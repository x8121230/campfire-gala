import { DEFAULT_GAME_CONFIG, GAME_CONFIG_STORAGE_KEY } from '../data/GameConfig.js';
import PlatformStorage from './PlatformStorage.js';

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

export default class ConfigManager {
    static baseConfig = null;
    static activeConfig = null;

    static clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    static merge(base, override) {
        const result = this.clone(base);
        if (!isPlainObject(override)) return result;

        Object.keys(result).forEach((key) => {
            if (override[key] === undefined) return;
            result[key] = isPlainObject(result[key])
                ? this.merge(result[key], override[key])
                : this.clone(override[key]);
        });
        return result;
    }

    static setBaseConfig(config) {
        const candidate = this.merge(DEFAULT_GAME_CONFIG, config);
        const errors = this.validate(candidate);
        this.baseConfig = errors.length === 0 ? candidate : this.clone(DEFAULT_GAME_CONFIG);
        if (errors.length > 0) console.warn('正式平衡設定無效，已改用預設值：', errors);
        this.activeConfig = null;
    }

    static getBaseConfig() {
        return this.clone(this.baseConfig || DEFAULT_GAME_CONFIG);
    }

    static getConfig() {
        if (this.activeConfig) return this.clone(this.activeConfig);

        const base = this.baseConfig || DEFAULT_GAME_CONFIG;
        let localOverride = null;
        try {
            const raw = PlatformStorage.getItem(GAME_CONFIG_STORAGE_KEY);
            localOverride = raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.warn('GM 本機設定無法讀取，已改用正式設定。', error);
        }

        // 每次正式平衡版本升級時，自動捨棄舊版 GM 覆寫值。
        // 遊戲存檔使用不同 key，不會因此清除玩家進度。
        if (localOverride && Number(localOverride.version) !== Number(base.version)) {
            PlatformStorage.removeItem(GAME_CONFIG_STORAGE_KEY);
            localOverride = null;
            console.info('GM 參數版本已更新，套用新版正式預設值。');
        }

        const candidate = this.merge(base, localOverride);
        const errors = this.validate(candidate);
        this.activeConfig = errors.length === 0 ? candidate : this.clone(base);
        if (errors.length > 0) console.warn('GM 本機設定無效，已忽略：', errors);
        return this.clone(this.activeConfig);
    }

    static getDefaultConfig() {
        return this.getBaseConfig();
    }

    static saveConfig(config) {
        const candidate = this.merge(this.baseConfig || DEFAULT_GAME_CONFIG, config);
        const errors = this.validate(candidate);
        if (errors.length > 0) return { ok: false, errors };

        PlatformStorage.setItem(GAME_CONFIG_STORAGE_KEY, JSON.stringify(candidate));
        this.activeConfig = candidate;
        return { ok: true, config: this.clone(candidate), errors: [] };
    }

    static resetConfig() {
        PlatformStorage.removeItem(GAME_CONFIG_STORAGE_KEY);
        this.activeConfig = this.clone(this.baseConfig || DEFAULT_GAME_CONFIG);
        return this.clone(this.activeConfig);
    }

    static applyToRegistry(registry) {
        const config = this.getConfig();
        registry.set('game_config', config);
        registry.set('game_config_version', config.version);
        return config;
    }

    static get(path, fallback = null, source = null) {
        const keys = String(path).split('.');
        let current = source || this.getConfig();
        for (const key of keys) {
            if (current == null || current[key] === undefined) return fallback;
            current = current[key];
        }
        return current;
    }

    static set(path, value, target) {
        const keys = String(path).split('.');
        let current = target;
        for (let index = 0; index < keys.length - 1; index += 1) {
            const key = keys[index];
            if (!isPlainObject(current[key])) current[key] = {};
            current = current[key];
        }
        current[keys[keys.length - 1]] = value;
        return target;
    }

    static validate(config) {
        const errors = [];
        const board = config?.bushMinesweeper?.board || {};
        const visuals = config?.bushMinesweeper?.visuals || {};
        const gold = config?.bushMinesweeper?.goldGrass || {};
        const score = config?.bushMinesweeper?.score || {};
        const achievements = config?.bushMinesweeper?.achievements || {};
        const hiddenGoldenBug = config?.bushMinesweeper?.hiddenGoldenBug || {};
        const fireflyGame = config?.fireflyCatch?.game || {};
        const fireflyRhythm = config?.fireflyCatch?.rhythm || {};
        const fireflyScore = config?.fireflyCatch?.score || {};
        const constellationGame = config?.constellation?.game || {};
        const constellationScore = config?.constellation?.score || {};
        const constellationPresentation = config?.constellation?.presentation || {};

        if (typeof config?.worldMap?.unlockAllStages !== 'boolean') {
            errors.push('全關卡開放開關必須是布林值。');
        }

        const integerRange = (value, min, max, label) => {
            if (!Number.isInteger(Number(value)) || Number(value) < min || Number(value) > max) {
                errors.push(label + '必須介於 ' + min + '～' + max + '。');
            }
        };

        integerRange(board.rows, 5, 7, '地圖列數');
        integerRange(board.cols, 5, 7, '地圖欄數');
        const safeMax = Math.max(1, Number(board.rows) * Number(board.cols) - 9);
        integerRange(board.dangerCount, 1, safeMax, '危險數量');
        integerRange(board.mistakeLimit, 1, 5, '可踩錯次數');
        integerRange(board.hintCount, 0, 3, '提示次數');
        integerRange(board.solverAttempts, 100, 2000, '盤面嘗試次數');

        integerRange(visuals.bushSize, 45, 100, '草叢大小');
        integerRange(visuals.flagSize, 45, 100, '旗子大小');
        integerRange(visuals.dangerSize, 55, 110, '刺刺球大小');
        integerRange(visuals.sideDangerSize, 45, 100, '資訊區刺刺球大小');
        integerRange(visuals.goldBoardSize, 55, 110, '盤面金草大小');
        integerRange(visuals.goldResultSize, 90, 190, '結算金草大小');

        const rates = gold.rates || {};
        ['goldenGrass', 'rainbowGrass', 'mysteryGrass'].forEach((key) => {
            integerRange(rates[key], 0, 100, key + ' 機率');
        });
        const rateTotal = Number(rates.goldenGrass) + Number(rates.rainbowGrass) + Number(rates.mysteryGrass);
        if (rateTotal !== 100) {
            errors.push('三種金草機率合計必須是 100％（目前 ' + rateTotal + '％）。');
        }
        integerRange(gold.duplicatePity, 1, 20, '重複保底次數');

        integerRange(score.clearPoints, 0, 100, '破關基礎分');
        integerRange(score.noDangerBonus, 0, 100, '無傷加分');
        integerRange(score.dangerPenaltyPerHit, 0, 100, '每次踩錯扣除');
        integerRange(score.noHintBonus, 0, 100, '未使用提示加分');
        integerRange(score.maxScore, 1, 100, '單局滿分');
        if (Number(score.clearPoints) + Number(score.noDangerBonus) + Number(score.noHintBonus) !== Number(score.maxScore)) {
            errors.push('破關分＋無傷加分＋未提示加分，必須等於單局滿分。');
        }
        if (Number(score.dangerPenaltyPerHit) > Number(score.noDangerBonus)) {
            errors.push('每次踩錯扣除不能大於無傷加分。');
        }

        integerRange(achievements.clearCountTarget, 2, 30, '累積破關成就門檻');
        integerRange(achievements.noHintClearTarget, 2, 30, '不用提示成就門檻');
        integerRange(achievements.perfectClearTarget, 2, 30, '滿分成就門檻');

        if (typeof hiddenGoldenBug.enabled !== 'boolean') {
            errors.push('黃金蟲奇遇開關必須是布林值。');
        }
        integerRange(hiddenGoldenBug.chancePercent, 0, 100, '黃金蟲出現機率');
        integerRange(hiddenGoldenBug.pityMisses, 0, 30, '黃金蟲保底場數');
        integerRange(hiddenGoldenBug.bonusScore, 1, 100, '黃金蟲加分');

        integerRange(fireflyGame.colorCount, 3, 3, '螢火節拍道數');
        integerRange(fireflyRhythm.bpm, 70, 100, '螢火歌曲速度');
        integerRange(fireflyRhythm.travelBeats, 4, 7, '音符下落拍數');
        integerRange(fireflyRhythm.perfectWindowMs, 150, 450, 'Perfect 判定時間');
        integerRange(fireflyRhythm.goodWindowMs, 400, 800, 'Good 判定時間');
        integerRange(fireflyRhythm.missWindowMs, 700, 1200, 'Miss 判定時間');
        integerRange(fireflyRhythm.musicVolumePercent, 0, 100, '螢火音樂音量');
        integerRange(fireflyRhythm.fireflySize, 70, 116, '節拍螢火蟲大小');
        if (Number(fireflyRhythm.perfectWindowMs) >= Number(fireflyRhythm.goodWindowMs)) {
            errors.push('Perfect 判定時間必須小於 Good 判定時間。');
        }
        if (Number(fireflyRhythm.goodWindowMs) >= Number(fireflyRhythm.missWindowMs)) {
            errors.push('Good 判定時間必須小於 Miss 判定時間。');
        }

        integerRange(fireflyScore.accuracyPoints, 0, 100, '螢火正確率分');
        integerRange(fireflyScore.comboPoints, 0, 100, '螢火連擊分');
        integerRange(fireflyScore.maxScore, 1, 100, '螢火滿分');
        const fireflyTotal = Number(fireflyScore.accuracyPoints)
            + Number(fireflyScore.comboPoints);
        if (fireflyTotal !== Number(fireflyScore.maxScore)) {
            errors.push('螢火判定分＋連擊分，必須等於螢火滿分。');
        }

        integerRange(constellationGame.roundCount, 1, 3, '星空回合數');
        integerRange(constellationGame.snapRadius, 55, 100, '星星吸附範圍');
        integerRange(constellationGame.idleHintSeconds, 3, 12, '自動提示等待時間');
        integerRange(constellationGame.branchHintMistakes, 1, 4, '分岔自動提示錯誤次數');
        integerRange(constellationScore.wrongPenalty, 0, 20, '點錯扣分');
        integerRange(constellationScore.maxWrongPenalty, 0, 50, '點錯扣分上限');
        integerRange(constellationScore.hintPenalty, 0, 20, '手動提示扣分');
        integerRange(constellationScore.maxHintPenalty, 0, 50, '提示扣分上限');
        integerRange(constellationScore.minScore, 0, 100, '星空保底分數');
        integerRange(constellationScore.maxScore, 1, 100, '星空滿分');
        if (Number(constellationScore.minScore) > Number(constellationScore.maxScore)) {
            errors.push('星空保底分數不能高於滿分。');
        }
        integerRange(constellationPresentation.toneVolumePercent, 0, 100, '星空音階音量');
        integerRange(constellationPresentation.comboBurstEvery, 2, 6, '星光連擊爆發間隔');
        integerRange(constellationPresentation.rainbowChancePercent, 0, 100, '彩虹星出現機率');
        integerRange(constellationPresentation.interactionItemCount, 2, 5, '朋友互動物數量');

        return errors;
    }
}
