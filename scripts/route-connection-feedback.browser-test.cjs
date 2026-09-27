// ROUTE_FEEDBACK_TEST_URL=http://localhost:3000 node scripts/route-connection-feedback.browser-test.cjs
const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/Users/hugh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const base = process.env.ROUTE_FEEDBACK_TEST_URL || 'http://localhost:3000';
const output = '/tmp/route-connection-feedback';
mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  try {
    for (const locale of ['zh', 'en', 'ja']) {
      const page = await browser.newPage({ viewport: { width: 393, height: 852 }, reducedMotion: locale === 'ja' ? 'reduce' : 'no-preference' });
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${base}/game/exhibition?preview=morning-route&sceneStep=route-game&lang=${locale}`);
      await page.getByRole('button', { name: {zh:'開始',en:'Start',ja:'はじめる'}[locale], exact: true }).click();
      const stage = page.locator('[data-linear-route]');
      const board = page.locator('[data-story-route-drop-target="exhibition-route-board"]');
      const choose = async (file, index) => {
        const from = await page.getByRole('button').filter({ has: page.locator(`img[src="/images/route_255/${file}"]`) }).boundingBox();
        const to = await page.locator(`[data-story-route-drop-target="exhibition-route-slot-${index}"]`).boundingBox();
        await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
        await page.mouse.down();
        await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
        await page.mouse.up();

      };
      assert.equal(await page.locator('[data-route-instruction]').count(), 0, 'No hidden visit-order requirement is shown');
      // Regression: the user’s screenshot is a valid connected road too.
      await choose('wide_to_narrow_捷運.png', 0);
      await choose('straight_街道.png', 1);
      await page.locator('[data-route-ready-depart]').waitFor();
      assert.equal(await stage.getAttribute('data-route-connection-phase'), 'ready', 'Either connected arrangement is accepted');
      await page.screenshot({ path: `${output}/alternate-connected-${locale}.png` });
      await page.getByRole('button', { name: {zh:'重新安排',en:'Rearrange',ja:'並べ直す'}[locale], exact:true }).click();
      await choose('straight_街道.png', 0);
      await choose('wide_to_narrow_捷運.png', 1);
      assert.equal(await stage.getAttribute('data-route-connection-phase'), 'editing', 'Wrong edge widths remain editable');
      assert.equal(await page.locator('[data-route-feedback]').count(), 0);
      await choose('wide_to_wide_街道.png', 0);
      await page.waitForFunction(() => document.querySelector('[data-linear-route]')?.dataset.routeConnectionPhase === 'tracing');
      assert.equal(await page.locator('[data-route-ready-depart]').count(), 0, 'Departure waits for feedback');
      assert.equal(await page.locator('[data-route-feedback]').count(), 1, 'Tray is replaced as soon as the road connects');
      const delays = await board.locator(':scope > *').evaluateAll(es => es.map(e => getComputedStyle(e).getPropertyValue('--route-trace-delay').trim()));
      assert.deepEqual(delays, ['530ms', '440ms', '350ms', '260ms'], 'Both endpoints illuminate in travel order, home to company');
      await page.waitForTimeout(420);
      await page.screenshot({ path: `${output}/trace-${locale}.png` });
      await page.waitForFunction(() => document.querySelector('[data-linear-route]')?.dataset.routeConnectionPhase === 'complete');
      await page.waitForTimeout(180);
      await page.screenshot({ path: `${output}/complete-${locale}.png` });
      await page.locator('[data-route-ready-depart]').waitFor();
      await page.waitForTimeout(250);
      assert.equal(await stage.getByRole('button', { name: /^(出發|Depart|出発)/ }).count(), 1, 'There is one departure button');
      await page.screenshot({ path: `${output}/ready-${locale}.png` });
      const joined = await board.locator(':scope > *').evaluateAll(es => es.map(e => { const r=e.getBoundingClientRect(); return {y:r.y,h:r.height}; }));
      assert.equal(joined.length, 4);
      for (let i=1;i<joined.length;i++) assert.ok(Math.abs(joined[i].y - joined[i-1].y - joined[i-1].h) < 1, 'All road seams close before departure');
      if (locale === 'zh') {
        await page.getByRole('button', { name: '重新安排', exact: true }).click();
        assert.equal(await stage.getAttribute('data-route-connection-phase'), 'editing');
        assert.equal(await page.locator('[data-route-ready-depart]').count(), 0);
        await choose('wide_to_narrow_捷運.png', 0);
        await choose('straight_街道.png', 1);
        await page.locator('[data-route-ready-depart]').waitFor();
      }
      await page.locator('[data-route-ready-depart]').click();
      await page.waitForTimeout(700);
      assert.ok(await page.locator('[data-route-ready-depart]').isDisabled(), 'Double departure is blocked');
      await page.close();
    }
    assert.deepEqual(errors, []);
    console.log('PASS: both connected arrangements, wrong roads, automatic trace, all four tiles, joined seams, completion then single CTA, rearrange, departure, three locales and reduced motion.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
