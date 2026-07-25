# Endless Heroes — Unity 6 版本 (URP + ECS/DOTS)

移植自 HTML5 Canvas 原始版本 V263，使用 Unity 6 + URP + ECS/DOTS 架構。

## 版本
- **原始版本:** V263 (HTML5/JS Canvas)
- **Unity 版本:** 6000.0.32f1 (Unity 6)
- **Render Pipeline:** URP (Universal Render Pipeline) 17.0.3
- **ECS/DOTS:** com.unity.entities 1.3.5 (敵人系統)
- **平台:** PC (Windows/Mac)

---

## 快速開始

### 1. 開啟專案
1. 使用 **Unity Hub** 安裝 Unity 6 (6000.0.32f1+)
2. 從 Unity Hub 「Open」→ 選擇 `unity-project/` 資料夾
3. 首次開啟會解析所有套件，請耐心等待

### 2. 初始設定 (一鍵建構)
在 Unity Editor 上方選單依序執行：

| 順序 | 選單 | 功能 |
|------|------|------|
| 1 | EndlessHeroes → 0. Setup URP Pipeline | 建立 URP 資源並設定 Render Pipeline |
| 2 | EndlessHeroes → 1. Build All Prefabs | 自動建立所有 Prefab（玩家×6、敵人×12、Boss×10、特效、拾取物） |
| 3 | EndlessHeroes → 2. Build Main Scene | 一鍵建構完整遊戲場景（含 ECS Spawner、UI、音訊） |
| 4 | EndlessHeroes → 3. Setup Physics Layers | 設定碰撞矩陣 |

### 3. 執行
點擊 Play 進入角色選擇畫面。

---

## 專案結構

```
unity-project/
├── Assets/
│   ├── Scripts/
│   │   ├── Core/                        — 核心系統
│   │   │   ├── GameManager.cs           — 主遊戲管理器（單例）
│   │   │   ├── GameConfig.cs            — ScriptableObject 遊戲設定 (V263)
│   │   │   ├── GameBootstrap.cs         — 啟動引導
│   │   │   ├── ObjectPoolManager.cs     — 物件池管理
│   │   │   └── InputManager.cs          — 輸入統一封裝（鍵盤+手把）
│   │   │
│   │   ├── Player/                      — 玩家系統
│   │   │   ├── PlayerController.cs      — 玩家控制器（6角色）
│   │   │   └── IPlayerAttack.cs         — 攻擊介面
│   │   │
│   │   ├── Combat/                      — 戰鬥系統
│   │   │   ├── MageAttack.cs            — 法師: 火球 + AOE
│   │   │   ├── ArcherAttack.cs          — 弓手: 展開箭 + 火DOT
│   │   │   ├── MeleeAttack.cs           — 黃金騎士: 扇形斬 + 背斬
│   │   │   ├── ValkyrieAttack.cs        — 女武神: 矛刺+衝擊波+雙刺+三刺
│   │   │   ├── BoomerangAttack.cs       — 迴力鏢手: 迴力鏢 + 連鎖閃電
│   │   │   ├── NinjaAttack.cs           — 忍者: 手裏劍連射 + 貫穿
│   │   │   ├── BoomerangProjectile.cs   — 迴力鏢投射物（去回邏輯）
│   │   │   ├── ProjectileController.cs  — 通用投射物控制器
│   │   │   ├── ExplosiveArrow.cs        — 爆炸箭
│   │   │   └── PiercingArrow.cs         — 穿透箭
│   │   │
│   │   ├── Weapons/                     — 附加武器
│   │   │   ├── WeaponBase.cs            — 武器基底類
│   │   │   ├── WeaponManager.cs         — 武器管理器
│   │   │   ├── OrbitingShield.cs        — 旋轉護盾
│   │   │   ├── Nova.cs                  — 範圍爆炸
│   │   │   ├── MissileLauncher.cs       — 飛彈發射器
│   │   │   ├── HomingMissileInstance.cs — 追蹤飛彈
│   │   │   ├── Thunder.cs              — 雷擊
│   │   │   └── ChainLightning.cs       — 鏈式閃電
│   │   │
│   │   ├── ECS/                         — ECS/DOTS 系統（敵人）
│   │   │   ├── Components/
│   │   │   │   ├── EnemyComponents.cs   — 敵人資料元件
│   │   │   │   ├── SpawnerComponents.cs — 生成器元件
│   │   │   │   └── CombatComponents.cs  — 碰撞/傷害元件
│   │   │   ├── Systems/
│   │   │   │   ├── EnemySpawnSystem.cs      — Kill-to-respawn 生成
│   │   │   │   ├── EnemyMovementSystem.cs   — Burst 加速移動
│   │   │   │   ├── EnemyCollisionSystem.cs  — 碰撞偵測
│   │   │   │   └── EnemyCleanupSystem.cs    — 死亡回收
│   │   │   ├── Authoring/
│   │   │   │   ├── EnemyAuthoring.cs        — Enemy Baker
│   │   │   │   ├── EnemySpawnerAuthoring.cs — Spawner Baker
│   │   │   │   ├── PlayerPositionAuthoring.cs
│   │   │   │   └── PlayerPositionSync.cs    — MonoBehaviour↔ECS 橋接
│   │   │   └── EndlessHeroes.ECS.asmdef
│   │   │
│   │   ├── Enemies/                     — 敵人 MonoBehaviour（Boss 等）
│   │   │   ├── EnemyBase.cs
│   │   │   ├── BossController.cs
│   │   │   └── EnemySpawner.cs
│   │   │
│   │   ├── Systems/                     — 遊戲系統
│   │   │   ├── WaveManager.cs           — 波次管理
│   │   │   ├── RushWave.cs              — 衝刺波事件
│   │   │   ├── EliteSpawner.cs          — 菁英怪生成
│   │   │   └── LevelManager.cs          — 6 關卡管理
│   │   │
│   │   ├── Progression/                 — 升級進程
│   │   │   ├── SkillTree.cs             — 被動技能樹
│   │   │   ├── PassiveItems.cs          — 被動道具
│   │   │   ├── ComboSystem.cs           — 連殺系統
│   │   │   ├── BombSystem.cs            — 大招系統（殺30充能）
│   │   │   ├── MetaProgression.cs       — 永久升級
│   │   │   ├── LeaderboardManager.cs    — 排行榜
│   │   │   ├── UpgradeOption.cs         — 升級選項
│   │   │   └── GameStats.cs             — 遊戲統計
│   │   │
│   │   ├── UI/                          — 使用者介面
│   │   │   ├── UIManager.cs             — UI 管理器
│   │   │   ├── CharacterSelectUI.cs     — 角色選擇（6角色）
│   │   │   └── MetaShopUI.cs            — 永久升級商店
│   │   │
│   │   ├── Audio/                       — 音訊
│   │   │   └── AudioManager.cs          — 音訊管理器（BGM/SFX 開關）
│   │   │
│   │   ├── Visual/                      — 視覺效果
│   │   │   ├── SpriteAnimatorController.cs — 幀動畫控制器
│   │   │   ├── DamageNumberManager.cs      — 傷害數字管理
│   │   │   ├── DamageNumberInstance.cs     — 傷害數字實體
│   │   │   ├── CameraShake.cs             — 暴擊震動
│   │   │   ├── CameraFollow.cs            — 相機跟隨
│   │   │   ├── LevelUpEffect.cs           — 聖光升級特效
│   │   │   ├── HardcoreVFX.cs             — 困難模式: 紅暈+灰燼粒子
│   │   │   ├── ParticleSpawner.cs         — 粒子生成
│   │   │   └── BackgroundScroller.cs      — 背景滾動
│   │   │
│   │   ├── Pickups/                     — 拾取物
│   │   │   ├── XPGemController.cs       — 經驗寶石
│   │   │   ├── MagnetPickup.cs          — 磁鐵道具
│   │   │   ├── TreasureChest.cs         — 寶箱
│   │   │   └── FireZone.cs              — 火焰區域 DOT
│   │   │
│   │   └── Editor/                      — 編輯器工具
│   │       ├── SceneBuilder.cs          — 一鍵建構場景 & Prefabs
│   │       ├── URPSetup.cs              — URP 管線設定
│   │       ├── PhysicsSetup.cs          — 碰撞矩陣設定
│   │       ├── SpriteStripImporter.cs   — Sprite Strip 切圖工具
│   │       ├── SpriteAssigner.cs        — 自動素材分配
│   │       ├── BackgroundImporter.cs    — 背景匯入工具
│   │       └── GameConfigCreator.cs     — GameConfig 建立工具
│   │
│   ├── Prefabs/                         — 預製件
│   │   ├── Player/          — 6 角色 Prefab
│   │   ├── Enemies/         — 12 種敵人 Prefab (含 ECS Authoring)
│   │   ├── Bosses/          — 10 Boss Prefab
│   │   ├── Projectiles/     — 投射物
│   │   ├── Effects/         — 特效
│   │   ├── Pickups/         — 拾取物
│   │   └── UI/              — UI 元件
│   │
│   ├── ScriptableObjects/   — GameConfig.asset
│   │
│   ├── Sprites/             — 圖片素材
│   │   ├── Characters/      — 6 角色 idle/run strips
│   │   ├── Enemies/         — 各關卡敵人 (含沙漠)
│   │   ├── Bosses/          — 10+ Boss sprites
│   │   ├── Backgrounds/     — 6 關卡背景 (含沙漠)
│   │   ├── UI/              — UI 素材
│   │   └── Effects/         — 特效素材
│   │
│   ├── Audio/               — 音訊素材
│   │   ├── BGM/             — 7 首 BGM (含角色選擇、沙漠)
│   │   └── SFX/             — 音效 (待補)
│   │
│   ├── Settings/            — URP 設定
│   │   └── URP/             — URP_Asset_2D + URP_Renderer_2D
│   │
│   └── Scenes/
│       └── MainScene.unity
│
├── Packages/
│   └── manifest.json        — 套件清單
│
└── ProjectSettings/
    └── ProjectVersion.txt   — Unity 6000.0.32f1
```

---

## 架構設計

### Hybrid ECS (混合架構)

本專案使用 **混合架構**：
- **ECS/DOTS** (com.unity.entities) → 大量敵人的生成、移動、碰撞偵測
- **MonoBehaviour** → 玩家、Boss、UI、武器、特效等互動性高的系統

這種設計讓:
1. 場上 30 隻敵人用 Burst-compiled Job System 批次移動，幾乎零 GC
2. Boss 和玩家保持 MonoBehaviour 靈活性
3. `PlayerPositionSync` 橋接兩個世界

### 敵人系統 (ECS)

```
EnemySpawnSystem   → 維持場上 30 隻 (kill-to-respawn)
EnemyMovementSystem → Burst 加速追蹤玩家
EnemyCollisionSystem → 碰撞偵測
EnemyCleanupSystem  → 回收已死亡 Entity
```

### 6 角色系統

| # | 角色 | 攻擊方式 | Script |
|---|------|----------|--------|
| 0 | 法師 | 火球 + AOE | MageAttack.cs |
| 1 | 弓手 | 展開箭 + 火DOT | ArcherAttack.cs |
| 2 | 黃金騎士 | 扇形斬 + 背斬 | MeleeAttack.cs |
| 3 | 女武神 | 矛刺 + 衝擊波 + 雙刺/三刺 | ValkyrieAttack.cs |
| 4 | 迴力鏢手 | 迴力鏢(去回) + 連鎖閃電 | BoomerangAttack.cs |
| 5 | 忍者 | 手裏劍連射 + 貫穿 | NinjaAttack.cs |

### 6 關卡

| # | 場景 | 背景 | BGM |
|---|------|------|-----|
| 1 | 草地 | grass.png | bgm.mp3 |
| 2 | 沙漠 | desert.png | bgm_desert.mp3 |
| 3 | 洞穴 | cave.png | bgm_level2.mp3 |
| 4 | 沼澤 | swamp.png | bgm_level3.mp3 |
| 5 | 火山 | volcano.png | bgm_level4.mp3 |
| 6 | 地獄 | hell.png | bgm_level5.mp3 |

### Hardcore 模式

通關 6 關後觸發：
- 敵人 HP × 3^N (N = 循環次數)
- 紅暈 Post-processing Vignette
- 灰燼粒子效果
- Boss 新增遠程攻擊

### 大招系統

殺 30 敵人 → 充能滿 → 全螢幕閃光清場

---

## 套件依賴

| 套件 | 版本 | 用途 |
|------|------|------|
| com.unity.render-pipelines.universal | 17.0.3 | URP 渲染管線 |
| com.unity.entities | 1.3.5 | ECS/DOTS 敵人系統 |
| com.unity.entities.graphics | 1.3.5 | ECS 渲染支援 |
| com.unity.mathematics | 1.3.2 | 高效數學運算 |
| com.unity.inputsystem | 1.11.2 | 新輸入系統 (手把支援) |
| com.unity.textmeshpro | 3.2.0-pre.12 | 傷害數字、UI 文字 |
| com.unity.2d.sprite | 1.0.0 | 2D Sprite 支援 |

---

## 輸入對照

| 動作 | 鍵盤 | 手把 (Gamepad) |
|------|------|----------------|
| 移動 | WASD / 方向鍵 | 左搖桿 |
| 瞄準 | (跟隨移動方向) | 右搖桿 |
| 大招 | Space | 右肩鈕 (Fire2) |

---

## 從原始 HTML5 版差異

1. **渲染:** Canvas 2D → Unity URP SpriteRenderer (自動 batching)
2. **敵人:** 陣列遍歷 → ECS/DOTS Burst-compiled Jobs
3. **碰撞:** 自製 Spatial Hash → Unity Physics2D + ECS 碰撞
4. **輸入:** 自製 Input class → Unity Input System + 手把
5. **動畫:** 自製 SpriteAnimator → SpriteAnimatorController (保留幀動畫邏輯)
6. **物件池:** 自製 ObjectPool → ObjectPoolManager (Queue<T>)
7. **設定:** config.js → GameConfig ScriptableObject

---

## 開發進度

- [x] 專案骨架 (Unity 6 + URP + ECS)
- [x] 資料夾結構
- [x] Editor Scripts (一鍵建構)
- [x] 6 角色 Scripts & Prefabs
- [x] ECS 敵人系統骨架
- [x] 素材匯入 (sprites, BGM)
- [ ] 完整 GameConfig 填入數值
- [ ] UI 流程串接
- [ ] 音效 (SFX) 補齊
- [ ] Hardcore 模式 Post-processing
- [ ] 翅膀 Lv10 視覺特效
- [ ] Hitbox Debug 開關

---

## 注意事項

1. **首次開啟** 會花 5-10 分鐘解析 Entities 套件，這是正常的
2. **URP 設定** 必須先執行選單 `0. Setup URP Pipeline`，否則會是粉紅色
3. **ECS Sub Scene** 未來可將敵人 Prefab 轉為 Sub Scene 提升效能
4. **Assembly Definition** ECS 系統有獨立的 `.asmdef`，確保 Burst 編譯正確
