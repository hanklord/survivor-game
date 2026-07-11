# Survivor Game — 技術開發文件

## 1. 專案概覽

| 項目 | 說明 |
|------|------|
| 遊戲類型 | 2D 俯視角倖存者類（Vampire Survivors-like） |
| 平台 | HTML5 Canvas（瀏覽器） |
| 引擎 | 無框架，純 JavaScript + Canvas 2D API |
| Repo | https://github.com/hanklord/survivor-game |
| 分支 | `main`（網頁版）、`godot`（Godot 4.x 實驗版） |
| 部署 | GitHub Pages 或直接開啟 index.html |

### 核心玩法
- 玩家在無限地圖上移動，自動攻擊最近敵人
- 擊殺敵人掉落 XP 寶石，升級時 3 選 1 技能
- 每關有時間限制，存活到結束 + 擊殺 Boss 即過關
- 5 個關卡，漸進難度

---

## 2. 技術架構

### 檔案結構

```
survivor-game/
├── index.html              # 入口 HTML
├── config.js               # 遊戲設定（角色、敵人、Boss、關卡）
├── js/
│   ├── main.js             # Game 主類別、生命週期管理
│   ├── player.js           # 玩家角色
│   ├── enemy.js            # 敵人類別
│   ├── boss.js             # Boss 類別
│   ├── projectile.js       # 投射物（火球）
│   ├── renderer.js         # Canvas 渲染器
│   ├── input.js            # 輸入管理（鍵盤+觸控）
│   ├── sprite-animator.js  # Sprite Strip 動畫系統（N×M grid）
│   ├── audio.js            # Web Audio API 音效/BGM
│   ├── level-manager.js    # 關卡系統
│   ├── wave-manager.js     # 敵人波次生成
│   ├── character-select.js # 角色選擇畫面
│   ├── ui.js               # HUD + 升級選單
│   ├── weapons.js          # 武器系統（護盾/飛彈/落雷/爆炸）
│   ├── archer-attack.js    # 弓箭手攻擊系統
│   ├── melee-attack.js     # 近戰攻擊系統
│   ├── level-up-effect.js  # 升級聖光特效
│   ├── combo-system.js     # 連殺 Combo
│   ├── bomb-system.js      # 全屏炸彈
│   ├── elite-spawner.js    # 精英怪 + 磁鐵道具
│   ├── rush-wave.js        # Rush Wave 事件
│   ├── passive-items.js    # 被動道具
│   ├── skill-tree.js       # 技能樹
│   ├── meta-progression.js # 永久升級（跨場金幣）
│   ├── damage-numbers.js   # 浮動傷害數字
│   ├── particle.js         # 粒子特效
│   ├── xp-gem.js           # 經驗值寶石
│   ├── spatial-hash.js     # 空間雜湊碰撞加速
│   ├── object-pool.js      # 物件池
│   ├── leaderboard.js      # 排行榜
│   └── utils.js            # 工具函式
├── assets/
│   ├── strips/             # Sprite strip PNG（83 張）
│   ├── backgrounds/        # 關卡背景 tile（5 張）
│   ├── audio/              # BGM（bgm.mp3, bgm_level2.mp3）
│   ├── enemies/            # 敵人靜態圖（舊版，未使用）
│   ├── xp_gem.png          # XP 寶石圖
│   ├── projectile.png      # 投射物圖（未使用，改用 code draw）
│   └── shield_icon.png     # 護盾圖示
└── docs/
    └── TECHNICAL.md        # 本文件
```

### 遊戲循環

```
requestAnimationFrame
  → _loop(timestamp)
    → dt = (ts - lastTime) / 1000, capped at MAX_DT (0.05s)
    → _levelUpEffect.update(dt)     // 獨立於暫停
    → if (!paused && !levelingUp)
        → _update(dt)               // 所有遊戲邏輯
    → renderer.render(state)        // 繪製
```

### Delta-Time 系統
- 所有移動速度以 **px/s** 為單位（非 px/frame）
- 公式：`position += speed * dt`
- MAX_DT = 0.05s（20fps 下限 cap，防穿牆）
- 速度常數：Player 180, Projectile 360, Enemy 54-120, Boss 18-33

---

## 3. 角色系統

### 角色列表

| 角色 | ID | 類型 | 描述 | 基礎技能 | Scale |
|------|----|------|------|----------|-------|
| 🔥 法師 | `ranged` | 遠程 | 火球魔法攻擊 | 火球自動射擊 | 1.0 |
| 🏹 弓手 | `archer` | 遠程 | 弓箭擴散射擊 | 扇形箭矢 | 1.0 |
| 🛡️ 黃金騎士 | `knight` | 近戰坦克 | 高防禦近戰攻擊 | 劍擊 | 1.5 |
| ⚔️ 近戰劍士 | `melee` | 近戰 | 劍氣斬擊（隱藏） | 弧形斬擊 | 1.0 |

### 角色差異

| 屬性 | 法師 | 弓手 | 黃金騎士 |
|------|------|------|----------|
| HP | 100 | 100 | 150 |
| 移速 | 180 | 180 | 153（×0.85） |
| 攻速 | 1.0s | 0.6s | 0.6s |
| 傷害 | 10 | 12 | 15 |
| 攻擊方式 | 火球（projectile） | 箭矢（archerAttack） | 斬擊（meleeAttack） |

### 升級機制
- 法師：🔥 火球+1（必定出現，最高 9 顆，扇形散射）
- 弓手：🏹 弓術精進 / 💥 爆炸箭 / 🔱 貫通箭
- 騎士：⚔️ 攻擊頻率 / 🗡️ 劍氣距離

### Sprite 動畫系統

**檔名命名規則：**
```
name_4f.png         → 4 frames, 1×4 strip
name_8f_4c2r.png    → 8 frames, 4 cols × 2 rows grid
name_12f_4c3r.png   → 12 frames, 4×3 grid
```

**解析函式：** `parseSpriteInfo(filename)`
- `(\d+)f` → frames
- `(\d+)c` → cols
- `(\d+)r` → rows
- 無 c/r → 預設單排（cols=frames, rows=1）

**SpriteAnimator 功能：**
- N×M grid 支援（row-major 播放順序）
- 可選 widthRatio（寬度縮放）
- 面向翻轉（facingLeft → scale(-1,1)）
- FPS 獨立的幀計時器

### Scale 參數
- 每個角色有獨立 `scale` 欄位
- 影響渲染大小：`drawSize = baseSize × scale`
- 影響碰撞框：`hitbox = PLAYER_HITBOX × scale`

---

## 4. 敵人 / Boss 系統

### 5 關卡配置

| 關卡 | 名稱 | 持續 | 速度倍率 | Boss |
|------|------|------|----------|------|
| 1 | 草地 | 90s | 1.0× | 紫龍 + 大猩猩 |
| 2 | 洞窟 | 120s | 1.2× | 甲蟲騎士 + 龍騎 |
| 3 | 沼澤 | 150s | 1.3× | 骷髏王 + Boss5 |
| 4 | 火山 | 180s | 1.5× | Boss6 + Boss7 |
| 5 | 地獄 | 240s | 1.8× | Boss8 + Boss9 |

### Boss 生成機制
- 每關有 2 隻 Boss，由 `bossIndices` 指定
- 生成時間：第一隻在關卡 50% 時間，第二隻在 70%
- 使用 `levelManager.levelTime`（每關重置），非全域時間
- Boss 生成前 3 秒顯示警告

### 過關條件
```
levelTime >= level.duration AND bosses.length === 0
```
必須同時滿足：
1. 存活到指定秒數
2. 該關所有 Boss 已被擊殺

### 敵人波次
- 每 3 秒生成一波
- 波次大小：`min(3 + gameTime/10, 30 - current)`
- 敵人等級漸進解鎖（每 30 秒解鎖下一級）
- 最大同時 30 隻普通敵人

---

## 5. 視覺特效

### 升級聖光效果 (`level-up-effect.js`)
- 觸發時機：升級時
- 持續 1.3 秒，遊戲期間不暫停（獨立於遊戲 pause）
- 選單在 1.5 秒後才彈出
- **跟隨角色移動**（追蹤 player 物件位置）
- 中心位置：角色腳底（y + 30px）
- 組成：
  - 全螢幕金白閃光（0.15s）
  - 金色光柱向上（400px 高、40-60px 寬）
  - 腳底金色光圈擴張（240px 半徑）
  - 20 顆金色粒子上升飄散
- 音效：4 音和弦 + 低音迴響 + 高頻 shimmer

### 斬擊特效（黃金騎士）
- Sprite strip：`slash_effect_4f.png`（4 幀青藍色弧形）
- **Crossfade 插值**：4 幀之間平滑混合，視覺等效 16+ 幀
- 不使用 `lighter` 合成模式（避免閃爍）
- 方向：`scale(-1, 1)` 水平翻轉，不旋轉（避免上下顛倒）
- Alpha：`min(1, alpha×1.5)` 前期不透明，尾端才淡

### Boss 方向指示箭頭
- Boss 在螢幕外時，玩家周圍顯示紅橘色箭頭
- 指向 Boss 所在方向
- 多 Boss 多箭頭
- 繪製在螢幕空間（ctx.restore 之後）

### 其他特效
- 傷害數字：浮動上升 + 暴擊放大
- 粒子：擊殺爆散（物件池回收）
- Combo 計數：連殺數顯示
- 畫面震動：Boss 擊殺時

---

## 6. 關卡系統

### 背景
- 5 張 pixel-art tile 圖（512×512）
- `createPattern('repeat')` + modulo offset 無限滾動
- 每關獨立背景色 fallback

### BGM 系統
- 預設：`assets/audio/bgm.mp3`（全域 loop）
- 關卡專用：config 中 `"bgm"` 欄位指定
- 目前 Level 2 有專屬 BGM（`bgm_level2.mp3`）
- `switchBGM()` 在關卡切換時更換

### 環境音（Web Audio API 合成）
- 草地：輕快旋律 loop
- 洞窟：滴水迴音
- 沼澤：低沉 drone
- 火山：隆隆聲
- 地獄：不和諧音 + 哀號

---

## 7. 效能優化

| 機制 | 設定 |
|------|------|
| 最大敵人數 | 30 |
| 最大 XP 寶石 | 50 |
| 最大傷害數字 | 20 |
| 物件池 | Projectile、Particle、XPGem |
| 空間雜湊 | cell size 120px，O(n) 碰撞 |
| FPS 監控 | 每秒計算，<20fps 自動降質 |
| 降質模式 | 關閉粒子、傷害數字 |
| Delta-time cap | MAX_DT = 0.05s（最低 20fps） |
| Off-screen culling | 不繪製視野外實體 |
| 背景分層 | 獨立 canvas，僅相機移動時重繪 |

---

## 8. UI 系統

### 角色選擇
- 3-4 張卡片橫排（hover 放大效果）
- 圖示 + 名稱 + 描述
- 選擇後進入遊戲

### 技能選擇選單（升級時）
- 暫停遊戲
- 隨機 3 個選項（pool shuffle）
- 角色基礎技能保證佔第一格（未滿級時）
- 通用升級 + 武器技能 + 被動道具

### HUD
- 左上：❤️ HP / MaxHP
- 左上下：⭐ Level + XP bar
- 左中：⏱️ 存活時間
- 左下：💀 擊殺數
- 右上：Combo 連殺
- 右下：💣 炸彈充能進度
- 中上：關卡名稱

### Boss 警告
- Boss 生成前 3 秒紅色脈衝警告文字
- 透明度隨時間閃爍

---

## 附錄：版本歷史摘要

- Delta-time 移動修正（所有實體）
- N×M grid sprite sheet 支援 + 檔名自動解析
- 4 角色系統（法師/弓手/騎士/劍士）
- 升級聖光特效（獨立動畫 + 跟隨 + 音效強化）
- 斬擊特效 sprite + crossfade 16 幀插值
- Boss 指示箭頭
- 關卡 Boss 系統修正（per-level time + bossIndices）
- 場景環境音（Web Audio 合成）
- 每關獨立 BGM 切換
- Godot 4.x 分支（實驗性）

---

## 9. Hardcore 模式（V162+）

- 通關後可選「Hardcore」重新開始，角色保留等級/技能
- 敵人（普通+Rush+精英+Boss）HP ×3^N（累乘）
- `HARDCORE_HP_MULTIPLIER = 3.0`（config.js 可調）
- 關卡名稱顯示「(Hardcore Lv.N)」
- 視覺特效（hardcoreLevel > 0 時啟用）：
  - 螢幕邊緣紅色脈動光暈（vignette，2.5s 週期，opacity 15~35%）
  - 飄浮灰燼粒子（28 顆，5~10px，紅/橘色，上飄+飄動）
  - 等級越高效果越強

## 10. 畫面比例與佈局（V165+）

- 遊戲強制 9:16 直屏比例
- PC 寬螢幕：pillarbox（兩側黑色），遊戲居中
- Canvas: `width = min(螢幕寬, 螢幕高×9/16)`
- `#game-container` 同步定位/大小
- 角色選擇畫面也限制在 9:16 區域

## 11. 系統更新摘要（V162~V177）

| 項目 | 說明 |
|------|------|
| 版本號格式 | V+數字（每 commit +1），顯示在角色選擇底部 |
| 設定按鈕 | 右上角⚙，暫停+BGM/音效開關（localStorage 保存） |
| 玩家血條 | 角色頭上 HP bar（綠/黃/紅） |
| Boss 箭頭 | 螢幕外 Boss 用紅橘色箭頭指示方向 |
| 各關 BGM | L1 預設, L2~L5 各有專屬 MP3, switchBGM() |
| 角色選擇 | 標題圖片(title.png) + 背景圖(title_bg.jpg) + 靜態角色圖 |
| 騎士斬擊 | 扇形±100°判定, range 160px, crossfade 4→16幀插值 |
| 聖光效果 | 跟隨角色、獨立動畫循環、1.3s播完才跳選單 |
| 怪物大小 | 全體 ×1.8（config size） |
| 弓箭手射速 | CD 0.67s（×1.5 加快） |
| 過關修正 | 每關只生成 bossIndices 指定的 Boss，用 levelTime |
| 除錯鍵 | N 鍵跳關 |
