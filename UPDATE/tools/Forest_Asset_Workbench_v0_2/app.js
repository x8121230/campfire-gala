/* Forest Asset Workbench. Reads selected File objects; never executes game code. */
(function () {
  'use strict';
  const C = window.ForestCore, $ = id => document.getElementById(id);
  const slotNames = { outfitBack: '衣服背景', outfitBody: '衣服本體', headStyle: '帽子／髮型／表情', effectFront: '特效' };
  const state = { tab: 'wardrobe', kind: 'body', assets: [], games: [], files: new Map(), cache: new Map(), urls: [],
    selected: null, layers: [], activeLayer: 'outfitBody', page: 0, demo: true, folder: '內建範例', issues: [], warnings: [],
    bg: 'sage', zoom: 1, frames: [], frame: 0, playing: false, cycle: null, scanId: 0, drawId: 0, forcedPaths: null };
  const ctx = $('canvas').getContext('2d');
  let toastTimer, lastTick = 0;
  function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4200); }
  function element(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
  function resetLayerState() { state.layers = Object.keys(slotNames).map(slot => ({ slot, assetId: null, visible: true, x: 0, y: 0, scale: 100 })); }
  const assetById = id => state.assets.find(a => a.id === id);
  const layerBySlot = slot => state.layers.find(layer => layer.slot === slot);
  function sourceURL(asset) { if (!asset.url) { asset.url = asset.data || URL.createObjectURL(asset.file); if (!asset.data) state.urls.push(asset.url); } return asset.url; }
  async function imageFor(asset) {
    if (!asset) return null;
    if (state.cache.has(asset.id)) return state.cache.get(asset.id);
    const promise = new Promise((resolve, reject) => {
      const img = new Image(); img.onload = () => { asset.width = img.naturalWidth; asset.height = img.naturalHeight; asset.error = null; resolve(img); };
      img.onerror = () => { asset.error = '圖片無法解碼'; reject(new Error(`${asset.name}：圖片無法解碼`)); }; img.src = sourceURL(asset);
    });
    state.cache.set(asset.id, promise);
    if (state.cache.size > 30) {
      const inUse = new Set([...state.layers.map(l => l.assetId), state.selected]);
      for (const key of state.cache.keys()) if (!inUse.has(key)) { state.cache.delete(key); break; }
    }
    return promise;
  }
  function releaseSource() {
    stopPlayback(); stopCycle(); state.drawId++;
    state.urls.forEach(url => URL.revokeObjectURL(url)); state.urls = []; state.cache.clear(); state.files.clear();
    state.assets = []; state.games = []; state.selected = null; state.currentBody = null; state.page = 0; state.frames = []; state.forcedPaths = null;
    state.warnings = []; state.frame = 0; state.zoom = 1; $('zoom').value = '100'; $('zoomValue').textContent = '100%';
    $('search').value = ''; $('allFiles').checked = false; resetLayerState();
  }
  function updateSourceStatus(message) {
    $('sourceLabel').textContent = state.folder;
    $('sourceDetail').textContent = state.demo ? '內建範例素材，供試用介面。' : '已讀取你選取的資料夾；更新後請重新選取。';
    $('assetCount').textContent = `${state.assets.length} 張圖片`;
    $('modeBadge').textContent = state.demo ? '範例模式' : '本機資料';
    $('scanStatus').textContent = message;
  }
  async function useDemo() {
    state.scanId++; releaseSource(); state.demo = true; state.folder = '內建範例';
    state.assets = (window.FOREST_DEMO?.assets || []).map((item, i) => ({ ...item, ...C.classify(item.path), id: `demo-${i}`, origin: '隨程式附送的範例' }));
    state.games = (window.FOREST_DEMO?.games || []).map(g => ({ ...g, referenceOnly: true,
      related: state.assets.filter(a => (g.relatedPaths || []).includes(a.path)).map(a => a.id) }));
    updateSourceStatus('內建素材可直接操作；實際結果請載入你的資料夾。');
    await initializeSelection();
  }
  async function importFolder(fileList) {
    if (!fileList.length) return;
    const scan = ++state.scanId; releaseSource(); state.demo = false;
    const firstPath = C.cleanPath(fileList[0].webkitRelativePath || fileList[0].name);
    state.folder = firstPath.includes('/') ? firstPath.split('/')[0] : '選取的檔案';
    document.body.classList.add('busy'); $('folderButton').disabled = true; updateSourceStatus('正在整理檔案清單…');
    try {
      const entries = [];
      for (const file of fileList) {
        const raw = C.cleanPath(file.webkitRelativePath || file.name);
        let path = raw.includes('/') ? raw.slice(raw.indexOf('/') + 1) : raw;
        if (state.folder === 'assets') path = `assets/${path}`;
        if (/(^|\/)(node_modules|\.git)(\/|$)/.test(path)) continue;
        state.files.set(path, file); entries.push({ file, path });
      }
      const imageEntries = entries.filter(e => C.IMAGE_RE.test(e.path));
      const sources = entries.filter(e => /\.js$/i.test(e.path) && !/\.min\.js$/i.test(e.path) && e.file.size <= 2 * 1024 * 1024 && (/^src\//.test(e.path) || /(?:Catalog|Wardrobe|PaperDoll|GameData)\.js$/i.test(e.path))).slice(0, 400);
      const definitions = [...(window.FOREST_DEMO?.definitions || [])];
      const texturePaths = Object.create(null), sourceText = new Map(); let games = null, layerConfig = null;
      let scannedBytes = 0;
      for (let i = 0; i < sources.length; i++) {
        if (scan !== state.scanId) return;
        const entry = sources[i]; scannedBytes += entry.file.size;
        if (scannedBytes > 30 * 1024 * 1024) { state.warnings.push('程式中繼資料超過 30 MB，部分略過；圖片仍可使用。'); break; }
        const text = await entry.file.text(); sourceText.set(entry.path, text);
        if (/FairyWardrobeData\.js$/i.test(entry.path)) definitions.unshift(...C.fairyDefinitions(text));
        Object.assign(texturePaths, C.sourceMaps(text));
        if (/MiniGameCatalog\.js$/i.test(entry.path)) {
          const value = C.namedLiteral(text, 'MINI_GAME_CATALOG');
          if (Array.isArray(value)) games = value.filter(g => g && typeof g.title === 'string' && typeof g.scene === 'string');
          else state.warnings.push('遊戲列表含非靜態資料，無法直接解析。');
        }
        if (/PaperDollLayers\.js$/i.test(entry.path)) layerConfig = C.namedLiteral(text, 'OUTFIT_LAYERS');
        if (i % 20 === 0) { updateSourceStatus(`已找到 ${imageEntries.length} 張圖片 · 正在讀取設定 ${i + 1}/${sources.length}`); await new Promise(r => setTimeout(r, 0)); }
      }
      if (scan !== state.scanId) return;
      // FairyWardrobeData builds these paths through a helper, so derive the same
      // deterministic mapping without evaluating any selected JavaScript.
      for (const def of definitions) {
        if (!Number.isInteger(def.version) || !def.slug || !def.type) continue;
        const prefix = def.type === 'hat' ? 'hat' : 'doll';
        const texture = `wardrobe_${prefix}_${def.slug}_v${def.version}`;
        const suffix = def.version >= 57 ? `_v${def.version}` : '';
        texturePaths[texture] ||= `assets/wardrobe_v${def.version}/${prefix}_${def.slug}${suffix}.png`;
      }
      state.assets = imageEntries.map(({ file, path }, i) => ({ id: `local-${scan}-${i}`, file, path, ...C.classify(path), name: C.assetName(path, definitions), origin: '選取的本機檔案' }));
      for (const asset of state.assets) {
        const version = Number(asset.path.match(/wardrobe_v(\d+)/)?.[1]);
        const slug = C.base(asset.path).replace(/\.[^.]+$/, '').replace(/^(?:doll|hat|icon)_/, '').replace(/_v\d+.*$/, '');
        const def = definitions.find(d => d.slug === slug && d.version === version);
        if (def) {
          asset.itemId = `item_${def.type}_fairytale_${def.slug}`; asset.integratedHat = slug === 'raincoat';
          asset.desc = def.desc; asset.ability = def.ability;
        }
      }
      // v6.1 four-layer declarations are accepted only as literal mappings, never code.
      if (layerConfig && typeof layerConfig === 'object') for (const asset of state.assets) {
        const config = layerConfig[asset.itemId]; if (!config || typeof config !== 'object') continue;
        const resolved = Object.entries(config).map(([slot, key]) => [slot, C.resolvePath(texturePaths[key], state.assets)]);
        if (resolved.some(([slot, a]) => !slotNames[slot] || slot === 'headStyle' || !a) || !resolved.some(([slot]) => slot === 'outfitBody')) { state.warnings.push(`${asset.name} 的四層清單不完整，沿用原圖。`); continue; }
        asset.splitLayers = resolved.map(([slot, a]) => [slot, a.id]);
      }
      // Recognize plain Phaser spritesheet calls with literal paths and frame sizes.
      for (const text of sourceText.values()) for (const match of text.matchAll(/\.spritesheet\(\s*['"][^'"]+['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*\{[^}]*frameWidth\s*:\s*(\d+)[^}]*frameHeight\s*:\s*(\d+)/g)) {
        const asset = C.resolvePath(match[1], state.assets); if (asset) asset.sheet = { frameWidth: +match[2], frameHeight: +match[3] };
      }
      const atlasEntries = entries.filter(e => /\.json$/i.test(e.path) && e.file.size <= 5 * 1024 * 1024 && /assets\//.test(e.path)).slice(0, 120);
      for (const entry of atlasEntries) {
        if (scan !== state.scanId) return;
        try {
          const json = JSON.parse(await entry.file.text()); if (!json.frames) continue;
          const dirname = entry.path.slice(0, entry.path.lastIndexOf('/') + 1);
          const path = typeof json.meta?.image === 'string' ? dirname + json.meta.image : entry.path.replace(/\.json$/i, '.png');
          const asset = C.resolvePath(path, state.assets); if (asset) asset.atlas = json;
        } catch { /* Non-atlas JSON never prevents asset browsing. */ }
      }
      if (scan !== state.scanId) return;
      state.games = (games || []).map(g => {
        const scenePath = [...sourceText.keys()].find(path => C.base(path) === `${g.scene}.js`);
        const text = sourceText.get(scenePath) || '';
        const prefixes = [...text.matchAll(/assets\/([\w-]+)\//g)].map(m => `assets/${m[1]}/`);
        const related = state.assets.filter(a => prefixes.some(prefix => a.path.startsWith(prefix))).map(a => a.id);
        return { title: g.title, scene: g.scene, icon: g.icon, subtitle: g.subtitle, description: g.description, id: g.id, scenePath, related };
      });
      if (!games) state.warnings.push('沒有讀到 MiniGameCatalog.js；獨立遊戲頁暫無清單，仍可瀏覽圖片。');
      const warningText = state.warnings.length ? ` · ${state.warnings.length} 項設定提示已記入報告` : '';
      updateSourceStatus(`已讀取 ${state.assets.length} 張圖片、${state.games.length} 款遊戲${warningText}。素材分類依路徑推測，可切「全部」。`);
      await initializeSelection();
      toast(`讀取完成：${state.assets.length} 張圖片。`);
    } catch (error) {
      state.warnings.push(error.message); updateSourceStatus(`讀取遇到問題：${error.message}`); toast('資料夾未完整讀取，請重新選取。');
    } finally { if (scan === state.scanId) { document.body.classList.remove('busy'); $('folderButton').disabled = false; } }
  }
  async function initializeSelection() {
    const body = state.assets.find(a => /doll_daily/.test(a.path)) || state.assets.find(a => a.kind === 'body');
    if (body) applyBody(body);
    const hat = state.assets.find(a => a.kind === 'hat'); if (hat) layerBySlot('headStyle').assetId = hat.id;
    state.selected = body?.id || state.assets[0]?.id || null;
    await switchTab(state.tab);
  }
  function applyBody(asset) {
    for (const layer of state.layers) if (layer.slot !== 'headStyle') { layer.assetId = null; layer.visible = true; layer.x = layer.y = 0; layer.scale = 100; }
    if (asset.splitLayers) for (const [slot, id] of asset.splitLayers) layerBySlot(slot).assetId = id;
    else layerBySlot('outfitBody').assetId = asset.id;
    state.currentBody = asset.id;
    $('layerWarning').textContent = asset.integratedHat ? '此套裝自帶帽子，依原規則暫停外加帽子。' : asset.splitLayers ? '依本機登記的分層素材顯示；請再檢查實際對位。' : '舊服裝含人物與頭髮，不能只靠開關拆開。';
  }
  function filteredAssets() {
    const query = $('search').value.trim().toLowerCase();
    return state.assets.filter(a => {
      if (query && !`${a.name} ${a.path}`.toLowerCase().includes(query)) return false;
      if (state.forcedPaths) return state.forcedPaths.has(a.id);
      if (state.tab === 'wardrobe') return state.kind === 'all' ? true : a.kind === state.kind;
      if ($('allFiles').checked) return true;
      return state.tab === 'characters' ? a.character : a.monster;
    });
  }
  function renderCatalog() {
    const list = $('assetList'); list.replaceChildren(); const filtered = filteredAssets(), pageSize = 12;
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize)); state.page = Math.min(state.page, pages - 1);
    $('filteredCount').textContent = filtered.length; $('pageNumber').textContent = `${state.page + 1} / ${pages}`;
    $('prevPage').disabled = state.page === 0; $('nextPage').disabled = state.page >= pages - 1;
    if (!filtered.length) list.append(element('div', 'empty', state.assets.length ? '沒有符合的素材。可清除搜尋，或切換「全部」。' : '選取遊戲資料夾，或按「返回範例」。'));
    for (const asset of filtered.slice(state.page * pageSize, (state.page + 1) * pageSize)) {
      const equipped = state.tab === 'wardrobe' ? state.layers.some(l => l.assetId === asset.id) : state.selected === asset.id;
      const button = element('button', `asset-card${equipped ? ' selected' : ''}`); button.title = asset.path; button.setAttribute('aria-label', asset.name);
      const img = new Image(); img.loading = 'lazy'; img.alt = ''; img.src = sourceURL(asset);
      img.onerror = () => { img.alt = '素材無法解碼'; asset.error = '圖片無法解碼'; };
      button.append(img, element('span', 'asset-name', asset.name), element('span', 'asset-type', state.demo ? 'DEMO / 範例' : asset.kind === 'hat' ? 'HEADWEAR' : asset.kind === 'body' ? 'OUTFIT' : 'LOCAL ASSET'));
      if (equipped) button.append(element('span', 'chosen', '已選'));
      button.addEventListener('click', () => selectAsset(asset)); list.append(button);
    }
  }
  async function selectAsset(asset) {
    state.selected = asset.id; stopPlayback();
    if (state.tab === 'wardrobe') {
      if (asset.kind === 'body') { applyBody(asset); state.activeLayer = 'outfitBody'; }
      else if (asset.kind === 'hat') { const layer = layerBySlot('headStyle'); layer.assetId = asset.id; layer.visible = true; layer.x = layer.y = 0; layer.scale = 100; state.activeLayer = 'headStyle'; }
      else { layerBySlot(state.activeLayer).assetId = asset.id; toast(`已放入「${slotNames[state.activeLayer]}」預覽層。`); }
      renderLayers();
    } else await prepareSprite(asset);
    renderCatalog(); await updateInfo(asset); draw();
  }
  async function switchTab(tab) {
    stopPlayback(); stopCycle(); state.tab = tab; state.page = 0; state.forcedPaths = null; $('search').value = '';
    document.querySelectorAll('[data-tab]').forEach(b => { b.classList.toggle('active', b.dataset.tab === tab); if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    const titles = { wardrobe: ['服裝・紙娃娃', '自由混搭，檢查比例與每一層的遮擋。'], characters: ['公仔・控制者', '查看主角素材，逐格檢查方向、比例與動作。'], monsters: ['怪物・動作', '巡覽敵人與首領影格，找出需要修整的地方。'], games: ['獨立遊戲', '從遊戲目錄確認入口，整理每款作品的素材。'] };
    $('pageTitle').textContent = titles[tab][0]; $('pageSubtitle').textContent = titles[tab][1];
    $('assetWorkspace').hidden = tab === 'games'; $('gamesView').hidden = tab !== 'games';
    if (tab === 'games') { renderGames(); return; }
    const wardrobe = tab === 'wardrobe';
    $('wardrobeKinds').hidden = !wardrobe; $('allFilesLabel').hidden = wardrobe; $('layersPanel').hidden = !wardrobe; $('spritePanel').hidden = wardrobe;
    $('wardrobeControls').hidden = !wardrobe; $('animationControls').hidden = wardrobe;
    $('previewTitle').textContent = wardrobe ? '穿搭預覽' : '素材與影格';
    $('previewHint').textContent = wardrobe ? '預覽調整不會修改遊戲' : '影格播放器 · 非遊戲行為模擬';
    $('stageTag').textContent = wardrobe ? 'FOUR-LAYER OUTFIT' : 'SPRITE INSPECTION';
    if (wardrobe) { state.selected = layerBySlot(state.activeLayer)?.assetId || layerBySlot('outfitBody').assetId; renderLayers(); }
    else { const first = filteredAssets()[0]; state.selected = first?.id || null; if (first) await prepareSprite(first); }
    renderCatalog(); await updateInfo(assetById(state.selected)); draw();
  }
  function renderLayers() {
    const list = $('layerList'); list.replaceChildren();
    for (let i = 0; i < state.layers.length; i++) {
      const layer = state.layers[i], asset = assetById(layer.assetId);
      const row = element('div', `layer-row${layer.slot === state.activeLayer ? ' active' : ''}`);
      const check = document.createElement('input'); check.type = 'checkbox'; check.checked = layer.visible; check.setAttribute('aria-label', `顯示${slotNames[layer.slot]}`);
      check.onchange = () => { layer.visible = check.checked; draw(); };
      const select = element('button', 'layer-select', slotNames[layer.slot]); select.title = asset?.name || '尚無獨立素材'; select.append(element('small', '', asset ? '●' : '未設定'));
      select.onclick = () => { state.activeLayer = layer.slot; state.selected = layer.assetId; renderLayers(); updateInfo(asset); };
      const up = element('button', 'layer-up', '↑'); up.title = '移到更後方'; up.disabled = i === 0;
      up.onclick = () => { [state.layers[i - 1], state.layers[i]] = [state.layers[i], state.layers[i - 1]]; renderLayers(); draw(); };
      const down = element('button', 'layer-up', '↓'); down.title = '移到更前方'; down.disabled = i === state.layers.length - 1;
      down.onclick = () => { [state.layers[i + 1], state.layers[i]] = [state.layers[i], state.layers[i + 1]]; renderLayers(); draw(); };
      row.append(check, select, up, down); list.append(row);
    }
    const select = $('layerAsset'); select.replaceChildren(new Option('不放素材', ''));
    for (const a of state.assets) select.add(new Option(`${a.name} · ${C.base(a.path)}`, a.id));
    const layer = layerBySlot(state.activeLayer); select.value = layer.assetId || '';
    $('layerX').value = layer.x; $('layerY').value = layer.y; $('layerScale').value = layer.scale;
  }
  async function updateInfo(asset) {
    const requestAsset = asset?.id;
    $('infoName').textContent = asset?.name || '尚未選取'; $('infoPath').textContent = asset?.path || '—'; $('infoSize').textContent = '—';
    $('infoOrigin').textContent = asset?.origin || '—'; $('infoAlpha').textContent = asset?.alpha || '尚未檢查';
    if (!asset) return;
    try { await imageFor(asset); if (requestAsset !== state.selected) return; $('infoSize').textContent = `${asset.width} × ${asset.height}` + (asset.masterWidth ? '（縮小範例）' : ''); }
    catch (error) { if (requestAsset === state.selected) $('infoSize').textContent = error.message; }
  }
  async function inspectSelected() {
    const asset = assetById(state.selected); if (!asset) return toast('先選取一個素材。');
    try {
      const image = await imageFor(asset), canvas = document.createElement('canvas');
      const scale = Math.min(1, 512 / Math.max(asset.width, asset.height)); canvas.width = Math.max(1, Math.round(asset.width * scale)); canvas.height = Math.max(1, Math.round(asset.height * scale));
      const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data; let transparent = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] < 255) transparent++;
      asset.alpha = transparent ? `有透明像素 ${Math.round(transparent / (data.length / 4) * 100)}%（抽查）` : '未見透明像素（抽查）';
      if (state.selected === asset.id) $('infoAlpha').textContent = asset.alpha;
      toast(transparent ? '抽查有透明像素；仍需用深淺背景確認邊緣。' : '抽查沒有透明像素；若這張應為去背圖，請列入待修。');
    } catch (error) { toast(`檢查失敗：${error.message}`); }
  }
  async function prepareSprite(asset) {
    const id = asset.id; stopPlayback(); state.frame = 0; $('spriteMode').value = 'whole'; $('flipX').checked = false;
    $('columns').value = $('rows').value = '1'; $('startFrame').value = $('endFrame').value = '0';
    try {
      await imageFor(asset); if (state.selected !== id) return;
      if (asset.atlas) { asset.atlasParsed = C.parseAtlas(asset.atlas, asset.width, asset.height); if (asset.atlasParsed.frames.length) $('spriteMode').value = 'atlas'; }
      if (asset.sheet && asset.width % asset.sheet.frameWidth === 0 && asset.height % asset.sheet.frameHeight === 0) {
        $('columns').value = asset.width / asset.sheet.frameWidth; $('rows').value = asset.height / asset.sheet.frameHeight;
        $('endFrame').value = +$('columns').value * +$('rows').value - 1;
        $('spriteMode').value = 'grid';
      }
      const select = $('atlasGroup'); select.replaceChildren(new Option('全部影格（逐格巡覽）', ''));
      const groups = new Set((asset.atlasParsed?.frames || []).map(f => f.name.replace(/\d+(?:\.[^.]+)?$/, '').replace(/[-_\/]$/, '')));
      for (const group of groups) if (group) select.add(new Option(group, group));
      updateFrames();
    } catch (error) { state.frames = []; toast(error.message); updatePlayer(); }
  }
  function updateFrames() {
    const asset = assetById(state.selected); if (!asset?.width) return;
    const mode = $('spriteMode').value;
    $('gridFields').hidden = mode !== 'grid'; $('atlasField').hidden = mode !== 'atlas';
    if (mode === 'atlas') {
      const group = $('atlasGroup').value;
      state.frames = (asset.atlasParsed?.frames || []).filter(f => !group || f.name.replace(/\d+(?:\.[^.]+)?$/, '').replace(/[-_\/]$/, '') === group);
      $('spriteNotice').textContent = state.frames.length ? `已讀取 Atlas${asset.atlasParsed.skipped.length ? `，略過 ${asset.atlasParsed.skipped.length} 個旋轉或不合法影格` : ''}。群組名稱不代表已驗證攻擊判定。` : '此素材沒有可用 Atlas，請用完整圖片或等格切片。';
    } else if (mode === 'grid') {
      const columns = Math.floor(C.clamp($('columns').value, 1, 64)), rows = Math.floor(C.clamp($('rows').value, 1, 64));
      $('columns').value = columns; $('rows').value = rows;
      const total = columns * rows; $('startFrame').max = $('endFrame').max = total - 1;
      const start = Math.floor(C.clamp($('startFrame').value, 0, total - 1)); const end = Math.floor(C.clamp($('endFrame').value, start, total - 1));
      $('startFrame').value = start; $('endFrame').value = end;
      state.frames = C.gridFrames(asset.width, asset.height, columns, rows, start, end);
      $('spriteNotice').textContent = '依等格切片巡覽。若圖集是不同角色，播放不代表牠們的移動或攻擊動畫。';
    } else { state.frames = C.gridFrames(asset.width, asset.height, 1, 1); $('spriteNotice').textContent = /\.gif$/i.test(asset.path) ? 'GIF 在畫布中只顯示靜態擷取，v0.2 不支援其逐格解碼。' : '目前顯示完整圖片；有精靈圖集時可改用等格切片。'; }
    state.frame = 0; stopPlayback(); updatePlayer(); draw();
  }
  function updatePlayer() {
    $('frameLabel').textContent = `影格 ${state.frames.length ? state.frame + 1 : 0} / ${state.frames.length}`;
    $('frameSlider').max = Math.max(0, state.frames.length - 1); $('frameSlider').value = state.frame;
    $('playButton').disabled = state.frames.length < 2; $('stepBack').disabled = $('stepForward').disabled = state.frames.length < 2;
    $('playButton').textContent = state.playing ? '暫停' : '播放影格';
  }
  function stopPlayback() { state.playing = false; updatePlayer(); }
  function stopCycle() { clearInterval(state.cycle); state.cycle = null; $('cycleHats').textContent = '自動換帽'; }
  function stepFrame(delta) { if (!state.frames.length) return; state.frame = (state.frame + delta + state.frames.length) % state.frames.length; updatePlayer(); draw(); }
  function chooseHat(delta) {
    const hats = state.assets.filter(a => a.kind === 'hat'); if (!hats.length) return toast('尚未找到帽子素材。');
    const current = hats.findIndex(a => a.id === layerBySlot('headStyle').assetId), index = (current + delta + hats.length) % hats.length;
    selectAsset(hats[index]);
  }
  function paintBackground() {
    const w = $('canvas').width, h = $('canvas').height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = ({ sage: '#e6eade', white: '#ffffff', dark: '#25322a', checker: '#f3f3f0' })[state.bg]; ctx.fillRect(0, 0, w, h);
    if (state.bg === 'checker') { ctx.fillStyle = '#d8dcd2'; for (let y = 0; y < h; y += 24) for (let x = 0; x < w; x += 24) if ((x / 24 + y / 24) % 2 === 0) ctx.fillRect(x, y, 24, 24); }
    if ($('guides').checked) {
      ctx.save(); ctx.strokeStyle = state.bg === 'dark' ? '#e8eed636' : '#75836330'; ctx.lineWidth = 1; ctx.setLineDash([5, 8]); ctx.beginPath(); ctx.moveTo(w / 2, 35); ctx.lineTo(w / 2, h - 30); ctx.moveTo(35, h - 54); ctx.lineTo(w - 35, h - 54); ctx.stroke(); ctx.restore();
      ctx.fillStyle = state.bg === 'dark' ? '#b0bdaa' : '#9ca58e'; ctx.font = '11px sans-serif'; ctx.fillText('BASELINE', 24, h - 35);
    }
  }
  async function draw() {
    const drawId = ++state.drawId; if (state.tab === 'games') return;
    const wardrobe = state.tab === 'wardrobe';
    const body = assetById(state.currentBody);
    const layers = wardrobe ? state.layers.filter(l => l.visible && l.assetId && !(l.slot === 'headStyle' && body?.integratedHat)) : [];
    const assets = wardrobe ? layers.map(l => assetById(l.assetId)) : [assetById(state.selected)].filter(Boolean);
    const images = await Promise.all(assets.map(a => imageFor(a).catch(() => null)));
    if (drawId !== state.drawId) return; paintBackground();
    if (!assets.length) { ctx.fillStyle = '#86917a'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('選取素材，開始預覽', 410, 425); ctx.textAlign = 'start'; return; }
    for (let i = 0; i < images.length; i++) {
      const image = images[i]; if (!image) continue;
      if (wardrobe) { const r = C.wardrobeRect(assets[i], layers[i], 820, 850, state.zoom); ctx.drawImage(image, r.x, r.y, r.w, r.h); }
      else {
        const f = state.frames[state.frame]; if (!f) continue;
        const uniformWidth = Math.max(...state.frames.map(frame => frame.width)), uniformHeight = Math.max(...state.frames.map(frame => frame.height));
        const scale = Math.min(650 / uniformWidth, 680 / uniformHeight) * state.zoom;
        ctx.save(); ctx.translate(410, 445); if ($('flipX').checked) ctx.scale(-1, 1);
        ctx.drawImage(image, f.x, f.y, f.w, f.h, (f.offsetX - uniformWidth / 2) * scale, (f.offsetY - uniformHeight / 2) * scale, f.w * scale, f.h * scale); ctx.restore();
      }
    }
  }
  function renderGames() {
    const list = $('gameList'); list.replaceChildren(); $('gameCount').textContent = `${state.games.length} 款${state.demo ? ' · 範例目錄' : ''}`;
    if (!state.games.length) list.append(element('div', 'empty', '尚未讀到遊戲列表。請選取包含 src/data/MiniGameCatalog.js 的遊戲根資料夾。'));
    for (const game of state.games) {
      const card = element('article', 'game-card'); card.append(element('div', 'game-symbol', game.icon || '♧'), element('h3', '', game.title), element('p', '', game.subtitle || ''), element('code', '', game.scene || '未登記場景'));
      card.append(element('p', 'status', game.referenceOnly ? '內建目錄示例 · 尚未比對你的電腦' : game.scenePath ? `已找到場景檔 · ${game.related.length} 張直接關聯圖片` : '未找到同名場景檔 · 待確認入口'));
      const view = element('button', 'secondary', '查看關聯素材 →'); view.disabled = !game.related.length;
      view.onclick = async () => { await switchTab('characters'); state.forcedPaths = new Set(game.related); state.page = 0; renderCatalog(); const asset = assetById(game.related[0]); if (asset) await selectAsset(asset); $('previewHint').textContent = `${game.title} · 場景內直接引用的素材`; };
      card.append(view, element('div', 'pending', '獨立試玩：待接入')); list.append(card);
    }
  }
  function reportSnapshot() {
    return { version: '0.2', source: state.demo ? 'demo' : 'local-folder', folderName: state.folder, tab: state.tab,
      asset: assetById(state.selected)?.path || null, frame: state.frames[state.frame]?.name || null,
      layers: state.layers.map(l => ({ slot: l.slot, file: assetById(l.assetId)?.path || null, visible: l.visible, x: l.x, y: l.y, scale: l.scale })),
      sprite: { mode: $('spriteMode').value, columns: +$('columns').value, rows: +$('rows').value, start: +$('startFrame').value, end: +$('endFrame').value, fps: +$('fps').value, flipX: $('flipX').checked } };
  }
  function download(blob, name) { const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = name; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000); }
  $('folderButton').onclick = () => $('folderInput').click();
  $('reloadButton').onclick = () => { $('folderInput').value = ''; $('folderInput').click(); };
  $('folderInput').onchange = event => importFolder(Array.from(event.target.files));
  $('demoButton').onclick = () => { document.body.classList.remove('busy'); $('folderButton').disabled = false; useDemo(); };
  document.querySelectorAll('[data-tab]').forEach(button => button.onclick = () => switchTab(button.dataset.tab));
  document.querySelectorAll('[data-kind]').forEach(button => button.onclick = () => { state.kind = button.dataset.kind; state.page = 0; state.forcedPaths = null; document.querySelectorAll('[data-kind]').forEach(b => b.classList.toggle('selected', b === button)); renderCatalog(); });
  $('search').oninput = () => { state.page = 0; renderCatalog(); };
  $('allFiles').onchange = () => { state.forcedPaths = null; state.page = 0; renderCatalog(); };
  $('prevPage').onclick = () => { state.page--; renderCatalog(); }; $('nextPage').onclick = () => { state.page++; renderCatalog(); };
  document.querySelectorAll('[data-bg]').forEach(button => button.onclick = () => { state.bg = button.dataset.bg; document.querySelectorAll('[data-bg]').forEach(b => b.classList.toggle('selected', b === button)); draw(); });
  $('guides').onchange = draw;
  $('zoom').oninput = () => { state.zoom = +$('zoom').value / 100; $('zoomValue').textContent = `${$('zoom').value}%`; draw(); };
  $('layerAsset').onchange = () => { const layer = layerBySlot(state.activeLayer); layer.assetId = $('layerAsset').value || null; state.selected = layer.assetId; if (state.activeLayer === 'outfitBody') state.currentBody = layer.assetId; renderCatalog(); renderLayers(); updateInfo(assetById(state.selected)); draw(); };
  for (const [id, prop, min, max] of [['layerX', 'x', -1500, 1500], ['layerY', 'y', -1500, 1500], ['layerScale', 'scale', 10, 300]]) $(id).oninput = () => { layerBySlot(state.activeLayer)[prop] = C.clamp($(id).value, min, max, prop === 'scale' ? 100 : 0); draw(); };
  $('resetLayers').onclick = () => { const body = assetById(state.currentBody) || state.assets.find(a => a.kind === 'body'), headStyle = layerBySlot('headStyle').assetId; resetLayerState(); if (body) applyBody(body); layerBySlot('headStyle').assetId = headStyle; renderLayers(); draw(); };
  $('previousHat').onclick = () => chooseHat(-1); $('nextHat').onclick = () => chooseHat(1);
  $('removeHat').onclick = () => { stopCycle(); layerBySlot('headStyle').assetId = null; renderLayers(); renderCatalog(); draw(); };
  $('cycleHats').onclick = () => { if (state.cycle) stopCycle(); else { if (!state.assets.some(a => a.kind === 'hat')) return toast('尚未找到帽子素材。'); state.cycle = setInterval(() => chooseHat(1), 1500); $('cycleHats').textContent = '停止換帽'; chooseHat(1); } };
  for (const id of ['spriteMode', 'startFrame', 'endFrame', 'atlasGroup']) $(id).onchange = updateFrames;
  for (const id of ['columns', 'rows']) $(id).onchange = () => { $('endFrame').value = C.clamp($('columns').value, 1, 64) * C.clamp($('rows').value, 1, 64) - 1; updateFrames(); };
  $('flipX').onchange = draw;
  $('playButton').onclick = () => { state.playing = !state.playing; lastTick = performance.now(); updatePlayer(); };
  $('stepBack').onclick = () => { stopPlayback(); stepFrame(-1); }; $('stepForward').onclick = () => { stopPlayback(); stepFrame(1); };
  $('frameSlider').oninput = () => { stopPlayback(); state.frame = Math.floor(C.clamp($('frameSlider').value, 0, Math.max(0, state.frames.length - 1))); updatePlayer(); draw(); };
  $('inspectButton').onclick = inspectSelected;
  $('addIssue').onclick = () => {
    const note = $('issueNote').value.trim(); if (!note) return toast('先寫下要修正的地方。');
    state.issues.push({ at: new Date().toISOString(), note, ...reportSnapshot() }); $('issueCount').textContent = state.issues.length; $('issueNote').value = '';
    $('issueStatus').textContent = `已記下 ${state.issues.length} 項。關閉前請匯出報告。`; toast('已加入報告，包含目前穿搭與影格。');
  };
  $('reportButton').onclick = () => {
    const report = { generatedAt: new Date().toISOString(), current: reportSnapshot(), issues: state.issues,
      warnings: state.warnings, assets: state.assets.map(a => ({ path: a.path, name: a.name, kind: a.kind, width: a.width || null, height: a.height || null, alpha: a.alpha || '未檢查', error: a.error || null })),
      pending: ['完整遊戲隔離試玩', '攻擊與大招邏輯、碰撞框接入', '獨立前後髮型素材', '動態程式產生的清單與非標準圖集解析', 'GIF 逐格解碼'] };
    download(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }), `forest-review-${new Date().toISOString().slice(0, 10)}.json`); toast('已匯出驗收報告。');
  };
  $('screenshotButton').onclick = async () => {
    stopPlayback(); stopCycle(); await draw();
    try { $('canvas').toBlob(blob => { if (blob) { download(blob, `forest-preview-${Date.now()}.png`); toast('已匯出目前預覽。'); } else toast('截圖失敗，請重新選取素材。'); }, 'image/png'); }
    catch (error) { toast(`截圖失敗：${error.message}`); }
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stopPlayback(); stopCycle(); } });
  function tick(now) { if (state.playing && state.tab !== 'wardrobe' && state.tab !== 'games' && now - lastTick >= 1000 / C.clamp($('fps').value, 1, 30, 6)) { lastTick = now; stepFrame(1); } requestAnimationFrame(tick); }
  resetLayerState(); requestAnimationFrame(tick); useDemo();
})();
