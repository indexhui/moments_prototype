const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadTs(file) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const module = { exports: {} };
  new Function('module', 'exports', 'require', outputText)(module, module.exports, require);
  return module.exports;
}
const raffle = loadTs('src/lib/game/exhibitionRaffle.ts');
const ending = loadTs('src/lib/game/exhibitionEnding.ts');

function storage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}
beforeEach(() => {
  global.window = Object.assign(new EventTarget(), { localStorage: storage(), sessionStorage: storage() });
  let queue = Promise.resolve();
  Object.defineProperty(global, 'navigator', { configurable: true, value: { locks: {
    request: (_name, callback) => { const task = queue.then(callback); queue = task.catch(() => {}); return task; },
  } } });
});

test('108 prizes exhaust at exactly A 2 / B 3 / C 3 / D 100, with no negative stock', () => {
  let state = raffle.initialRaffleState();
  const awarded = { A: 0, B: 0, C: 0, D: 0 };
  for (let i = 0; i < 108; i++) {
    const result = raffle.drawFromStock(state, `player-${i}`, ((i * 37) % 101) / 101, 'now');
    assert.ok(result.receipt.prize);
    awarded[result.receipt.prize]++;
    state = result.state;
  }
  assert.deepEqual(awarded, { A: 2, B: 3, C: 3, D: 100 });
  assert.deepEqual(state.remaining, { A: 0, B: 0, C: 0, D: 0 });
  assert.equal(raffle.drawFromStock(state, 'sold-out', 0.5, 'now').receipt.prize, null);
});

test('ticket boundaries weight every remaining set equally', () => {
  const state = raffle.initialRaffleState();
  for (const [position, expected] of [[0, 'A'], [1, 'A'], [2, 'B'], [4, 'B'], [5, 'C'], [7, 'C'], [8, 'D'], [107, 'D']]) {
    assert.equal(raffle.drawFromStock(state, 'player', (position + 0.5) / 108, 'now').receipt.prize, expected);
  }
});

test('simultaneous duplicate requests deduct one prize for the same draw attempt', async () => {
  const [first, second] = await Promise.all([raffle.claimExhibitionPrize('one'), raffle.claimExhibitionPrize('one')]);
  assert.deepEqual(first, second);
  const reloaded = raffle.parseRaffleState(window.localStorage.getItem(raffle.RAFFLE_STORAGE_KEY));
  assert.equal(Object.values(reloaded.remaining).reduce((a, b) => a + b), 107);
  assert.equal(reloaded.receipts.length, 1);
  assert.deepEqual(await raffle.claimExhibitionPrize('one'), first);
});

test('new player preserves stock; staff reset restores stock and keeps existing tickets', async () => {
  ending.startExhibitionRun();
  const id = 'ending-visit-one';
  ending.saveExhibitionPhoto(2, { imagePath: 'data:image/png;base64,test', score: 87 });
  window.sessionStorage.setItem('moment:exhibition-ending-step-v1', 'thanks');
  await ending.registerExhibitionEmail('person@example.com', 'zh', '小日玩家');
  const receipt = await raffle.claimExhibitionPrize(id);
  ending.startExhibitionRun();
  const nextReceipt = await raffle.claimExhibitionPrize('ending-visit-two');
  assert.notEqual(nextReceipt.runId, receipt.runId);
  assert.equal(Object.values(raffle.loadRaffleState().remaining).reduce((a, b) => a + b), 106);
  assert.deepEqual(ending.loadExhibitionPhotos(), [null, null, null, null]);
  assert.equal(window.sessionStorage.getItem('moment:exhibition-ending-step-v1'), null);
  assert.equal(ending.loadExhibitionRegistrations().length, 1);
  assert.equal(raffle.loadRaffleState().receipts.length, 2);
  await raffle.resetExhibitionPrizes();
  assert.deepEqual(raffle.loadRaffleState().remaining, raffle.INITIAL_PRIZE_STOCK);
  assert.deepEqual(await raffle.claimExhibitionPrize(id), receipt);
  assert.deepEqual(raffle.loadRaffleState().remaining, raffle.INITIAL_PRIZE_STOCK);
});

test('failed storage never awards an unrecorded prize and damaged stock never silently refills', async () => {
  window.localStorage.setItem(raffle.RAFFLE_STORAGE_KEY, '{bad');
  await assert.rejects(raffle.claimExhibitionPrize('one'));
  await raffle.resetExhibitionPrizes();
  const before = window.localStorage.getItem(raffle.RAFFLE_STORAGE_KEY);
  window.localStorage.setItem = () => { throw new Error('Quota exceeded'); };
  await assert.rejects(raffle.claimExhibitionPrize('one'));
  assert.equal(window.localStorage.getItem(raffle.RAFFLE_STORAGE_KEY), before);
  assert.throws(() => raffle.parseRaffleState(JSON.stringify({ ...raffle.initialRaffleState(), remaining: { A: -1, B: 3, C: 3, D: 100 } })));
});

test('all four captured images and scores survive remount', () => {
  const photos = Array.from({ length: 4 }, (_, i) => ({ imagePath: `data:image/png;base64,photo-${i}`, score: 65 + i * 10 }));
  photos.forEach((photo, i) => ending.saveExhibitionPhoto(i, photo));
  assert.deepEqual(ending.loadExhibitionPhotos(), photos);
});

test('email validation and concurrent duplicate submissions preserve one registration', async () => {
  await assert.rejects(ending.registerExhibitionEmail('not-an-email', 'zh', '小日玩家'));
  await Promise.all([ending.registerExhibitionEmail(' PERSON@example.com ', 'zh', '小日玩家'), ending.registerExhibitionEmail('person@example.com', 'en', 'Moments fan')]);
  assert.equal(ending.loadExhibitionRegistrations().length, 1);
  assert.equal(ending.loadExhibitionRegistrations()[0].email, 'person@example.com');
  assert.equal(ending.loadExhibitionRegistrations()[0].nickname, 'Moments fan');
  await assert.rejects(ending.registerExhibitionEmail('empty-name@example.com', 'zh', '   '));
});

test('staff export contains the saved email list and neutralizes spreadsheet formulas', async () => {
  await ending.registerExhibitionEmail('=2+3@example.com', 'zh', '=小日玩家');
  let clicked = false;
  const link = { click: () => { clicked = true; } };
  global.document = { createElement: () => link };
  ending.exportExhibitionRegistrations();
  assert.equal(clicked, true);
  assert.match(link.download, /^moments-preregistration-.*\.csv$/);
  const blob = require('node:buffer').resolveObjectURL(link.href);
  const csv = await blob.text();
  assert.match(csv, /nickname,email,registered_at,language/);
  assert.match(csv, /"'=小日玩家"/);
  assert.match(csv, /"'=2\+3@example.com"/);
  assert.equal(ending.loadExhibitionRegistrations().length, 1);
});
