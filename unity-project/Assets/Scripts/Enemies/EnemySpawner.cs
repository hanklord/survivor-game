using UnityEngine;

/// <summary>
/// EnemySpawner — 敵人生成工具
/// 對應原始架構: enemy.js Enemy.pickConfig / Enemy.spawnWave 靜態方法
/// </summary>
public static class EnemySpawner
{
    private const float LEVEL_UNLOCK_START = 30f;
    private const float LEVEL_UNLOCK_INTERVAL = 30f;
    private const float SPAWN_RADIUS = 12f;  // 生成距離玩家半徑

    /// <summary>
    /// 依遊戲時間選擇敵人設定等級
    /// </summary>
    public static EnemyConfig PickConfig(GameConfig config, float gameTime)
    {
        if (config == null || config.enemies == null || config.enemies.Length == 0)
            return null;

        var enemies = config.enemies;
        int maxLevel = 1;

        if (gameTime > LEVEL_UNLOCK_START)
        {
            maxLevel = Mathf.Min(enemies.Length, 1 + Mathf.FloorToInt((gameTime - LEVEL_UNLOCK_START) / LEVEL_UNLOCK_INTERVAL));
        }

        int idx = Random.Range(0, maxLevel);
        return enemies[idx];
    }

    /// <summary>
    /// 在玩家周圍生成一波敵人
    /// </summary>
    public static void SpawnWave(int waveNumber, PlayerController player, GameConfig config, float gameTime, float hpMultiplier)
    {
        if (config == null || config.enemies == null || player == null) return;

        int count = 3 + waveNumber * 2;
        count = Mathf.Min(count, GameManager.MAX_ENEMIES - GameManager.Instance.Enemies.Count);

        for (int i = 0; i < count; i++)
        {
            var enemyConfig = PickConfig(config, gameTime);
            SpawnEnemy(enemyConfig, player.transform.position, hpMultiplier);
        }
    }

    /// <summary>
    /// 在玩家周圍隨機位置生成單隻敵人
    /// </summary>
    public static EnemyBase SpawnEnemy(EnemyConfig config, Vector3 playerPos, float hpMultiplier = 1f)
    {
        if (config == null || config.prefab == null) return null;

        // 在畫面外圍隨機位置生成
        float angle = Random.Range(0f, Mathf.PI * 2f);
        Vector3 spawnPos = playerPos + new Vector3(
            Mathf.Cos(angle) * SPAWN_RADIUS,
            Mathf.Sin(angle) * SPAWN_RADIUS,
            0
        );

        var go = Object.Instantiate(config.prefab, spawnPos, Quaternion.identity);
        var enemy = go.GetComponent<EnemyBase>();
        enemy.Initialize(config, hpMultiplier);
        GameManager.Instance.RegisterEnemy(enemy);

        return enemy;
    }

    /// <summary>
    /// 生成菁英敵人 (5× HP, 2× 大小)
    /// </summary>
    public static EnemyBase SpawnElite(EnemyConfig config, Vector3 playerPos, float hpMultiplier = 1f)
    {
        var enemy = SpawnEnemy(config, playerPos, hpMultiplier * 5f);
        enemy.transform.localScale *= 2f;
        enemy.XPValue *= 5;
        return enemy;
    }
}
