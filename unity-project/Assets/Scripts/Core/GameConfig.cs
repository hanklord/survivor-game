using UnityEngine;
using System;

/// <summary>
/// GameConfig — 全域遊戲設定 ScriptableObject
/// 對應原始架構: config.js (V263)
/// Unity 6 + URP + ECS/DOTS 版本
/// </summary>
[CreateAssetMenu(fileName = "GameConfig", menuName = "EndlessHeroes/GameConfig")]
public class GameConfig : ScriptableObject
{
    // === 全域常數 ===
    public const string GAME_VERSION = "V263";
    public const float HARDCORE_HP_MULTIPLIER = 3.0f;
    public const float LEVEL_CLEAR_HEAL_PERCENT = 0.5f;
    public const bool DEBUG_SHOW_HITBOX = false;
    public const int MAX_ENEMIES = 30;
    public const int BOMB_KILL_THRESHOLD = 30;

    [Header("Player")]
    public CharacterConfig[] characters;

    [Header("Enemies")]
    public EnemyConfig[] enemies;

    [Header("Bosses")]
    public BossConfig[] bosses;

    [Header("Projectile")]
    public ProjectileConfig projectile;

    [Header("XP Gem")]
    public XPGemConfig xpGem;

    [Header("Levels")]
    public LevelConfig[] levels;

    [Header("Audio")]
    public AudioConfig audio;

    [Header("Prefabs")]
    public GameObject[] playerPrefabs; // 按 CharacterType 索引

    public GameObject GetPlayerPrefab(CharacterType type)
    {
        int index = (int)type;
        if (playerPrefabs == null || index < 0 || index >= playerPrefabs.Length)
        {
            Debug.LogWarning($"[GameConfig] playerPrefabs not set or index {index} out of range (length={playerPrefabs?.Length ?? 0}). Use 'EndlessHeroes → 9. Auto Setup GameConfig Assets' to configure.");
            return null;
        }
        return playerPrefabs[index];
    }

    public CharacterStats GetCharacterStats(CharacterType type)
    {
        int index = (int)type;
        if (characters == null || index < 0 || index >= characters.Length)
        {
            Debug.LogWarning($"[GameConfig] characters not set or index {index} out of range.");
            return new CharacterStats();
        }
        return characters[index].stats;
    }
}

// === 角色設定 ===

[Serializable]
public class CharacterConfig
{
    public CharacterType type;
    public string displayName;
    public Sprite portrait;
    public CharacterStats stats;
    public AttackType attackType;
    public GameObject prefab;
}

[Serializable]
public class CharacterStats
{
    public float hp = 100f;
    public float speed = 3.6f;
    public float damage = 10f;
    public float fireRate = 1.0f;
    public int projectileCount = 1;
    public float pickupRange = 1.2f;
    public float invulnDuration = 0.5f;
    public float scale = 1.0f;
}

// === 敵人設定 ===

[Serializable]
public class EnemyConfig
{
    public int level;
    public string enemyName;
    public Sprite[] idleFrames;
    public float size = 0.72f;
    public Color color = Color.red;
    public float hp = 3f;
    public float speed = 1.8f;
    public float damage = 5f;
    public int xpValue = 1;
    public GameObject prefab;
}

// === Boss 設定 ===

[Serializable]
public class BossConfig
{
    public int level;
    public string bossName;
    public Sprite[] idleFrames;
    public float size = 2.88f;
    public Color color = Color.green;
    public float hp = 300f;
    public float speed = 0.6f;
    public float damage = 15f;
    public float spawnTime = 30f;
    public int xpValue = 50;
    public bool hasRangedAttack = false; // Hardcore mode ranged attack
    public float rangedAttackInterval = 3f;
    public GameObject prefab;
}

// === 投射物設定 ===

[Serializable]
public class ProjectileConfig
{
    public Sprite sprite;
    public Color color = Color.yellow;
    public float size = 0.24f;
    public float speed = 8f;
    public float lifetime = 2f;
}

// === XP 寶石設定 ===

[Serializable]
public class XPGemConfig
{
    public Sprite sprite;
    public Color color = new Color(0, 1, 0.53f);
    public float attractSpeed = 6f;
    public float pickupRadius = 0.3f;
}

// === 關卡設定 (6 Levels) ===

[Serializable]
public class LevelConfig
{
    public string levelName;
    public Color bgColor;
    public Texture2D bgTexture;
    public Sprite bgImage;
    public AudioClip bgm;
    public float duration = 90f;
    public float enemySpeedMult = 1.0f;
    public int[] enemyIndices;   // 此關卡使用的敵人 index
    public int[] bossIndices;
    public AudioClip ambientSound;
}

// === 音訊設定 ===

[Serializable]
public class AudioConfig
{
    public bool bgmEnabled = true;
    public bool sfxEnabled = true;
    [Range(0f, 1f)]
    public float bgmVolume = 0.5f;
    [Range(0f, 1f)]
    public float sfxVolume = 0.7f;
    public AudioClip defaultBGM;
    public bool enabled { get; set; }
    public float volume { get; set; }
}

// === 列舉 (6 角色) ===

public enum CharacterType
{
    Mage = 0,       // 法師 (火球 + AOE)
    Archer = 1,     // 弓手 (展開箭 + 火DOT)
    Knight = 2,     // 黃金騎士 (扇形斬 + 背斬)
    Valkyrie = 3,   // 女武神 (矛刺 + 衝擊波 + 雙刺 + 三刺)
    Boomerang = 4,  // 迴力鏢手 (迴力鏢 + 連鎖閃電)
    Ninja = 5       // 忍者 (手裏劍連射 + 貫穿)
}

public enum AttackType
{
    Ranged,         // 法師
    Archer,         // 弓手
    Melee,          // 騎士
    Valkyrie,       // 女武神
    Boomerang,      // 迴力鏢
    Ninja           // 忍者
}
