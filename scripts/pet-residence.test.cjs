const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const compile=(file,imports={})=>{const {outputText}=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/lib/game',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}});const module={exports:{}};new Function('module','exports','require',outputText)(module,module.exports,name=>imports[name]);return module.exports;};
const home=compile('petHome.ts');
const forest=compile('petForest.ts',{'./petHome':home});
const stays=compile('petResidence.ts',{'./petHome':home,'./petForest':forest});
const story={hasSeenSunbeastFirstReveal:false,lastDogPhotoCapture:null,sunbeastPhotoCapturesById:{},hasCompletedStreetForgotLunchFrogEvent:false,unlockedDiaryEntryIds:[],status:{savings:1234}};
const start=100000;
const unlocked=()=>home.applyHomeAction(home.createPetHomeState(),story,{type:'purchase',product:'bundle'}).state;
const prepared=()=>({...forest.createForest(start),decorations:[{id:'rest',x:25,y:65},{id:'ball',x:60,y:65},{id:'plant',x:70,y:40},{id:'pond',x:75,y:68}]});
const act=(h,f,type,pet='naotaro',now=start)=>stays.applyResidence(h,f,story,{type,pet,now});

test('purchase grants invitation rights, without automatically moving anybody in or enabling their station',()=>{
 const h=unlocked();const f={...prepared(),coins:100};
 assert.deepEqual(home.residentPets(h,story),['beigo']);
 assert.equal(home.canInvitePet(h,story,'naotaro'),true);
 assert.equal(forest.applyForest(f,h,story,{type:'build',id:'tea',now:start}).ok,false);
 assert.equal(home.applyHomeAction({...h,selectedPet:'frog'},story,{type:'care',action:'feed',now:start}).ok,false);
});
test('invitation validates rights, actual placed furniture, duplicates, and finite time',()=>{
 assert.equal(act(home.createPetHomeState(),prepared(),'send-invitation').ok,false);
 const h=unlocked();const f=forest.createForest(start);
 assert.equal(act(h,f,'send-invitation').ok,false);
 assert.equal(act(h,prepared(),'send-invitation','naotaro',NaN).ok,false);
 const sent=act(h,prepared(),'send-invitation');assert.equal(sent.ok,true);
 assert.equal(act(sent.state,prepared(),'send-invitation').ok,false);
 assert.deepEqual(home.residentPets(sent.state,story),['beigo']);
});
test('both companions can arrive after reload, wait indefinitely and check in exactly once',()=>{
 for(const pet of ['naotaro','frog']){
  const before=JSON.stringify(story);const f=prepared();
  let h=act(unlocked(),f,'send-invitation',pet).state;
  assert.equal(act(h,f,'check-in',pet,start+7999).ok,false);
  h=home.normalizePetHome(JSON.parse(JSON.stringify(h)));
  assert.equal(stays.residenceStatus(h,f,story,pet,start+86400000).arrived,true);
  const result=act(h,f,'check-in',pet,start+86400000);assert.equal(result.ok,true);
  assert.ok(home.residentPets(result.state,story).includes(pet));
  assert.equal(result.state.invitations[pet],undefined);
  assert.equal(act(result.state,f,'check-in',pet,start+86400000).ok,false);
  assert.equal(JSON.stringify(story),before);
 }
});
test('removing required furniture prevents check-in until the room is ready again',()=>{
 const h=act(unlocked(),prepared(),'send-invitation','frog').state;
 const f={...prepared(),decorations:prepared().decorations.filter(d=>d.id!=='pond')};
 assert.equal(act(h,f,'check-in','frog',start+8000).ok,false);
 assert.equal(act(h,prepared(),'check-in','frog',start+8000).ok,true);
});
test('legacy saves preserve entitled residents while future purchases still require invitations',()=>{
 const legacy={...unlocked(),bonds:{beigo:5,naotaro:40,frog:8}};delete legacy.residents;
 const restored=home.normalizePetHome(legacy);assert.equal(restored.residents,null);
 assert.deepEqual(home.residentPets(restored,story),['beigo','naotaro','frog']);
 const locked={...home.createPetHomeState()};delete locked.residents;
 const purchased=home.applyHomeAction(home.normalizePetHome(locked),story,{type:'purchase',product:'bundle'}).state;
 assert.deepEqual(purchased.residents,['beigo']);
 const storyOwned={...home.createPetHomeState(),purchases:{story:true,bundle:false}};delete storyOwned.residents;
 assert.deepEqual(home.residentPets(home.normalizePetHome(storyOwned),{...story,hasSeenSunbeastFirstReveal:true}),['beigo','naotaro']);
});
test('requests record completed interactions for the correct resident and grant rewards once',()=>{
 const f=prepared();let h={...unlocked(),residents:['beigo','frog','naotaro']};
 const original=JSON.stringify(h);
 assert.equal(act(h,f,'claim-request','frog').ok,false);
 h=stays.recordResidentMoment(h,story,'frog','play',start);assert.equal(JSON.stringify(h),original);
 h=stays.recordResidentMoment(h,story,'frog','decor:pond',start);
 h=stays.recordResidentMoment(h,story,'frog','decor:pond',start+1);
 assert.equal(stays.residentRequest(h,'frog',start).count,1);
 h=stays.recordResidentMoment(h,story,'beigo','feed',start);
 assert.equal(stays.residentRequest(h,'frog',start).complete,false);
 h=stays.recordResidentMoment(h,story,'frog','feed',start+100);
 h=home.normalizePetHome(JSON.parse(JSON.stringify(h)));
 const reward=act(h,f,'claim-request','frog',start+101);assert.equal(reward.ok,true);
 assert.equal(reward.state.hearts,h.hearts+8);assert.equal(reward.state.bonds.frog,h.bonds.frog+4);
 assert.equal(act(reward.state,f,'claim-request','frog',start+102).ok,false);
 const cooling=stays.recordResidentMoment(reward.state,story,'frog','feed',start+102);
 assert.equal(stays.residentRequest(cooling,'frog',start+102).count,0);
 const again=stays.recordResidentMoment(cooling,story,'frog','feed',start+60101);
 assert.equal(stays.residentRequest(again,'frog',start+60101).count,1);
});
test('unadmitted companions cannot complete requests, corrupt invite times and quest data normalize safely',()=>{
 const h=unlocked();assert.equal(stays.recordResidentMoment(h,story,'frog','feed',start),h);
 const dirty=home.normalizePetHome({...h,residents:['beigo','beigo','unknown'],invitations:{frog:Infinity,naotaro:-1},requests:{frog:{done:['feed','feed','unknown',null],round:-5,claimedAt:NaN}}});
 assert.deepEqual(dirty.residents,['beigo']);assert.deepEqual(dirty.invitations,{});
 assert.deepEqual(dirty.requests.frog,{done:['feed'],round:0,claimedAt:0});
});
