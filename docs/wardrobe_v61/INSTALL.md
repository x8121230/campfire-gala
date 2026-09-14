# v6.1 安裝與復原

先安裝 `Forest_Wardrobe_v6_0_Layer_Foundation_UPDATE`。v6.1 只包含四層定稿格式相關的小型程式檔，不包含 v5.5～v5.9 圖片。

1. 備份遊戲中的 `src/data/PaperDollLayers.js`、`src/systems/PaperDollRenderer.js` 與 `src/scenes/Collection.js`。
2. 解壓本更新包，將 `src` 合併到遊戲根目錄，同名檔案選擇取代。
3. 保留原本 `assets`，不要刪除任何 v5.5～v5.9 衣服或帽子圖片。
4. 啟動 localhost，重新整理後打開衣櫃。

驗收時確認頁尾顯示 `v6.1 · 童話新裝 60 件 · 四層定稿`；不選衣服與帽子時顯示原本預設底裝；30 件衣服與 30 頂帽子都能選取、卸下及重新進入衣櫃。舊圖片外觀暫時不變，因為本包沒有重送圖片。

要復原時，把備份的三個檔案覆蓋回原位置。本更新沒有改裝備 ID、存檔鍵或玩家進度。
