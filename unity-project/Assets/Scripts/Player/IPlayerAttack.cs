/// <summary>
/// IPlayerAttack — 玩家攻擊介面
/// 所有角色攻擊系統（Mage/Archer/Knight/Valkyrie）實作此介面
/// </summary>
public interface IPlayerAttack
{
    /// <summary>
    /// 執行攻擊
    /// </summary>
    void Attack(PlayerController player);

    /// <summary>
    /// 升級攻擊
    /// </summary>
    void Upgrade();

    /// <summary>
    /// 取得當前等級
    /// </summary>
    int GetLevel();
}
