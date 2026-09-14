import SaveSystem from './SaveSystem.js';
import { WORLD_REGIONS, REGION_SUBMAPS } from '../data/WorldRegionData.js';

export default class WorldProgressSystem {
    static defaults() {
        const regions = {};
        WORLD_REGIONS.forEach((region) => {
            regions[region.id] = {
                unlocked: region.id === 'forest' || region.alwaysUnlocked === true,
                fogCleared: region.id === 'forest' || region.alwaysUnlocked === true
            };
        });
        return { regions, stickers: [], participation: {}, discoveredSubmaps: ['morning_camp'] };
    }

    static read(registry) {
        const defaults = this.defaults();
        const saved = registry.get('world_progress') || SaveSystem.getValue('world_progress', {}) || {};
        const merged = {
            ...defaults,
            ...saved,
            regions: { ...defaults.regions, ...(saved.regions || {}) },
            stickers: Array.isArray(saved.stickers) ? saved.stickers : [],
            participation: saved.participation && typeof saved.participation === 'object' ? saved.participation : {},
            discoveredSubmaps: Array.isArray(saved.discoveredSubmaps) ? saved.discoveredSubmaps : ['morning_camp']
        };
        WORLD_REGIONS.filter((region) => region.alwaysUnlocked).forEach((region) => {
            merged.regions[region.id] = {
                ...(merged.regions[region.id] || {}),
                unlocked: true,
                fogCleared: true
            };
        });
        registry.set('world_progress', merged);
        return merged;
    }

    static save(registry, progress) {
        registry.set('world_progress', progress);
        SaveSystem.setValue('world_progress', progress);
    }

    static totalStars(registry) {
        const stageProgress = registry.get('stage_progress') || {};
        return Object.values(stageProgress).reduce((sum, stage) => sum + Math.max(0, Number(stage?.stars) || 0), 0);
    }

    static regionStars(registry, regionId) {
        const stageIds = (REGION_SUBMAPS[regionId] || []).flatMap((submap) => submap.stageIds || []);
        const stageProgress = registry.get('stage_progress') || {};
        return stageIds.reduce((sum, id) => sum + Math.max(0, Number(stageProgress[id]?.stars) || 0), 0);
    }

    static unlock(registry, regionId) {
        const progress = this.read(registry);
        progress.regions[regionId] = { unlocked: true, fogCleared: true };
        this.save(registry, progress);
    }

    static addParticipation(registry, submapId) {
        const progress = this.read(registry);
        progress.participation[submapId] = (progress.participation[submapId] || 0) + 1;
        const stickerId = `sticker_${submapId}`;
        if (progress.participation[submapId] >= 6 && !progress.stickers.includes(stickerId)) {
            progress.stickers.push(stickerId);
        }
        if (!progress.discoveredSubmaps.includes(submapId)) progress.discoveredSubmaps.push(submapId);
        this.save(registry, progress);
        return progress.stickers.includes(stickerId);
    }
}
