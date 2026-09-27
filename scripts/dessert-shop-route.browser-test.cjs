// DESSERT_ROUTE_TEST_URL=http://localhost:3000 node scripts/dessert-shop-route.browser-test.cjs
const assert = require('node:assert/strict');
const { mkdirSync, readFileSync } = require('node:fs');
const ts = require('typescript');
const { outputText } = ts.transpileModule(readFileSync('src/lib/game/dessertShopRoutePuzzle.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const loaded = { exports: {} };
new Function('module', 'exports', outputText)(loaded, loaded.exports);
const { solveDessertRoute, getConnectedDessertRoute } = loaded.exports;
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/Users/hugh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const baseUrl = process.env.DESSERT_ROUTE_TEST_URL || 'http://localhost:3000';
const output = '/tmp/dessert-route-help';
mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const board = page.locator('[data-dessert-moves]');
  const dialog = page.getByRole('dialog');
  const nearbyDepart = page.locator('[data-dessert-nearby-depart]');
  const tile = id => page.locator(`[data-dessert-tile="${id}"]`);
  const slots = () => page.locator('[data-dessert-tile]').evaluateAll(elements => {
    const result = Array(6).fill(null);
    for (const element of elements) result[Number(element.dataset.dessertSlot)] = element.dataset.dessertTile;
    return result;
  });
  const start = async (lang = 'zh') => {
    await page.goto(`${baseUrl}/game/exhibition?preview=dessert-route&lang=${lang}`);
    await page.getByRole('button', { name: lang === 'zh' ? '開始' : lang === 'ja' ? 'はじめる' : 'Start', exact: true }).click();
    await board.waitFor();
  };
  const repeatMoves = async count => {
    for (let i = 0; i < count; i++) await tile('corner-left-top').click();
  };
  try {
    await start();
    assert.equal(await nearbyDepart.count(), 0, 'Departure banner only appears after connecting the road');
    assert.equal(await board.getByRole('button', { name: '出發', exact: true }).count(), 0, 'The redundant footer departure action is removed');
    await page.screenshot({ path: `${output}/initial.png` });
    await tile('vertical').click({ force: true });
    assert.equal(await board.getAttribute('data-dessert-moves'), '0', 'Invalid moves are not counted');
    await repeatMoves(12);
    assert.equal(await dialog.count(), 0, 'No offer at 12 moves');
    await repeatMoves(1);
    await dialog.waitFor();
    assert.equal(await board.getAttribute('data-dessert-moves'), '13');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${output}/offer.png` });
    const before = await slots();
    await page.getByRole('button', { name: '先等等', exact: true }).click();
    assert.deepEqual(await slots(), before, 'Declining preserves the board');
    assert.equal(await board.getByRole('status').count(), 0, 'Help replaces the hint instead of adding a second row');
    await page.screenshot({ path: `${output}/help-link.png` });
    await repeatMoves(1);
    assert.equal(await dialog.count(), 0, 'The prompt does not interrupt every move');
    await page.getByRole('button', { name: '小貝狗幫忙', exact: true }).click();
    await page.getByRole('button', { name: '要', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-dessert-assisting]')?.dataset.dessertAssisting === 'false');
    assert.equal(await board.getAttribute('data-dessert-moves'), '14', 'Helper slides do not count as player moves');
    assert.equal(getConnectedDessertRoute(await slots()).length, 0, 'Helper stops before winning');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${output}/one-step-left.png` });
    await page.locator('[data-dessert-suggested="true"]').click();
    assert.ok(getConnectedDessertRoute(await slots()).length, 'Player finishes in one move');
    assert.equal(await dialog.count(), 0);
    await page.getByRole('button', { name: '重來', exact: true }).click();
    assert.equal(await board.getAttribute('data-dessert-moves'), '0');
    assert.equal(await nearbyDepart.count(), 0, 'Reset clears the nearby departure action');
    assert.equal(await page.getByRole('button', { name: '小貝狗幫忙', exact: true }).count(), 0);

    // Arrange for the winning move itself to be number 13.
    const solution = solveDessertRoute(await slots());
    assert.equal((13 - solution.length) % 2, 0);
    await repeatMoves(13 - solution.length);
    for (const id of solution) await tile(id).click();
    assert.equal(await board.getAttribute('data-dessert-moves'), '13');
    assert.ok(getConnectedDessertRoute(await slots()).length);
    assert.equal(await dialog.count(), 0, 'Winning on move 13 suppresses the offer');
    const completion = page.locator('[data-dessert-completion]');
    await completion.waitFor();
    assert.equal(await nearbyDepart.count(), 0, 'Completion is shown before departure can be clicked');
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${output}/completion.png` });
    await nearbyDepart.waitFor();
    assert.equal(await completion.count(), 0, 'Completion disappears before the departure button appears');
    assert.equal(await board.getByRole('button', { name: /出發/ }).count(), 1, 'Only the full-width action offers departure');
    await page.waitForTimeout(550);
    const ctaBounds = await nearbyDepart.boundingBox();
    const cardBounds = await page.locator('[data-dessert-board-card]').boundingBox();
    const viewportBounds = await board.boundingBox();
    const bannerBounds = await page.locator('[data-dessert-completion-banner]').boundingBox();
    assert.equal(bannerBounds.width, viewportBounds.width, 'Departure banner spans the entire game width');
    assert.equal(ctaBounds.width, viewportBounds.width - 32, 'Departure is a large inset button');
    assert.ok(ctaBounds.height >= 48, 'Large horizontal departure hit area');
    assert.ok(ctaBounds.y >= cardBounds.y + cardBounds.height, 'Departure sits below the board without covering it');
    await page.screenshot({ path: `${output}/connected-depart.png` });
    await nearbyDepart.click();
    await page.getByText('找到甜點店了！', { exact: true }).first().waitFor();

    for (const [lang, accept, later] of [['en', 'Yes', 'Not yet'], ['ja', 'お願い', 'まだ大丈夫']]) {
      await page.setViewportSize({ width: 320, height: 568 });
      await start(lang);
      await repeatMoves(13);
      await dialog.waitFor();
      assert.ok(await page.getByRole('button', { name: accept, exact: true }).isVisible());
      const bounds = await dialog.boundingBox();
      assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= 320 && bounds.y + bounds.height <= 568);
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${output}/offer-${lang}.png` });
      await page.getByRole('button', { name: later, exact: true }).click();
      for (const id of solveDessertRoute(await slots())) await tile(id).click();
      await nearbyDepart.waitFor();
      await page.waitForTimeout(450);
      const cta = await nearbyDepart.boundingBox();
      assert.ok(cta.x >= 0 && cta.y >= 0 && cta.x + cta.width <= 320 && cta.y + cta.height <= 568);
      await page.screenshot({ path: `${output}/connected-depart-${lang}.png` });
      await nearbyDepart.click();
      await page.waitForFunction(() => !document.querySelector('[data-dessert-moves]'));
    }
    assert.deepEqual(errors, []);
    console.log('PASS: threshold, invalid moves, decline/reopen, assist, final move, reset, winning move 13, departure, narrow EN/JA layouts.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
