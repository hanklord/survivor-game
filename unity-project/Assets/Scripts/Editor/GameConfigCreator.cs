using UnityEngine;
using UnityEditor;

/// <summary>
/// GameConfigCreator — 建立預設 GameConfig ScriptableObject
/// 在 Unity Editor 選單中執行：EndlessHeroes → Create Default GameConfig
/// </summary>
public class GameConfigCreator : Editor
{
    [MenuItem("EndlessHeroes/4. Create Default GameConfig")]
    public static void CreateDefaultConfig()
    {
        var config = ScriptableObject.CreateInstance<GameConfig>();

        // Characters — scale = htmlSize / 86.4 (for 128px frame, PPU=100, orthoSize=8)
        // Player HTML size = 66px → scale = 66/86.4 = 0.76
        config.characters = new CharacterConfig[]
        {
            new CharacterConfig
            {
                type = CharacterType.Mage,
                displayName = "法師",
                attackType = AttackType.Ranged,
                stats = new CharacterStats
                {
                    hp = 100, speed = 3.6f, damage = 10,
                    fireRate = 1.0f, projectileCount = 1,
                    pickupRange = 1.2f, scale = 0.76f
                }
            },
            new CharacterConfig
            {
                type = CharacterType.Archer,
                displayName = "弓箭手",
                attackType = AttackType.Archer,
                stats = new CharacterStats
                {
                    hp = 100, speed = 3.6f, damage = 12,
                    fireRate = 1.5f, projectileCount = 1,
                    pickupRange = 1.2f, scale = 0.76f
                }
            },
            new CharacterConfig
            {
                type = CharacterType.Knight,
                displayName = "騎士",
                attackType = AttackType.Melee,
                stats = new CharacterStats
                {
                    hp = 150, speed = 3.2f, damage = 15,
                    fireRate = 1.67f, projectileCount = 0,
                    pickupRange = 1.2f, scale = 1.14f
                }
            },
            new CharacterConfig
            {
                type = CharacterType.Valkyrie,
                displayName = "女武神",
                attackType = AttackType.Valkyrie,
                stats = new CharacterStats
                {
                    hp = 100, speed = 3.4f, damage = 20,
                    fireRate = 1.25f, projectileCount = 0,
                    pickupRange = 1.2f, scale = 0.89f
                }
            },
        };

        // Enemies (10 levels)
        // size = HTML pixel size / 86.4 (for 128px frame sprites at PPU=100, orthoSize=8)
        config.enemies = new EnemyConfig[]
        {
            new EnemyConfig { level = 1,  hp = 12, speed = 1.8f, damage = 5,  size = 1.12f, xpValue = 1, color = new Color(0.27f, 1f, 0.27f) },
            new EnemyConfig { level = 2,  hp = 16, speed = 2.16f, damage = 6, size = 0.79f, xpValue = 1, color = new Color(0.53f, 0.27f, 0.67f) },
            new EnemyConfig { level = 3,  hp = 10, speed = 1.68f, damage = 8, size = 0.96f, xpValue = 2, color = new Color(0.13f, 0.27f, 0.67f) },
            new EnemyConfig { level = 4,  hp = 20, speed = 2.04f, damage = 9, size = 1.00f, xpValue = 2, color = new Color(0.2f, 0.4f, 0.2f) },
            new EnemyConfig { level = 5,  hp = 8,  speed = 1.56f, damage = 10, size = 0.88f, xpValue = 2, color = new Color(0.27f, 0.53f, 0.27f) },
            new EnemyConfig { level = 6,  hp = 14, speed = 2.4f,  damage = 9, size = 0.91f, xpValue = 3, color = new Color(0.4f, 0.4f, 0.4f) },
            new EnemyConfig { level = 7,  hp = 10, speed = 1.32f, damage = 12, size = 1.38f, xpValue = 3, color = new Color(0.27f, 0.13f, 0f) },
            new EnemyConfig { level = 8,  hp = 18, speed = 2.28f, damage = 14, size = 0.91f, xpValue = 3, color = new Color(0.13f, 0f, 0.27f) },
            new EnemyConfig { level = 9,  hp = 30, speed = 1.2f,  damage = 16, size = 1.09f, xpValue = 4, color = new Color(1f, 0.27f, 0f) },
            new EnemyConfig { level = 10, hp = 20, speed = 1.08f, damage = 20, size = 1.17f, xpValue = 5, color = new Color(0.27f, 0f, 0.27f) },
        };

        // Bosses (10 levels)
        // Boss sprites have larger frames (~384-768px), size = HTML pixel size / 67.5 / (frame/100)
        // Using approximate scale for boss frame sizes
        config.bosses = new BossConfig[]
        {
            new BossConfig { level = 1, bossName = "惡魔",     hp = 300,  speed = 0.6f,  damage = 15, size = 1.67f, xpValue = 50, spawnTime = 30 },
            new BossConfig { level = 2, bossName = "猩猩",     hp = 800,  speed = 0.48f, damage = 22, size = 2.71f, xpValue = 80, spawnTime = 60 },
            new BossConfig { level = 3, bossName = "甲蟲騎士", hp = 1200, speed = 0.54f, damage = 28, size = 2.08f, xpValue = 100, spawnTime = 30 },
            new BossConfig { level = 4, bossName = "巨龍",     hp = 1200, speed = 0.54f, damage = 28, size = 2.50f, xpValue = 100, spawnTime = 60 },
            new BossConfig { level = 5, bossName = "骷髏王",   hp = 1500, speed = 0.66f, damage = 30, size = 1.98f, xpValue = 120, spawnTime = 30 },
            new BossConfig { level = 6, bossName = "牛頭人",   hp = 2000, speed = 0.36f, damage = 35, size = 2.29f, xpValue = 150, spawnTime = 60 },
            new BossConfig { level = 7, bossName = "黑魔導",   hp = 2500, speed = 0.42f, damage = 40, size = 2.50f, xpValue = 180, spawnTime = 30 },
            new BossConfig { level = 8, bossName = "機械龍",   hp = 2000, speed = 0.6f,  damage = 45, size = 1.88f, xpValue = 200, spawnTime = 60 },
            new BossConfig { level = 9, bossName = "史萊姆王", hp = 3000, speed = 0.54f, damage = 50, size = 2.08f, xpValue = 250, spawnTime = 30 },
            new BossConfig { level = 10, bossName = "暗黑龍",  hp = 8000, speed = 0.48f, damage = 60, size = 5.00f, xpValue = 500, spawnTime = 60 },
        };

        // Projectile
        config.projectile = new ProjectileConfig
        {
            color = new Color(1f, 0.4f, 0f),
            size = 0.24f,
            speed = 8f,
            lifetime = 2f
        };

        // XP Gem
        config.xpGem = new XPGemConfig
        {
            color = new Color(0f, 1f, 0.53f),
            attractSpeed = 6f,
            pickupRadius = 0.3f
        };

        // Levels
        config.levels = new LevelConfig[]
        {
            new LevelConfig { levelName = "草地", bgColor = new Color(0.1f, 0.18f, 0.1f), duration = 90,  enemySpeedMult = 1.0f, bossIndices = new int[] { 0, 1 } },
            new LevelConfig { levelName = "洞窟", bgColor = new Color(0.1f, 0.1f, 0.18f), duration = 120, enemySpeedMult = 1.5f, bossIndices = new int[] { 2, 3 } },
            new LevelConfig { levelName = "沼澤", bgColor = new Color(0.1f, 0.18f, 0.16f), duration = 150, enemySpeedMult = 2.0f, bossIndices = new int[] { 4, 5 } },
            new LevelConfig { levelName = "火山", bgColor = new Color(0.18f, 0.1f, 0.1f), duration = 180, enemySpeedMult = 2.5f, bossIndices = new int[] { 6, 7 } },
            new LevelConfig { levelName = "地獄", bgColor = new Color(0.15f, 0.05f, 0.1f), duration = 240, enemySpeedMult = 3.0f, bossIndices = new int[] { 8, 9 } },
        };

        // Audio
        config.audio = new AudioConfig
        {
            enabled = true,
            volume = 0.5f
        };

        // 儲存
        string dir = "Assets/ScriptableObjects";
        if (!AssetDatabase.IsValidFolder(dir))
        {
            AssetDatabase.CreateFolder("Assets", "ScriptableObjects");
        }

        AssetDatabase.CreateAsset(config, dir + "/GameConfig.asset");
        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();

        EditorUtility.FocusProjectWindow();
        Selection.activeObject = config;

        Debug.Log("[EndlessHeroes] GameConfig created at " + dir + "/GameConfig.asset");
        Debug.Log("  → Remember to assign Player Prefabs and Enemy/Boss Prefabs!");
    }
}
