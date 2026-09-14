(function (root) {
  'use strict';
  const IMAGE_RE = /\.(png|jpe?g|webp|gif|svg|bmp|avif)$/i;
  const cleanPath = path => String(path || '').replace(/\\/g, '/').replace(/^\.\//, '');
  const base = path => cleanPath(path).split('/').pop();
  const clamp = (value, min, max, fallback = min) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : fallback;
  // A small DATA-only reader. Uploaded JavaScript is never imported or evaluated.
  function tokens(source) {
    const out = []; let i = 0;
    while (i < source.length) {
      const c = source[i];
      if (/\s/.test(c)) { i++; continue; }
      if (source.startsWith('//', i)) { i = source.indexOf('\n', i); if (i < 0) break; continue; }
      if (source.startsWith('/*', i)) { const end = source.indexOf('*/', i + 2); i = end < 0 ? source.length : end + 2; continue; }
      if (c === '"' || c === "'" || c === '`') {
        const quote = c; let value = '', dynamic = false; i++;
        while (i < source.length && source[i] !== quote) {
          let ch = source[i++];
          if (quote === '`' && ch === '$' && source[i] === '{') dynamic = true;
          if (ch === '\\') {
            ch = source[i++];
            if (ch === 'u' && /^[0-9a-f]{4}$/i.test(source.slice(i, i + 4))) { ch = String.fromCharCode(parseInt(source.slice(i, i + 4), 16)); i += 4; }
            else if (ch === 'x' && /^[0-9a-f]{2}$/i.test(source.slice(i, i + 2))) { ch = String.fromCharCode(parseInt(source.slice(i, i + 2), 16)); i += 2; }
            else ch = ({ n: '\n', r: '\r', t: '\t' })[ch] ?? ch;
          }
          value += ch;
        }
        i++; out.push({ type: dynamic ? 'dynamic' : 'string', value }); continue;
      }
      const number = source.slice(i).match(/^(?:0x[\da-f]+|\d+(?:\.\d+)?)/i);
      if (number) { out.push({ type: 'number', value: Number(number[0]) }); i += number[0].length; continue; }
      const word = source.slice(i).match(/^[a-z_$][\w$]*/i);
      if (word) { out.push({ type: 'word', value: word[0] }); i += word[0].length; continue; }
      out.push({ type: 'symbol', value: c }); i++;
    }
    return out;
  }
  function literalReader(list, initial = 0) {
    let cursor = initial;
    function read(depth = 0) {
      if (depth > 30) throw new Error('資料巢狀過深');
      const token = list[cursor++]; if (!token) throw new Error('資料不完整');
      if (token.type === 'string' || token.type === 'number') return token.value;
      if (token.value === 'true') return true;
      if (token.value === 'false') return false;
      if (token.value === 'null') return null;
      if (token.value === '-' && list[cursor]?.type === 'number') return -list[cursor++].value;
      if (token.value === '[') {
        const result = [];
        while (list[cursor] && list[cursor].value !== ']') {
          if (list[cursor].value === ',') { cursor++; continue; }
          result.push(read(depth + 1));
          if (list[cursor]?.value !== ',' && list[cursor]?.value !== ']') throw new Error('含運算式的陣列不自動執行');
        }
        if (!list[cursor]) throw new Error('陣列不完整'); cursor++; return result;
      }
      if (token.value === '{') {
        const result = Object.create(null);
        while (list[cursor] && list[cursor].value !== '}') {
          if (list[cursor].value === ',') { cursor++; continue; }
          const key = list[cursor++];
          if (!['string', 'word', 'number'].includes(key.type) || list[cursor++]?.value !== ':') throw new Error('非靜態物件');
          const value = read(depth + 1);
          if (!['__proto__', 'prototype', 'constructor'].includes(String(key.value))) result[key.value] = value;
          if (list[cursor]?.value !== ',' && list[cursor]?.value !== '}') throw new Error('含運算式的物件不自動執行');
        }
        if (!list[cursor]) throw new Error('物件不完整'); cursor++; return result;
      }
      throw new Error('非靜態資料');
    }
    const value = read(); return { value, end: cursor };
  }
  function namedLiteral(source, name) {
    const list = tokens(source);
    for (let i = 0; i < list.length - 2; i++) {
      if (list[i].value !== name || list[i + 1].value !== '=') continue;
      let start = i + 2;
      if (list[start]?.value === 'Object' && list[start + 2]?.value === 'freeze') start += 4;
      try { return literalReader(list, start).value; } catch { return null; }
    }
    return null;
  }
  function fairyDefinitions(source) {
    const result = [];
    for (const match of source.matchAll(/\b(v(\d+)Definitions)\s*=/g)) {
      const rows = namedLiteral(source, match[1]);
      if (!Array.isArray(rows)) continue;
      for (const row of rows) if (Array.isArray(row) && row.length >= 3 && row.slice(0, 3).every(x => typeof x === 'string')) {
        result.push({ slug: row[0], name: row[1], type: row[2], desc: row[3] || '', ability: row[4] || '', version: Number(match[2]) });
      }
    }
    return result;
  }
  function sourceMaps(source) {
    const paths = Object.create(null);
    const list = tokens(source);
    for (let i = 0; i + 2 < list.length; i++) {
      if (['word', 'string'].includes(list[i].type) && list[i + 1].value === ':' && list[i + 2].type === 'string' && /^assets\//.test(list[i + 2].value)) paths[list[i].value] = list[i + 2].value;
    }
    return paths;
  }
  function classify(path) {
    const p = cleanPath(path).toLowerCase(), filename = base(p);
    const wardrobe = /wardrobe|paper.?doll|服裝|紙娃娃/.test(p);
    let kind = 'image';
    if (/icon/.test(filename) && wardrobe) kind = 'icon';
    else if (wardrobe && /hat|headwear|帽/.test(filename)) kind = 'hat';
    else if (wardrobe && /doll|body|cloth|fullset|dress|衣/.test(filename)) kind = 'body';
    else if (wardrobe) kind = 'layer';
    return { kind, wardrobe,
      character: !wardrobe && /hero|player|character|crew|cast|unit|sprite|公仔|主角|角色/.test(p),
      monster: !wardrobe && /monster|enemy|boss|creature|unit|sprite|wolf|怪|敵/.test(p) };
  }
  function assetName(path, definitions = []) {
    const file = base(path).replace(/\.[^.]+$/, ''), version = Number(path.match(/wardrobe_v(\d+)/)?.[1]);
    const slug = file.replace(/^(?:doll|hat|icon|body|cloth)_/, '').replace(/_v\d+.*$/, '');
    const def = definitions.find(d => d.slug === slug && (!version || d.version === version));
    return def?.name || ({ doll_daily_v50: '日常休閒裝', doll_pink_home_v50_alpha: '粉紅居家服', hero: '主角公仔', bosses: '首領圖集', units: '角色圖集', 'hero-atlas': '主角圖集' })[file] || file.replace(/_/g, ' ');
  }
  function resolvePath(path, assets) {
    const exact = assets.find(asset => asset.path === cleanPath(path)); if (exact) return exact;
    const matches = assets.filter(asset => base(asset.path) === base(path));
    return matches.length === 1 ? matches[0] : null;
  }
  function parseAtlas(json, imageWidth, imageHeight) {
    const entries = Array.isArray(json.frames) ? json.frames.map((f, i) => [f.filename || String(i), f]) : Object.entries(json.frames || {});
    const frames = [], skipped = [];
    for (const [name, item] of entries) {
      const f = item?.frame;
      if (item?.rotated || !f || ![f.x, f.y, f.w, f.h].every(Number.isFinite) || f.x < 0 || f.y < 0 || f.w <= 0 || f.h <= 0 || f.x + f.w > imageWidth || f.y + f.h > imageHeight) { skipped.push(name); continue; }
      const size = item.sourceSize || { w: f.w, h: f.h }, offset = item.spriteSourceSize || { x: 0, y: 0 };
      if (![size.w, size.h, offset.x, offset.y].every(Number.isFinite) || size.w <= 0 || size.h <= 0 || offset.x < 0 || offset.y < 0 || offset.x + f.w > size.w || offset.y + f.h > size.h) { skipped.push(name); continue; }
      frames.push({ name, x: f.x, y: f.y, w: f.w, h: f.h, width: size.w, height: size.h, offsetX: offset.x, offsetY: offset.y });
    }
    return { frames, skipped };
  }
  function gridFrames(width, height, columns, rows, start = 0, end = null) {
    columns = Math.floor(clamp(columns, 1, 64)); rows = Math.floor(clamp(rows, 1, 64));
    const total = columns * rows;
    start = Math.floor(clamp(start, 0, total - 1)); end = Math.floor(clamp(end ?? total - 1, start, total - 1));
    const frames = [];
    for (let i = start; i <= end; i++) { const x = i % columns, y = Math.floor(i / columns);
      const left = Math.round(x * width / columns), top = Math.round(y * height / rows);
      const w = Math.round((x + 1) * width / columns) - left, h = Math.round((y + 1) * height / rows) - top;
      if (w > 0 && h > 0) frames.push({ name: String(i), x: left, y: top, w, h, width: w, height: h, offsetX: 0, offsetY: 0 });
    }
    return frames;
  }
  function wardrobeRect(asset, layer, canvasWidth, canvasHeight, zoom = 1) {
    const fit = Math.min((canvasWidth - 90) / 1024, (canvasHeight - 120) / 1536) * zoom;
    const tall = asset.kind === 'hat' && /wardrobe_v(?:55|56|59)\//.test(asset.path);
    const width = asset.masterWidth || asset.width, height = asset.masterHeight || asset.height;
    const scale = fit * layer.scale / 100;
    return { x: canvasWidth / 2 + layer.x * fit - width * scale / 2,
      y: canvasHeight / 2 + 20 + (layer.y - (tall ? 132 : 0)) * fit - height * scale / 2,
      w: width * scale, h: height * scale };
  }
  const api = { IMAGE_RE, cleanPath, base, clamp, tokens, namedLiteral, fairyDefinitions, sourceMaps, classify, assetName, resolvePath, parseAtlas, gridFrames, wardrobeRect };
  root.ForestCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
