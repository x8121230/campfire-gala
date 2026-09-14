import assert from 'node:assert/strict';
import { SealRescueSession, SEAL_RESCUE_CONFIG } from '../src/data/SealRescueData.js';

const session = new SealRescueSession();
for (let guard = 0; guard < 20 && !session.finished; guard++) {
    const round = session.nextRound(() => .2);
    const lane = round.find(choice => choice.seal && !choice.cracked)?.lane
        ?? round.find(choice => !choice.cracked).lane;
    assert.ok(session.choose(lane));
}
assert.equal(session.seals, SEAL_RESCUE_CONFIG.sealsToFinish);
assert.equal(session.finished, true);

const splash = new SealRescueSession();
splash.round = 2;
const choices = splash.nextRound(() => .1);
const cracked = choices.find(choice => choice.cracked);
assert.equal(splash.choose(cracked.lane).result, 'splash');
assert.equal(splash.splashes, 1);

console.log('seal_rescue_logic: rescue, hint and whale-save rules passed');
