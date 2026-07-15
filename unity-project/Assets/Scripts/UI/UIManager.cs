using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;

/// <summary>
/// UIManager — 使用者介面管理器
/// 對應原始架構: ui.js UI class
/// 管理所有 HUD、Modal、技能圖標等 UI 元素
/// </summary>
public class UIManager : MonoBehaviour
{
    [Header("HUD")]
    [SerializeField] private Slider _hpBar;
    [SerializeField] private Slider _xpBar;
    [SerializeField] private Text _levelText;
    [SerializeField] private Text _timerText;
    [SerializeField] private Text _killsText;
    [SerializeField] private Text _levelNameText;
    [SerializeField] private Text _comboText;
    [SerializeField] private GameObject _hudPanel;

    [Header("Level Up")]
    [SerializeField] private GameObject _levelUpPanel;
    [SerializeField] private Transform _upgradeButtonContainer;
    [SerializeField] private GameObject _upgradeButtonPrefab;

    [Header("Game Over")]
    [SerializeField] private GameObject _gameOverPanel;
    [SerializeField] private Text _gameOverStatsText;
    [SerializeField] private Text _gameOverCoinsText;
    [SerializeField] private Transform _leaderboardContainer;
    [SerializeField] private GameObject _leaderboardEntryPrefab;

    [Header("Level Clear")]
    [SerializeField] private GameObject _levelClearPanel;
    [SerializeField] private Text _levelClearText;
    [SerializeField] private Button _nextLevelButton;

    [Header("All Clear")]
    [SerializeField] private GameObject _allClearPanel;
    [SerializeField] private Button _hardcoreButton;

    [Header("Boss")]
    [SerializeField] private GameObject _bossHPPanel;
    [SerializeField] private Slider _bossHPBar;
    [SerializeField] private Text _bossNameText;
    [SerializeField] private GameObject _bossWarningPanel;

    [Header("Pause")]
    [SerializeField] private GameObject _pausePanel;

    [Header("Rush Wave")]
    [SerializeField] private GameObject _rushWarningPanel;

    [Header("Skill Icons")]
    [SerializeField] private Transform _skillIconContainer;
    [SerializeField] private GameObject _skillIconPrefab;

    [Header("Mute")]
    [SerializeField] private Button _muteButton;
    [SerializeField] private Text _muteText;

    private System.Action<UpgradeOption> _onUpgradeSelected;
    private System.Action _onNextLevel;
    private System.Action _onHardcore;

    private void Start()
    {
        HideAll();
    }

    /// <summary>
    /// 更新所有 HUD 元素
    /// </summary>
    public void UpdateHUD(PlayerController player, float gameTime, int kills)
    {
        if (player == null) return;

        // HP
        if (_hpBar != null)
            _hpBar.value = player.CurrentHP / player.MaxHP;

        // XP
        if (_xpBar != null)
            _xpBar.value = (float)player.XP / player.XPNeeded;

        // 文字
        if (_levelText != null)
            _levelText.text = $"Lv.{player.Level}";

        if (_timerText != null)
            _timerText.text = FormatTime(gameTime);

        if (_killsText != null)
            _killsText.text = $"殺敵: {kills}";

        // Combo
        var combo = GameManager.Instance.ComboSystem;
        if (_comboText != null)
        {
            if (combo.GetCount() >= 5)
            {
                _comboText.gameObject.SetActive(true);
                _comboText.text = $"{combo.GetCount()} COMBO x{combo.GetMultiplier():F1}";
            }
            else
            {
                _comboText.gameObject.SetActive(false);
            }
        }
    }

    /// <summary>
    /// 顯示 HUD
    /// </summary>
    public void ShowHUD()
    {
        if (_hudPanel != null) _hudPanel.SetActive(true);
    }

    /// <summary>
    /// 顯示升級選單
    /// </summary>
    public void ShowLevelUp(List<UpgradeOption> choices, System.Action<UpgradeOption> callback)
    {
        _onUpgradeSelected = callback;
        _levelUpPanel.SetActive(true);

        // 清除舊按鈕
        foreach (Transform child in _upgradeButtonContainer)
        {
            Destroy(child.gameObject);
        }

        // 建立選項按鈕
        foreach (var choice in choices)
        {
            var btnGo = Instantiate(_upgradeButtonPrefab, _upgradeButtonContainer);
            var btn = btnGo.GetComponent<Button>();
            var text = btnGo.GetComponentInChildren<Text>();

            if (text != null)
            {
                text.text = $"{choice.Icon} {choice.Name}\n{choice.Description}";
            }

            var capturedChoice = choice;
            btn.onClick.AddListener(() => OnUpgradeClicked(capturedChoice));
        }
    }

    private void OnUpgradeClicked(UpgradeOption choice)
    {
        _onUpgradeSelected?.Invoke(choice);
    }

    /// <summary>
    /// 隱藏升級選單
    /// </summary>
    public void HideLevelUp()
    {
        if (_levelUpPanel != null) _levelUpPanel.SetActive(false);
    }

    /// <summary>
    /// 顯示遊戲結束畫面
    /// </summary>
    public void ShowGameOver(GameStats stats, List<LeaderboardEntry> leaderboard, int coins)
    {
        _gameOverPanel.SetActive(true);

        if (_gameOverStatsText != null)
        {
            _gameOverStatsText.text = $"等級: {stats.Level}\n擊殺: {stats.Kills}\n時間: {FormatTime(stats.Time)}\n分數: {stats.Score}";
        }

        if (_gameOverCoinsText != null)
        {
            _gameOverCoinsText.text = $"+{coins} 金幣";
        }

        // 排行榜
        if (_leaderboardContainer != null)
        {
            foreach (Transform child in _leaderboardContainer)
            {
                Destroy(child.gameObject);
            }

            for (int i = 0; i < leaderboard.Count; i++)
            {
                var entry = leaderboard[i];
                var entryGo = Instantiate(_leaderboardEntryPrefab, _leaderboardContainer);
                var text = entryGo.GetComponentInChildren<Text>();
                if (text != null)
                {
                    text.text = $"#{i + 1} 分數:{entry.Score} 殺:{entry.Kills} Lv{entry.Level} ({entry.Date})";
                }
            }
        }
    }

    /// <summary>
    /// 顯示過關畫面
    /// </summary>
    public void ShowLevelClear(int levelIndex, System.Action callback)
    {
        _onNextLevel = callback;
        _levelClearPanel.SetActive(true);

        if (_levelClearText != null)
        {
            _levelClearText.text = $"第 {levelIndex + 1} 關通過！";
        }

        if (_nextLevelButton != null)
        {
            _nextLevelButton.onClick.RemoveAllListeners();
            _nextLevelButton.onClick.AddListener(() =>
            {
                _levelClearPanel.SetActive(false);
                _onNextLevel?.Invoke();
            });
        }
    }

    /// <summary>
    /// 顯示全通關畫面
    /// </summary>
    public void ShowAllClear(System.Action onHardcore)
    {
        _onHardcore = onHardcore;
        _allClearPanel.SetActive(true);

        if (_hardcoreButton != null)
        {
            _hardcoreButton.onClick.RemoveAllListeners();
            _hardcoreButton.onClick.AddListener(() =>
            {
                _allClearPanel.SetActive(false);
                _onHardcore?.Invoke();
            });
        }
    }

    /// <summary>
    /// 顯示 Boss 血條
    /// </summary>
    public void ShowBossHP(BossController boss)
    {
        if (_bossHPPanel != null) _bossHPPanel.SetActive(true);
        if (_bossNameText != null) _bossNameText.text = boss.BossName;
        UpdateBossHP(boss);
    }

    public void UpdateBossHP(BossController boss)
    {
        if (_bossHPBar != null)
            _bossHPBar.value = boss.CurrentHP / boss.MaxHP;
    }

    public void HideBossHP()
    {
        if (_bossHPPanel != null) _bossHPPanel.SetActive(false);
    }

    /// <summary>
    /// Boss 警告
    /// </summary>
    public void ShowBossWarning()
    {
        if (_bossWarningPanel != null) _bossWarningPanel.SetActive(true);
    }

    public void HideBossWarning()
    {
        if (_bossWarningPanel != null) _bossWarningPanel.SetActive(false);
    }

    /// <summary>
    /// 暫停畫面
    /// </summary>
    public void ShowPause(bool show)
    {
        if (_pausePanel != null) _pausePanel.SetActive(show);
    }

    /// <summary>
    /// 衝刺波警告
    /// </summary>
    public void ShowRushWarning(bool show)
    {
        if (_rushWarningPanel != null) _rushWarningPanel.SetActive(show);
    }

    /// <summary>
    /// 設定關卡名稱
    /// </summary>
    public void SetLevelName(string name)
    {
        if (_levelNameText != null) _levelNameText.text = name;
    }

    /// <summary>
    /// 顯示閃避文字
    /// </summary>
    public void ShowDodgeText(Vector3 worldPos)
    {
        DamageNumberManager.Instance?.SpawnText(worldPos, "DODGE", Color.cyan);
    }

    /// <summary>
    /// 更新技能圖示
    /// </summary>
    public void UpdateSkillIcons(List<SkillInfo> skills)
    {
        if (_skillIconContainer == null) return;

        foreach (Transform child in _skillIconContainer)
        {
            Destroy(child.gameObject);
        }

        foreach (var skill in skills)
        {
            var iconGo = Instantiate(_skillIconPrefab, _skillIconContainer);
            var text = iconGo.GetComponentInChildren<Text>();
            if (text != null)
            {
                text.text = $"{skill.Icon}{skill.Level}";
            }
        }
    }

    /// <summary>
    /// 更新靜音圖示
    /// </summary>
    public void UpdateMute(bool enabled)
    {
        if (_muteText != null)
        {
            _muteText.text = enabled ? "🔊" : "🔇";
        }
    }

    private void HideAll()
    {
        if (_levelUpPanel != null) _levelUpPanel.SetActive(false);
        if (_gameOverPanel != null) _gameOverPanel.SetActive(false);
        if (_levelClearPanel != null) _levelClearPanel.SetActive(false);
        if (_allClearPanel != null) _allClearPanel.SetActive(false);
        if (_bossHPPanel != null) _bossHPPanel.SetActive(false);
        if (_bossWarningPanel != null) _bossWarningPanel.SetActive(false);
        if (_pausePanel != null) _pausePanel.SetActive(false);
        if (_rushWarningPanel != null) _rushWarningPanel.SetActive(false);
    }

    private string FormatTime(float t)
    {
        int min = (int)(t / 60f);
        int sec = (int)(t % 60f);
        return $"{min}:{sec:D2}";
    }
}
