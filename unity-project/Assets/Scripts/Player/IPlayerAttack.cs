using UnityEngine;

/// <summary>
/// IPlayerAttack — 攻擊介面
/// 所有角色攻擊類別實作此介面
/// </summary>
public interface IPlayerAttack
{
    /// <summary>
    /// 執行攻擊
    /// </summary>
    /// <param name="direction">攻擊方向</param>
    void Attack(Vector2 direction);

    /// <summary>
    /// 升級攻擊能力
    /// </summary>
    void OnLevelUp(int level);
}
