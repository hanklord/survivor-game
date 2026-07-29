using UnityEngine;
using UnityEditor;
using System.IO;

/// <summary>
/// GameConfigAutoSetup — 自動設定 GameConfig 中所有圖片、音訊引用
/// 根據 HTML 版 config.js 的對應關係，將切好的 Sprite Strip、背景圖、BGM 全部連結到 GameConfig
/// 
/// 使用方式：
///   1. 先執行 "EndlessHeroes → 6. Import & Slice All Sprite Strips"
///   2. 再執行 "EndlessHeroes → 9. Auto Setup GameConfig Assets"
/// </summary>
public class GameConfigAutoSetup : Editor
{
    [MenuItem("EndlessHeroes/9. Auto Setup GameConfig Assets")]
    public static void AutoSetup()
    {
        // 找到 GameConfig asset
        string[] guids = AssetDatabase.FindAssets("t:GameConfig");
        if (guids.Length == 0)
        {
            Debug.LogError("[AutoSetup] GameConfig not found! Run 'EndlessHeroes → 4. Create Default GameConfig' first.");
            return;
        }

        string configPath = AssetDatabase.GUIDToAssetPath(guids[0]);
        var config = AssetDatabase.LoadAssetAtPath<GameConfig>(configPath);
        if (config == null)
        {
            Debug.LogError("[AutoSetup] Failed to load GameConfig at: " + configPath);
            return;
        }

        Debug.Log("[AutoSetup] Setting up GameConfig at: " + configPath);

        SetupCharacters(config);
        SetupEnemies(config);
        SetupBosses(config);
        SetupLevels(config);
        SetupProjectile(config);
        SetupXPGem(config);
        SetupAudio(config);
        SetupPlayerPrefabs(config);

        EditorUtility.SetDirty(config);
        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();

        Debug.Log("[AutoSetup] ✓ GameConfig auto-setup complete!");
    }

    // ============================================================
    // Characters
    // ============================================================

    private static void SetupCharacters(GameConfig config)
    {
        if (config.characters == null || config.characters.Length < 6)
        {
            Debug.LogWarning("[AutoSetup] characters array too short, recreating...");
            config.characters = new CharacterConfig[6];
            for (int i = 0; i < 6; i++) config.characters[i] = new CharacterConfig();
        }

        // Mage (index 0)
        SetCharacter(config.characters[0], CharacterType.Mage, "法師", AttackType.Ranged,
            "Assets/Sprites/UI/chars/mage.png",
            100, 3.6f, 10, 1.0f, 1, 1.2f, 0.76f);

        // Archer (index 1)
        SetCharacter(config.characters[1], CharacterType.Archer, "弓手", AttackType.Archer,
            "Assets/Sprites/UI/chars/archer.png",
            100, 3.6f, 12, 1.5f, 1, 1.2f, 0.76f);

        // Knight (index 2)
        SetCharacter(config.characters[2], CharacterType.Knight, "黃金騎士", AttackType.Melee,
            "Assets/Sprites/UI/chars/knight.png",
            150, 3.2f, 15, 1.67f, 0, 1.2f, 1.14f);

        // Valkyrie (index 3)
        SetCharacter(config.characters[3], CharacterType.Valkyrie, "女武神", AttackType.Valkyrie,
            "Assets/Sprites/UI/chars/valkyrie.png",
            100, 3.4f, 20, 1.25f, 0, 1.2f, 1.30f);

        // Boomerang (index 4)
        SetCharacter(config.characters[4], CharacterType.Boomerang, "迴力鏢手", AttackType.Boomerang,
            "Assets/Sprites/UI/chars/boomerang.png",
            100, 3.6f, 8, 0.8f, 1, 1.2f, 0.76f);

        // Ninja (index 5)
        SetCharacter(config.characters[5], CharacterType.Ninja, "忍者", AttackType.Ninja,
            "Assets/Sprites/UI/chars/ninja.png",
            100, 4.0f, 6, 2.5f, 3, 1.2f, 0.76f);

        Debug.Log("  ✓ Characters configured (6 types)");
    }

    private static void SetCharacter(CharacterConfig ch, CharacterType type, string name, AttackType atkType,
        string portraitPath, float hp, float speed, float damage, float fireRate, int projCount, float pickup, float scale)
    {
        ch.type = type;
        ch.displayName = name;
        ch.attackType = atkType;
        ch.portrait = LoadFirstSprite(portraitPath);
        ch.stats = new CharacterStats
        {
            hp = hp, speed = speed, damage = damage,
            fireRate = fireRate, projectileCount = projCount,
            pickupRange = pickup, scale = scale
        };
    }

    // ============================================================
    // Enemies (12 types matching HTML config.js)
    // ============================================================

    private static void SetupEnemies(GameConfig config)
    {
        // HTML config has 12 enemy types
        var enemyDefs = new (int level, string stripPath, float size, string color, float hp, float speed, float damage, int xp)[]
        {
            // Level 1: Slime
            (1, "Assets/Sprites/Enemies/enemy_slime2_idle_4f.png", 1.12f, "#44ff44", 12, 1.8f, 5, 1),
            // Level 2: Scorpion
            (2, "Assets/Sprites/Enemies/desert_scorpion_6f.png", 0.93f, "#cc8800", 14, 1.92f, 6, 1),
            // Level 3: Skeleton
            (3, "Assets/Sprites/Enemies/desert_skeleton_8f_4c2r.png", 0.98f, "#ddcc88", 16, 2.04f, 7, 1),
            // Level 4: Monster (purple)
            (4, "Assets/Sprites/Enemies/monster4_idle_4f.png", 0.79f, "#8844aa", 16, 2.16f, 6, 2),
            // Level 5: Beetle
            (5, "Assets/Sprites/Enemies/enemy_beetle_idle_8f_4c2r.png", 0.96f, "#2244aa", 10, 1.68f, 8, 2),
            // Level 6: Dark Knight
            (6, "Assets/Sprites/Characters/dark_knight_walk_8f.png", 1.00f, "#336633", 20, 2.04f, 9, 2),
            // Level 7: Dragon
            (7, "Assets/Sprites/Enemies/dragon_8f.png", 0.88f, "#448844", 8, 1.56f, 10, 2),
            // Level 8: Monster1
            (8, "Assets/Sprites/Enemies/monster1_idle_3f.png", 0.91f, "#666666", 14, 2.4f, 9, 3),
            // Level 9: Large Monster4
            (9, "Assets/Sprites/Enemies/monster4_idle_4f.png", 1.38f, "#442200", 10, 1.32f, 12, 3),
            // Level 10: Dark Knight (dark)
            (10, "Assets/Sprites/Characters/dark_knight_walk_8f.png", 0.91f, "#220044", 18, 2.28f, 14, 3),
            // Level 11: Large Dragon (red)
            (11, "Assets/Sprites/Enemies/dragon_8f.png", 1.09f, "#ff4400", 30, 1.2f, 16, 4),
            // Level 12: Large Beetle (dark)
            (12, "Assets/Sprites/Enemies/enemy_beetle_idle_8f_4c2r.png", 1.17f, "#440044", 20, 1.08f, 20, 5),
        };

        config.enemies = new EnemyConfig[enemyDefs.Length];
        for (int i = 0; i < enemyDefs.Length; i++)
        {
            var d = enemyDefs[i];
            config.enemies[i] = new EnemyConfig
            {
                level = d.level,
                enemyName = $"Enemy_Lv{d.level}",
                idleFrames = GetSpriteFrames(d.stripPath),
                size = d.size,
                color = HexToColor(d.color),
                hp = d.hp,
                speed = d.speed,
                damage = d.damage,
                xpValue = d.xp,
                prefab = LoadPrefab($"Assets/Prefabs/Enemies/Enemy_{i:D2}.prefab"),
            };
        }

        Debug.Log($"  ✓ Enemies configured ({config.enemies.Length} types)");
    }

    // ============================================================
    // Bosses (12 types matching HTML config.js)
    // ============================================================

    private static void SetupBosses(GameConfig config)
    {
        var bossDefs = new (string name, int level, string stripPath, float size, string color, float hp, float speed, float damage, float spawnTime, int xp)[]
        {
            ("綠魔",     1,  "Assets/Sprites/Bosses/boss_demon_idle_8f.png",              1.67f, "#44ff44", 300,  0.6f,  15, 30, 50),
            ("大猩猩",   2,  "Assets/Sprites/Bosses/boss_gorilla_idle_8f.png",            2.71f, "#553311", 800,  0.48f, 22, 60, 80),
            ("蠍子王",   3,  "Assets/Sprites/Bosses/desert_boss_scorpion_king_8f_4c2r.png", 2.08f, "#cc8800", 600,  0.66f, 20, 30, 100),
            ("沙蟲",     4,  "Assets/Sprites/Bosses/desert_boss_sandworm_8f_4c2r.png",    2.31f, "#ddcc88", 900,  0.54f, 24, 60, 120),
            ("甲蟲騎士", 5,  "Assets/Sprites/Bosses/boss_beetle_knight_idle_3f.png",      2.08f, "#1a3366", 1200, 0.54f, 28, 30, 100),
            ("火龍",     6,  "Assets/Sprites/Bosses/big_dragon_8f_4c2r.png",              2.50f, "#ff0066", 1200, 0.54f, 28, 60, 100),
            ("骷髏王",   7,  "Assets/Sprites/Bosses/boss_skeletonking_9f.png",            1.98f, "#ff4400", 1500, 0.66f, 30, 30, 120),
            ("牛頭怪",   8,  "Assets/Sprites/Bosses/boss_gnu_idle_5f.png",                2.29f, "#44ccff", 2000, 0.36f, 35, 60, 150),
            ("暗法師",   9,  "Assets/Sprites/Bosses/boss_mage3_idle_4f.png",              2.50f, "#008844", 2500, 0.42f, 40, 30, 180),
            ("機械龍",   10, "Assets/Sprites/Bosses/boss_machine_dragon_idle_4f.png",     1.88f, "#4400ff", 2000, 0.6f,  45, 60, 200),
            ("史萊姆王", 11, "Assets/Sprites/Bosses/boss_kingslime_idle_4f.png",          2.08f, "#ffcc00", 3000, 0.54f, 50, 30, 250),
            ("暗黑巨龍", 12, "Assets/Sprites/Bosses/big_dark_dragon_8f_4c2r.png",         5.00f, "#000000", 8000, 0.48f, 60, 60, 500),
        };

        config.bosses = new BossConfig[bossDefs.Length];
        for (int i = 0; i < bossDefs.Length; i++)
        {
            var d = bossDefs[i];
            string prefabPath = i < 10
                ? $"Assets/Prefabs/Bosses/Boss_{(i + 1):D2}_{GetBossPrefabSuffix(i)}.prefab"
                : $"Assets/Prefabs/Bosses/Boss_{(i + 1):D2}_{GetBossPrefabSuffix(i)}.prefab";

            config.bosses[i] = new BossConfig
            {
                level = d.level,
                bossName = d.name,
                idleFrames = GetSpriteFrames(d.stripPath),
                size = d.size,
                color = HexToColor(d.color),
                hp = d.hp,
                speed = d.speed,
                damage = d.damage,
                spawnTime = d.spawnTime,
                xpValue = d.xp,
                hasRangedAttack = false,
                rangedAttackInterval = 3f,
                prefab = LoadPrefab(GetBossPrefabPath(i)),
            };
        }

        Debug.Log($"  ✓ Bosses configured ({config.bosses.Length} types)");
    }

    private static string GetBossPrefabPath(int index)
    {
        string[] suffixes = { "Demon", "Gorilla", "BeetleKnight", "BigDragon", "SkeletonKing", "Gnu", "Mage", "MachineDragon", "KingSlime", "DarkDragon" };
        // Prefabs are named Boss_01_Demon through Boss_10_DarkDragon
        // But we have 12 bosses — extra 2 might share prefabs
        if (index < suffixes.Length)
            return $"Assets/Prefabs/Bosses/Boss_{(index + 1):D2}_{suffixes[index]}.prefab";

        // For 11th and 12th boss, try loading a generic or reusing
        return $"Assets/Prefabs/Bosses/Boss.prefab";
    }

    private static string GetBossPrefabSuffix(int index)
    {
        string[] suffixes = { "Demon", "Gorilla", "BeetleKnight", "BigDragon", "SkeletonKing", "Gnu", "Mage", "MachineDragon", "KingSlime", "DarkDragon", "KingSlime", "DarkDragon" };
        return index < suffixes.Length ? suffixes[index] : "Generic";
    }

    // ============================================================
    // Levels (6 levels matching HTML config.js)
    // ============================================================

    private static void SetupLevels(GameConfig config)
    {
        config.levels = new LevelConfig[]
        {
            new LevelConfig
            {
                levelName = "草原",
                bgColor = HexToColor("#1a2e1a"),
                bgImage = LoadFirstSprite("Assets/Sprites/Backgrounds/grass.png"),
                bgTexture = LoadTexture("Assets/Sprites/Backgrounds/grass.png"),
                bgm = LoadAudio("Assets/Audio/BGM/bgm.mp3"),
                duration = 90,
                enemySpeedMult = 1.0f,
                enemyIndices = new int[] { 0, 3, 4 },
                bossIndices = new int[] { 0, 1 },
            },
            new LevelConfig
            {
                levelName = "沙漠",
                bgColor = HexToColor("#2e2a1a"),
                bgImage = LoadFirstSprite("Assets/Sprites/Backgrounds/desert.png"),
                bgTexture = LoadTexture("Assets/Sprites/Backgrounds/desert.png"),
                bgm = LoadAudio("Assets/Audio/BGM/bgm_desert.mp3"),
                duration = 100,
                enemySpeedMult = 1.2f,
                enemyIndices = new int[] { 1, 2 },
                bossIndices = new int[] { 2, 3 },
            },
            new LevelConfig
            {
                levelName = "洞窟",
                bgColor = HexToColor("#1a1a2e"),
                bgImage = LoadFirstSprite("Assets/Sprites/Backgrounds/cave.png"),
                bgTexture = LoadTexture("Assets/Sprites/Backgrounds/cave.png"),
                bgm = LoadAudio("Assets/Audio/BGM/bgm_level2.mp3"),
                duration = 120,
                enemySpeedMult = 1.5f,
                enemyIndices = new int[] { 3, 4, 5, 6 },
                bossIndices = new int[] { 4, 5 },
            },
            new LevelConfig
            {
                levelName = "沼澤",
                bgColor = HexToColor("#1a2e2a"),
                bgImage = LoadFirstSprite("Assets/Sprites/Backgrounds/swamp.png"),
                bgTexture = LoadTexture("Assets/Sprites/Backgrounds/swamp.png"),
                bgm = LoadAudio("Assets/Audio/BGM/bgm_level3.mp3"),
                duration = 150,
                enemySpeedMult = 2.0f,
                enemyIndices = new int[] { 5, 6, 7, 8 },
                bossIndices = new int[] { 6, 7 },
            },
            new LevelConfig
            {
                levelName = "火山",
                bgColor = HexToColor("#2e1a1a"),
                bgImage = LoadFirstSprite("Assets/Sprites/Backgrounds/volcano.png"),
                bgTexture = LoadTexture("Assets/Sprites/Backgrounds/volcano.png"),
                bgm = LoadAudio("Assets/Audio/BGM/bgm_level4.mp3"),
                duration = 180,
                enemySpeedMult = 2.5f,
                enemyIndices = new int[] { 7, 8, 9, 10 },
                bossIndices = new int[] { 8, 9 },
            },
            new LevelConfig
            {
                levelName = "地獄",
                bgColor = HexToColor("#1a0a0a"),
                bgImage = LoadFirstSprite("Assets/Sprites/Backgrounds/hell.png"),
                bgTexture = LoadTexture("Assets/Sprites/Backgrounds/hell.png"),
                bgm = LoadAudio("Assets/Audio/BGM/bgm_level5.mp3"),
                duration = 240,
                enemySpeedMult = 3.0f,
                enemyIndices = new int[] { 9, 10, 11 },
                bossIndices = new int[] { 10, 11 },
            },
        };

        Debug.Log($"  ✓ Levels configured ({config.levels.Length} levels)");
    }

    // ============================================================
    // Projectile
    // ============================================================

    private static void SetupProjectile(GameConfig config)
    {
        config.projectile = new ProjectileConfig
        {
            sprite = LoadFirstSprite("Assets/Sprites/Effects/projectile.png"),
            color = HexToColor("#ff6600"),
            size = 0.24f,
            speed = 8f,
            lifetime = 2f,
        };
        Debug.Log("  ✓ Projectile configured");
    }

    // ============================================================
    // XP Gem
    // ============================================================

    private static void SetupXPGem(GameConfig config)
    {
        config.xpGem = new XPGemConfig
        {
            sprite = LoadFirstSprite("Assets/Sprites/Pickups/xp_gem.png"),
            color = HexToColor("#00ff88"),
            attractSpeed = 6f,
            pickupRadius = 0.3f,
        };
        Debug.Log("  ✓ XP Gem configured");
    }

    // ============================================================
    // Audio
    // ============================================================

    private static void SetupAudio(GameConfig config)
    {
        config.audio = new AudioConfig
        {
            bgmEnabled = true,
            sfxEnabled = true,
            bgmVolume = 0.5f,
            sfxVolume = 0.7f,
            defaultBGM = LoadAudio("Assets/Audio/BGM/bgm.mp3"),
        };
        Debug.Log("  ✓ Audio configured");
    }

    // ============================================================
    // Player Prefabs
    // ============================================================

    private static void SetupPlayerPrefabs(GameConfig config)
    {
        config.playerPrefabs = new GameObject[]
        {
            LoadPrefab("Assets/Prefabs/Player/Player_Mage.prefab"),
            LoadPrefab("Assets/Prefabs/Player/Player_Archer.prefab"),
            LoadPrefab("Assets/Prefabs/Player/Player_Knight.prefab"),
            LoadPrefab("Assets/Prefabs/Player/Player_Valkyrie.prefab"),
            LoadPrefab("Assets/Prefabs/Player/Player_Boomerang.prefab"),
            LoadPrefab("Assets/Prefabs/Player/Player_Ninja.prefab"),
        };
        Debug.Log("  ✓ Player prefabs assigned");
    }

    // ============================================================
    // Utility Methods
    // ============================================================

    /// <summary>
    /// 從 sprite strip 取得切好的 sprite 陣列（透過 SpriteStripImporter）
    /// </summary>
    private static Sprite[] GetSpriteFrames(string assetPath)
    {
        if (!File.Exists(Path.GetFullPath(assetPath)))
        {
            Debug.LogWarning($"  [AutoSetup] Sprite not found: {assetPath}");
            return new Sprite[0];
        }

        var sprites = SpriteStripImporter.GetSpritesFromStrip(assetPath);
        if (sprites == null || sprites.Length == 0)
        {
            // 可能是 single sprite（未切割）
            var single = AssetDatabase.LoadAssetAtPath<Sprite>(assetPath);
            if (single != null) return new Sprite[] { single };
            Debug.LogWarning($"  [AutoSetup] No frames found in: {assetPath}");
            return new Sprite[0];
        }
        return sprites;
    }

    /// <summary>
    /// 載入路徑中第一個 Sprite（用於 single sprite 資源如背景圖、UI 圖等）
    /// </summary>
    private static Sprite LoadFirstSprite(string assetPath)
    {
        var sprite = AssetDatabase.LoadAssetAtPath<Sprite>(assetPath);
        if (sprite != null) return sprite;

        // 嘗試從 Multiple 模式中取第一張
        var all = AssetDatabase.LoadAllAssetsAtPath(assetPath);
        foreach (var obj in all)
        {
            if (obj is Sprite s) return s;
        }
        Debug.LogWarning($"  [AutoSetup] Sprite not found: {assetPath}");
        return null;
    }

    /// <summary>
    /// 載入 Texture2D（背景用）
    /// </summary>
    private static Texture2D LoadTexture(string assetPath)
    {
        var tex = AssetDatabase.LoadAssetAtPath<Texture2D>(assetPath);
        if (tex == null)
            Debug.LogWarning($"  [AutoSetup] Texture not found: {assetPath}");
        return tex;
    }

    /// <summary>
    /// 載入 AudioClip
    /// </summary>
    private static AudioClip LoadAudio(string assetPath)
    {
        var clip = AssetDatabase.LoadAssetAtPath<AudioClip>(assetPath);
        if (clip == null)
            Debug.LogWarning($"  [AutoSetup] AudioClip not found: {assetPath}");
        return clip;
    }

    /// <summary>
    /// 載入 Prefab
    /// </summary>
    private static GameObject LoadPrefab(string assetPath)
    {
        var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
        if (prefab == null)
            Debug.LogWarning($"  [AutoSetup] Prefab not found: {assetPath}");
        return prefab;
    }

    /// <summary>
    /// Hex 顏色轉換 (#RRGGBB → Color)
    /// </summary>
    private static Color HexToColor(string hex)
    {
        if (ColorUtility.TryParseHtmlString(hex, out Color color))
            return color;
        return Color.white;
    }
}
