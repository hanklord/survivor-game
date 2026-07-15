using UnityEngine;

/// <summary>
/// WaveManager — 波次管理器
/// 對應原始架構: wave-manager.js WaveManager class
/// 控制敵人波次生成與 Boss 出場時機
/// </summary>
public class WaveManager : MonoBehaviour
{
    [Header("Settings")]
    [SerializeField] private float _waveInterval = 5f;
    [SerializeField] private float _bossWarningDuration = 3f;

    private int _waveNumber;
    private float _waveTimer;
    private float _bossWarningTimer;
    private bool _bossWarningActive;
    private int _nextBossIndex;
    private float _hpMultiplier = 1f;

    private GameConfig _config;
    private PlayerController _player;

    public void Initialize()
    {
        _config = GameManager.Instance.gameConfig;
        _player = GameManager.Instance.Player;
        _waveNumber = 0;
        _waveTimer = _waveInterval;
        _bossWarningActive = false;
        _nextBossIndex = 0;
    }

    private void Update()
    {
        if (GameManager.Instance == null || GameManager.Instance.IsGameOver || GameManager.Instance.IsPaused) return;
        if (GameManager.Instance.Player == null) return;

        UpdateWaves();
        UpdateBossWarning();
    }

    /// <summary>
    /// 更新波次生成邏輯
    /// </summary>
    private void UpdateWaves()
    {
        if (_config == null || _player == null) return;

        _waveTimer -= Time.deltaTime;

        if (_waveTimer <= 0)
        {
            _waveNumber++;
            _waveTimer = _waveInterval;

            if (GameManager.Instance.Enemies.Count < GameManager.MAX_ENEMIES)
            {
                EnemySpawner.SpawnWave(_waveNumber, _player, _config, GameManager.Instance.GameTime, _hpMultiplier);
            }
        }
    }

    /// <summary>
    /// 管理 Boss 警告與生成
    /// </summary>
    private void UpdateBossWarning()
    {
        var levelManager = GameManager.Instance.LevelManager;
        if (levelManager == null) return;

        var currentLevel = levelManager.GetCurrentLevelConfig();
        if (currentLevel == null || currentLevel.bossIndices == null) return;

        // 檢查是否該生成 Boss
        int bossKillsNeeded = _nextBossIndex;
        if (bossKillsNeeded >= currentLevel.bossIndices.Length) return;

        // Boss 生成條件：固定擊殺數
        int killThreshold = (bossKillsNeeded == 0) ? 20 : 50;
        if (GameManager.Instance.Kills < killThreshold * (_nextBossIndex + 1)) return;

        if (!_bossWarningActive)
        {
            // 開始警告
            _bossWarningActive = true;
            _bossWarningTimer = _bossWarningDuration;
            GameManager.Instance.UIManager.ShowBossWarning();
            GameManager.Instance.AudioManager.PlaySFX(SFXType.BossWarning);
        }
        else
        {
            _bossWarningTimer -= Time.deltaTime;
            if (_bossWarningTimer <= 0)
            {
                SpawnBoss(currentLevel.bossIndices[_nextBossIndex]);
                _bossWarningActive = false;
                _nextBossIndex++;
                GameManager.Instance.UIManager.HideBossWarning();
            }
        }
    }

    private void SpawnBoss(int bossIndex)
    {
        var bossConfig = _config.bosses[bossIndex];
        float angle = Random.Range(0f, Mathf.PI * 2f);
        Vector3 spawnPos = _player.transform.position + new Vector3(
            Mathf.Cos(angle) * 10f,
            Mathf.Sin(angle) * 10f,
            0
        );

        var go = Instantiate(bossConfig.prefab, spawnPos, Quaternion.identity);
        var boss = go.GetComponent<BossController>();
        boss.Initialize(bossConfig, _hpMultiplier);
        GameManager.Instance.RegisterBoss(boss);
    }

    /// <summary>
    /// 設定 HP 倍率（困難模式用）
    /// </summary>
    public void SetHPMultiplier(float mult)
    {
        _hpMultiplier = mult;
    }

    public void ResetBossIndex()
    {
        _nextBossIndex = 0;
        _bossWarningActive = false;
    }
}
