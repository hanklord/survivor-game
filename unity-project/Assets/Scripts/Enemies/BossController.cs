using UnityEngine;

/// <summary>
/// BossController — Boss 控制器
/// 對應原始架構: boss.js Boss class
/// 大型敵人，高 HP、大碰撞體、專屬動畫
/// </summary>
public class BossController : MonoBehaviour
{
    [Header("Stats")]
    public float MaxHP;
    public float CurrentHP;
    public float Speed;
    public float ContactDamage;
    public float Size;
    public string BossName;
    public int XPValue = 50;
    public int EntityID { get; private set; }

    private Rigidbody2D _rb;
    private Transform _target;
    private SpriteAnimatorController _animator;

    private static int _nextBossId = 1000;

    private void Awake()
    {
        _rb = GetComponent<Rigidbody2D>();
        _rb.gravityScale = 0f;
        _rb.freezeRotation = true;
        _animator = GetComponent<SpriteAnimatorController>();
        EntityID = _nextBossId++;
    }

    /// <summary>
    /// 初始化 Boss（生成時呼叫）
    /// </summary>
    public void Initialize(BossConfig config, float hpMultiplier = 1f)
    {
        BossName = config.bossName;
        MaxHP = config.hp * hpMultiplier;
        CurrentHP = MaxHP;
        Speed = config.speed;
        ContactDamage = config.damage;
        Size = config.size;
        XPValue = config.xpValue;

        transform.localScale = Vector3.one * Size;
        _target = GameManager.Instance.Player.transform;

        // 顯示 Boss 血條
        GameManager.Instance.UIManager.ShowBossHP(this);
    }

    private void Update()
    {
        if (GameManager.Instance.IsGameOver || GameManager.Instance.IsPaused) return;
        MoveTowardTarget();
        UpdateAnimation();
    }

    /// <summary>
    /// 朝玩家緩慢移動
    /// </summary>
    private void MoveTowardTarget()
    {
        if (_target == null) return;

        Vector2 dir = (_target.position - transform.position).normalized;
        _rb.velocity = dir * Speed;

        if (_animator != null)
        {
            _animator.SetFlipX(_target.position.x < transform.position.x);
        }
    }

    private void UpdateAnimation()
    {
        if (_animator != null)
        {
            _animator.SetState(AnimState.Idle);
        }
    }

    /// <summary>
    /// 受傷
    /// </summary>
    public void TakeDamage(float damage)
    {
        bool isCrit = Random.value < 0.1f;
        if (isCrit) damage *= 1.5f;

        CurrentHP -= damage;
        GameManager.Instance.UIManager.UpdateBossHP(this);

        if (CurrentHP <= 0)
        {
            Die();
        }
    }

    private void Die()
    {
        GameManager.Instance.HandleBossKill(this);
        GameManager.Instance.UIManager.HideBossHP();
        Destroy(gameObject);
    }

    private void OnCollisionStay2D(Collision2D collision)
    {
        if (collision.gameObject.CompareTag("Player"))
        {
            GameManager.Instance.PlayerTakeDamage(ContactDamage);
        }
    }
}
