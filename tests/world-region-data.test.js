import assert from 'node:assert/strict';
import { WORLD_REGIONS, REGION_SUBMAPS, getSubmap } from '../src/data/WorldRegionData.js';

assert.equal(WORLD_REGIONS.length, 10, '必須有 10 個世界區域');
assert.equal(Object.keys(REGION_SUBMAPS).length, 9, '幻界改為直達星芽谷，其餘 9 區有子地圖資料');

WORLD_REGIONS.forEach((region) => {
    if (region.id === 'realm') {
        assert.equal(region.navigation, 'portal', '幻界必須使用漩渦直達入口');
        assert.equal(region.targetScene, 'RealmWorldGame', '幻界必須直達 3D 星芽谷');
        assert.equal(REGION_SUBMAPS.realm, undefined, '幻界不採三張子地圖設定');
    } else {
        assert.equal(REGION_SUBMAPS[region.id]?.length, 3, `${region.name} 必須有 3 張子地圖`);
    }
});

assert.equal(getSubmap('forest', 'morning_camp')?.name, '晨光營地');
assert.equal(REGION_SUBMAPS.forest.flatMap((item) => item.stageIds).length, 5, '森林第一版應接入 5 款正式遊戲');
assert.deepEqual(
    REGION_SUBMAPS.forest.map((item) => item.background),
    ['forest_morning_camp_v2', 'forest_emerald_woods_v2', 'forest_mosslight_valley_v2'],
    '森林三張子地圖必須使用三張不同背景'
);

console.log('✅ 世界地圖資料測試通過：9 區三子地圖＋幻界直達星芽谷。');
