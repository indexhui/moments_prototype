const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/lib/game/petHome.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
const compiled = { exports: {} };
new Function('module', 'exports', outputText)(compiled, compiled.exports);
const home = compiled.exports;
const progress = () => ({ hasSeenSunbeastFirstReveal: false, lastDogPhotoCapture: null, sunbeastPhotoCapturesById: {}, hasCompletedStreetForgotLunchFrogEvent: false, unlockedDiaryEntryIds: [], currentDay: 4, status: { savings: 1234 } });
const perform = (state, story, action) => home.applyHomeAction(state, story, action);

test('story ownership and completed collection are both required; the bundle does not complete story', () => {
  const story = progress();
  const untouched = JSON.stringify(story);
  let state = home.createPetHomeState();
  assert.equal(home.canInvitePet(state, story, 'beigo'), true);
  assert.equal(home.canInvitePet(state, story, 'naotaro'), false);
  state = perform(state, story, { type: 'purchase', product: 'story' }).state;
  assert.equal(home.canInvitePet(state, story, 'naotaro'), false);
  assert.equal(home.canInvitePet(state, { ...story, hasSeenSunbeastFirstReveal: true }, 'naotaro'), true);
  assert.equal(home.canInvitePet(home.createPetHomeState(), { ...story, hasSeenSunbeastFirstReveal: true }, 'naotaro'), false);
  state = perform(state, story, { type: 'purchase', product: 'bundle' }).state;
  assert.equal(home.canInvitePet(state, story, 'frog'), true);
  assert.equal(home.canInvitePet(state, story, 'naotaro'), true);
  assert.equal(JSON.stringify(story), untouched);
  assert.equal(perform(state, story, { type: 'purchase', product: 'bundle' }).ok, false);
});

test('one or two frog clue photos cannot unlock a story companion or its furniture', () => {
  const base = progress();
  const state = perform(home.createPetHomeState(), base, { type: 'purchase', product: 'story' }).state;
  for (const count of [1, 2]) {
    const story = { ...base, sunbeastPhotoCapturesById: { frog: Array(count).fill({}) } };
    assert.equal(home.canInvitePet(state, story, 'frog'), false);
    assert.equal(home.ownsFurniture(state, story, 'pond'), false);
    assert.equal(perform(state, story, { type: 'invite', pet: 'frog' }).ok, false);
  }
  assert.equal(home.canInvitePet(state, { ...base, sunbeastPhotoCapturesById: { frog: [{}, {}, {}] } }, 'frog'), true);
  assert.equal(home.canInvitePet(state, { ...base, hasCompletedStreetForgotLunchFrogEvent: true, unlockedDiaryEntryIds: ['bai-entry-2'] }, 'frog'), true);
});

test('care cooldown prevents double rewards, persists, and never changes story resources', () => {
  const story = progress(); const before = JSON.stringify(story);
  const start = home.createPetHomeState();
  const first = perform(start, story, { type: 'care', action: 'pet', now: 100000 }).state;
  assert.equal(first.hearts, start.hearts + 3);
  assert.equal(first.bonds.beigo, 8);
  assert.equal(start.bonds.beigo, 0);
  const restored = home.normalizePetHome(JSON.parse(JSON.stringify(first)));
  assert.equal(perform(restored, story, { type: 'care', action: 'pet', now: 100001 }).ok, false);
  assert.equal(perform(restored, story, { type: 'care', action: 'pet', now: 120000 }).ok, true);
  assert.equal(JSON.stringify(story), before);
});

test('furniture purchases cannot overspend, bypass chapter locks, duplicate or exceed room capacity', () => {
  const story = progress(); let state = home.createPetHomeState();
  assert.equal(perform(state, story, { type: 'buy-furniture', id: 'books' }).ok, false);
  state = perform(state, story, { type: 'purchase', product: 'story' }).state;
  assert.equal(perform(state, story, { type: 'buy-furniture', id: 'lamp' }).ok, false);
  assert.equal(perform(state, story, { type: 'buy-furniture', id: 'pond' }).ok, false);
  assert.equal(perform(state, story, { type: 'place', id: 'pond' }).ok, false);
  state = perform(state, story, { type: 'buy-furniture', id: 'books' }).state;
  assert.equal(state.hearts, 10);
  assert.equal(perform(state, story, { type: 'buy-furniture', id: 'books' }).ok, false);
  assert.equal(perform(state, story, { type: 'place', id: 'cushion' }).ok, false);
  state = perform(state, story, { type: 'purchase', product: 'bundle' }).state;
  state = perform(state, story, { type: 'place', id: 'books' }).state;
  state = perform(state, story, { type: 'place', id: 'pond' }).state;
  assert.equal(state.placements.length, 5);
  assert.equal(perform(state, story, { type: 'place', id: 'ball' }).ok, false);
  state = perform(state, story, { type: 'remove', id: 'books' }).state;
  assert.equal(perform(state, story, { type: 'place', id: 'ball' }).ok, true);
  state = perform(state, story, { type: 'move', id: 'cushion', x: -100, y: 300 }).state;
  assert.deepEqual(state.placements.find(item => item.id === 'cushion'), { id:'cushion', x:13, y:89 });
});

test('photos are bounded and stored independently; deleting a photo does not remove earned items', () => {
  const story = progress(); let state = home.createPetHomeState();
  for (let i = 0; i < home.MAX_HOME_PHOTOS; i++) {
    state = perform(state, story, { type:'photo', photo:{ id:String(i), petId:'beigo', caption:'hello', createdAt:i, image:'data:image/jpeg;base64,AAAA' } }).state;
  }
  const full = perform(state, story, { type:'photo', photo:{ id:'overflow', petId:'beigo', caption:'hello', createdAt:20, image:'data:image/jpeg;base64,AAAA' } });
  assert.equal(full.ok, false);
  const removed = perform(state, story, { type:'delete-photo', id:'0' }).state;
  assert.equal(removed.photos.length, 11);
  assert.deepEqual(removed.ownedFurniture, state.ownedFurniture);
});

test('corrupt saves recover safely and writes only touch the independent home key', () => {
  const stored = new Map([['moment:player-progress', '{"currentDay":9,"chapter":"untouched"}']]);
  global.window = Object.assign(new EventTarget(), { localStorage: { getItem:key => stored.get(key) ?? null, setItem:(key,value) => stored.set(key,value) } });
  const originalStory = stored.get('moment:player-progress');
  stored.set(home.PET_HOME_STORAGE_KEY, '{bad json');
  assert.deepEqual(home.readPetHome(), home.createPetHomeState());
  const dirty = home.normalizePetHome({ version:1, hearts:-99, purchases:{bundle:'true'}, placements:[null, {id:'cushion',x:200,y:20},{id:'cushion',x:50,y:70},{id:'unknown',x:1,y:1}], photos:[null,{}] });
  assert.equal(dirty.hearts, 0);
  assert.equal(dirty.purchases.bundle, false);
  assert.equal(dirty.placements.length, 1);
  assert.equal(home.savePetHome(dirty), true);
  assert.equal(stored.get('moment:player-progress'), originalStory);
  assert.deepEqual(home.readPetHome(), dirty);
  window.localStorage.setItem = () => { throw new Error('quota'); };
  assert.equal(home.savePetHome(dirty), false);
  delete global.window;
});
