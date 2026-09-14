import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/scenes/RealmPortalTransition.js', import.meta.url), 'utf8');

assert.match(source, /makeStorybookPortal\(\)/, '幻界轉場必須建立星芽花環');
assert.match(source, /makeDandelionStream\(\)/, '幻界轉場必須包含蒲公英流光');
assert.match(source, /makeDestinationCard\(\)/, '幻界轉場必須顯示目的地題字');
assert.match(source, /finishTransition\(\)/, '幻界轉場必須有完整揭幕階段');
assert.match(source, /prefers-reduced-motion/, '轉場必須照顧減少動態效果設定');
assert.match(source, /this\.scene\.start\(this\.targetScene, this\.targetData\)/,
    '特效結束後必須保留目的場景與返回資料');
assert.doesNotMatch(source, /正在穿越異界漩渦/, '不可退回舊式讀取圈文案');

console.log('✅ 星芽谷童話畫卷轉場結構與場景交接測試通過。');
