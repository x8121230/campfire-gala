export function adventureAchievements(data,config={}){
 const stats=data.minigame_stats?.treasure||{},done=new Set(data.achievements||[]),targets=config.bushMinesweeper?.achievements||{};
 const rows=[
 ['bush_first_clear','第一次尋寶','成功通關草叢探險',stats.clearCount,1],
 ['bush_three_clears','旗幟小高手','累積通關草叢探險',stats.clearCount,targets.clearCountTarget||3],
 ['bush_no_hint','森林推理家','不使用提示成功通關',stats.noHintClearCount,targets.noHintClearTarget||3],
 ['bush_perfect','完美小偵探','以滿分完成草叢探險',stats.perfectClearCount,targets.perfectClearTarget||3],
 ['bush_no_flag','不用旗也知道','不插旗成功通關',stats.noFlagAchievementRuleVersion>=2?stats.noFlagClearCount:0,1],
 ['gold_grass_collector','金草收藏家','收集三種不同金草',new Set(data.gold_grass_encyclopedia||[]).size,3]
 ];
 return rows.map(([id,name,description,value,total])=>({id,name,description,total,count:Math.min(total,Math.max(0,Number(value)||0)),done:done.has(id)}));
}
