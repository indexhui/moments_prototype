const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
function compile(file,imports={}) {
 const {outputText}=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/lib/game',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}});
 const module={exports:{}};new Function('module','exports','require',outputText)(module,module.exports,id=>imports[id]);return module.exports;
}
const home=compile('petHome.ts');
const forest=compile('petForest.ts',{'./petHome':home});
const room=compile('petRoomInteraction.ts',{'./petHome':home});
test('wishes rotate after care, respect each action cooldown and never impose a deadline',()=>{
 const state=home.createPetHomeState();const now=100000;
 assert.equal(room.petWish(state,'beigo',now),'feed');
 state.bonds.beigo=8;state.careAt['beigo:feed']=now;
 assert.equal(room.petWish(state,'beigo',now),'pet');
 state.careAt['beigo:pet']=now;state.careAt['beigo:play']=now;
 assert.equal(room.petWish(state,'beigo',now+19999),null);
 assert.equal(room.petWish(state,'beigo',now+20000),'pet');
 assert.equal(room.petWish(state,'beigo',now+86400000),'pet');
});
test('pet strokes must belong to the same companion within one interaction',()=>{
 let strokes=room.advancePetStroke(null,'beigo',1000);
 strokes=room.advancePetStroke(strokes,'beigo',1500);assert.equal(strokes.count,2);
 strokes=room.advancePetStroke(strokes,'frog',1800);assert.equal(strokes.count,1);
 strokes=room.advancePetStroke(strokes,'frog',6500);assert.equal(strokes.count,1);
 strokes=room.advancePetStroke(strokes,'frog',6700);
 strokes=room.advancePetStroke(strokes,'frog',6900);assert.equal(strokes.count,3);
});
test('food and play animate toward the drop location before completing',()=>{
 for(const kind of ['feed','play']){
  const activity={pet:'beigo',kind,startedAt:1000,from:{x:25,y:40},to:{x:75,y:70}};
  assert.deepEqual(room.activityPose(activity,1000).point,activity.from);
  const moving=room.activityPose(activity,1550);assert.equal(moving.arrived,false);assert.equal(moving.done,false);assert.equal(moving.point.x,50);
  const arrived=room.activityPose(activity,2100);assert.deepEqual(arrived.point,activity.to);assert.equal(arrived.arrived,true);assert.equal(arrived.done,false);
  assert.equal(room.activityPose(activity,1000+room.ACTIVITY_DURATION[kind]-1).done,false);
  assert.equal(room.activityPose(activity,1000+room.ACTIVITY_DURATION[kind]).done,true);
 }
});
test('invalid drops cannot become floor interactions; all idle companions remain on the floor',()=>{
 for(const point of [{x:NaN,y:50},{x:50,y:Infinity},{x:50,y:10},{x:100,y:50}])assert.equal(room.isOnFloor(point),false);
 assert.equal(room.isOnFloor({x:70,y:65}),true);
 const state=forest.createForest();
 for(let now=0;now<120000;now+=6000)for(const [index,pet] of ['beigo','naotaro','frog'].entries()){
  const point=room.idlePetPoint(pet,index,state,now);
  assert.ok(point.x>=18&&point.x<=82&&point.y>=30&&point.y<=76);
 }
});
