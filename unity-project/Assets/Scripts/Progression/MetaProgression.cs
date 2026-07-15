using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// MetaProgression — 永久升級系統
/// 對應原始架構: meta-progression.js MetaProgression class
/// 跨遊戲的永久加成，存檔於 PlayerPrefs
/// </summary>
public class MetaProgression
{
    private const string COINS_KEY = "meta_coins";
    private const string UPGRADE_PREFIX = "meta_upgrade_";

    // 升級定義
    public static readonly MetaUpgradeDefinition[] UPGRADES = new MetaUpgradeDefinition[]
    {
        new MetaUpgradeDefinition { Id = "attack",     Name = "攻擊力",   MaxLevel = 20, BaseCost = 10, BonusPerLevel = 0.02f },
        new MetaUpgradeDefinition { Id = "hp",         Name = "生命值",   MaxLevel = 20, BaseCost = 10, BonusPerLevel = 5f },
        new MetaUpgradeDefinition { Id = "speed",      Name = "移動速度", MaxLevel = 20, BaseCost = 10, BonusPerLevel = 0.01f },
        new MetaUpgradeDefinition { Id = "startLevel", Name = "起始等級", MaxLevel = 5,  BaseCost = 50, BonusPerLevel = 1f },
    };

    private int _coins;
    private Dictionary<string, int> _upgradeLevels = new Dictionary<string, int>();

    public MetaProgression()
    {
        Load();
    }

    /// <summary>
    /// 取得當前金幣
    /// </summary>
    public int GetCoins() => _coins;

    /// <summary>
    /// 增加金幣
    /// </summary>
    public void AddCoins(int amount)
    {
        _coins += amount;
        Save();
    }

    /// <summary>
    /// 購買升級
    /// </summary>
    public bool Purchase(string upgradeId)
    {
        var def = GetDefinition(upgradeId);
        if (def == null) return false;

        int level = GetUpgradeLevel(upgradeId);
        if (level >= def.MaxLevel) return false;

        int cost = GetCost(upgradeId);
        if (_coins < cost) return false;

        _coins -= cost;
        _upgradeLevels[upgradeId] = level + 1;
        Save();
        return true;
    }

    /// <summary>
    /// 取得升級等級
    /// </summary>
    public int GetUpgradeLevel(string upgradeId)
    {
        return _upgradeLevels.ContainsKey(upgradeId) ? _upgradeLevels[upgradeId] : 0;
    }

    /// <summary>
    /// 取得升級費用
    /// </summary>
    public int GetCost(string upgradeId)
    {
        var def = GetDefinition(upgradeId);
        if (def == null) return int.MaxValue;
        int level = GetUpgradeLevel(upgradeId);
        return def.BaseCost * (level + 1);
    }

    /// <summary>
    /// 計算遊戲結束獎勵金幣
    /// kills × 0.5 + time × 0.1
    /// </summary>
    public int CalculateReward(int kills, float time)
    {
        return Mathf.RoundToInt(kills * 0.5f + time * 0.1f);
    }

    /// <summary>
    /// 套用永久加成到玩家
    /// </summary>
    public void ApplyBonuses(PlayerController player)
    {
        // 攻擊力
        int attackLv = GetUpgradeLevel("attack");
        if (attackLv > 0)
        {
            float mult = 1f + attackLv * 0.02f;
            player.SetDamageMultiplier(mult);
        }

        // 生命值
        int hpLv = GetUpgradeLevel("hp");
        if (hpLv > 0)
        {
            player.IncreaseMaxHP(hpLv * 5f);
        }

        // 移動速度
        int speedLv = GetUpgradeLevel("speed");
        if (speedLv > 0)
        {
            player.SetSpeed(player.BaseSpeed * (1f + speedLv * 0.01f));
        }

        // 起始等級
        int startLv = GetUpgradeLevel("startLevel");
        for (int i = 0; i < startLv; i++)
        {
            player.AddXP(player.XPNeeded); // 觸發升級
        }
    }

    /// <summary>
    /// 取得所有升級資訊（供 UI 顯示）
    /// </summary>
    public List<MetaUpgradeInfo> GetAllUpgradeInfo()
    {
        var list = new List<MetaUpgradeInfo>();
        foreach (var def in UPGRADES)
        {
            list.Add(new MetaUpgradeInfo
            {
                Definition = def,
                CurrentLevel = GetUpgradeLevel(def.Id),
                Cost = GetCost(def.Id),
                CanAfford = _coins >= GetCost(def.Id),
                IsMaxed = GetUpgradeLevel(def.Id) >= def.MaxLevel
            });
        }
        return list;
    }

    private MetaUpgradeDefinition GetDefinition(string id)
    {
        foreach (var def in UPGRADES)
        {
            if (def.Id == id) return def;
        }
        return null;
    }

    private void Save()
    {
        PlayerPrefs.SetInt(COINS_KEY, _coins);
        foreach (var kvp in _upgradeLevels)
        {
            PlayerPrefs.SetInt(UPGRADE_PREFIX + kvp.Key, kvp.Value);
        }
        PlayerPrefs.Save();
    }

    private void Load()
    {
        _coins = PlayerPrefs.GetInt(COINS_KEY, 0);
        foreach (var def in UPGRADES)
        {
            _upgradeLevels[def.Id] = PlayerPrefs.GetInt(UPGRADE_PREFIX + def.Id, 0);
        }
    }
}

// === 資料結構 ===

public class MetaUpgradeDefinition
{
    public string Id;
    public string Name;
    public int MaxLevel;
    public int BaseCost;
    public float BonusPerLevel;
}

public class MetaUpgradeInfo
{
    public MetaUpgradeDefinition Definition;
    public int CurrentLevel;
    public int Cost;
    public bool CanAfford;
    public bool IsMaxed;
}
