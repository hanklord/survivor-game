using UnityEngine;

/// <summary>
/// LevelManager — 關卡管理器
/// 對應原始架構: level-manager.js LevelManager class
/// 管理 5 個關卡的切換、通關條件、背景與 BGM 變更
/// </summary>
public class LevelManager : MonoBehaviour
{
    private int _currentLevelIndex;
    private float _levelTimer;
    private int _bossKillsInLevel;
    private bool _allCleared;

    private const int BOSSES_TO_CLEAR = 2;

    public int CurrentLevelIndex => _currentLevelIndex;
    public bool IsAllClear => _allCleared;

    public void Initialize()
    {
        _currentLevelIndex = 0;
        _levelTimer = 0f;
        _bossKillsInLevel = 0;
        _allCleared = false;

        ApplyLevelSettings();
    }

    private void Update()
    {
        if (GameManager.Instance.IsGameOver || GameManager.Instance.IsPaused) return;

        _levelTimer += Time.deltaTime;
    }

    /// <summary>
    /// Boss 被殺時呼叫，檢查通關條件
    /// </summary>
    public void OnBossKilled()
    {
        _bossKillsInLevel++;

        if (_bossKillsInLevel >= BOSSES_TO_CLEAR)
        {
            LevelClear();
        }
    }

    /// <summary>
    /// 關卡通關處理
    /// </summary>
    private void LevelClear()
    {
        // 回復 HP
        var player = GameManager.Instance.Player;
        float healAmount = player.MaxHP * GameConfig.LEVEL_CLEAR_HEAL_PERCENT;
        player.Heal(healAmount);

        if (_currentLevelIndex >= GameManager.Instance.gameConfig.levels.Length - 1)
        {
            // 全通關
            _allCleared = true;
            GameManager.Instance.UIManager.ShowAllClear(() =>
            {
                GameManager.Instance.StartHardcore();
            });
        }
        else
        {
            GameManager.Instance.UIManager.ShowLevelClear(_currentLevelIndex, () =>
            {
                Advance();
            });
        }
    }

    /// <summary>
    /// 切換至下一關
    /// </summary>
    public void Advance()
    {
        _currentLevelIndex++;
        _bossKillsInLevel = 0;
        _levelTimer = 0f;

        ApplyLevelSettings();

        // 重置 Boss 生成
        GameManager.Instance.WaveManager.ResetBossIndex();
    }

    /// <summary>
    /// 套用當前關卡設定（背景、BGM、速度倍率）
    /// </summary>
    private void ApplyLevelSettings()
    {
        var config = GetCurrentLevelConfig();
        if (config == null) return;

        // 背景
        var bgScroller = FindObjectOfType<BackgroundScroller>();
        if (bgScroller != null)
        {
            if (config.bgTexture != null)
            {
                bgScroller.SetBackgroundTexture(config.bgTexture);
            }
            else if (config.bgImage != null)
            {
                bgScroller.SetBackground(config.bgImage);
            }
            else
            {
                bgScroller.SetBackgroundColor(config.bgColor);
            }
        }

        Camera.main.backgroundColor = config.bgColor;

        // BGM
        if (GameManager.Instance.AudioManager != null)
            GameManager.Instance.AudioManager.PlayBGM(config.bgm);

        // UI 更新關卡名稱
        if (GameManager.Instance.UIManager != null)
            GameManager.Instance.UIManager.SetLevelName(config.levelName);
    }

    /// <summary>
    /// 取得當前關卡設定
    /// </summary>
    public LevelConfig GetCurrentLevelConfig()
    {
        var levels = GameManager.Instance.gameConfig.levels;
        if (_currentLevelIndex < levels.Length)
        {
            return levels[_currentLevelIndex];
        }
        return null;
    }

    /// <summary>
    /// 取得當前關卡 BGM
    /// </summary>
    public AudioClip GetCurrentLevelBGM()
    {
        var config = GetCurrentLevelConfig();
        return config?.bgm ?? GameManager.Instance.gameConfig.audio.defaultBGM;
    }

    /// <summary>
    /// 取得敵人速度倍率
    /// </summary>
    public float GetEnemySpeedMultiplier()
    {
        var config = GetCurrentLevelConfig();
        return config?.enemySpeedMult ?? 1f;
    }

    /// <summary>
    /// 重置至指定關卡（困難模式用）
    /// </summary>
    public void ResetToLevel(int index)
    {
        _currentLevelIndex = index;
        _bossKillsInLevel = 0;
        _levelTimer = 0f;
        _allCleared = false;

        ApplyLevelSettings();
        GameManager.Instance.WaveManager.ResetBossIndex();
    }
}
