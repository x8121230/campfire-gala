import {RealmWorld as BaseWorld} from './RealmWorld.js';
export class RealmWorld extends BaseWorld {
 drawNameplate(ctx,name,...args){return super.drawNameplate(ctx,String(name).replace(/裁縫師[・·．\s]*布隆克/g,'冒險導師・布隆克'),...args);}
}
