const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const compile=(file,imports={})=>{const {outputText}=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/lib/game',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}});const module={exports:{}};new Function('module','exports','require',outputText)(module,module.exports,name=>imports[name]);return module.exports;};
const home=compile('petHome.ts');
const forest=compile('petForest.ts',{'./petHome':home});
const story=()=>({hasSeenSunbeastFirstReveal:false,lastDogPhotoCapture:null,sunbeastPhotoCapturesById:{},hasCompletedStreetForgotLunchFrogEvent:false,unlockedDiaryEntryIds:[],status:{savings:1234}});
const start=100000;
const act=(state,action,h=home.createPetHomeState(),s=story())=>forest.applyForest(state,h,s,action);

test('production survives reload, keeps fractional progress and cannot be collected twice',()=>{
 const initial=forest.createForest(start);
 assert.equal(forest.stationYield(initial.stations.soup,'soup',start+9999).count,0);
 const loaded=forest.normalizeForest(JSON.parse(JSON.stringify(initial)),start+25500);
 const first=act(loaded,{type:'collect',id:'soup',now:start+25500});
 assert.equal(first.state.coins,52);
 assert.equal(first.state.stations.soup.collectedAt,start+20000);
 assert.equal(act(first.state,{type:'collect',id:'soup',now:start+25500}).ok,false);
 assert.equal(forest.stationYield(first.state.stations.soup,'soup',start+30000).count,1);
 assert.equal(initial.coins,40);
});

test('offline production caps at two hours; clock rollback yields no rewards',()=>{
 const initial=forest.createForest(start);
 const long=act(initial,{type:'collect',id:'soup',now:start+7*24*3600000});
 assert.equal(long.state.coins,40+720*6);
 assert.equal(long.state.sold,720);
 assert.equal(act(long.state,{type:'collect',id:'soup',now:start}).ok,false);
 assert.equal(act(long.state,{type:'collect',id:'soup',now:start+7*24*3600000}).ok,false);
});

test('upgrades charge correctly and settle old dishes at the old price',()=>{
 const initial=forest.createForest(start);
 const upgraded=act(initial,{type:'upgrade',id:'soup',now:start+25000});
 assert.equal(upgraded.ok,true);
 assert.equal(upgraded.state.coins,12);
 assert.equal(upgraded.state.stations.soup.level,2);
 assert.equal(upgraded.state.sold,2);
 assert.equal(forest.stationYield(upgraded.state.stations.soup,'soup',start+35000).coins,12);
 assert.equal(act(upgraded.state,{type:'upgrade',id:'soup',now:start+35000}).ok,false);
 const capped={...upgraded.state,coins:9999,stations:{...upgraded.state.stations,soup:{...upgraded.state.stations.soup,level:5}}};
 assert.equal(act(capped,{type:'upgrade',id:'soup',now:start+35000}).ok,false);
});

test('tea construction enforces ownership AND story collection, or bundle; no main-story writes',()=>{
 const main=story();const before=JSON.stringify(main);const initial={...forest.createForest(start),coins:100};
 let h=home.createPetHomeState();
 assert.equal(act(initial,{type:'build',id:'tea',now:start},h,main).ok,false);
 h=home.applyHomeAction(h,main,{type:'purchase',product:'story'}).state;
 assert.equal(act(initial,{type:'build',id:'tea',now:start},h,main).ok,false);
 const completed={...main,hasSeenSunbeastFirstReveal:true};
 assert.equal(act(initial,{type:'build',id:'tea',now:start},h,completed).ok,false);
 h={...h,residents:['beigo','naotaro']};
 const built=act(initial,{type:'build',id:'tea',now:start},h,completed);
 assert.equal(built.ok,true);assert.equal(built.state.coins,20);
 assert.equal(act(built.state,{type:'build',id:'tea',now:start},h,completed).ok,false);
 const bundle={...home.applyHomeAction(home.createPetHomeState(),main,{type:'purchase',product:'bundle'}).state,residents:['beigo','naotaro']};
 assert.equal(act(initial,{type:'build',id:'tea',now:start},bundle,main).ok,true);
 assert.equal(act({...initial,coins:79},{type:'build',id:'tea',now:start},bundle,main).ok,false);
 assert.equal(JSON.stringify(main),before);
});

test('journal rewards are earned and one-time, including after reload',()=>{
 let state=forest.createForest(start);
 assert.equal(act(state,{type:'task',id:'first-soup'}).ok,false);
 state=act(state,{type:'collect',id:'soup',now:start+10000}).state;
 state=act(state,{type:'task',id:'first-soup'}).state;
 assert.equal(state.coins,66);
 assert.equal(act(forest.normalizeForest(JSON.parse(JSON.stringify(state)),start+10000),{type:'task',id:'first-soup'}).ok,false);
});

test('decorations enforce collectible gates, capacity, clamped movement and persist',()=>{
 let state=forest.createForest(start);
 assert.equal(act(state,{type:'place',id:'pond'}).ok,false);
 const bundle={...home.createPetHomeState(),purchases:{story:false,bundle:true}};
 for(const id of ['pond','cushion','mat'])state=act(state,{type:'place',id},bundle).state;
 assert.equal(state.decorations.length,6);
 assert.equal(act(state,{type:'place',id:'books'},bundle).ok,false);
 state=act(state,{type:'move',kind:'decoration',id:'pond',x:-10,y:900},bundle).state;
 const loaded=forest.normalizeForest(JSON.parse(JSON.stringify(state)),start);
 assert.deepEqual(loaded.decorations.find(item=>item.id==='pond'),{id:'pond',x:18,y:76});
 assert.equal(act(state,{type:'move',kind:'station',id:'soup',x:NaN,y:40},bundle).ok,false);
});

test('corrupt state recovers, and persistence writes only the forest key',()=>{
 const state=forest.normalizeForest({version:2,coins:NaN,stations:{soup:{level:999,collectedAt:Infinity}},decorations:[null,{id:'made-up'}, {id:'rest',x:Infinity,y:0},{id:'rest',x:5,y:4}],claimedTasks:['fake']},start);
 assert.equal(state.coins,40);assert.equal(state.stations.soup.level,5);assert.equal(state.stations.soup.collectedAt,start);
 assert.equal(state.decorations.length,1);assert.deepEqual(state.claimedTasks,[]);
 const writes=[];global.localStorage={setItem:(key,value)=>writes.push([key,value])};global.window={dispatchEvent:()=>{}};
 assert.equal(forest.saveForest(state),true);assert.deepEqual(writes.map(item=>item[0]),['moment:pet-forest:v2']);
 global.localStorage.setItem=()=>{throw new Error('quota');};assert.equal(forest.saveForest(state),false);
 delete global.localStorage;delete global.window;
});

const room = compile('petRoomLayout.ts');
test('room floor stays below the wall and above controls on both phone sizes',()=>{
 for(const height of [852,640/360*393]) {
  const back=room.toRoomPoint(18,30,height);
  const front=room.toRoomPoint(82,76,height);
  assert.ok(back.y>=height*.55);
  assert.ok(front.y<=height-190);
  assert.ok(front.y-back.y>=65);
  assert.ok(back.x>=70&&front.x<=323);
 }
});
test('drag coordinates round-trip after resizing without rewriting saved positions',()=>{
 const positions=[{x:18,y:30},{x:34,y:39},{x:82,y:76},{x:45.75,y:63.2}];
 for(const height of [852,640/360*393])for(const point of positions){
  const display=room.toRoomPoint(point.x,point.y,height);
  const restored=room.fromRoomPoint(display.x,display.y,height);
  assert.ok(Math.abs(restored.x-point.x)<1e-9);
  assert.ok(Math.abs(restored.y-point.y)<1e-9);
 }
});
