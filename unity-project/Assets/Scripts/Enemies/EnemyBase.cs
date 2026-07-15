using UnityEngine;

/// <summary>
/// EnemyBase — 敵人基底類別
/// 對應原始架構: enemy.js Enemy class
/// 管理生命值、移動、碰撞傷害
/// </summary>
[RequireComponent(typeof(Rigidbody2D))]
[RequireComponent(typeof(Collider2D))]
public class EnemyBase : MonoBehaviour
{
    [Header("Stats")]
    public float MaxHP;
    public float CurrentHP;
    public float Speed;
    public float ContactDamage;
    public float Size;
    public Color DeathColor;
    public int XPValue = 1;
    public int EntityID { get; private set; }

    protected Rigidbody2D _rb;
    protected Transform _target;
    protected SpriteAnimatorController _animator;
    private float _knockbackTimer;
    private Vector2 _knockbackVelocity;

    private static int _nextId = 0;

    protected virtual void Awake()
    {
        _rb = GetComponent<Rigidbody2D>();
        _rb.gravityScale = 0f;
        _rb.freezeRotation = true;
        _animator = GetComponent<SpriteAnimatorController>();
        EntityID = _nextId++;
    }

    /// <summary>
    /// 初始化敵人（生成時呼叫）
    /// </summary>
    public virtual void Initialize(EnemyConfig config, float hpMultiplier = 1f)
    {
        MaxHP = config.hp * hpMultiplier;
        CurrentHP = MaxHP;
        Speed = config.speed;
        ContactDamage = config.damage;
        Size = config.size;
        DeathColor = config.color;
        XPValue = config.xpValue;

        transform.localScale = Vector3.one * Size;
        _target = GameManager.Instance.Player.transform;
    }

    protected virtual void Update()
    {
        if (GameManager.Instance.IsGameOver || GameManager.Instance.IsPaused) return;

        if (_knockbackTimer > 0)
        {
            _knockbackTimer -= Time.deltaTime;
            return;
        }

        MoveTowardTarget();
        UpdateAnimation();
    }

    /// <summary>
    /// 朝目標移動
    /// </summary>
    protected virtual void MoveTowardTarget()
    {
        if (_target == null) return;

        Vector2 dir = (_target.position - transform.position).normalized;
        _rb.velocity = dir * Speed;

        // 翻轉面向
        if (_animator != null)
        {
            _animator.SetFlipX(_target.position.x < transform.position.x);
        }
    }

    protected virtual void UpdateAnimation()
    {
        if (_animator != null)
        {
            _animator.SetState(AnimState.Run);
        }
    }

    /// <summary>
    /// 受傷
    /// </summary>
    public virtual void TakeDamage(float damage)
    {
        // 暴擊判定
        bool isCrit = Random.value < 0.1f;
        if (isCrit) damage *= 1.5f;

        CurrentHP -= damage;
        DamageNumberManager.Instance?.Spawn(transform.position, damage, isCrit);

        if (CurrentHP <= 0)
        {
            Die();
        }
    }

    /// <summary>
    /// 施加擊退
    /// </summary>
    public void ApplyKnockback(Vector2 force)
    {
        _knockbackTimer = 0.15f;
        _rb.velocity = force;
    }

    protected virtual void Die()
    {
        GameManager.Instance.HandleKill(this);
        gameObject.SetActive(false);
        Destroy(gameObject, 0.1f);
    }

    /// <summary>
    /// 碰觸玩家時造成傷害
    /// </summary>
    private void OnCollisionStay2D(Collision2D collision)
    {
        if (collision.gameObject.CompareTag("Player"))
        {
            GameManager.Instance.PlayerTakeDamage(ContactDamage);
        }
    }
}
