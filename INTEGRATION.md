# 不同版本的手動整合方式

如果現在的專案比 wardrobe_v5_3 更新，請不要盲目覆蓋 main.js 或 MiniGameCatalog.js。
新檔案與 assets/animal-snack 資料夾可以加入；已有同名檔案時先備份並比對。

## main.js

在 imports 加入：

```js
import AnimalSnackGame from './scenes/AnimalSnackGame.js';
```

在 Phaser config 的 scene 陣列加入一次：

```js
AnimalSnackGame,
```

## MiniGameCatalog.js

在 MINI_GAME_CATALOG 陣列加入一次，避免重複 id：

```js
{
  id: 'animal_snack',
  scene: 'AnimalSnackGame',
  category: 'rhythm',
  icon: '🥕',
  title: '動物點心隊',
  subtitle: '森林配送 · 幼童試玩',
  description: '看客人、選點心，自動送出！送錯不扣命，朋友會再來。',
  status: '新遊戲・幼童試玩',
  accent: 0x78a483,
  launchData: { mode: 'kids' }
},
```

新增場景自己在 preload 載入 assets/animal-snack。不要把素材路徑改成 DEMO 路徑。
Hub 啟動時傳入 returnScene: 'MiniGameHub'，返回由原本 MiniGameTestSession.finish 還原測試快照。

## 本次檔案範圍

- 修改：src/main.js、src/data/MiniGameCatalog.js。
- 新增：src/data/AnimalSnackData.js、src/scenes/AnimalSnackGame.js。
- 新增：assets/animal-snack/ 下七個 PNG。
- 不修改：PreloadScene、WorldMap、Collection、裝備與存檔系統。

## 開發測試

在 UPDATE 執行 `node --test tests/*.test.mjs`（測試使用 Node 24）。
scene-flow 使用模擬顯示物件及事件，不是瀏覽器端到端測試。

## 建議人工驗收

- 首頁全部及反應節奏分頁都能進入遊戲；其他八款入口仍可開。
- 開局、送錯、漏接、暫停、隱藏視窗、重玩、返回各操作一次。
- 測試關閉音效再重開、聲音相較其他遊戲是否舒適。
- 縮放視窗及平板橫向下，點心卡是否容易點選。
- 正式愛心、水晶、裝備、成就前後相同。
