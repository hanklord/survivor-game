using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;

/// <summary>
/// CharacterSelectUI — 角色選擇介面
/// 對應原始架構: character-select.js CharacterSelect class
/// 
/// 顯示流程：標題圖 → 副標「選擇角色」→ 6 張角色卡片 (3×2 grid)
/// 每張卡片包含：角色頭像、名稱（彩色）、技能描述
/// 點擊卡片 → 關閉面板 → 回呼通知 GameBootstrap 啟動遊戲
/// 
/// 此腳本會在 Runtime 動態建立整個 UI（無需手動拖 prefab），
/// 只需將此 Component 掛在一個空 GameObject 上即可。
/// </summary>
public class CharacterSelectUI : MonoBehaviour
{
    [Header("Optional: 手動指定標題圖片")]
    [SerializeField] private Sprite _titleSprite;

    [Header("Optional: 手動指定背景圖片")]
    [SerializeField] private Sprite _backgroundSprite;

    // 角色資料（對應 HTML 版 CHARACTERS 陣列）
    private static readonly CharacterDisplayData[] CHARACTERS = new CharacterDisplayData[]
    {
        new CharacterDisplayData { type = CharacterType.Mage,      name = "法師",     desc = "火球魔法攻擊",   colorHex = "#ff6600" },
        new CharacterDisplayData { type = CharacterType.Archer,    name = "弓手",     desc = "弓箭擴散射擊",   colorHex = "#44cc44" },
        new CharacterDisplayData { type = CharacterType.Knight,    name = "黃金騎士", desc = "高防禦近戰攻擊", colorHex = "#ffcc00" },
        new CharacterDisplayData { type = CharacterType.Valkyrie,  name = "女武神",   desc = "長槍貫穿攻擊",   colorHex = "#ccddff" },
        new CharacterDisplayData { type = CharacterType.Boomerang, name = "迴力鏢手", desc = "迴力鏢迴旋攻擊", colorHex = "#ddaa44" },
        new CharacterDisplayData { type = CharacterType.Ninja,     name = "忍者",     desc = "手裏劍連射",     colorHex = "#6633aa" },
    };

    private Canvas _canvas;
    private GameObject _panel;
    private System.Action<CharacterType> _onSelected;
    private List<GameObject> _cards = new List<GameObject>();

    private void Awake()
    {
        // 確保有 Canvas
        _canvas = GetComponentInChildren<Canvas>();
        if (_canvas == null)
        {
            var canvasGO = new GameObject("CharacterSelectCanvas");
            canvasGO.transform.SetParent(transform);
            _canvas = canvasGO.AddComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _canvas.sortingOrder = 100;
            canvasGO.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasGO.GetComponent<CanvasScaler>().referenceResolution = new Vector2(1080, 1920);
            canvasGO.GetComponent<CanvasScaler>().matchWidthOrHeight = 0.5f;
            canvasGO.AddComponent<GraphicRaycaster>();
        }

        // 預設隱藏
        _canvas.gameObject.SetActive(false);
    }

    /// <summary>
    /// 顯示角色選擇畫面
    /// </summary>
    public void Show(System.Action<CharacterType> callback)
    {
        _onSelected = callback;

        // 嘗試自動載入標題圖片（如果未手動指定）
        if (_titleSprite == null)
        {
            _titleSprite = Resources.Load<Sprite>("UI/title");
        }

        BuildUI();
        _canvas.gameObject.SetActive(true);
        Time.timeScale = 1f;
    }

    /// <summary>
    /// 隱藏角色選擇畫面
    /// </summary>
    public void Hide()
    {
        _canvas.gameObject.SetActive(false);
    }

    // =========================================
    // UI 建構
    // =========================================

    private void BuildUI()
    {
        // 清除舊 UI
        if (_panel != null) Destroy(_panel);
        _cards.Clear();

        // 背景面板（全螢幕深色遮罩）
        _panel = CreatePanel("CharSelectPanel", _canvas.transform);
        var panelRect = _panel.GetComponent<RectTransform>();
        panelRect.anchorMin = Vector2.zero;
        panelRect.anchorMax = Vector2.one;
        panelRect.offsetMin = Vector2.zero;
        panelRect.offsetMax = Vector2.zero;

        var panelImg = _panel.AddComponent<Image>();
        panelImg.color = new Color(0.05f, 0.05f, 0.12f, 0.97f);

        // 背景圖（如果有指定）
        if (_backgroundSprite != null)
        {
            var bgGO = CreatePanel("BG", _panel.transform);
            var bgRect = bgGO.GetComponent<RectTransform>();
            bgRect.anchorMin = Vector2.zero;
            bgRect.anchorMax = Vector2.one;
            bgRect.offsetMin = Vector2.zero;
            bgRect.offsetMax = Vector2.zero;
            var bgImg = bgGO.AddComponent<Image>();
            bgImg.sprite = _backgroundSprite;
            bgImg.preserveAspect = true;
            bgImg.color = new Color(1, 1, 1, 0.3f);
        }

        // 垂直排列容器
        var content = CreatePanel("Content", _panel.transform);
        var contentRect = content.GetComponent<RectTransform>();
        contentRect.anchorMin = new Vector2(0.5f, 0.5f);
        contentRect.anchorMax = new Vector2(0.5f, 0.5f);
        contentRect.pivot = new Vector2(0.5f, 0.5f);
        contentRect.sizeDelta = new Vector2(700, 900);

        var vlg = content.AddComponent<VerticalLayoutGroup>();
        vlg.childAlignment = TextAnchor.UpperCenter;
        vlg.spacing = 20f;
        vlg.childForceExpandWidth = false;
        vlg.childForceExpandHeight = false;
        vlg.padding = new RectOffset(20, 20, 40, 20);

        // 1. 標題圖片
        if (_titleSprite != null)
        {
            var titleGO = CreatePanel("Title", content.transform);
            var titleImg = titleGO.AddComponent<Image>();
            titleImg.sprite = _titleSprite;
            titleImg.preserveAspect = true;
            var titleLE = titleGO.AddComponent<LayoutElement>();
            titleLE.preferredWidth = 320;
            titleLE.preferredHeight = 100;
        }
        else
        {
            // 文字標題 fallback
            var titleGO = CreateTextObj("TitleText", content.transform, "無盡的英雄", 36, Color.white);
            var titleLE = titleGO.AddComponent<LayoutElement>();
            titleLE.preferredHeight = 60;
        }

        // 2. 副標
        var subtitleGO = CreateTextObj("Subtitle", content.transform, "選擇角色", 22, new Color(0.7f, 0.7f, 0.7f));
        var subLE = subtitleGO.AddComponent<LayoutElement>();
        subLE.preferredHeight = 35;

        // 3. 角色卡片容器 (3×2 Grid)
        var gridGO = CreatePanel("CardGrid", content.transform);
        var gridLE = gridGO.AddComponent<LayoutElement>();
        gridLE.preferredWidth = 660;
        gridLE.preferredHeight = 560;

        var grid = gridGO.AddComponent<GridLayoutGroup>();
        grid.cellSize = new Vector2(200, 250);
        grid.spacing = new Vector2(15, 15);
        grid.childAlignment = TextAnchor.UpperCenter;
        grid.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
        grid.constraintCount = 3;

        // 4. 建立 6 張角色卡片
        for (int i = 0; i < CHARACTERS.Length; i++)
        {
            CreateCharacterCard(gridGO.transform, CHARACTERS[i]);
        }

        // 5. 版本號
        var verGO = CreateTextObj("Version", content.transform, GameConfig.GAME_VERSION, 12, new Color(1, 1, 1, 0.3f));
        var verLE = verGO.AddComponent<LayoutElement>();
        verLE.preferredHeight = 20;
    }

    // =========================================
    // 卡片建構
    // =========================================

    private void CreateCharacterCard(Transform parent, CharacterDisplayData data)
    {
        Color borderColor;
        ColorUtility.TryParseHtmlString(data.colorHex, out borderColor);

        // 卡片容器
        var card = CreatePanel($"Card_{data.type}", parent);
        var cardImg = card.AddComponent<Image>();
        cardImg.color = new Color(0.08f, 0.08f, 0.2f, 0.95f);

        // 圓角邊框效果（用 Outline）
        var outline = card.AddComponent<Outline>();
        outline.effectColor = borderColor;
        outline.effectDistance = new Vector2(2, 2);

        // 按鈕
        var btn = card.AddComponent<Button>();
        var colors = btn.colors;
        colors.normalColor = Color.white;
        colors.highlightedColor = new Color(1.2f, 1.2f, 1.2f);
        colors.pressedColor = new Color(0.8f, 0.8f, 0.8f);
        btn.colors = colors;

        var charType = data.type;
        btn.onClick.AddListener(() => OnCardClicked(charType));

        // 卡片內容 (垂直排列)
        var cardVLG = card.AddComponent<VerticalLayoutGroup>();
        cardVLG.childAlignment = TextAnchor.UpperCenter;
        cardVLG.spacing = 6f;
        cardVLG.padding = new RectOffset(10, 10, 15, 10);
        cardVLG.childForceExpandWidth = false;
        cardVLG.childForceExpandHeight = false;

        // 角色頭像
        var portraitGO = CreatePanel("Portrait", card.transform);
        var portraitImg = portraitGO.AddComponent<Image>();
        portraitImg.preserveAspect = true;
        portraitImg.color = Color.white;

        // 從 GameConfig 取得頭像
        Sprite portrait = GetPortraitForType(data.type);
        if (portrait != null)
        {
            portraitImg.sprite = portrait;
        }
        else
        {
            portraitImg.color = borderColor;
        }

        var portraitLE = portraitGO.AddComponent<LayoutElement>();
        portraitLE.preferredWidth = 80;
        portraitLE.preferredHeight = 80;

        // 角色名稱
        var nameGO = CreateTextObj("Name", card.transform, data.name, 18, borderColor);
        nameGO.GetComponent<Text>().fontStyle = FontStyle.Bold;
        var nameLE = nameGO.AddComponent<LayoutElement>();
        nameLE.preferredHeight = 28;

        // 技能描述
        var descGO = CreateTextObj("Desc", card.transform, data.desc, 13, new Color(0.7f, 0.7f, 0.7f));
        var descLE = descGO.AddComponent<LayoutElement>();
        descLE.preferredHeight = 22;

        _cards.Add(card);
    }

    private Sprite GetPortraitForType(CharacterType type)
    {
        if (GameManager.Instance == null || GameManager.Instance.gameConfig == null)
            return null;

        var characters = GameManager.Instance.gameConfig.characters;
        int index = (int)type;
        if (characters != null && index >= 0 && index < characters.Length)
        {
            return characters[index].portrait;
        }
        return null;
    }

    private void OnCardClicked(CharacterType type)
    {
        Hide();
        _onSelected?.Invoke(type);
    }

    // =========================================
    // UI 工廠方法
    // =========================================

    private GameObject CreatePanel(string name, Transform parent)
    {
        var go = new GameObject(name, typeof(RectTransform));
        go.transform.SetParent(parent, false);
        return go;
    }

    private GameObject CreateTextObj(string name, Transform parent, string text, int fontSize, Color color)
    {
        var go = new GameObject(name, typeof(RectTransform));
        go.transform.SetParent(parent, false);
        var txt = go.AddComponent<Text>();
        txt.text = text;
        txt.fontSize = fontSize;
        txt.color = color;
        txt.alignment = TextAnchor.MiddleCenter;
        // 嘗試多種字型（確保中文可顯示）
        txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        if (txt.font == null)
            txt.font = Font.CreateDynamicFontFromOSFont("Microsoft JhengHei", fontSize);
        if (txt.font == null)
            txt.font = Font.CreateDynamicFontFromOSFont("Arial Unicode MS", fontSize);
        if (txt.font == null)
            txt.font = Font.CreateDynamicFontFromOSFont("Arial", fontSize);
        txt.horizontalOverflow = HorizontalWrapMode.Overflow;
        return go;
    }

    // =========================================
    // 資料結構
    // =========================================

    private class CharacterDisplayData
    {
        public CharacterType type;
        public string name;
        public string desc;
        public string colorHex;
    }
}
