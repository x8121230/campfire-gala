import test from 'node:test';
import assert from 'node:assert/strict';
import {updatePumpkinBossV321 as update,advancePumpkinProjectile as advance,clearPumpkinAttacks,insideSlam} from '../src/realm/PumpkinCombatV321.js';
import {mouseIdlePhase,impactFrame,slashAngle} from '../src/realm/StorybookEffectsV321.js';
function setup(){const j={player:{x:100,y:0},projectiles:[],traps:[],hits:0,effects:[],hurt(){this.hits++},effect(k,v){this.effects.push({k,...v})},moveBody(m,x,y){m.x+=x;m.y+=y}};const m={id:1,x:0,y:0,homeX:0,homeY:0,alive:true,aggro:true,boss:{phase:'idle',elapsed:0,cooldown:0,turn:0}};return {j,m};}
function ticks(j,m,n){for(let i=0;i<n;i++)update(j,m,.05);}
test('slam locks target, lands once, leaves no persistent damage',()=>{const {j,m}=setup();update(j,m,.05);assert.equal(m.boss.target.x,100);ticks(j,m,27);assert.equal(j.hits,1);assert.equal(j.effects.length,1);ticks(j,m,15);assert.equal(j.hits,1);});
test('moving out of locked warning avoids slam',()=>{const {j,m}=setup();update(j,m,.05);j.player.y=150;ticks(j,m,27);assert.equal(m.y,0);assert.equal(j.hits,0);});
test('warning ellipse boundary',()=>{assert(insideSlam({x:105,y:0},{x:0,y:0}));assert(!insideSlam({x:105.1,y:0},{x:0,y:0}));assert(!insideSlam({x:0,y:65.1},{x:0,y:0}));});
test('vertical pumpkin aim stays vertical, emits once',()=>{const {j,m}=setup();j.player={x:0,y:100};m.boss.turn=1;update(j,m,.05);j.player.x=80;ticks(j,m,15);assert.equal(j.projectiles.length,1);assert.equal(j.projectiles[0].dx,0);assert.equal(j.projectiles[0].dy,1);assert.equal(j.projectiles[0].kind,'pumpkin');});
function shot(){return {x:0,y:0,dx:1,dy:0,speed:185,radius:28,power:1,life:2,maxLife:2,ownerBoss:1};}
test('projectile substeps stop at wall before player',()=>{const {j}=setup();const s=shot();advance(j,s,1,x=>x<30);assert.equal(j.hits,0);assert.equal(s.life,0);assert.equal(j.effects.length,1);advance(j,s,1,()=>true);assert.equal(j.effects.length,1);});
test('projectile hits once and expires',()=>{const {j}=setup();const s=shot();advance(j,s,1,()=>true);advance(j,s,1,()=>true);assert.equal(j.hits,1);assert.equal(s.life,0);});
test('death clears only owned attacks',()=>{const {j,m}=setup();j.projectiles=[{ownerBoss:1},{ownerBoss:2}];j.traps=[{ownerBoss:1},{ownerBoss:2}];clearPumpkinAttacks(j,m);assert.equal(j.projectiles.length,1);assert.equal(j.projectiles[0].ownerBoss,2);assert.equal(j.traps.length,1);m.alive=false;update(j,m,1);assert.equal(m.boss,null);});
test('mouse idle continues cycling after long play',()=>{for(const t of [0,60,3600,90000]){const a=mouseIdlePhase(t,3),b=mouseIdlePhase(t+.3,3);assert(a>=0&&a<1);assert.notEqual(a,b);}});
test('four impact frames and overhead left/right slash',()=>{assert.deepEqual([0,.1,.25,.6].map(impactFrame),[0,1,2,3]);assert.equal(slashAngle(-1,0,0),-Math.PI/2);assert.equal(slashAngle(-1,0,1),-Math.PI);assert.equal(slashAngle(1,0,1),0);});
