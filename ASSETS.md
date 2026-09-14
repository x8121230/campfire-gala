# 素材與生成紀錄

## 統一規格

新素材採森林童話／水彩粉彩可愛風。角色正面全身、空手、不帶文字與食物。
背景是程式繪製的低對比森林色塊和緩慢漂浮葉點，避免客人淹沒在複雜背景中。
新圖原始尺寸 1254 × 1254，RGBA，已檢查含透明 alpha；程式等比例顯示，不拉伸。

| 檔案 | 用途 | 來源 |
| --- | --- | --- |
| airship.png | 葉翼點心飛行器 | 本次生成 |
| rabbit.png | 空手小兔子客人 | 本次生成 |
| monkey.png | 空手小猴子客人 | 本次生成 |
| panda.png | 空手熊貓客人 | 本次生成 |
| carrot.png | 紅蘿蔔點心 | 原 AnimalFoodMatch/food_rabbit_item.png |
| banana.png | 香蕉點心 | 原 AnimalFoodMatch/food_monkey_item.png |
| bamboo.png | 竹子點心 | 原 AnimalFoodMatch/food_panda_item.png |

素材放在 UPDATE/assets/animal-snack；DEMO 內也附相同素材供獨立試玩。
既有素材按使用者提供的專案沿用；此紀錄不另行聲稱來源授權範圍。

## 生成模式

內建圖片生成，四次獨立生成、每次一張單體透明素材，非 sprite sheet；未使用 API／CLI。

### 飛行器提示詞

Create ONE game sprite asset, not a mockup or sheet. A cute little forest snack-delivery flying basket, front three-quarter view, broad symmetrical leaf wings, small wooden wicker basket with a cream cloth liner, a single harmless round bubble nozzle pointing upwards, tiny daisy emblem. No pilot, no animals, no food, no text, no lettering, no UI. Warm hand-painted children's storybook illustration, soft cream, sage green, honey brown, rounded chunky silhouettes, delicate brown outlines and gentle shading. Must read clearly at 150 pixels wide. Whole object isolated centered, occupies 80 percent of square canvas, generous clean margin. Actual transparent alpha background; no checkerboard drawn, no cast shadow outside object. Intended as a friendly preschool vertical-scrolling game player sprite.

### 三位動物共用提示詞

ONE isolated children's game character sprite: [ANIMAL], full body sitting, front facing, empty hands gently open, happy gentle expression, plump cute proportions, rosy cheeks, big kind dark eyes. Warm forest storybook watercolor and soft gouache, delicate brown outlines, creamy highlights, simple readable silhouette at 100 px. No food, no props, no clothing, no letters, no text, no card, no border, no scene, no ground. Whole body inside square canvas with 15 percent clear margin all sides. Actual transparent alpha background, not drawn checkerboard. A friendly guest for a preschool snack-delivery game. Single character only.

ANIMAL 分別替換成：

- a little cream-white rabbit with long pink-lined ears
- a little warm brown monkey with a curled tail
- a little black and white giant panda
