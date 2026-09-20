import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import {CloudGlideSession,CLOUD_GLIDE_CONFIG,CLOUD_GLIDE_PHASES} from '../src/data/CloudGlideData.js';

assert.equal(CLOUD_GLIDE_CONFIG.targetRings,25);
assert.equal(CLOUD_GLIDE_PHASES.length,5);
assert.deepEqual(CLOUD_GLIDE_PHASES.map(phase=>phase.name),['晨風試翼','浮島變奏','逆風峽谷','彩虹衝刺','風暴核心']);

const session=new CloudGlideSession();
assert.equal(session.phaseIndex,0);
assert.equal(session.missRing(),true);assert.equal(session.combo,0);
assert.equal(session.bumpCloud(),true);assert.equal(session.cloudBumps,1);
assert.equal(session.hint(),true);assert.equal(session.hints,1);

let last;
for(let i=0;i<5;i+=1)last=session.passRing({perfect:i===0});
assert.equal(last.phaseChanged,true);assert.equal(session.phaseIndex,1);assert.equal(session.rings,5);
assert.equal(session.stars,6);assert.equal(session.combo,5);assert.equal(session.bestCombo,5);
assert.ok(session.score>500);

const rareSession=new CloudGlideSession();
const ordinary=rareSession.passRing({perfect:true});
const golden=rareSession.passRing({perfect:true,rare:'gold'});
const rainbow=rareSession.passRing({perfect:true,boost:true,rare:'rainbow'});
assert.ok(golden.points>ordinary.points);assert.ok(rainbow.points>golden.points);
assert.equal(rareSession.stars,12);

session.missRing();assert.equal(session.combo,0);
for(let i=5;i<20;i+=1)session.passRing({boost:i>=15});
assert.equal(session.phaseIndex,4);
assert.equal(session.health,3);session.damage();session.damage();assert.equal(session.health,1);
assert.equal(session.repair(),true);assert.equal(session.health,2);

for(let i=20;i<24;i+=1)assert.equal(session.passRing().result,'passed');
assert.equal(session.passRing({perfect:true}).result,'complete');
assert.equal(session.complete,true);assert.equal(session.rings,25);
assert.equal(session.passRing().result,'ignored');assert.equal(session.missRing(),false);

const sceneSource=await readFile(new URL('../src/scenes/CloudGlideGame.js',import.meta.url),'utf8');
assert.match(sceneSource,/setDisplaySize\(187,140\)/);
assert.match(sceneSource,/boostButton=this\.button\(1032,613,126,86/);
assert.match(sceneSource,/container\(1178,613\)/);
for(const family of ['swift','sheep','whale','thick-cloud','storm-cloud','gust','shield']){
    for(let frame=0;frame<4;frame+=1)await access(new URL(`../assets/cloud-glide/${family}-${frame}.png`,import.meta.url));
}

console.log('cloud_glide_logic: gameplay, 10% resize, paired controls and 28 watercolor frames passed');
