import { HOMEWEAR_FILES, HOMEWEAR_BODIES, HOMEWEAR_HEADS } from './HomewearData.js';
import { REPAIR_FILES, BODY_LAYERS, HEAD_LAYERS, DEFAULT_HEAD, DEFAULT_BODY, MASTER_SIZE, EFFECT_KEY } from './WardrobeHeadData.js';
export const LAYER_ORDER = Object.freeze(['outfitBack', 'outfitBody', 'headStyle', 'effectFront']);
export const LAYER_SYSTEM_VERSION = '7.0-whole-head-repair';
export const LAYER_FILES = {...REPAIR_FILES,...HOMEWEAR_FILES};
export const OUTFIT_LAYERS = {...BODY_LAYERS,...HOMEWEAR_BODIES};
export const CLIP_ID = 'item_hat_daily_01';
export const HAT_HEAD_PROFILES = Object.freeze({ neutral: DEFAULT_HEAD });
export const COMBO_LAYERS = Object.freeze({
 'item_cloth_fairytale_starlight_pillow|item_hat_fairytale_nightcap': Object.freeze({ effectFront: EFFECT_KEY })
});
export const FINAL_ART_STATUS = Object.freeze({ finalReplaceableHead: Object.keys(BODY_LAYERS), exactCombo: Object.keys(COMBO_LAYERS) });
export function layerDescriptor(slot, texture, fit = 'master') {
 return {slot,texture,fit,offsetX:0,offsetY:0};
}
export function resolveLayers(look, exists, outfits = OUTFIT_LAYERS, combos = COMBO_LAYERS) {
 const missing=[]; const layers=[];
 const body=outfits[look.bodyId] || outfits.item_cloth_daily_01;
 const bodyKey=body?.outfitBody || DEFAULT_BODY;
 const actualBody=exists(bodyKey)?bodyKey:DEFAULT_BODY;
 if(!exists(bodyKey))missing.push(bodyKey);
 if(exists(actualBody)) {
  if(body?.outfitBack && exists(body.outfitBack))layers.push(layerDescriptor('outfitBack',body.outfitBack));
  layers.push(layerDescriptor('outfitBody',actualBody));
 }
 // Each head texture already contains hat, hair, face and expression.
 // Never draw the old head or an inventory hat over this layer.
 const selectedHead=(HOMEWEAR_HEADS[look.hatId] || HEAD_LAYERS[look.hatId]) || DEFAULT_HEAD;
 const actualHead=exists(selectedHead)?selectedHead:DEFAULT_HEAD;
 if(!exists(selectedHead))missing.push(selectedHead);
 if(exists(actualHead))layers.push(layerDescriptor('headStyle',actualHead));
 else missing.push(actualHead);
 const combo=combos[`${look.bodyId}|${look.hatId}`];
 const active=Boolean(combo && actualBody===bodyKey && actualHead===selectedHead);
 if(active && combo.effectFront) {
  if(exists(combo.effectFront))layers.push(layerDescriptor('effectFront',combo.effectFront));
  else missing.push(combo.effectFront);
 }
 return {layers,proceduralClip:false,combo:active,registered:Boolean(body),layered:true,
  hasBody:layers.some(x=>x.slot==='outfitBody'),usedFallback:missing.length>0,missing:[...new Set(missing)]};
}
export function layerTransform(layer,layout) {
 const scale=Math.min(layout.maxWidth/MASTER_SIZE.width,layout.maxHeight/MASTER_SIZE.height);
 if(!Number.isFinite(scale)||scale<=0)throw new RangeError('Invalid paper-doll layout');
 return {x:layout.centerX+(layer.offsetX||0)*scale,y:layout.centerY+(layer.offsetY||0)*scale,scale};
}
