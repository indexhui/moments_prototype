// Run against a built local server: FROG_DIARY_TEST_URL=http://localhost:3002 node scripts/exhibition-frog-diary.browser-test.cjs
const assert = require('node:assert/strict');
const { mkdirSync, readFileSync } = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = readFileSync(path.join(__dirname, '../src/lib/game/exhibitionI18n.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const loaded = { exports: {} };
new Function('module', 'exports', outputText)(loaded, loaded.exports);
const { getExhibitionFrogDiaryText } = loaded.exports;
const normalize = text => text.replace(/\s+/g, ' ').trim();
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/Users/hugh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const baseUrl = process.env.FROG_DIARY_TEST_URL || 'http://localhost:3001';
const locales = (process.env.FROG_DIARY_TEST_LOCALES ?? 'zh,en,ja').split(',').filter(Boolean);
const entries = (process.env.FROG_DIARY_TEST_ENTRIES ?? '1,2,3').split(',').map(value => Number(value) - 1);
const output = process.env.FROG_DIARY_TEST_OUTPUT || '/tmp/exhibition-frog-diary';
mkdirSync(output, { recursive: true });
const continueLabels = { zh: '繼續', en: 'Continue', ja: 'つづける' };
const clueLabels = { zh: ['街道', '便利商店', '甜點店'], en: ['Street', 'Convenience Store', 'Dessert Shop'], ja: ['街', 'コンビニ', 'スイーツ店'] };
const noTape = async page => {
  const labels = await page.locator('[aria-label]').evaluateAll(es => es.map(e => e.getAttribute('aria-label')).join('\n'));
  assert.doesNotMatch(labels, /紙膠帶|地點書籤|washi|bookmark|テープ|しおり/i);
  assert.equal(await page.locator('[id^="bai-entry-2-location-fill"]').count(), 0);
};
async function solve(page, dragFirst = false) {
  const board = page.locator('[data-diary-puzzle-active-layer]');
  await board.waitFor();
  let swaps = 0;
  if (dragFirst) {
    const pieces = page.locator('[data-diary-puzzle-image-layer="1"]');
    const before = await pieces.evaluateAll(es => es.map(e => e.dataset.diaryPuzzleImagePiece));
    const from = await pieces.first().boundingBox(), bounds = await board.boundingBox();
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds.x - 12, bounds.y + bounds.height / 2, { steps: 8 });
    assert.equal(await page.locator('[data-puzzle-drop-target]').count(), 0);
    await page.mouse.up();
    assert.deepEqual(await pieces.evaluateAll(es => es.map(e => e.dataset.diaryPuzzleImagePiece)), before, 'Dropping outside returns the piece');
  }
  for (let attempt = 0; attempt < 40; attempt++) {
    const state = await board.getAttribute('data-diary-puzzle-layer-state');
    if (state === 'solved') return swaps;
    if (state === 'settling') {
      await page.waitForTimeout(850);
      continue;
    }
    const layer = await board.getAttribute('data-diary-puzzle-active-layer');
    if (layer === '1') {
      assert.equal(await page.locator('[data-diary-puzzle-layer-preview], [data-diary-puzzle-layer-preview-arrow]').count(), 0, 'No next-layer preview while the first puzzle is unfinished');
      assert.equal(await page.locator('[data-diary-puzzle-image-layer="2"]').count(), 0, 'The next layer is not rendered before completion');
    }
    const pieces = page.locator(`[data-diary-puzzle-image-layer="${layer}"]`);
    const order = await pieces.evaluateAll(es => es.map(e => Number(e.dataset.diaryPuzzleImagePiece)));
    const slot = order.findIndex((piece, index) => piece !== index);
    if (slot < 0) { await page.waitForTimeout(850); continue; }
    const otherSlot = order.indexOf(slot);
    if (dragFirst && swaps === 0) {
      const from = await pieces.nth(slot).boundingBox(), to = await pieces.nth(otherSlot).boundingBox();
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
      await page.mouse.down();
      await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
      assert.equal(await page.locator('[data-puzzle-piece-dragging="true"]').count(), 1);
      assert.equal(await page.locator('[data-puzzle-drop-target]').getAttribute('data-puzzle-drop-target'), String(otherSlot));
      await page.mouse.up();
    } else {
      await pieces.nth(slot).click();
      await pieces.nth(otherSlot).click();
    }
    swaps++;
    if (dragFirst && swaps === 1) assert.ok(await page.locator('[data-puzzle-seam-joined="true"]').count(), 'Correct neighboring pieces join');
    if (layer === '1' && await board.getAttribute('data-diary-puzzle-layer-state') === 'settling') {
      assert.equal(await page.locator('[data-diary-puzzle-layer-preview]').count(), 0, 'The first layer settles before showing the preview');
      if (!await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)) {
        const waiting = page.locator('[data-diary-puzzle-layer-preview="waiting"]');
        await waiting.waitFor();
        const previewBounds = await waiting.boundingBox();
        const puzzleBounds = await board.boundingBox();
        const titleBounds = await page.locator('[data-exhibition-frog-diary-motion-role="title"]').boundingBox();
        assert.ok(previewBounds.width > puzzleBounds.width * 0.4, 'The next-layer image is large enough to recognize');
        assert.ok(previewBounds.y > titleBounds.y + titleBounds.height && previewBounds.y + previewBounds.height < puzzleBounds.y, 'The preview fits between title and completed puzzle');
        assert.ok(previewBounds.x >= 0 && previewBounds.x + previewBounds.width <= page.viewportSize().width, 'The preview fits on narrow screens');
        assert.ok(await waiting.locator('button').evaluateAll(es => es.every(e => e.tabIndex === -1 && getComputedStyle(e).pointerEvents === 'none')), 'The preview cannot be operated during the handoff');
        await page.waitForTimeout(230);
        await page.screenshot({ path: `${output}/layer-preview-after-completion-${page.viewportSize().width}.png` });
        const preview = page.locator('[data-diary-puzzle-layer-preview="entering"]');
        await preview.waitFor();
        const before = await preview.evaluate(e => getComputedStyle(e).transform);
        await page.waitForTimeout(140);
        assert.notEqual(await preview.evaluate(e => getComputedStyle(e).transform), before, 'The preview visibly moves into the active board');
        await page.screenshot({ path: `${output}/layer-handoff-${page.viewportSize().width}.png` });
      }
    }
    if (layer === '2') assert.equal(await page.locator('[data-diary-puzzle-layer-preview]').count(), 0, 'The preview becomes the playable layer without a duplicate');
    await page.waitForTimeout(430);
  }
  throw new Error('Puzzle did not finish');
}
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  try {
    const baseline = await browser.newPage({ viewport: { width: 393, height: 852 } });
    const baselineErrors = [];
    baseline.on('pageerror', e => baselineErrors.push(e.message));
    await baseline.goto(`${baseUrl}/game/exhibition/tgs?preview=frog-diary-fragment&sceneStep=catalog`);
    await baseline.locator('[data-diary-entry-card-id="bai-entry-2"]').click();
    await baseline.waitForTimeout(1800);
    assert.ok(await baseline.locator('[aria-label*="紙膠帶"]').count(), 'TGS still requires collecting tape');
    await baseline.screenshot({ path: `${output}/tgs-tape.png` });
    await baseline.close();
    const isHydrationError = text => text.includes('Minified React error #418') || text.includes('Hydration failed');
    const baselineHydration = baselineErrors.some(isHydrationError);
    assert.deepEqual(baselineErrors.filter(e => !isHydrationError(e)), []);
    for (const locale of locales) {
      const page = await browser.newPage({ viewport: locale === 'en' ? { width: 320, height: 568 } : { width: 393, height: 852 } });
      page.on('pageerror', e => errors.push(e.message));
      const next = () => page.getByRole('button', { name: continueLabels[locale], exact: true });
      for (const entry of entries) {
        const phase = ['frog-diary-fragment', 'street-flyer', 'convenience-clerk'][entry];
        const scene = entry === 0 ? 'catalog' : 'diary-fragment-ready';
        await page.goto(`${baseUrl}/game/exhibition?preview=${phase}&sceneStep=${scene}&lang=${locale}`);
        if (entry === 0) {
          await page.locator('[data-diary-entry-card-id="bai-entry-2"]').click();
        } else {
          const segment = page.locator(`[data-diary-segment-step="${entry * 2}"]`);
          await page.waitForFunction(step => document.querySelector(`[data-diary-segment-step="${step}"]`)?.getAttribute('data-diary-segment-locked') === 'false', entry * 2);
          await segment.click();
          await next().click();
        }
        await page.locator('[data-diary-puzzle-active-layer]').waitFor();
        await page.locator('[data-exhibition-frog-diary-page-turn="settled"]').waitFor();
        await page.locator('[data-exhibition-puzzle-position="focused"]').waitFor();
        await page.waitForTimeout(950);
        await noTape(page);
        assert.equal(await page.locator('[data-diary-puzzle-layer-preview], [data-diary-puzzle-layer-preview-arrow]').count(), 0, 'The unfinished puzzle has no second-layer preview');
        assert.equal(await page.locator('[data-frog-diary-puzzle-completion-layer]').count(), 0, 'The preview does not show later completion artwork');
        assert.equal(await page.locator('[data-diary-puzzle-text-grid], [data-reconstruction-token], [data-exhibition-diary-restored-prose]').count(), 0, 'The puzzle has no scattered letters or body text');
        assert.equal(await next().count(), 0, 'Cannot advance before puzzle completion');
        await page.screenshot({ path: `${output}/${locale}-${entry + 1}-puzzle.png` });
        const swaps = await solve(page, locale === 'zh');
        await noTape(page);
        assert.equal(await next().count(), 0, 'Continue waits for the restored text');
        const reconstruction = page.locator('[data-exhibition-diary-reconstruction]');
        await reconstruction.waitFor();
        assert.equal(await page.locator('[data-exhibition-puzzle-position]').getAttribute('data-exhibition-puzzle-position'), 'docked');
        assert.equal(await next().count(), 0, 'No continue during text reconstruction');
        const card = page.locator('[data-reconstruction-card]').first();
        await card.waitFor();
        const firstTransform = await card.evaluate(el => getComputedStyle(el).transform);
        await page.waitForTimeout(180);
        assert.notEqual(await card.evaluate(el => getComputedStyle(el).transform), firstTransform, 'The word cards actually move');
        await page.screenshot({ path: `${output}/${locale}-${entry + 1}-reconstructing.png` });
        await page.locator('[data-exhibition-diary-reconstruction="merge"]').waitFor();
        if (entry === 0) {
          const keyword = page.locator('[data-exhibition-diary-keyword]');
          assert.equal(await keyword.getAttribute('data-exhibition-diary-keyword-stage'), 'waiting');
          assert.equal(await keyword.evaluate(el => getComputedStyle(el).animationName), 'none', 'The keyword waits until every word has settled');
        }
        assert.ok(await page.locator('[data-reconstruction-card] > :first-child').evaluateAll(es => es.every(el => Number(getComputedStyle(el).opacity) < 0.15)), 'Card frames fade before prose settles');
        await next().waitFor({ timeout: 9000 });
        const restored = page.locator('[data-exhibition-diary-reconstruction="complete"]');
        await restored.waitFor();
        if (entry === 0) {
          const keyword = page.locator('[data-exhibition-diary-keyword]');
          assert.equal((await keyword.textContent()).toLowerCase(), clueLabels[locale][entry].toLowerCase());
          await page.waitForTimeout(610);
          const emphasizedTransform = await keyword.evaluate(el => getComputedStyle(el).transform);
          assert.notEqual(emphasizedTransform, 'none', 'The keyword floats after reconstruction');
          await page.screenshot({ path: `${output}/${locale}-street-emphasis.png` });
          await page.locator('[data-exhibition-diary-keyword-stage="settled"]').waitFor();
          assert.notEqual(await keyword.evaluate(el => getComputedStyle(el).transform), emphasizedTransform, 'The keyword returns to its reading position');
          assert.equal(await keyword.locator('path').evaluate(el => getComputedStyle(el).strokeDashoffset), '0px', 'The short underline finishes drawing');
          const animationTime = await keyword.evaluate(el => el.getAnimations()[0]?.currentTime);
          await page.waitForTimeout(180);
          assert.equal(await keyword.evaluate(el => el.getAnimations()[0]?.currentTime), animationTime, 'The emphasis plays once');
        } else {
          assert.equal(await page.locator('[data-exhibition-diary-keyword]').count(), 0, 'Only the requested street clue is emphasized');
        }
        const text = await restored.locator('p').evaluateAll(es => es.map(e => e.getAttribute('aria-label')).join('\n'));
        assert.ok(await restored.locator('p').evaluateAll(es => es.every(el => getComputedStyle(el).fontSize === '16px')));
        const copy = getExhibitionFrogDiaryText(locale);
        assert.equal(normalize(text), normalize([copy.firstPuzzleText, copy.secondPuzzleText, copy.thirdPuzzleText][entry]));
        assert.equal(await page.getByText([copy.revealText, copy.secondRevealText, copy.thirdRevealText][entry], { exact: true }).count(), 0, 'The photo-only second segment stays unrevealed');
        assert.ok(await restored.evaluate(el => {
          for (let parent = el.parentElement; parent; parent = parent.parentElement) {
            if (['auto', 'scroll'].includes(getComputedStyle(parent).overflowY)) return true;
          }
          return false;
        }), 'The diary text must be inside a user-scrollable region');
        assert.doesNotMatch(text, /＿/);
        await noTape(page);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        assert.equal(overflow, false);
        await restored.scrollIntoViewIfNeeded();
        await page.screenshot({ path: `${output}/${locale}-${entry + 1}-restored.png` });
        await next().scrollIntoViewIfNeeded();
        const continueBounds = await next().boundingBox();
        assert.ok(continueBounds.y >= 0 && continueBounds.y + continueBounds.height <= page.viewportSize().height, 'Continue fits in the viewport');
        await page.screenshot({ path: `${output}/${locale}-${entry + 1}-continue.png` });
        await next().click();
        await page.getByText(clueLabels[locale][entry], { exact: true }).last().waitFor();
        await next().last().click();
        await page.waitForURL(url => url.searchParams.get('preview') !== phase);
        console.log(`PASS ${locale} entry ${entry + 1}: ${swaps} swaps, complete text, clue, next scene`);
      }
      await page.close();
    }
    const review = await browser.newPage({ viewport: { width: 393, height: 852 } });
    review.on('pageerror', e => errors.push(e.message));
    await review.goto(`${baseUrl}/game/exhibition?preview=morning-route&sceneStep=open-diary`);
    await review.locator('[data-diary-entry-card-id="bai-entry-2"]').click();
    await review.getByText(getExhibitionFrogDiaryText('zh').firstPuzzleText, { exact: true }).waitFor();
    await noTape(review);
    console.log('PASS route diary reopen: restored street clue is readable without tape');
    await review.goto(`${baseUrl}/game/exhibition?preview=frog-dessert&sceneStep=diary-fragment-ready`);
    await review.waitForFunction(() => document.querySelector('[data-diary-segment-step="6"]')?.getAttribute('data-diary-segment-locked') === 'false');
    await review.locator('[data-diary-segment-step="6"]').click();
    await review.getByText(getExhibitionFrogDiaryText('zh').thirdRevealText, { exact: true }).waitFor();
    assert.equal(await review.locator('[data-diary-segment-step]').count(), 6);
    await noTape(review);
    await review.getByRole('button', { name: '繼續', exact: true }).click();
    await review.waitForURL(url => url.searchParams.get('preview') !== 'frog-dessert');
    console.log('PASS final photo: sixth segment and story handoff');
    await review.close();
    if (locales.length === 0 || locales.includes('zh')) {
      const reduced = await browser.newPage({ viewport: { width: 393, height: 852 }, reducedMotion: 'reduce' });
      reduced.on('pageerror', e => errors.push(e.message));
      await reduced.goto(`${baseUrl}/game/exhibition?preview=frog-diary-fragment&sceneStep=catalog`);
      await reduced.locator('[data-diary-entry-card-id="bai-entry-2"]').click();
      await reduced.locator('[data-exhibition-frog-diary-page-turn="settled"]').waitFor();
      await solve(reduced);
      await reduced.locator('[data-exhibition-diary-reconstruction="complete"]').waitFor({ timeout: 2000 });
      await reduced.getByRole('button', { name: '繼續', exact: true }).waitFor();
      assert.equal(await reduced.locator('[data-reconstruction-card]').first().isVisible(), false);
      const keyword = reduced.locator('[data-exhibition-diary-keyword-stage="settled"]');
      await keyword.waitFor();
      assert.equal(await keyword.evaluate(el => getComputedStyle(el).animationName), 'none', 'Reduced motion uses static ink emphasis');
      await reduced.close();
      console.log('PASS reduced motion: short reveal, complete prose, continue');
    }
    assert.deepEqual(errors.filter(e => !(baselineHydration && isHydrationError(e))), []);
    console.log(`PASS browser errors: ${errors.length} existing hydration warnings (${baselineHydration ? 'reproduced in TGS' : 'none in baseline'})`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
