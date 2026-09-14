import { PAPER_DOLL_LAYOUT } from './PaperDollConfig.js';
export const SUBMAP_DOLL_LAYOUTS = Object.freeze({morning_camp:{footX:450,footY:646,height:455.52},emerald_woods:{footX:580,footY:650,height:433.68},mosslight_valley:{footX:500,footY:665,height:446.16}});
export function getSubmapDollLayout(id) {
 const p=SUBMAP_DOLL_LAYOUTS[id];if(!p)return {...PAPER_DOLL_LAYOUT.worldMap};
 return {...PAPER_DOLL_LAYOUT.worldMap,centerX:p.footX,centerY:p.footY-(1266/1290-.5)*p.height,maxWidth:p.height*768/1290,maxHeight:p.height,footX:p.footX,footY:p.footY};
}
