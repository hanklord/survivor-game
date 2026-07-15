using UnityEngine;
using System;

/// <summary>
/// GameConfig — 全域遊戲設定 ScriptableObject
/// 對應原始架構: config.js
/// </summary>
[CreateAssetMenu(fileName = "GameConfig", menuName = "EndlessHeroes/GameConfig")]
public class GameConfig : ScriptableObject
{
    // === 全域常數 ===
    public const string GAME_VERSION = "V221";
    public const float HARDCORE_HP_MULTIPLIER = 3.0f;
    public const float LEVEL_CLEAR_HEAL_PERCENT = 0.5f;
    public const bool DEBUG_SHOW_HITBOX = false;

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
        return playerPrefabs[(int)type];
    }

    public CharacterStats GetCharacterStats(CharacterType type)
    {
        return characters[(int)type].stats;
    }
}

// === 角色設定 ===

[Serializable]
public class CharacterConfig
{
    public CharacterType type;
    public string displayName;
    public Sprite portrait;        // 角色選擇畫面頭像（可選）
    public CharacterStats stats;
    public AttackType attackType;
    public GameObject prefab;
}

[Serializable]
public class CharacterStats
{
    public float hp = 100f;
    public float speed = 3.6f; // Unity units/s (原 180px/s ÷ 50 pixel per unit)
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

// === 關卡設定 ===

/// <summary>
/// 關卡設定
/// </summary>
[Serializable]
public class LevelConfig
{
    public string levelName;
    public Color bgColor;
    public Texture2D bgTexture;     // 背景紋理（Repeat 平鋪）
    public Sprite bgImage;          // 備用（Sprite 模式）
    public AudioClip bgm;
    public float duration = 90f;
    public float enemySpeedMult = 1.0f;
    public int[] bossIndices;
    public AudioClip ambientSound;
}

// === 音訊設定 ===

[Serializable]
public class AudioConfig
{
    public bool enabled = true;
    [Range(0f, 1f)]
    public float volume = 0.5f;
    public AudioClip defaultBGM;
}

// === 列舉 ===

public enum CharacterType
{
    Mage = 0,
    Archer = 1,
    Knight = 2,
    Valkyrie = 3
}

public enum AttackType
{
    Ranged,
    Archer,
    Melee,
    Valkyrie
}
