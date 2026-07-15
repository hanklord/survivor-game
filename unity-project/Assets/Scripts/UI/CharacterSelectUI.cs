using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// CharacterSelectUI — 角色選擇介面
/// 對應原始架構: character-select.js CharacterSelect class
/// 自動搜尋子物件按鈕，點選後回呼 GameBootstrap
/// </summary>
public class CharacterSelectUI : MonoBehaviour
{
    [Header("UI - Auto-linked by name")]
    [SerializeField] private GameObject _panel;
    [SerializeField] private Button _mageButton;
    [SerializeField] private Button _archerButton;
    [SerializeField] private Button _knightButton;
    [SerializeField] private Button _valkyrieButton;
    [SerializeField] private Text _descriptionText;

    private System.Action<CharacterType> _onSelected;

    private void Awake()
    {
        // 自動搜尋按鈕（如果未手動指定）
        if (_panel == null) _panel = gameObject;
        if (_mageButton == null) _mageButton = FindButtonInChildren("MageButton");
        if (_archerButton == null) _archerButton = FindButtonInChildren("ArcherButton");
        if (_knightButton == null) _knightButton = FindButtonInChildren("KnightButton");
        if (_valkyrieButton == null) _valkyrieButton = FindButtonInChildren("ValkyrieButton");
        if (_descriptionText == null)
        {
            var descGO = FindDeep(transform, "Description");
            if (descGO != null) _descriptionText = descGO.GetComponent<Text>();
        }

        // 預設隱藏（等待 Show() 呼叫）
        _panel.SetActive(false);
    }

    /// <summary>
    /// 顯示角色選擇畫面
    /// </summary>
    public void Show(System.Action<CharacterType> callback)
    {
        _onSelected = callback;
        _panel.SetActive(true);
        Time.timeScale = 1f; // 確保未暫停

        // 綁定按鈕事件
        BindButton(_mageButton, CharacterType.Mage);
        BindButton(_archerButton, CharacterType.Archer);
        BindButton(_knightButton, CharacterType.Knight);
        BindButton(_valkyrieButton, CharacterType.Valkyrie);
    }

    private void BindButton(Button btn, CharacterType type)
    {
        if (btn == null) return;
        btn.onClick.RemoveAllListeners();
        btn.onClick.AddListener(() => SelectCharacter(type));
    }

    private void SelectCharacter(CharacterType type)
    {
        _panel.SetActive(false);
        _onSelected?.Invoke(type);
    }

    private Button FindButtonInChildren(string name)
    {
        var t = FindDeep(transform, name);
        return t != null ? t.GetComponent<Button>() : null;
    }

    private Transform FindDeep(Transform parent, string name)
    {
        if (parent.name == name) return parent;
        foreach (Transform child in parent)
        {
            var result = FindDeep(child, name);
            if (result != null) return result;
        }
        return null;
    }
}
