# 開發驗證

一般使用者不必執行這些檔案，直接開 index.html 即可。

開發環境需 Node.js 20 以上，無其他套件：

```sh
node --test tests/*.test.cjs
```

12 項測試涵蓋：靜態資料讀取、不執行來源 JS、原型污染防護、檔名解析、重複檔名判定、圖集範圍、裁切位移、衣帽定位、範例初始化、穿帽／卸帽、圖層開關、匯出操作、分頁切換、影格控制、File 物件輸入與場景素材關聯。

workflows.test.cjs 使用 DOM、Image 與 Canvas 替身，驗證方法和事件接線；不驗證真實 PNG 渲染、CSS 排版、瀏覽器資料夾權限或 Windows 批次啟動。這些項目須另做 Edge 實機驗收。

沒有宣稱 Playwright 瀏覽器檢查通過：本環境未安裝 Chromium，下載嘗試逾時。
