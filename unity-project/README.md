# Endless Heroes — Unity 版本

移植自 HTML5 Canvas 原始版本，基於 `docs/ARCHITECTURE.md` 架構文件。

## 版本
- 原始版本: V221 (HTML5/JS)
- Unity 版本: 2022.3.62f1 LTS (支援 2D)

---

## 專案結構

```
Assets/
├── Scripts/
│   ├── Core/                    — 核心系統
│   │   ├── GameManager.cs       — 主遊戲管理器（單例）
│   │   ├── GameConfig.cs        — ScriptableObject 遊戲設定
│   │   ├── ObjectPoolManager.cs — 物件池管理
│   │   └── InputManager.cs      — 輸入統一封裝
│   │
│   ├── Player/                  — 玩家系統
│   │   ├── PlayerController.cs  — 玩家控制器
│   │   └── IPlayerAttack.cs     — 攻擊介面
│   │
│   ├── Combat/                  — 戰鬥系統
│   │   ├── MageAttack.cs        — 法師火球攻擊
│   │   ├── ArcherAttack.cs      — 弓箭手扇形箭矢
│   │   ├── ExplosiveArrow.cs    — 爆炸箭
│   │   ├── PiercingArrow.cs     — 穿透箭
│   │   ├── MeleeAttack.cs       — 騎士近戰弧形攻擊
│   │   ├── ValkyrieAttack.cs    — 女武神突刺攻擊
│   │   └── ProjectileController.cs — 投射物控制器
│   │
│   ├── Weapons/                 — 附加武器
│   │   ├── WeaponBase.cs        — 武器基底類
│   │   ├── WeaponManager.cs     — 武器管理器
│   │   ├── OrbitingShield.cs    — 旋轉護盾
│   │   ├── Nova.cs              — 範圍爆炸
│   │   ├── MissileLauncher.cs   — 飛彈發射器
│   │   ├── HomingMissileInstance.cs — 追蹤飛彈實體
│   │   ├── Thunder.cs           — 雷擊
│   │   └── ChainLightning.cs    — 鏈式閃電
│   │
│   ├── Enemies/                 — 敵人系統
│   │   ├── EnemyBase.cs         — 敵人基底類
│   │   ├── BossController.cs    — Boss 控制器
│   │   └── EnemySpawner.cs      — 敵人生成工具
│   │
│   ├── Systems/                 — 遊戲系統
│   │   ├── WaveManager.cs       — 波次管理
│   │   ├── RushWave.cs          — 衝刺波事件
│   │   ├── EliteSpawner.cs      — 菁英怪生成
│   │   └── LevelManager.cs      — 關卡管理
│   │
│   ├── Progression/             — 升級進程
│   │   ├── SkillTree.cs         — 被動技能樹
│   │   ├── PassiveItems.cs      — 被動道具
│   │   ├── ComboSystem.cs       — 連殺系統
│   │   ├── BombSystem.cs        — 大招系統
│   │   ├── MetaProgression.cs   — 永久升級
│   │   ├── LeaderboardManager.cs— 排行榜
│   │   ├── UpgradeOption.cs     — 升級選項
│   │   └── GameStats.cs         — 遊戲統計
│   │
│   ├── UI/                      — 使用者介面
│   │   ├── UIManager.cs         — UI 管理器
│   │   ├── CharacterSelectUI.cs — 角色選擇
│   │   └── MetaShopUI.cs        — 永久升級商店
│   │
│   ├── Audio/                   — 音訊
│   │   └── AudioManager.cs      — 音訊管理器
│   │
│   ├── Visual/                  — 視覺效果
│   │   ├── SpriteAnimatorController.cs — 幀動畫控制器
│   │   ├── DamageNumberManager.cs      — 傷害數字管理
│   │   ├── DamageNumberInstance.cs     — 傷害數字實體
│   │   ├── CameraShake.cs             — 畫面震動
│   │   ├── CameraFollow.cs            — 相機跟隨
│   │   ├── LevelUpEffect.cs           — 升級特效
│   │   ├── HardcoreVFX.cs             — 困難模式特效
│   │   ├── ParticleSpawner.cs         — 粒子生成
│   │   └── BackgroundScroller.cs      — 背景滾動
│   │
│   └── Pickups/                 — 拾取物
│       ├── XPGemController.cs   — 經驗寶石
│       ├── MagnetPickup.cs      — 磁鐵道具
│       ├── TreasureChest.cs     — 寶箱
│       └── FireZone.cs          — 火焰區域 DOT
│
├── Prefabs/                     — 預製件（需手動建立）
│   ├── Player/
│   ├── Enemies/
│   ├── Bosses/
│   ├── Projectiles/
│   ├── Effects/
│   ├── Pickups/
│   └── UI/
│
├── ScriptableObjects/           — 設定資料
│   └── GameConfig.asset
│
├── Sprites/                     — 圖片素材
│   ├── Characters/
│   ├── Enemies/
│   ├── Bosses/
│   ├── Backgrounds/
│   ├── UI/
│   └── Effects/
│
├── Audio/                       — 音訊素材
│   ├── BGM/
│   └── SFX/
│
└── Scenes/
    └── Main.unity
```

---

## 移植對照表

| 原始 JS 模組 | Unity 腳本 | 說明 |
|-------------|-----------|------|
| main.js (Game) | GameManager.cs | 主遊戲管理器 |
| config.js | GameConfig.cs (ScriptableObject) | 設定資料化 |
| player.js | PlayerController.cs | 玩家控制器 |
| enemy.js | EnemyBase.cs + EnemySpawner.cs | 敵人基底 + 生成邏輯分離 |
| boss.js | BossController.cs | Boss 控制器 |
| projectile.js | ProjectileController.cs | 投射物 + 物件池 |
| weapons.js | WeaponManager + 各 Weapon 類別 | 拆分為獨立元件 |
| melee-attack.js | MeleeAttack.cs | Physics2D 弧形碰撞 |
| archer-attack.js | ArcherAttack + Explosive + Piercing | 3 個獨立類別 |
| valkyrie-attack.js | ValkyrieAttack.cs | BoxCast 模擬突刺 |
| wave-manager.js | WaveManager.cs | MonoBehaviour 元件 |
| rush-wave.js | RushWave.cs | MonoBehaviour 元件 |
| elite-spawner.js | EliteSpawner.cs | MonoBehaviour 元件 |
| level-manager.js | LevelManager.cs | 關卡管理 |
| skill-tree.js | SkillTree.cs | 純 C# 類別 |
| passive-items.js | PassiveItems.cs | 純 C# 類別 |
| combo-system.js | ComboSystem.cs | 純 C# 類別 |
| bomb-system.js | BombSystem.cs | 純 C# 類別 |
| meta-progression.js | MetaProgression.cs | PlayerPrefs 存儲 |
| character-select.js | CharacterSelectUI.cs | UI 元件 |
| renderer.js | Unity 內建渲染 + CameraFollow | 不需手動渲染 |
| sprite-animator.js | SpriteAnimatorController.cs | 自訂幀動畫 |
| particle.js | ParticleSpawner.cs | Unity ParticleSystem |
| damage-numbers.js | DamageNumberManager.cs | TextMeshPro |
| level-up-effect.js | LevelUpEffect.cs | 粒子 + UI Overlay |
| hardcore-vfx.js | HardcoreVFX.cs | 粒子 + SpriteRenderer |
| audio.js | AudioManager.cs | Unity AudioSource |
| ui.js | UIManager.cs | Unity UI (Canvas) |
| input.js | InputManager.cs | Unity Input + 觸控 |
| leaderboard.js | LeaderboardManager.cs | PlayerPrefs + JSON |
| object-pool.js | ObjectPoolManager.cs | Queue 物件池 |
| spatial-hash.js | Unity Physics2D | 直接使用物理引擎 |
| xp-gem.js | XPGemController.cs | 物件池 + 吸引邏輯 |
| utils.js | 各處 inline | Vector2.Distance 等內建函式 |

---

## 架構設計決策

### 1. 為什麼不需要 SpatialHash？
Unity 內建 Physics2D 引擎已經使用 broadphase 加速碰撞查詢（`OverlapCircleAll` 等），不需額外實作空間雜湊。

### 2. 為什麼不需要 Renderer？
Unity 的 SpriteRenderer + Camera 系統天然支援分層渲染、Off-screen culling。背景使用 `BackgroundScroller` 實現無限滾動。

### 3. ScriptableObject vs JSON 設定
使用 ScriptableObject 取代原始的 `config.js`：
- 可在 Inspector 中可視化編輯
- 支援直接拖放 Prefab、Sprite、AudioClip
- 版本控制友善

### 4. 物件池策略
- Projectile/XPGem 使用 `Queue<T>` 物件池
- 粒子使用 Unity ParticleSystem（內建池化）
- 敵人暫時不池化（數量有限 MAX=30，直接 Instantiate/Destroy）

### 5. 暫停機制
使用 `Time.timeScale = 0` 全域暫停，UI 動畫使用 `Time.unscaledDeltaTime`。

---

## 初始設定步驟

1. **建立 Unity 2D 專案** (2021.3+)
2. **匯入腳本** 至 `Assets/Scripts/`
3. **建立 GameConfig ScriptableObject**
   - Create → EndlessHeroes → GameConfig
   - 填入角色/敵人/Boss/關卡設定
4. **建立 Prefab**
   - 玩家 4 種角色 Prefab (含 PlayerController + 對應攻擊元件)
   - 敵人/Boss Prefab (含 EnemyBase/BossController)
   - 投射物 Prefab (含 ProjectileController + Collider2D trigger)
   - XPGem Prefab (含 XPGemController)
5. **建立場景**
   - Main Camera (含 CameraFollow + CameraShake)
   - GameManager (含所有 Manager 子物件)
   - Canvas (含 UIManager + 所有 UI Panel)
   - ObjectPoolManager
6. **設定 Layer**
   - Player (Layer 6)
   - Enemy (Layer 7)
   - Projectile (Layer 8)
   - Pickup (Layer 9)
7. **設定 Physics2D**
   - Player 與 Enemy 碰撞
   - Projectile 與 Enemy 碰撞 (Trigger)
   - Pickup 與 Player 碰撞 (Trigger)
8. **匯入素材**
   - 切割 Sprite Strip 為個別 Sprite
   - 設定 AudioClip
   - 配置 Animation Sets

---

## 遊戲流程

```
啟動 → MetaShopUI → CharacterSelectUI → GameManager.InitGame()
  ↓
主迴圈 (Unity Update)
  ├── InputManager.GetDirection() → PlayerController.Move()
  ├── IPlayerAttack.Attack()
  ├── WeaponManager.UpdateWeapon()
  ├── WaveManager → EnemySpawner
  ├── RushWave / EliteSpawner
  ├── XPGemController.Update() → 吸引/撿取
  ├── 碰撞偵測 (Physics2D)
  └── UIManager.UpdateHUD()
  ↓
升級: ShowLevelUp() → Time.timeScale=0 → 選擇 → ApplyUpgrade()
  ↓
通關: LevelManager.OnBossKilled() → LevelClear → Advance()
  ↓
全通: StartHardcore() → 重置 + HP 倍率
  ↓
死亡: EndGame() → GameOver UI → MetaProgression 獎勵
```

---

## 依賴套件

- **TextMeshPro** (Unity 內建) — 傷害數字
- **Unity UI** (內建) — 所有 UI
- **2D Physics** (內建) — 碰撞偵測

無需額外第三方套件。
