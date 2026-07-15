/// <summary>
/// UpgradeOption — 升級選項資料結構
/// 用於升級選單 UI 顯示
/// </summary>
public class UpgradeOption
{
    public UpgradeType Type;
    public SkillType SkillType;
    public WeaponType WeaponType;
    public PassiveItemType PassiveItemType;
    public string Name;
    public string Icon;
    public string Description;
    public int CurrentLevel;
}

public enum UpgradeType
{
    Skill,
    Weapon,
    PassiveItem,
    CharacterAttack
}
