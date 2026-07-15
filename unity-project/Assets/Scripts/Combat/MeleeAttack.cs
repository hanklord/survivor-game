using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// MeleeAttack — 騎士近戰弧形攻擊
/// 對應原始架構: melee-attack.js MeleeAttack class
/// 200° 扇形弧線攻擊，含背斬與擊退
/// </summary>
public class MeleeAttack : MonoBehaviour, IPlayerAttack
{
    [Header("Base Stats")]
    [SerializeField] private float _baseRange = 3.2f;      // 原 160px
    [SerializeField] private float _baseDamage = 15f;
    [SerializeField] private float _baseCD = 0.6f;
    [SerializeField] private float _hitboxDuration = 0.25f;
    [SerializeField] private float _arcDegrees = 200f;
    [SerializeField] private float _knockback = 2f;

    [Header("Visual")]
    [SerializeField] private GameObject _slashEffectPrefab;

    // === 狀態 ===
    private int _level = 1;
    private float _currentRange;
    private float _currentCD;
    private float _currentDamage;
    private float _timer;
    private bool _isAttacking;
    private float _hitboxTimer;
    private float _attackAngle;
    private HashSet<int> _hitEnemies = new HashSet<int>();

    // 背斬機制 (Lv13+)
    private const int BACK_SLASH_LEVEL = 13;
    private const float BACK_SLASH_CHANCE = 0.1f;

    private PlayerController _player;

    private void Start()
    {
        _currentRange = _baseRange;
        _currentCD = _baseCD;
        _currentDamage = _baseDamage;
    }

    public void Attack(PlayerController player)
    {
        _player = player;
        if (_timer > 0) return;

        _timer = _currentCD;
        _isAttacking = true;
        _hitboxTimer = _hitboxDuration;
        _hitEnemies.Clear();

        // 攻擊方向
        _attackAngle = player.FacingLeft ? 180f : 0f;

        // 背斬判定 (Lv13+)
        if (_level >= BACK_SLASH_LEVEL && Random.value < BACK_SLASH_CHANCE)
        {
            _attackAngle += 180f;
        }

        // 生成斬擊特效
        SpawnSlashEffect(player.FacingLeft);
    }

    private void Update()
    {
        if (_timer > 0) _timer -= Time.deltaTime;

        if (_isAttacking)
        {
            _hitboxTimer -= Time.deltaTime;
            CheckHits();

            if (_hitboxTimer <= 0)
            {
                _isAttacking = false;
            }
        }
    }

    /// <summary>
    /// 檢查弧形範圍內的敵人碰撞
    /// </summary>
    private void CheckHits()
    {
        var hits = Physics2D.OverlapCircleAll(transform.position, _currentRange, LayerMask.GetMask("Enemy"));

        foreach (var hit in hits)
        {
            var enemy = hit.GetComponent<EnemyBase>();
            if (enemy == null) continue;
            if (_hitEnemies.Contains(enemy.EntityID)) continue;

            // 角度判定
            Vector2 dir = (hit.transform.position - transform.position).normalized;
            float angle = Mathf.Atan2(dir.y, dir.x) * Mathf.Rad2Deg;
            float diff = Mathf.DeltaAngle(_attackAngle, angle);

            if (Mathf.Abs(diff) <= _arcDegrees / 2f)
            {
                _hitEnemies.Add(enemy.EntityID);

                float totalDamage = _currentDamage * _player.DamageMultiplier;
                enemy.TakeDamage(totalDamage);

                // 擊退
                Vector2 knockDir = dir;
                enemy.ApplyKnockback(knockDir * _knockback);

                // 傷害數字
                DamageNumberManager.Instance.Spawn(enemy.transform.position, totalDamage);
            }
        }
    }

    private void SpawnSlashEffect(bool facingLeft = true)
    {
        if (_slashEffectPrefab == null) return;

        var effect = Instantiate(_slashEffectPrefab, transform.position, Quaternion.Euler(0, 0, _attackAngle));
        var tempLocalScale = Vector3.one * (_currentRange / _baseRange);
        effect.transform.parent = transform;
        effect.transform.localScale = tempLocalScale;
        effect.transform.localPosition = facingLeft ? new Vector3(-0.5f, 0, 0) :  new Vector3(0.5f, 0, 0);
        effect.GetComponent<SpriteAnimatorController>()?.SetState(AnimState.Attack);
        effect.GetComponent<SpriteAnimatorController>()?.SetFlipY(facingLeft);
        Destroy(effect, _hitboxDuration + 0.1f);
    }

    public void Upgrade()
    {
        _level++;
        // 奇數升級 = 範圍，偶數 = 攻速
        if (_level % 2 == 1)
        {
            UpgradeRange();
        }
        else
        {
            UpgradeRate();
        }
    }

    /// <summary>
    /// 提升攻擊速度
    /// </summary>
    public void UpgradeRate()
    {
        _currentCD = Mathf.Max(0.2f, _currentCD * 0.9f);
    }

    /// <summary>
    /// 增加攻擊範圍
    /// </summary>
    public void UpgradeRange()
    {
        _currentRange += 0.3f;
    }

    public int GetLevel() => _level;

    private void OnDrawGizmosSelected()
    {
        if (!GameConfig.DEBUG_SHOW_HITBOX) return;

        Gizmos.color = new Color(0.5f, 0, 1, 0.3f);
        Gizmos.DrawWireSphere(transform.position, _currentRange);
    }
}
