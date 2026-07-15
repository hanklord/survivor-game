using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// PassiveItems — 被動道具系統
/// 對應原始架構: passive-items.js PassiveItems class
/// 層疊式被動加成道具
/// </summary>
public class PassiveItems
{
    private const int MAX_STACKS = 5;

    private Dictionary<PassiveItemType, int> _stacks = new Dictionary<PassiveItemType, int>();

    private static readonly Dictionary<PassiveItemType, float> BONUS_PER_STACK = new Dictionary<PassiveItemType, float>
    {
        { PassiveItemType.PickupRange, 0.3f },   // +0.3 範圍/層
        { PassiveItemType.XPBonus,     0.15f },  // +15% XP/層
        { PassiveItemType.Armor,       2f },     // +2 護甲/層
        { PassiveItemType.MaxHP,       15f },    // +15 HP/層
    };

    private static readonly Dictionary<PassiveItemType, string> ITEM_NAMES = new Dictionary<PassiveItemType, string>
    {
        { PassiveItemType.PickupRange, "拾取範圍" },
        { PassiveItemType.XPBonus,     "經驗加成" },
        { PassiveItemType.Armor,       "護甲" },
        { PassiveItemType.MaxHP,       "最大生命" },
    };

    public PassiveItems()
    {
        foreach (PassiveItemType type in System.Enum.GetValues(typeof(PassiveItemType)))
        {
            _stacks[type] = 0;
        }
    }

    /// <summary>
    /// 新增一層被動道具
    /// </summary>
    public bool Add(PassiveItemType type)
    {
        if (_stacks[type] >= MAX_STACKS) return false;
        _stacks[type]++;
        return true;
    }

    /// <summary>
    /// 取得總加成值
    /// </summary>
    public float GetBonus(PassiveItemType type)
    {
        return _stacks[type] * BONUS_PER_STACK[type];
    }

    /// <summary>
    /// 取得每層加成值
    /// </summary>
    public float GetBonusPerStack(PassiveItemType type)
    {
        return BONUS_PER_STACK[type];
    }

    /// <summary>
    /// 取得當前層數
    /// </summary>
    public int GetStacks(PassiveItemType type) => _stacks[type];

    /// <summary>
    /// 是否已滿
    /// </summary>
    public bool IsMaxed(PassiveItemType type) => _stacks[type] >= MAX_STACKS;

    /// <summary>
    /// 取得可供選擇的道具列表
    /// </summary>
    public List<UpgradeOption> GetAvailableChoices()
    {
        var choices = new List<UpgradeOption>();
        foreach (var kvp in _stacks)
        {
            if (kvp.Value < MAX_STACKS)
            {
                choices.Add(new UpgradeOption
                {
                    Type = UpgradeType.PassiveItem,
                    PassiveItemType = kvp.Key,
                    Name = ITEM_NAMES[kvp.Key],
                    Description = $"{ITEM_NAMES[kvp.Key]} +{BONUS_PER_STACK[kvp.Key]}（{kvp.Value + 1}/{MAX_STACKS}）",
                    CurrentLevel = kvp.Value
                });
            }
        }
        return choices;
    }
}

public enum PassiveItemType
{
    PickupRange,
    XPBonus,
    Armor,
    MaxHP
}
