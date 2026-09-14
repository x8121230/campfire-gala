import assert from 'node:assert/strict';
import { IceTapRescueSession, ICE_TAP_LEVELS } from '../src/data/IceTapRescueData.js';

for(let level=0;level<ICE_TAP_LEVELS.length;level++){
    const session=new IceTapRescueSession(level);
    const future=session.level.path[1];
    if(future)assert.equal(session.tap(future.id).result,'future');
    const decoy=session.level.decoys[0];
    if(decoy)assert.equal(session.tap(decoy.id).result,'decoy');
    while(!session.complete)assert.equal(session.tap(session.activeId).result,'support');
    assert.equal(session.current,session.level.path.length);
}
console.log('ice_tap_rescue_logic: five towers, order guard and decoy feedback passed');
