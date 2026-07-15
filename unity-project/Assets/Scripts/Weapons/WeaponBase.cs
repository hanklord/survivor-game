using UnityEngine;

/// <summary>
/// WeaponBase — 武器基底類別
/// 所有附加武器繼承此類
/// </summary>
public abstract class WeaponBase : MonoBehaviour
{
    public bool IsActive { get; protected set; } = true;
    public int Level { get; protected set; } = 1;
    public int MaxLevel { get; protected set; } = 15;

    protected PlayerController _player;

    public virtual void Initialize(PlayerController player)
    {
        _player = player;
    }

    public abstract void UpdateWeapon(float dt, PlayerController player);
    public abstract void Upgrade();
    public virtual WeaponVisualData GetVisualData() => null;
}
