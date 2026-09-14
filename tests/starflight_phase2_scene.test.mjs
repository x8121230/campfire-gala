import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const scene = fs.readFileSync(new URL('../src/scenes/ForestStarflightGame.js', import.meta.url), 'utf8');
const standalone = fs.readFileSync(new URL('../assets/forest-starflight/phase1/standalone.js', import.meta.url), 'utf8');

test('hangar confirms the current paper doll, aircraft and special weapon before launch', () => {
    assert.match(scene, /森林飛行機艙/);
    assert.match(scene, /this\.doll\(null,177,328/);
    assert.match(scene, /森林芽翼 01/);
    assert.match(scene, /確認裝備・前往彈射甲板/);
});

test('three-second launch freezes the session until the forest catapult completes', () => {
    assert.match(scene, /showLaunchSequence\(fromCheckpoint=false\).*this\.session\.setPaused\(true\)/s);
    assert.match(scene, /t\/STAR_PHASE1\.launchSeconds/);
    assert.match(scene, /finishLaunch\(\).*this\.session\.setPaused\(false\).*this\.mode='playing'/s);
});

test('ultimate closeup uses the equipped paper doll and keeps the sister fairy', () => {
    assert.match(scene, /this\.ultimatePortrait=this\.doll/);
    assert.match(scene, /this\.ultimateFairy=this\.art\([^;]*'fairy'/);
    assert.match(scene, /妍妍的星光祝福/);
});

test('guardian presentation and standalone build include the current integrated features', () => {
    assert.match(scene, /母上的守護/);
    assert.match(scene, /回復 1 點生命・短暫無敵/);
    for (const marker of ['showLaunchSequence','drawGuardian','guardianEnabled','ultimatePortrait=this.doll']) assert.match(standalone, new RegExp(marker.replace('.', '\\.')));
});

test('v0.7 branch signs support flight selection, direct taps and visible region hazards', () => {
    assert.match(scene, /chooseBranchAt\(x,y\)/);
    assert.match(scene, /branchTop=this\.text/);
    assert.match(scene, /branchBottom=this\.text/);
    assert.match(scene, /飛入通道或直接點路牌/);
    assert.match(scene, /h\.kind==='mist'/);
    assert.match(scene, /h\.kind==='rock'/);
});

test('v0.8 adds a right-top GM panel with seven safe tuning controls and direct map testing', () => {
    for (const marker of ['GM 調校','openGMPanel','renderGMPanel','closeGMPanel','STAR_TUNING','forceRegion']) assert.match(scene, new RegExp(marker));
    for (const marker of ["regionType==='ice'","regionType==='wetland'","regionType==='magma'","regionType==='forest'","h.kind==='icicle'","h.kind==='ember'"]) assert.match(scene, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(standalone, /version:'0\.8\.1'/);
    assert.match(standalone, /GM 調校模式/);
});
