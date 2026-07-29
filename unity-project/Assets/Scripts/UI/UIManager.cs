using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;

/// <summary>
/// UIManager — 使用者介面管理器
/// 對應原始架構: ui.js UI class
/// 自動建構所有 UI 面板（無需手動在 Inspector 指定）
/// </summary>
public class UIManager : MonoBehaviour
{
    // === 自動建構的 UI 引用 ===
    private Canvas _canvas;
    private GameObject _hudPanel;
    private Slider _hpBar;
    private Slider _xpBar;
    private Text _levelText;
    private Text _timerText;
    private Text _killsText;
    private Text _levelNameText;
    private Text _comboText;

    private GameObject _levelUpPanel;
    private Transform _upgradeButtonContainer;

    private GameObject _gameOverPanel;
    private Text _gameOverStatsText;
    private Text _gameOverCoinsText;
    private Button _restartButton;

    private GameObject _levelClearPanel;
    private Text _levelClearText;
    private Button _nextLevelButton;

    private GameObject _allClearPanel;
    private Button _hardcoreButton;

    private GameObject _bossHPPanel;
    private Slider _bossHPBar;
    private Text _bossNameText;
    private GameObject _bossWarningPanel;

    private System.Action<UpgradeOption> _onUpgradeSelected;
    private System.Action _onNextLevel;
    private System.Action _onHardcore;

    private Font _font;

    private void Awake()
    {
        _font = Font.CreateDynamicFontFromOSFont("Microsoft JhengHei", 14);
        if (_font == null) _font = Font.CreateDynamicFontFromOSFont("Arial", 14);
        BuildCanvas();
        BuildHUD();
        BuildLevelUpPanel();
        BuildGameOverPanel();
        BuildLevelClearPanel();
        BuildAllClearPanel();
        BuildBossHPPanel();
        BuildBossWarningPanel();
        HideAll();
    }

    // =========================================================
    // BUILD CANVAS
    // =========================================================
    private void BuildCanvas()
    {
        var canvasGO = new GameObject("UICanvas");
        canvasGO.transform.SetParent(transform);
        _canvas = canvasGO.AddComponent<Canvas>();
        _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        _canvas.sortingOrder = 50;
        var scaler = canvasGO.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1080, 1920);
        scaler.matchWidthOrHeight = 0.5f;
        canvasGO.AddComponent<GraphicRaycaster>();
    }

    // =========================================================
    // BUILD HUD (top bar: HP, XP, Level, Timer, Kills)
    // =========================================================
    private void BuildHUD()
    {
        _hudPanel = CreatePanel("HUD", _canvas.transform, AnchorPreset.TopStretch, new Vector2(0, -120));
        var hlg = _hudPanel.AddComponent<HorizontalLayoutGroup>();
        hlg.childAlignment = TextAnchor.MiddleCenter;
        hlg.spacing = 20;
        hlg.padding = new RectOffset(30, 30, 10, 10);
        hlg.childForceExpandWidth = true;
        hlg.childForceExpandHeight = false;

        // HP Bar
        _hpBar = CreateSlider("HPBar", _hudPanel.transform, new Color(0.8f, 0.2f, 0.2f), 150);
        // XP Bar
        _xpBar = CreateSlider("XPBar", _hudPanel.transform, new Color(0.2f, 0.6f, 1f), 150);
        // Level
        _levelText = CreateText("LevelText", _hudPanel.transform, "Lv.1", 20, Color.white);
        // Timer
        _timerText = CreateText("TimerText", _hudPanel.transform, "0:00", 18, Color.white);
        // Kills
        _killsText = CreateText("KillsText", _hudPanel.transform, "殺敵: 0", 18, Color.white);
        // Level Name
        _levelNameText = CreateText("LevelName", _hudPanel.transform, "", 16, new Color(1, 0.9f, 0.5f));
        // Combo (hidden by default)
        _comboText = CreateText("ComboText", _hudPanel.transform, "", 22, Color.yellow);
        _comboText.gameObject.SetActive(false);
    }

    // =========================================================
    // BUILD LEVEL UP PANEL
    // =========================================================
    private void BuildLevelUpPanel()
    {
        _levelUpPanel = CreateFullscreenPanel("LevelUpPanel", new Color(0, 0, 0, 0.85f));
        var title = CreateText("Title", _levelUpPanel.transform, "升級！選擇強化", 28, Color.yellow);
        var titleRT = title.GetComponent<RectTransform>();
        titleRT.anchorMin = new Vector2(0.5f, 0.85f);
        titleRT.anchorMax = new Vector2(0.5f, 0.85f);
        titleRT.sizeDelta = new Vector2(400, 50);

        // Button container
        var containerGO = new GameObject("UpgradeButtons", typeof(RectTransform));
        containerGO.transform.SetParent(_levelUpPanel.transform, false);
        var crt = containerGO.GetComponent<RectTransform>();
        crt.anchorMin = new Vector2(0.1f, 0.2f);
        crt.anchorMax = new Vector2(0.9f, 0.8f);
        crt.offsetMin = Vector2.zero;
        crt.offsetMax = Vector2.zero;
        var vlg = containerGO.AddComponent<VerticalLayoutGroup>();
        vlg.spacing = 15;
        vlg.childAlignment = TextAnchor.MiddleCenter;
        vlg.childForceExpandHeight = false;
        vlg.childForceExpandWidth = true;
        vlg.padding = new RectOffset(20, 20, 20, 20);
        _upgradeButtonContainer = containerGO.transform;
    }

    // =========================================================
    // BUILD GAME OVER PANEL
    // =========================================================
    private void BuildGameOverPanel()
    {
        _gameOverPanel = CreateFullscreenPanel("GameOverPanel", new Color(0, 0, 0, 0.9f));
        var title = CreateText("GOTitle", _gameOverPanel.transform, "GAME OVER", 36, Color.red);
        var trt = title.GetComponent<RectTransform>();
        trt.anchorMin = new Vector2(0.5f, 0.75f);
        trt.anchorMax = new Vector2(0.5f, 0.75f);
        trt.sizeDelta = new Vector2(400, 60);

        _gameOverStatsText = CreateText("GOStats", _gameOverPanel.transform, "", 20, Color.white);
        var srt = _gameOverStatsText.GetComponent<RectTransform>();
        srt.anchorMin = new Vector2(0.5f, 0.5f);
        srt.anchorMax = new Vector2(0.5f, 0.5f);
        srt.sizeDelta = new Vector2(400, 200);

        _gameOverCoinsText = CreateText("GOCoins", _gameOverPanel.transform, "", 22, Color.yellow);
        var crt = _gameOverCoinsText.GetComponent<RectTransform>();
        crt.anchorMin = new Vector2(0.5f, 0.35f);
        crt.anchorMax = new Vector2(0.5f, 0.35f);
        crt.sizeDelta = new Vector2(300, 40);

        _restartButton = CreateButton("RestartBtn", _gameOverPanel.transform, "重新開始",
            new Vector2(0.5f, 0.15f), new Vector2(250, 60));
        _restartButton.onClick.AddListener(() =>
        {
            _gameOverPanel.SetActive(false);
            UnityEngine.SceneManagement.SceneManager.LoadScene(
                UnityEngine.SceneManagement.SceneManager.GetActiveScene().buildIndex);
        });
    }

    // =========================================================
    // BUILD LEVEL CLEAR PANEL
    // =========================================================
    private void BuildLevelClearPanel()
    {
        _levelClearPanel = CreateFullscreenPanel("LevelClearPanel", new Color(0, 0.1f, 0, 0.85f));
        _levelClearText = CreateText("ClearText", _levelClearPanel.transform, "通關！", 32, Color.green);
        var trt = _levelClearText.GetComponent<RectTransform>();
        trt.anchorMin = new Vector2(0.5f, 0.6f);
        trt.anchorMax = new Vector2(0.5f, 0.6f);
        trt.sizeDelta = new Vector2(400, 60);

        _nextLevelButton = CreateButton("NextBtn", _levelClearPanel.transform, "下一關",
            new Vector2(0.5f, 0.35f), new Vector2(250, 60));
    }

    // =========================================================
    // BUILD ALL CLEAR PANEL
    // =========================================================
    private void BuildAllClearPanel()
    {
        _allClearPanel = CreateFullscreenPanel("AllClearPanel", new Color(0.1f, 0, 0.1f, 0.9f));
        CreateText("AllClearTitle", _allClearPanel.transform, "全通關！", 36, Color.magenta)
            .GetComponent<RectTransform>().anchorMin = new Vector2(0.5f, 0.65f);
        _hardcoreButton = CreateButton("HardcoreBtn", _allClearPanel.transform, "困難模式",
            new Vector2(0.5f, 0.35f), new Vector2(250, 60));
    }

    // =========================================================
    // BUILD BOSS HP PANEL
    // =========================================================
    private void BuildBossHPPanel()
    {
        var go = new GameObject("BossHPPanel", typeof(RectTransform));
        go.transform.SetParent(_canvas.transform, false);
        var rt = go.GetComponent<RectTransform>();
        rt.anchorMin = new Vector2(0.15f, 0.92f);
        rt.anchorMax = new Vector2(0.85f, 0.96f);
        rt.offsetMin = Vector2.zero;
        rt.offsetMax = Vector2.zero;
        go.AddComponent<Image>().color = new Color(0.2f, 0, 0, 0.6f);
        _bossHPPanel = go;

        _bossHPBar = CreateSliderSimple("BossHP", go.transform, Color.red);
        _bossNameText = CreateText("BossName", go.transform, "", 16, Color.white);
        var nrt = _bossNameText.GetComponent<RectTransform>();
        nrt.anchorMin = Vector2.zero; nrt.anchorMax = Vector2.one;
        nrt.offsetMin = Vector2.zero; nrt.offsetMax = Vector2.zero;
    }

    private void BuildBossWarningPanel()
    {
        var go = new GameObject("BossWarning", typeof(RectTransform));
        go.transform.SetParent(_canvas.transform, false);
        var rt = go.GetComponent<RectTransform>();
        rt.anchorMin = new Vector2(0.2f, 0.4f);
        rt.anchorMax = new Vector2(0.8f, 0.6f);
        rt.offsetMin = Vector2.zero; rt.offsetMax = Vector2.zero;
        var txt = CreateText("WarnText", go.transform, "⚠ BOSS 來了！", 30, Color.red);
        txt.GetComponent<RectTransform>().anchorMin = Vector2.zero;
        txt.GetComponent<RectTransform>().anchorMax = Vector2.one;
        _bossWarningPanel = go;
    }

    // =========================================================
    // PUBLIC API
    // =========================================================

    public void ShowHUD()
    {
        if (_hudPanel != null) _hudPanel.SetActive(true);
    }

    public void UpdateHUD(PlayerController player, float gameTime, int kills)
    {
        if (player == null) return;
        if (_hpBar != null) _hpBar.value = player.CurrentHP / player.MaxHP;
        if (_xpBar != null) _xpBar.value = (float)player.XP / player.XPNeeded;
        if (_levelText != null) _levelText.text = $"Lv.{player.Level}";
        if (_timerText != null) _timerText.text = FormatTime(gameTime);
        if (_killsText != null) _killsText.text = $"殺敵: {kills}";

        if (_comboText != null && GameManager.Instance != null)
        {
            var combo = GameManager.Instance.ComboSystem;
            if (combo != null && combo.GetCount() >= 5)
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

    public void ShowLevelUp(List<UpgradeOption> choices, System.Action<UpgradeOption> callback)
    {
        _onUpgradeSelected = callback;
        if (_levelUpPanel == null || choices == null || choices.Count == 0)
        {
            if (choices != null && choices.Count > 0) callback?.Invoke(choices[0]);
            return;
        }

        _levelUpPanel.SetActive(true);
        Time.timeScale = 0f;

        // 清除舊按鈕
        foreach (Transform child in _upgradeButtonContainer)
            Destroy(child.gameObject);

        // 建立選項按鈕
        foreach (var choice in choices)
        {
            var btn = CreateUpgradeButton(choice);
            btn.transform.SetParent(_upgradeButtonContainer, false);
        }
    }

    private GameObject CreateUpgradeButton(UpgradeOption choice)
    {
        var go = new GameObject("UpgradeBtn", typeof(RectTransform));
        var rt = go.GetComponent<RectTransform>();
        rt.sizeDelta = new Vector2(500, 80);
        var img = go.AddComponent<Image>();
        img.color = new Color(0.15f, 0.15f, 0.3f, 0.95f);

        var btn = go.AddComponent<Button>();
        var colors = btn.colors;
        colors.highlightedColor = new Color(0.3f, 0.3f, 0.5f);
        btn.colors = colors;

        var outline = go.AddComponent<Outline>();
        outline.effectColor = new Color(0.5f, 0.8f, 1f);
        outline.effectDistance = new Vector2(1, 1);

        var txt = CreateText("Text", go.transform, $"{choice.Icon} {choice.Name}\n<size=14>{choice.Description}</size>", 18, Color.white);
        var trt = txt.GetComponent<RectTransform>();
        trt.anchorMin = Vector2.zero; trt.anchorMax = Vector2.one;
        trt.offsetMin = new Vector2(15, 5); trt.offsetMax = new Vector2(-15, -5);
        txt.alignment = TextAnchor.MiddleLeft;

        var capturedChoice = choice;
        btn.onClick.AddListener(() =>
        {
            _levelUpPanel.SetActive(false);
            Time.timeScale = 1f;
            _onUpgradeSelected?.Invoke(capturedChoice);
        });

        var le = go.AddComponent<LayoutElement>();
        le.preferredHeight = 80;
        return go;
    }

    public void HideLevelUp()
    {
        if (_levelUpPanel != null) _levelUpPanel.SetActive(false);
        Time.timeScale = 1f;
    }

    public void ShowGameOver(GameStats stats, List<LeaderboardEntry> leaderboard, int coins)
    {
        if (_gameOverPanel == null) return;
        _gameOverPanel.SetActive(true);
        Time.timeScale = 0f;
        if (_gameOverStatsText != null)
            _gameOverStatsText.text = $"等級: {stats.Level}\n擊殺: {stats.Kills}\n時間: {FormatTime(stats.Time)}";
        if (_gameOverCoinsText != null)
            _gameOverCoinsText.text = $"+{coins} 金幣";
    }

    public void ShowLevelClear(int levelIndex, System.Action callback)
    {
        _onNextLevel = callback;
        if (_levelClearPanel == null) { callback?.Invoke(); return; }
        _levelClearPanel.SetActive(true);
        Time.timeScale = 0f;
        if (_levelClearText != null) _levelClearText.text = $"第 {levelIndex + 1} 關通過！";
        if (_nextLevelButton != null)
        {
            _nextLevelButton.onClick.RemoveAllListeners();
            _nextLevelButton.onClick.AddListener(() =>
            {
                _levelClearPanel.SetActive(false);
                Time.timeScale = 1f;
                _onNextLevel?.Invoke();
            });
        }
    }

    public void ShowAllClear(System.Action onHardcore)
    {
        _onHardcore = onHardcore;
        if (_allClearPanel == null) { onHardcore?.Invoke(); return; }
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

    public void ShowBossHP(BossController boss)
    {
        if (_bossHPPanel != null) _bossHPPanel.SetActive(true);
        if (_bossNameText != null) _bossNameText.text = boss.BossName;
        UpdateBossHP(boss);
    }

    public void UpdateBossHP(BossController boss)
    {
        if (_bossHPBar != null) _bossHPBar.value = boss.CurrentHP / boss.MaxHP;
    }

    public void HideBossHP()
    {
        if (_bossHPPanel != null) _bossHPPanel.SetActive(false);
    }

    public void ShowBossWarning()
    {
        if (_bossWarningPanel != null) _bossWarningPanel.SetActive(true);
    }

    public void HideBossWarning()
    {
        if (_bossWarningPanel != null) _bossWarningPanel.SetActive(false);
    }

    public void ShowPause(bool show) { }
    public void ShowRushWarning(bool show) { }
    public void SetLevelName(string name)
    {
        if (_levelNameText != null) _levelNameText.text = name;
    }

    public void ShowDodgeText(Vector3 worldPos)
    {
        if (DamageNumberManager.Instance != null)
            DamageNumberManager.Instance.SpawnText(worldPos, "DODGE", Color.cyan);
    }

    public void UpdateSkillIcons(List<SkillInfo> skills) { }
    public void UpdateMute(bool enabled) { }

    // =========================================================
    // HIDE ALL
    // =========================================================
    private void HideAll()
    {
        if (_levelUpPanel != null) _levelUpPanel.SetActive(false);
        if (_gameOverPanel != null) _gameOverPanel.SetActive(false);
        if (_levelClearPanel != null) _levelClearPanel.SetActive(false);
        if (_allClearPanel != null) _allClearPanel.SetActive(false);
        if (_bossHPPanel != null) _bossHPPanel.SetActive(false);
        if (_bossWarningPanel != null) _bossWarningPanel.SetActive(false);
    }

    // =========================================================
    // UI FACTORY HELPERS
    // =========================================================
    private enum AnchorPreset { TopStretch }

    private GameObject CreatePanel(string name, Transform parent, AnchorPreset preset, Vector2 offset)
    {
        var go = new GameObject(name, typeof(RectTransform));
        go.transform.SetParent(parent, false);
        var rt = go.GetComponent<RectTransform>();
        // Top stretch
        rt.anchorMin = new Vector2(0, 1);
        rt.anchorMax = new Vector2(1, 1);
        rt.pivot = new Vector2(0.5f, 1);
        rt.sizeDelta = new Vector2(0, 60);
        rt.anchoredPosition = offset;
        go.AddComponent<Image>().color = new Color(0, 0, 0, 0.4f);
        return go;
    }

    private GameObject CreateFullscreenPanel(string name, Color bgColor)
    {
        var go = new GameObject(name, typeof(RectTransform));
        go.transform.SetParent(_canvas.transform, false);
        var rt = go.GetComponent<RectTransform>();
        rt.anchorMin = Vector2.zero;
        rt.anchorMax = Vector2.one;
        rt.offsetMin = Vector2.zero;
        rt.offsetMax = Vector2.zero;
        go.AddComponent<Image>().color = bgColor;
        return go;
    }

    private Text CreateText(string name, Transform parent, string content, int size, Color color)
    {
        var go = new GameObject(name, typeof(RectTransform));
        go.transform.SetParent(parent, false);
        var txt = go.AddComponent<Text>();
        txt.text = content;
        txt.fontSize = size;
        txt.color = color;
        txt.font = _font;
        txt.alignment = TextAnchor.MiddleCenter;
        txt.horizontalOverflow = HorizontalWrapMode.Overflow;
        txt.verticalOverflow = VerticalWrapMode.Overflow;
        txt.raycastTarget = false;
        var le = go.AddComponent<LayoutElement>();
        le.preferredHeight = size + 10;
        return txt;
    }

    private Slider CreateSlider(string name, Transform parent, Color fillColor, float width)
    {
        var go = new GameObject(name, typeof(RectTransform));
        go.transform.SetParent(parent, false);
        var le = go.AddComponent<LayoutElement>();
        le.preferredWidth = width;
        le.preferredHeight = 20;

        // Background
        var bgGO = new GameObject("BG", typeof(RectTransform));
        bgGO.transform.SetParent(go.transform, false);
        var bgRT = bgGO.GetComponent<RectTransform>();
        bgRT.anchorMin = Vector2.zero; bgRT.anchorMax = Vector2.one;
        bgRT.offsetMin = Vector2.zero; bgRT.offsetMax = Vector2.zero;
        bgGO.AddComponent<Image>().color = new Color(0.2f, 0.2f, 0.2f, 0.8f);

        // Fill
        var fillArea = new GameObject("FillArea", typeof(RectTransform));
        fillArea.transform.SetParent(go.transform, false);
        var faRT = fillArea.GetComponent<RectTransform>();
        faRT.anchorMin = Vector2.zero; faRT.anchorMax = Vector2.one;
        faRT.offsetMin = Vector2.zero; faRT.offsetMax = Vector2.zero;

        var fillGO = new GameObject("Fill", typeof(RectTransform));
        fillGO.transform.SetParent(fillArea.transform, false);
        var fRT = fillGO.GetComponent<RectTransform>();
        fRT.anchorMin = Vector2.zero; fRT.anchorMax = Vector2.one;
        fRT.offsetMin = Vector2.zero; fRT.offsetMax = Vector2.zero;
        fillGO.AddComponent<Image>().color = fillColor;

        var slider = go.AddComponent<Slider>();
        slider.fillRect = fRT;
        slider.interactable = false;
        slider.transition = Selectable.Transition.None;
        return slider;
    }

    private Slider CreateSliderSimple(string name, Transform parent, Color color)
    {
        return CreateSlider(name, parent, color, 0);
    }

    private Button CreateButton(string name, Transform parent, string label, Vector2 anchor, Vector2 size)
    {
        var go = new GameObject(name, typeof(RectTransform));
        go.transform.SetParent(parent, false);
        var rt = go.GetComponent<RectTransform>();
        rt.anchorMin = anchor; rt.anchorMax = anchor;
        rt.sizeDelta = size;
        go.AddComponent<Image>().color = new Color(0.2f, 0.4f, 0.6f);
        var btn = go.AddComponent<Button>();

        var txt = CreateText("BtnText", go.transform, label, 20, Color.white);
        var trt = txt.GetComponent<RectTransform>();
        trt.anchorMin = Vector2.zero; trt.anchorMax = Vector2.one;
        trt.offsetMin = Vector2.zero; trt.offsetMax = Vector2.zero;

        return btn;
    }

    private string FormatTime(float t)
    {
        int min = (int)(t / 60f);
        int sec = (int)(t % 60f);
        return $"{min}:{sec:D2}";
    }
}
