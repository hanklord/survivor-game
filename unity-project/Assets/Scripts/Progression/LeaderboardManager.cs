using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// LeaderboardManager — 本地排行榜
/// 對應原始架構: leaderboard.js Leaderboard class
/// 使用 PlayerPrefs 儲存 Top 10
/// </summary>
public class LeaderboardManager
{
    private const string STORAGE_KEY = "sg_leaderboard";
    private const int MAX_ENTRIES = 10;

    private List<LeaderboardEntry> _entries = new List<LeaderboardEntry>();

    public LeaderboardManager()
    {
        Load();
    }

    /// <summary>
    /// 新增一筆紀錄
    /// 計分公式: kills × level + survival_time
    /// </summary>
    public void AddEntry(GameStats stats)
    {
        var entry = new LeaderboardEntry
        {
            Score = stats.Score,
            Kills = stats.Kills,
            Level = stats.Level,
            Time = stats.Time,
            Date = System.DateTime.Now.ToString("yyyy-MM-dd")
        };

        _entries.Add(entry);
        _entries.Sort((a, b) => b.Score.CompareTo(a.Score));

        if (_entries.Count > MAX_ENTRIES)
        {
            _entries.RemoveRange(MAX_ENTRIES, _entries.Count - MAX_ENTRIES);
        }

        Save();
    }

    /// <summary>
    /// 取得前 n 名
    /// </summary>
    public List<LeaderboardEntry> GetTop(int n)
    {
        int count = Mathf.Min(n, _entries.Count);
        return _entries.GetRange(0, count);
    }

    /// <summary>
    /// 清空排行榜
    /// </summary>
    public void Clear()
    {
        _entries.Clear();
        Save();
    }

    private void Save()
    {
        var data = new LeaderboardData { entries = _entries.ToArray() };
        string json = JsonUtility.ToJson(data);
        PlayerPrefs.SetString(STORAGE_KEY, json);
        PlayerPrefs.Save();
    }

    private void Load()
    {
        string json = PlayerPrefs.GetString(STORAGE_KEY, "");
        if (!string.IsNullOrEmpty(json))
        {
            var data = JsonUtility.FromJson<LeaderboardData>(json);
            if (data != null && data.entries != null)
            {
                _entries = new List<LeaderboardEntry>(data.entries);
            }
        }
    }
}

[System.Serializable]
public class LeaderboardEntry
{
    public int Score;
    public int Kills;
    public int Level;
    public float Time;
    public string Date;
}

[System.Serializable]
public class LeaderboardData
{
    public LeaderboardEntry[] entries;
}
