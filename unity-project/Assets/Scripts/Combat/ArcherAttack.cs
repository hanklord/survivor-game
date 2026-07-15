using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// ArcherAttack — 弓箭手扇形箭矢攻擊
/// 對應原始架構: archer-attack.js ArcherAttack class
/// 扇形多箭、火焰區域、爆炸箭、穿透箭
/// </summary>
public class ArcherAttack : MonoBehaviour, IPlayerAttack
{
    [Header("Base Stats")]
    [SerializeField] private float _baseCD = 0.67f;
    [SerializeField] private float _baseDamage = 12f;
    [SerializeField] private float _arrowSpeed = 10f;       // Unity units/s
    [SerializeField] private float _range = 8f;             // 射程
    [SerializeField] private float _spreadAngle = 8.6f;     // 度 (原 0.15 rad)

    [Header("Prefabs")]
    [SerializeField] private GameObject _arrowPrefab;
    [SerializeField] private GameObject _fireZonePrefab;

    // === 狀態 ===
    private int _level = 1;
    private int _arrowCount = 1;
    private float _currentCD;
    private float _timer;

    // 火焰區域 (Lv13+)
    private const int FIRE_ZONE_LEVEL = 13;
    private const float FIRE_ZONE_CHANCE = 0.3f;
    private const float FIRE_ZONE_DURATION = 2f;
    private const float FIRE_ZONE_DAMAGE_RATIO = 0.3f;

    private PlayerController _player;

    private void Start()
    {
        _currentCD = _baseCD;
    }

    public void Attack(PlayerController player)
    {
        _player = player;
        if (_timer > 0) return;

        _timer = _currentCD;
        FireArrows(player);
    }

    private void Update()
    {
        if (_timer > 0) _timer -= Time.deltaTime;
    }

    /// <summary>
    /// 發射扇形箭矢
    /// </summary>
    private void FireArrows(PlayerController player)
    {
        // 找最近敵人為目標
        Transform target = FindNearestEnemy();
        Vector2 baseDir;

        if (target != null)
        {
            baseDir = (target.position - transform.position).normalized;
        }
        else
        {
            baseDir = player.FacingLeft ? Vector2.left : Vector2.right;
        }

        float totalSpread = _spreadAngle * (_arrowCount - 1);
        float startAngle = -totalSpread / 2f;

        for (int i = 0; i < _arrowCount; i++)
        {
            float angle = startAngle + _spreadAngle * i;
            Vector2 dir = RotateVector(baseDir, angle);

            SpawnArrow(dir, player.GetTotalDamage() * (_baseDamage / 10f));
        }

        GameManager.Instance.AudioManager.PlaySFX(SFXType.ArrowShoot);
    }

    private void SpawnArrow(Vector2 direction, float damage)
    {
        var arrow = GameManager.Instance.PoolManager.GetProjectile();
        arrow.transform.position = transform.position;
        arrow.Initialize(direction * _arrowSpeed, damage, _range / _arrowSpeed);

        // Lv13+ 火焰區域
        if (_level >= FIRE_ZONE_LEVEL && Random.value < FIRE_ZONE_CHANCE)
        {
            arrow.OnHitCallback = (pos) => SpawnFireZone(pos, damage);
        }
    }

    private void SpawnFireZone(Vector3 position, float damage)
    {
        if (_fireZonePrefab == null) return;

        var zone = Instantiate(_fireZonePrefab, position, Quaternion.identity);
        var fz = zone.GetComponent<FireZone>();
        fz.Initialize(damage * FIRE_ZONE_DAMAGE_RATIO, FIRE_ZONE_DURATION);
    }

    private Transform FindNearestEnemy()
    {
        float minDist = float.MaxValue;
        Transform nearest = null;

        foreach (var enemy in GameManager.Instance.Enemies)
        {
            float dist = Vector2.Distance(transform.position, enemy.transform.position);
            if (dist < minDist && dist <= _range)
            {
                minDist = dist;
                nearest = enemy.transform;
            }
        }

        // 也搜尋 Boss
        foreach (var boss in GameManager.Instance.Bosses)
        {
            float dist = Vector2.Distance(transform.position, boss.transform.position);
            if (dist < minDist && dist <= _range)
            {
                minDist = dist;
                nearest = boss.transform;
            }
        }

        return nearest;
    }

    public void Upgrade()
    {
        _level++;
        // 奇數 = 數量++，偶數 = 攻速++
        if (_level % 2 == 1)
        {
            UpgradeCount();
        }
        else
        {
            UpgradeRate();
        }
    }

    /// <summary>
    /// 增加箭矢數量
    /// </summary>
    public void UpgradeCount()
    {
        _arrowCount = Mathf.Min(9, _arrowCount + 1);
    }

    /// <summary>
    /// 提升射擊頻率
    /// </summary>
    public void UpgradeRate()
    {
        _currentCD = Mathf.Max(0.2f, _currentCD * 0.88f);
    }

    public int GetLevel() => _level;

    private Vector2 RotateVector(Vector2 v, float degrees)
    {
        float rad = degrees * Mathf.Deg2Rad;
        float cos = Mathf.Cos(rad);
        float sin = Mathf.Sin(rad);
        return new Vector2(v.x * cos - v.y * sin, v.x * sin + v.y * cos);
    }
}
