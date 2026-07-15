using UnityEngine;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// SkillTree — 被動技能樹系統
/// 對應原始架構: skill-tree.js SkillTree class
/// 10 種被動技能，每種最高 15 級
/// </summary>
public class SkillTree
{
    private const int MAX_LEVEL = 15;

    private Dictionary<SkillType, int> _levels = new Dictionary<SkillType, int>();

    // 每級加成值
    private static readonly Dictionary<SkillType, float> BONUS_PER_LEVEL = new Dictionary<SkillType, float>
    {
        { SkillType.Speed,   0.05f },  // +5% 速度/級
        { SkillType.Pickup,  0.2f },   // +0.2 範圍/級
        { SkillType.Armor,   1f },     // +1 護甲/級
        { SkillType.XPBonus, 0.1f },   // +10% XP/級
        { SkillType.Crit,    0.03f },  // +3% 暴擊/級
        { SkillType.Regen,   1f },     // +1 HP/秒/級
        { SkillType.Reflect, 0.05f },  // +5% 反射機率/級
        { SkillType.Dodge,   0.03f },  // +3% 閃避/級
        { SkillType.MaxHP,   10f },    // +10 HP/級
        { SkillType.Damage,  0.05f },  // +5% 傷害/級
    };

    private static readonly Dictionary<SkillType, string> SKILL_NAMES = new Dictionary<SkillType, string>
    {
        { SkillType.Speed,   "移動速度" },
        { SkillType.Pickup,  "拾取範圍" },
        { SkillType.Armor,   "護甲" },
        { SkillType.XPBonus, "經驗加成" },
        { SkillType.Crit,    "暴擊率" },
        { SkillType.Regen,   "生命回復" },
        { SkillType.Reflect, "傷害反射" },
        { SkillType.Dodge,   "閃避" },
        { SkillType.MaxHP,   "最大生命" },
        { SkillType.Damage,  "傷害提升" },
    };

    private static readonly Dictionary<SkillType, string> SKILL_ICONS = new Dictionary<SkillType, string>
    {
        { SkillType.Speed,   "👟" },
        { SkillType.Pickup,  "🧲" },
        { SkillType.Armor,   "🛡️" },
        { SkillType.XPBonus, "⭐" },
        { SkillType.Crit,    "💥" },
        { SkillType.Regen,   "💚" },
        { SkillType.Reflect, "🪞" },
        { SkillType.Dodge,   "💨" },
        { SkillType.MaxHP,   "❤️" },
        { SkillType.Damage,  "⚔️" },
    };

    public SkillTree()
    {
        foreach (SkillType type in System.Enum.GetValues(typeof(SkillType)))
        {
            _levels[type] = 0;
        }
    }

    /// <summary>
    /// 隨機取得 n 個可選升級選項
    /// </summary>
    public List<UpgradeOption> GetRandomChoices(int count)
    {
        var available = new List<SkillType>();
        foreach (var kvp in _levels)
        {
            if (kvp.Value < MAX_LEVEL)
            {
                available.Add(kvp.Key);
            }
        }

        // 打亂順序
        for (int i = available.Count - 1; i > 0; i--)
        {
            int j = Random.Range(0, i + 1);
            var temp = available[i];
            available[i] = available[j];
            available[j] = temp;
        }

        var choices = new List<UpgradeOption>();
        for (int i = 0; i < Mathf.Min(count, available.Count); i++)
        {
            var type = available[i];
            choices.Add(new UpgradeOption
            {
                Type = UpgradeType.Skill,
                SkillType = type,
                Name = SKILL_NAMES[type],
                Icon = SKILL_ICONS[type],
                Description = GetUpgradeDescription(type),
                CurrentLevel = _levels[type]
            });
        }

        return choices;
    }

    /// <summary>
    /// 升級指定技能
    /// </summary>
    public void Upgrade(SkillType type)
    {
        if (_levels[type] < MAX_LEVEL)
        {
            _levels[type]++;
        }
    }

    /// <summary>
    /// 取得技能等級
    /// </summary>
    public int GetLevel(SkillType type) => _levels[type];

    /// <summary>
    /// 取得技能總加成值
    /// </summary>
    public float GetBonus(SkillType type)
    {
        return _levels[type] * BONUS_PER_LEVEL[type];
    }

    /// <summary>
    /// 取得每級加成值
    /// </summary>
    public float GetBonusPerLevel(SkillType type)
    {
        return BONUS_PER_LEVEL[type];
    }

    /// <summary>
    /// 取得所有已啟動的技能
    /// </summary>
    public List<SkillInfo> GetActiveSkills()
    {
        var active = new List<SkillInfo>();
        foreach (var kvp in _levels)
        {
            if (kvp.Value > 0)
            {
                active.Add(new SkillInfo
                {
                    Type = kvp.Key,
                    Level = kvp.Value,
                    Icon = SKILL_ICONS[kvp.Key],
                    Name = SKILL_NAMES[kvp.Key]
                });
            }
        }
        return active;
    }

    private string GetUpgradeDescription(SkillType type)
    {
        int nextLevel = _levels[type] + 1;
        float bonus = BONUS_PER_LEVEL[type];

        switch (type)
        {
            case SkillType.Speed: return $"移動速度 +{bonus * 100}%（Lv{nextLevel}）";
            case SkillType.Pickup: return $"拾取範圍 +{bonus}（Lv{nextLevel}）";
            case SkillType.Armor: return $"護甲 +{bonus}（Lv{nextLevel}）";
            case SkillType.XPBonus: return $"經驗值 +{bonus * 100}%（Lv{nextLevel}）";
            case SkillType.Crit: return $"暴擊率 +{bonus * 100}%（Lv{nextLevel}）";
            case SkillType.Regen: return $"每秒回復 +{bonus} HP（Lv{nextLevel}）";
            case SkillType.Reflect: return $"反射機率 +{bonus * 100}%（Lv{nextLevel}）";
            case SkillType.Dodge: return $"閃避率 +{bonus * 100}%（Lv{nextLevel}）";
            case SkillType.MaxHP: return $"最大 HP +{bonus}（Lv{nextLevel}）";
            case SkillType.Damage: return $"傷害 +{bonus * 100}%（Lv{nextLevel}）";
            default: return "";
        }
    }
}

// === 列舉與資料結構 ===

public enum SkillType
{
    Speed,
    Pickup,
    Armor,
    XPBonus,
    Crit,
    Regen,
    Reflect,
    Dodge,
    MaxHP,
    Damage
}

public class SkillInfo
{
    public SkillType Type;
    public int Level;
    public string Icon;
    public string Name;
}
