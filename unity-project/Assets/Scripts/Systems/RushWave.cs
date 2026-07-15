using UnityEngine;

/// <summary>
/// RushWave — 衝刺波事件
/// 對應原始架構: rush-wave.js RushWave class
/// 每 60 秒觸發一次快速生成浪潮
/// </summary>
public class RushWave : MonoBehaviour
{
    private const float TRIGGER_INTERVAL = 60f;
    private const float DURATION = 8f;
    private const float SPAWN_INTERVAL = 0.5f;
    private const int SPAWN_COUNT = 4;
    private const int XP_REWARD_COUNT = 5;

    private float _triggerTimer;
    private float _durationTimer;
    private float _spawnTimer;
    private bool _isActive;

    public bool IsActive => _isActive;

    public void Initialize()
    {
        _triggerTimer = TRIGGER_INTERVAL;
        _isActive = false;
    }

    private void Update()
    {
        if (GameManager.Instance == null || GameManager.Instance.IsGameOver || GameManager.Instance.IsPaused) return;
        if (GameManager.Instance.Player == null) return;

        if (_isActive)
        {
            UpdateRush();
        }
        else
        {
            _triggerTimer -= Time.deltaTime;
            if (_triggerTimer <= 0)
            {
                StartRush();
            }
        }
    }

    private void StartRush()
    {
        _isActive = true;
        _durationTimer = DURATION;
        _spawnTimer = 0f;

        GameManager.Instance.UIManager.ShowRushWarning(true);
    }

    private void UpdateRush()
    {
        _durationTimer -= Time.deltaTime;
        _spawnTimer -= Time.deltaTime;

        if (_spawnTimer <= 0)
        {
            _spawnTimer = SPAWN_INTERVAL;
            SpawnRushEnemies();
        }

        if (_durationTimer <= 0)
        {
            EndRush();
        }
    }

    private void SpawnRushEnemies()
    {
        var config = GameManager.Instance.gameConfig;
        var player = GameManager.Instance.Player;
        if (config == null || player == null) return;

        for (int i = 0; i < SPAWN_COUNT; i++)
        {
            var enemyConfig = EnemySpawner.PickConfig(config, GameManager.Instance.GameTime);
            if (enemyConfig != null)
                EnemySpawner.SpawnEnemy(enemyConfig, player.transform.position);
        }
    }

    private void EndRush()
    {
        _isActive = false;
        _triggerTimer = TRIGGER_INTERVAL;

        GameManager.Instance.UIManager.ShowRushWarning(false);

        // 獎勵：5 次 XP 爆發
        var player = GameManager.Instance.Player;
        for (int i = 0; i < XP_REWARD_COUNT; i++)
        {
            Vector2 offset = Random.insideUnitCircle * 1.5f;
            GameManager.Instance.PoolManager.SpawnXPGem(
                player.transform.position + (Vector3)offset, 3);
        }
    }
}
