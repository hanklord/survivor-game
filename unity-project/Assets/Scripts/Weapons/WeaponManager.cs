using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// WeaponManager — 武器系統管理器
/// 對應原始架構: weapons.js WeaponManager class
/// 管理所有附加武器（護盾/Nova/飛彈/雷擊/鏈電）的更新與升級
/// </summary>
public class WeaponManager : MonoBehaviour
{
    private Dictionary<WeaponType, WeaponBase> _weapons = new Dictionary<WeaponType, WeaponBase>();
    private PlayerController _player;

    private void Start()
    {
        _player = GetComponent<PlayerController>();
    }

    private void Update()
    {
        foreach (var weapon in _weapons.Values)
        {
            if (weapon.IsActive)
            {
                weapon.UpdateWeapon(Time.deltaTime, _player);
            }
        }
    }

    /// <summary>
    /// 新增武器
    /// </summary>
    public void AddWeapon(WeaponType type)
    {
        if (_weapons.ContainsKey(type))
        {
            UpgradeWeapon(type);
            return;
        }

        WeaponBase weapon = null;
        switch (type)
        {
            case WeaponType.OrbitingShield:
                weapon = gameObject.AddComponent<OrbitingShield>();
                break;
            case WeaponType.Nova:
                weapon = gameObject.AddComponent<Nova>();
                break;
            case WeaponType.HomingMissile:
                weapon = gameObject.AddComponent<MissileLauncher>();
                break;
            case WeaponType.Thunder:
                weapon = gameObject.AddComponent<Thunder>();
                break;
            case WeaponType.ChainLightning:
                weapon = gameObject.AddComponent<ChainLightning>();
                break;
        }

        if (weapon != null)
        {
            weapon.Initialize(_player);
            _weapons[type] = weapon;
        }
    }

    /// <summary>
    /// 升級指定武器
    /// </summary>
    public void UpgradeWeapon(WeaponType type)
    {
        if (_weapons.TryGetValue(type, out var weapon))
        {
            weapon.Upgrade();
        }
        else
        {
            AddWeapon(type);
        }
    }

    /// <summary>
    /// 取得所有武器視覺資料
    /// </summary>
    public List<WeaponVisualData> GetVisuals()
    {
        var visuals = new List<WeaponVisualData>();
        foreach (var weapon in _weapons.Values)
        {
            var v = weapon.GetVisualData();
            if (v != null) visuals.Add(v);
        }
        return visuals;
    }

    public bool HasWeapon(WeaponType type) => _weapons.ContainsKey(type);
    public int GetWeaponLevel(WeaponType type) => _weapons.ContainsKey(type) ? _weapons[type].Level : 0;
}

// === 列舉 ===

public enum WeaponType
{
    OrbitingShield,
    Nova,
    HomingMissile,
    Thunder,
    ChainLightning
}

// === 武器視覺資料 ===

public class WeaponVisualData
{
    public WeaponType Type;
    public Vector3[] Positions;
    public float Radius;
    public float Alpha;
}
