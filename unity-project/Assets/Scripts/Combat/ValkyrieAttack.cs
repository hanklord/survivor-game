using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// ValkyrieAttack — 女武神長槍突刺攻擊
/// 對應原始架構: valkyrie-attack.js ValkyrieAttack class
/// 窄線性突刺、衝擊波擊退、雙突刺
/// </summary>
public class ValkyrieAttack : MonoBehaviour, IPlayerAttack
{
    [Header("Base Stats")]
    [SerializeField] private float _baseRange = 2.4f;       // 原 120px
    [SerializeField] private float _baseDamage = 20f;
    [SerializeField] private float _baseCD = 0.8f;
    [SerializeField] private float _thrustWidth = 0.66f;    // 原 33px
    [SerializeField] private float _knockbackRadius = 1.6f; // 原 80px

    [Header("Visual")]
    [SerializeField] private GameObject _thrustEffectPrefab;
    [SerializeField] private GameObject _shockwaveEffectPrefab;

    // === 狀態 ===
    private int _level = 1;
    private float _currentRange;
    private float _currentCD;
    private float _timer;
    private PlayerController _player;

    // 衝擊波 (Lv5+)
    private const int KNOCKBACK_LEVEL = 5;
    private const float KNOCKBACK_DAMAGE_RATIO = 0.25f;

    // 雙突刺 (Lv15+)
    private const int DUAL_THRUST_LEVEL = 15;
    private const int MAX_LEVEL = 20;

    private void Start()
    {
        _currentRange = _baseRange;
        _currentCD = _baseCD;
    }

    public void Attack(PlayerController player)
    {
        _player = player;
        if (_timer > 0) return;

        _timer = _currentCD;

        // 主突刺方向
        float angle = player.FacingLeft ? 180f : 0f;
        PerformThrust(angle);

        // Lv15+ 雙突刺（隨機角度）
        if (_level >= DUAL_THRUST_LEVEL)
        {
            float randomAngle = angle + Random.Range(-45f, 45f);
            PerformThrust(randomAngle);
        }

        // Lv5+ 衝擊波擊退
        if (_level >= KNOCKBACK_LEVEL)
        {
            PerformShockwave();
        }
    }

    private void Update()
    {
        if (_timer > 0) _timer -= Time.deltaTime;
    }

    /// <summary>
    /// 執行單次突刺判定
    /// </summary>
    private void PerformThrust(float angleDeg)
    {
        Vector2 dir = new Vector2(
            Mathf.Cos(angleDeg * Mathf.Deg2Rad),
            Mathf.Sin(angleDeg * Mathf.Deg2Rad)
        );

        // 使用 BoxCast 模擬窄長矩形判定
        Vector2 origin = (Vector2)transform.position;
        Vector2 boxSize = new Vector2(_currentRange, _thrustWidth);

        var hits = Physics2D.BoxCastAll(
            origin + dir * (_currentRange / 2f),
            boxSize,
            angleDeg,
            Vector2.zero,
            0f,
            LayerMask.GetMask("Enemy")
        );

        float totalDamage = _baseDamage * _player.DamageMultiplier;

        foreach (var hit in hits)
        {
            var enemy = hit.collider.GetComponent<EnemyBase>();
            if (enemy != null)
            {
                enemy.TakeDamage(totalDamage);
                enemy.ApplyKnockback(dir * 3f);
                DamageNumberManager.Instance.Spawn(enemy.transform.position, totalDamage);
            }

            var boss = hit.collider.GetComponent<BossController>();
            if (boss != null)
            {
                boss.TakeDamage(totalDamage);
                DamageNumberManager.Instance.Spawn(boss.transform.position, totalDamage);
            }
        }

        // 突刺視覺
        SpawnThrustEffect(dir, angleDeg);
    }

    /// <summary>
    /// 衝擊波：以玩家為中心的範圍擊退
    /// </summary>
    private void PerformShockwave()
    {
        var hits = Physics2D.OverlapCircleAll(transform.position, _knockbackRadius, LayerMask.GetMask("Enemy"));
        float shockDamage = _baseDamage * KNOCKBACK_DAMAGE_RATIO * _player.DamageMultiplier;

        foreach (var hit in hits)
        {
            var enemy = hit.GetComponent<EnemyBase>();
            if (enemy != null)
            {
                Vector2 pushDir = (hit.transform.position - transform.position).normalized;
                enemy.ApplyKnockback(pushDir * 4f);
                enemy.TakeDamage(shockDamage);
            }
        }

        // 衝擊波視覺
        if (_shockwaveEffectPrefab != null)
        {
            var effect = Instantiate(_shockwaveEffectPrefab, transform.position, Quaternion.identity);
            Destroy(effect, 0.5f);
        }
    }

    private void SpawnThrustEffect(Vector2 dir, float angle)
    {
        if (_thrustEffectPrefab == null) return;

        Vector3 pos = transform.position + (Vector3)(dir * _currentRange * 0.5f);
        var effect = Instantiate(_thrustEffectPrefab, pos, Quaternion.Euler(0, 0, angle));
        effect.transform.localScale = new Vector3(_currentRange / _baseRange, 1f, 1f);
        Destroy(effect, 0.3f);
    }

    public void Upgrade()
    {
        if (_level >= MAX_LEVEL) return;
        _level++;

        // 奇數 = 範圍，偶數 = 攻速
        if (_level % 2 == 1)
        {
            UpgradeRange();
        }
        else
        {
            UpgradeRate();
        }
    }

    public void UpgradeRange()
    {
        _currentRange += 0.2f;
    }

    public void UpgradeRate()
    {
        _currentCD = Mathf.Max(0.3f, _currentCD * 0.9f);
    }

    public int GetLevel() => _level;
}
