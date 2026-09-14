import assert from 'node:assert/strict';
import { SledDeliverySession, SLED_CONFIG } from '../src/data/SledDeliveryData.js';

const session = new SledDeliverySession();
assert.equal(session.setSpeed('fast'), true);
assert.equal(session.speed, 'fast');
assert.equal(session.deliverAt(SLED_CONFIG.deliveryMaxX + 1).result, 'early');
assert.equal(session.deliverAt(SLED_CONFIG.deliveryMinX - 1).result, 'late');
for (let i = 0; i < SLED_CONFIG.deliveriesToFinish; i++) {
    assert.equal(session.deliverAt((SLED_CONFIG.deliveryMinX + SLED_CONFIG.deliveryMaxX) / 2).result, 'success');
}
assert.equal(session.delivered, 5);
assert.equal(session.finished, true);
session.catchCargo();
assert.equal(session.cargoCatches, 0, 'finished sessions ignore new catch events');
console.log('sled_delivery_logic: speed, zone, retry and finish checks passed');
