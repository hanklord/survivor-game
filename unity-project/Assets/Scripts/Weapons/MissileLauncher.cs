using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// MissileLauncher — 追蹤飛彈發射器
/// 對應原始架構: weapons.js MissileLauncher / HomingMissile class
/// 發射追蹤飛彈，命中時 AOE 爆炸
/// </summary>
public class MissileLauncher : WeaponBase
{
    private const float BASE_CD = 2f;
    private const float MISSILE_SPEED = 4.8f;    // 原 240px/s
    private const float BASE_DAMAGE = 20f;
    private const float AOE_RADIUS = 1f;         // 原 50px
    private const float AOE_DAMAGE = 10f;
    private const float MISSILE_LIFETIME = 4f;
    private const float TURN_RATE = 3f;          // rad/s

    private float _cd;
    private float _timer;
    private float _damage;
    private List<HomingMissileInstance> _missiles = new List<HomingMissileInstance>();

    [SerializeField] private GameObject _missilePrefab;
    [SerializeField] private GameObject _explosionPrefab;

    public override void Initialize(PlayerController player)
    {
        base.Initialize(player);
        _cd = BASE_CD;
        _damage = BASE_DAMAGE;
        _timer = _cd;
        MaxLevel = 15;
    }

    public override void UpdateWeapon(float dt, PlayerController player)
    {
        _timer -= dt;

        if (_timer <= 0)
        {
            LaunchMissile(player);
            _timer = _cd;
        }

        // 更新所有飛彈
        for (int i = _missiles.Count - 1; i >= 0; i--)
        {
            if (!_missiles[i].IsActive)
            {
                _missiles.RemoveAt(i);
            }
        }
    }

    private void LaunchMissile(PlayerController player)
    {
        // 找最近敵人
        Transform target = FindNearestEnemy(player.transform.position);
        if (target == null) return;

        if (_missilePrefab != null)
        {
            var go = Instantiate(_missilePrefab, player.transform.position, Quaternion.identity);
            var missile = go.GetComponent<HomingMissileInstance>();
            if (missile != null)
            {
                missile.Initialize(target, MISSILE_SPEED, _damage * player.DamageMultiplier,
                    AOE_RADIUS, AOE_DAMAGE * player.DamageMultiplier, MISSILE_LIFETIME, TURN_RATE,
                    _explosionPrefab);
                _missiles.Add(missile);
            }
        }
    }

    private Transform FindNearestEnemy(Vector3 from)
    {
        float minDist = float.MaxValue;
        Transform nearest = null;

        foreach (var enemy in GameManager.Instance.Enemies)
        {
            float dist = Vector2.Distance(from, enemy.transform.position);
            if (dist < minDist)
            {
                minDist = dist;
                nearest = enemy.transform;
            }
        }
        foreach (var boss in GameManager.Instance.Bosses)
        {
            float dist = Vector2.Distance(from, boss.transform.position);
            if (dist < minDist)
            {
                minDist = dist;
                nearest = boss.transform;
            }
        }
        return nearest;
    }

    public override void Upgrade()
    {
        if (Level >= MaxLevel) return;
        Level++;
        _damage += 5f;
        _cd = Mathf.Max(0.8f, _cd * 0.9f);
    }
}
