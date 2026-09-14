import SaveSystem from '../systems/SaveSystem.js';
import WorldProgressSystem from '../systems/WorldProgressSystem.js';
import { getRegion, getSubmap } from '../data/WorldRegionData.js';
import AudioSystem from '../systems/AudioSystem.js';

export default class FreeExplore extends Phaser.Scene {
    constructor() { super('FreeExplore'); }
    init(data) { this.regionId=data?.regionId||'forest';this.submapId=data?.submapId||'morning_camp';this.taps=0; }
    create() {
        SaveSystem.applyToRegistry(this.registry); const region=getRegion(this.regionId); const submap=getSubmap(this.regionId,this.submapId);
        AudioSystem.playRegionBgm(this, this.regionId, 0.38);
        const background=submap?.background&&this.textures.exists(submap.background)?submap.background:'world_map_overview';
        this.add.image(640,360,background).setDisplaySize(1280,720);
        this.add.rectangle(640,45,1280,90,0x173c43,.82);
        this.add.text(640,30,`${region.icon} ${submap?.name || '自由探索'}`,{fontFamily:'Microsoft JhengHei, Arial',fontSize:'34px',color:'#fff2ad',fontStyle:'bold'}).setOrigin(.5);
        this.status=this.add.text(640,73,'隨意點一點：沒有倒數、生命或失敗',{fontFamily:'Microsoft JhengHei, Arial',fontSize:'19px',color:'#fff'}).setOrigin(.5);
        this.makeButton(105,50,170,56,'← 回導覽頁',()=>this.scene.start('RegionGuide',{regionId:this.regionId}),0x315e75);
        const things=[['🌼',210,260,'花朵開花了！'],['💧',430,500,'水面冒出泡泡！'],['🐦',665,210,'小鳥唱了一首歌！'],['🦋',880,390,'蝴蝶跳起舞來！'],['🐿️',1080,530,'松鼠開心地揮手！']];
        things.forEach(([emoji,x,y,message],i)=>this.makeThing(emoji,x,y,message,i));
    }
    makeThing(emoji,x,y,message,index){const glow=this.add.circle(x,y,60,0xfff2a0,.22);const thing=this.add.text(x,y,emoji,{fontSize:'65px'}).setOrigin(.5).setInteractive({useHandCursor:true});this.tweens.add({targets:glow,alpha:.38,scale:1.08,duration:900+index*120,yoyo:true,repeat:-1});thing.on('pointerdown',()=>{this.taps+=1;const gotSticker=WorldProgressSystem.addParticipation(this.registry,this.submapId);this.status.setText(gotSticker?'📖 找到參與貼紙！可以繼續自由玩':message);this.tweens.add({targets:thing,y:y-34,angle:index%2?12:-12,duration:170,yoyo:true,ease:'Back.easeOut'});for(let n=0;n<7;n+=1){const p=this.add.circle(x,y,Phaser.Math.Between(3,7),[0xffe978,0x9de7ff,0xffb4dc][n%3]);this.tweens.add({targets:p,x:x+Phaser.Math.Between(-85,85),y:y+Phaser.Math.Between(-90,45),alpha:0,duration:520,onComplete:()=>p.destroy()});}});}
    makeButton(x,y,width,height,label,callback,color){const c=this.add.container(x,y);const bg=this.add.rectangle(0,0,width,height,color,.98).setStrokeStyle(3,0xffe6a7).setInteractive({useHandCursor:true});const t=this.add.text(0,0,label,{fontFamily:'Microsoft JhengHei, Arial',fontSize:'19px',color:'#fff',fontStyle:'bold'}).setOrigin(.5);c.add([bg,t]);bg.on('pointerdown',callback);return c;}
}
