/// <summary>
/// ComboSystem — 連殺系統
/// 對應原始架構: combo-system.js ComboSystem class
/// 追蹤連續擊殺並給予 XP 倍率加成
/// </summary>
public class ComboSystem
{
    private const float DECAY_TIME = 2f;  // 2 秒衰減

    private int _count;
    private float _timer;

    /// <summary>
    /// 增加連殺計數
    /// </summary>
    public void AddKill()
    {
        _count++;
        _timer = DECAY_TIME;
    }

    /// <summary>
    /// 更新衰減計時
    /// </summary>
    public void UpdateTimer(float dt)
    {
        if (_count == 0) return;

        _timer -= dt;
        if (_timer <= 0)
        {
            _count = 0;
        }
    }

    /// <summary>
    /// 取得當前 XP 倍率
    /// </summary>
    public float GetMultiplier()
    {
        if (_count >= 20) return 2.0f;
        if (_count >= 10) return 1.5f;
        return 1.0f;
    }

    /// <summary>
    /// 取得當前連殺數
    /// </summary>
    public int GetCount() => _count;

    /// <summary>
    /// 是否達到里程碑（用於 UI 閃爍）
    /// </summary>
    public bool IsMilestone()
    {
        return _count == 10 || _count == 20 || _count == 50;
    }
}
