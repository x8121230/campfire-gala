import { test } from 'node:test';
import assert from 'node:assert/strict';
import WorldProgressSystem from '../src/systems/WorldProgressSystem.js';

function registryWith(worldProgress) {
    const values = new Map([['world_progress', worldProgress]]);
    return {
        get: (key) => values.get(key),
        set: (key, value) => values.set(key, value)
    };
}

test('新存檔的幻界入口預設永久開放', () => {
    const progress = WorldProgressSystem.defaults();
    assert.deepEqual(progress.regions.realm, { unlocked: true, fogCleared: true });
});

test('舊存檔即使記錄為鎖定也會自動修復幻界入口', () => {
    const registry = registryWith({
        regions: { realm: { unlocked: false, fogCleared: false } },
        stickers: [], participation: {}, discoveredSubmaps: ['morning_camp']
    });
    const progress = WorldProgressSystem.read(registry);
    assert.equal(progress.regions.realm.unlocked, true);
    assert.equal(progress.regions.realm.fogCleared, true);
});
