using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;

/// <summary>
/// MetaShopUI — 永久升級商店 UI
/// 對應原始架構: meta-progression.js 商店介面
/// </summary>
public class MetaShopUI : MonoBehaviour
{
    [SerializeField] private GameObject _panel;
    [SerializeField] private Text _coinsText;
    [SerializeField] private Transform _upgradeContainer;
    [SerializeField] private GameObject _upgradeItemPrefab;
    [SerializeField] private Button _startButton;

    private MetaProgression _meta;
    private System.Action _onStart;

    public void Show(MetaProgression meta, System.Action onStart)
    {
        _meta = meta;
        _onStart = onStart;
        _panel.SetActive(true);

        _startButton.onClick.RemoveAllListeners();
        _startButton.onClick.AddListener(() =>
        {
            _panel.SetActive(false);
            _onStart?.Invoke();
        });

        Refresh();
    }

    private void Refresh()
    {
        if (_coinsText != null)
            _coinsText.text = $"💰 {_meta.GetCoins()}";

        // 清除舊項目
        foreach (Transform child in _upgradeContainer)
        {
            Destroy(child.gameObject);
        }

        // 建立升級項目
        var upgrades = _meta.GetAllUpgradeInfo();
        foreach (var info in upgrades)
        {
            var itemGo = Instantiate(_upgradeItemPrefab, _upgradeContainer);
            var texts = itemGo.GetComponentsInChildren<Text>();
            var btn = itemGo.GetComponent<Button>();

            if (texts.Length >= 2)
            {
                texts[0].text = $"{info.Definition.Name} (Lv{info.CurrentLevel}/{info.Definition.MaxLevel})";
                texts[1].text = info.IsMaxed ? "MAX" : $"費用: {info.Cost}";
            }

            if (btn != null)
            {
                btn.interactable = info.CanAfford && !info.IsMaxed;
                var capturedId = info.Definition.Id;
                btn.onClick.AddListener(() =>
                {
                    _meta.Purchase(capturedId);
                    Refresh();
                });
            }
        }
    }
}
