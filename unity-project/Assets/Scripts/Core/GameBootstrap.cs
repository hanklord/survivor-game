using UnityEngine;

/// <summary>
/// GameBootstrap — 遊戲啟動流程控制
/// 管理啟動順序：MetaShop → 角色選擇 → InitGame
/// 掛載於場景中，遊戲啟動時自動執行
/// </summary>
public class GameBootstrap : MonoBehaviour
{
    [Header("UI References")]
    [SerializeField] private CharacterSelectUI _characterSelectUI;
    [SerializeField] private MetaShopUI _metaShopUI;

    [Header("Settings")]
    [SerializeField] private bool _skipMetaShop = true;  // 開發時跳過商店
    [SerializeField] private bool _skipCharacterSelect = false;
    [SerializeField] private CharacterType _defaultCharacter = CharacterType.Mage;

    private void Start()
    {
        Debug.Log("[EndlessHeroes] Game starting...");

        // 確保 GameManager 已就位
        if (GameManager.Instance == null)
        {
            Debug.LogError("[EndlessHeroes] GameManager not found in scene!");
            return;
        }

        // 確保 GameConfig 已指定
        if (GameManager.Instance.gameConfig == null)
        {
            Debug.LogWarning("[EndlessHeroes] GameConfig not assigned! Using quick-start with defaults.");
            QuickStart();
            return;
        }

        // 正常啟動流程
        StartGameFlow();
    }

    private void StartGameFlow()
    {
        if (_skipMetaShop)
        {
            ShowCharacterSelect();
        }
        else if (_metaShopUI != null)
        {
            _metaShopUI.Show(GameManager.Instance.MetaProgression, ShowCharacterSelect);
        }
        else
        {
            ShowCharacterSelect();
        }
    }

    private void ShowCharacterSelect()
    {
        if (_skipCharacterSelect)
        {
            OnCharacterSelected(_defaultCharacter);
            return;
        }

        // 如果沒有手動指定 CharacterSelectUI，自動建立一個
        if (_characterSelectUI == null)
        {
            _characterSelectUI = FindObjectOfType<CharacterSelectUI>();
        }
        if (_characterSelectUI == null)
        {
            var go = new GameObject("CharacterSelectUI");
            _characterSelectUI = go.AddComponent<CharacterSelectUI>();
            Debug.Log("[EndlessHeroes] Auto-created CharacterSelectUI");
        }

        _characterSelectUI.Show(OnCharacterSelected);
    }

    private void OnCharacterSelected(CharacterType type)
    {
        Debug.Log("[EndlessHeroes] Character selected: " + type);
        GameManager.Instance.InitGame(type);
    }

    /// <summary>
    /// 快速啟動（無 GameConfig 時的簡易模式）
    /// 仍然顯示角色選擇
    /// </summary>
    private void QuickStart()
    {
        Debug.Log("[EndlessHeroes] GameConfig not assigned, showing character select with defaults.");
        ShowCharacterSelect();
    }
}
