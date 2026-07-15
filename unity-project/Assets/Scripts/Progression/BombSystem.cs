using System.Collections.Generic;

/// <summary>
/// BombSystem — 大招/炸彈系統
/// 對應原始架構: bomb-system.js BombSystem class
/// 累積擊殺充能，滿後可全螢幕清場
/// </summary>
public class BombSystem
{
    private const int KILLS_TO_CHARGE = 30;
    private const float RECHARGE_CD = 120f;

    private float _charge;        // 0 ~ 1
    private bool _ready;

    /// <summary>
    /// 增加充能值
    /// </summary>
    public void AddCharge(int kills)
    {
        if (_ready) return;

        _charge += (float)kills / KILLS_TO_CHARGE;
        if (_charge >= 1f)
        {
            _charge = 1f;
            _ready = true;
        }
    }

    /// <summary>
    /// 是否可施放
    /// </summary>
    public bool IsReady() => _ready;

    /// <summary>
    /// 取得充能百分比
    /// </summary>
    public float GetChargePercent() => _charge;

    /// <summary>
    /// 全螢幕清場，回傳擊殺列表
    /// </summary>
    public List<EnemyBase> Activate(List<EnemyBase> enemies)
    {
        if (!_ready) return new List<EnemyBase>();

        var killed = new List<EnemyBase>(enemies);
        foreach (var enemy in killed)
        {
            enemy.TakeDamage(float.MaxValue);
        }

        _charge = 0f;
        _ready = false;
        return killed;
    }
}
