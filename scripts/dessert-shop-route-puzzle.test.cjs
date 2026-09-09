const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/lib/game/dessertShopRoutePuzzle.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const loaded = { exports: {} };
new Function('module', 'exports', outputText)(loaded, loaded.exports);
const { INITIAL_DESSERT_ROUTE_SLOTS, areDessertRouteSlotsAdjacent, getConnectedDessertRoute } = loaded.exports;

test('both upper and lower roads connect the office to the shop', () => {
  assert.deepEqual(getConnectedDessertRoute([
    'corner-bottom-right', 'horizontal', 'corner-left-top',
    'vertical', null, 'vertical-alternate',
  ]), [3, 0, 1, 2]);
  assert.deepEqual(getConnectedDessertRoute([
    'vertical', null, 'vertical-alternate',
    'corner-bottom-right', 'horizontal', 'corner-left-top',
  ]), [3, 4, 5, 2]);
});

test('either straight tile can carry the route', () => {
  assert.deepEqual(getConnectedDessertRoute([
    'corner-bottom-right', 'horizontal', 'corner-left-top',
    'vertical-alternate', null, 'vertical',
  ]), [3, 0, 1, 2]);
});

test('empty gaps, wrong-facing openings and roads leaving the board do not win', () => {
  assert.deepEqual(getConnectedDessertRoute(INITIAL_DESSERT_ROUTE_SLOTS), []);
  assert.deepEqual(getConnectedDessertRoute([
    'corner-bottom-right', null, 'corner-left-top',
    'vertical', 'horizontal', 'vertical-alternate',
  ]), []);
  assert.deepEqual(getConnectedDessertRoute([
    'corner-bottom-right', 'vertical-alternate', 'corner-left-top',
    'vertical', null, 'horizontal',
  ]), []);
  assert.deepEqual(getConnectedDessertRoute([
    'vertical', null, 'corner-left-top',
    'vertical-alternate', 'horizontal', 'corner-bottom-right',
  ]), []);
  assert.equal(areDessertRouteSlotsAdjacent(2, 3), false);
  assert.equal(areDessertRouteSlotsAdjacent(-1, 2), false);
  assert.equal(areDessertRouteSlotsAdjacent(5, 6), false);
});

test('legal slides reach both routes and every tile can participate before the board locks', () => {
  const queue = [INITIAL_DESSERT_ROUTE_SLOTS];
  const seen = new Set([JSON.stringify(INITIAL_DESSERT_ROUTE_SLOTS)]);
  const routeShapes = new Set();
  const usedTiles = new Set();

  for (let current = 0; current < queue.length; current++) {
    const slots = queue[current];
    const route = getConnectedDessertRoute(slots);
    if (route.length > 0) {
      routeShapes.add(route.join(','));
      route.forEach((index) => usedTiles.add(slots[index]));
      // The UI stops accepting moves as soon as a route connects.
      continue;
    }

    const empty = slots.indexOf(null);
    for (let index = 0; index < slots.length; index++) {
      if (!areDessertRouteSlotsAdjacent(index, empty)) continue;
      const next = [...slots];
      [next[index], next[empty]] = [next[empty], next[index]];
      const key = JSON.stringify(next);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push(next);
    }
  }

  assert.deepEqual(routeShapes, new Set(['3,0,1,2', '3,4,5,2']));
  assert.deepEqual(usedTiles, new Set(INITIAL_DESSERT_ROUTE_SLOTS.filter(Boolean)));
});
