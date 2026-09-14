// Read-only production asset check. No dependencies beyond Node.js.
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { LAYER_FILES, OUTFIT_LAYERS, LAYER_ORDER } from '../src/data/PaperDollLayers.js';
import { FAIRY_FILES } from '../src/data/FairyWardrobeData.js';
const PRODUCTION_FILES = { ...FAIRY_FILES, ...LAYER_FILES };

// Supports non-interlaced 8-bit RGBA PNGs, the approved master format.
export function inspectLayerPNG(data) {
    const fail = message => { throw new Error(message); };
    if (data.length < 33 || data.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') fail('不是 PNG');
    const width = data.readUInt32BE(16), height = data.readUInt32BE(20);
    if (width !== 1024 || height !== 1536) fail(`畫布必須為 1024×1536，目前 ${width}×${height}`);
    if (data[24] !== 8 || data[25] !== 6 || data[28] !== 0) fail('必須為 8-bit RGBA、非交錯 PNG；沒有 alpha 的棋盤格草稿不可用');
    const parts = [];
    for (let cursor = 8; cursor + 12 <= data.length;) {
        const length = data.readUInt32BE(cursor);
        if (cursor + length + 12 > data.length) fail('PNG 區塊不完整');
        const type = data.toString('ascii', cursor + 4, cursor + 8);
        if (type === 'IDAT') parts.push(data.subarray(cursor + 8, cursor + 8 + length));
        cursor += length + 12;
        if (type === 'IEND') break;
    }
    const stride = width * 4;
    const bytes = inflateSync(Buffer.concat(parts), { maxOutputLength: (stride + 1) * height });
    if (bytes.length !== (stride + 1) * height) fail('PNG 像素長度不符');
    let previous = Buffer.alloc(stride), transparent = 0, visible = 0;
    const paeth = (a, b, c) => {
        const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c);
        return da <= db && da <= dc ? a : db <= dc ? b : c;
    };
    for (let y = 0; y < height; y++) {
        const start = y * (stride + 1), filter = bytes[start];
        if (filter > 4) fail('不支援的 PNG filter');
        const row = Buffer.alloc(stride);
        for (let x = 0; x < stride; x++) {
            const left = x >= 4 ? row[x - 4] : 0, up = previous[x], upperLeft = x >= 4 ? previous[x - 4] : 0;
            const predictors = [0, left, up, Math.floor((left + up) / 2), paeth(left, up, upperLeft)];
            row[x] = (bytes[start + 1 + x] + predictors[filter]) & 255;
            if (x % 4 === 3) { if (row[x] === 0) transparent++; else visible++; }
        }
        previous = row;
    }
    if (!transparent || !visible) fail('圖層必須同時有透明區與可見內容，不能是實心背景或空白圖');
    return { width, height, transparentPixels: transparent, visiblePixels: visible };
}

export function validateManifest(files, outfits, read = path => readFileSync(new URL(`../${path}`, import.meta.url))) {
    const errors = [], assets = [];
    for (const [key, path] of Object.entries(files)) {
        try { assets.push({ key, path, ...inspectLayerPNG(read(path)) }); }
        catch (error) { errors.push(`${key}: ${error.message}`); }
    }
    for (const [id, layers] of Object.entries(outfits)) {
        if (!layers || !layers.outfitBody) { errors.push(`${id}: 缺少 outfitBody`); continue; }
        for (const [slot, key] of Object.entries(layers)) {
            if (!['outfitBack', 'outfitBody', 'effectFront'].includes(slot)) errors.push(`${id}: 不合法的衣服圖層 ${slot}`);
            if (!Object.hasOwn(files, key)) errors.push(`${id}: ${key} 尚未登記素材路徑`);
        }
    }
    return { ok: !errors.length, outfitCount: Object.keys(outfits).length, assets, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const report = validateManifest(PRODUCTION_FILES, OUTFIT_LAYERS);
    console.log(JSON.stringify(report, null, 2));
    console.log('30 件既有服裝已登記為相容的一層式 outfitBody；格式通過不代表可替換頭部的美術已完成。');
    if (!report.ok) process.exitCode = 1;
}
