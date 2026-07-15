using UnityEngine;

/// <summary>
/// PlayerController — 玩家控制器
/// 對應原始架構: player.js Player class
/// 管理移動、狀態、經驗值、動畫
/// </summary>
[RequireComponent(typeof(Rigidbody2D))]
[RequireComponent(typeof(SpriteAnimatorController))]
public class PlayerController : MonoBehaviour
{
    // === 基礎屬性 ===
    public float CurrentHP { get; private set; }
    public float MaxHP { get; private set; }
    public float BaseSpeed { get; private set; }
    public float CurrentSpeed { get; private set; }
    public float BaseDamage { get; private set; }
    public float DamageMultiplier { get; private set; } = 1f;
    public float FireRate { get; private set; }
    public int ProjectileCount { get; private set; }
    public float BasePickupRange { get; private set; }
    public float PickupRange { get; private set; }
    public int Level { get; private set; } = 1;
    public int XP { get; private set; }
    public int XPNeeded { get; private set; }
    public bool IsInvulnerable { get; private set; }
    public CharacterType CharacterType { get; private set; }
    public AttackType AttackType { get; private set; }
    public bool FacingLeft { get; private set; }

    // === 常數 ===
    private const int BASE_XP_NEEDED = 8;
    private const int XP_PER_LEVEL = 3;
    private const float INVULN_DURATION = 0.5f;

    // === 私有變數 ===
    private Rigidbody2D _rb;
    private SpriteAnimatorController _animator;
    private float _invulnTimer;
    private float _fireTimer;
    private Vector2 _moveDirection;
    private IPlayerAttack _attackSystem;

    // === 事件 ===
    public System.Action OnLevelUp;
    public System.Action<float, float> OnHPChanged; // current, max

    private void Awake()
    {
        _rb = GetComponent<Rigidbody2D>();
        _animator = GetComponent<SpriteAnimatorController>();
        if (_rb != null)
        {
            _rb.gravityScale = 0f;
            _rb.freezeRotation = true;
        }

        // 如果沒有 Sprite，建立一個 placeholder 方塊
        var sr = GetComponent<SpriteRenderer>();
        if (sr != null && sr.sprite == null)
        {
            sr.sprite = CreatePlaceholderSprite();
        }
    }

    private static Sprite CreatePlaceholderSprite()
    {
        var tex = new Texture2D(32, 32);
        var colors = new Color[32 * 32];
        for (int i = 0; i < colors.Length; i++) colors[i] = Color.white;
        tex.SetPixels(colors);
        tex.Apply();
        return Sprite.Create(tex, new Rect(0, 0, 32, 32), new Vector2(0.5f, 0.5f), 32);
    }

    /// <summary>
    /// 初始化玩家（角色選擇後呼叫）
    /// </summary>
    public void Initialize(CharacterType type, CharacterStats stats)
    {
        CharacterType = type;
        MaxHP = stats.hp;
        CurrentHP = stats.hp;
        BaseSpeed = stats.speed;
        CurrentSpeed = stats.speed;
        BaseDamage = stats.damage;
        FireRate = stats.fireRate;
        ProjectileCount = stats.projectileCount;
        BasePickupRange = stats.pickupRange;
        PickupRange = stats.pickupRange;
        XPNeeded = BASE_XP_NEEDED;
        Level = 1;
        XP = 0;
        DamageMultiplier = 1f;

        transform.localScale = Vector3.one * stats.scale;

        // 設定攻擊類型
        switch (type)
        {
            case CharacterType.Mage:
                AttackType = AttackType.Ranged;
                break;
            case CharacterType.Archer:
                AttackType = AttackType.Archer;
                break;
            case CharacterType.Knight:
                AttackType = AttackType.Melee;
                break;
            case CharacterType.Valkyrie:
                AttackType = AttackType.Valkyrie;
                break;
        }

        _attackSystem = GetComponent<IPlayerAttack>();
    }

    private void Update()
    {
        if (GameManager.Instance.IsGameOver || GameManager.Instance.IsPaused) return;

        HandleInput();
        UpdateInvulnerability();
        UpdateAttack();
        UpdateAnimation();
    }

    private void FixedUpdate()
    {
        Move();
    }

    private void HandleInput()
    {
        float h = Input.GetAxisRaw("Horizontal");
        float v = Input.GetAxisRaw("Vertical");
        _moveDirection = new Vector2(h, v).normalized;

        if (h != 0) FacingLeft = h < 0;

        // 大招
        if (Input.GetKeyDown(KeyCode.Space))
        {
            GameManager.Instance.ActivateUltimate();
        }
    }

    /// <summary>
    /// 依方向與速度移動
    /// </summary>
    private void Move()
    {
        _rb.velocity = _moveDirection * CurrentSpeed;
    }

    private void UpdateInvulnerability()
    {
        if (_invulnTimer > 0)
        {
            _invulnTimer -= Time.deltaTime;
            IsInvulnerable = _invulnTimer > 0;
        }
    }

    private void UpdateAttack()
    {
        _fireTimer -= Time.deltaTime;
        if (_fireTimer <= 0f)
        {
            _fireTimer = 1f / FireRate;
            _attackSystem?.Attack(this);
        }
    }

    private void UpdateAnimation()
    {
        bool isMoving = _moveDirection.sqrMagnitude > 0.01f;
        _animator.SetState(isMoving ? AnimState.Run : AnimState.Idle);
        _animator.SetFlipX(FacingLeft);
    }

    /// <summary>
    /// 受傷並觸發無敵
    /// </summary>
    public void TakeDamage(float damage)
    {
        if (IsInvulnerable) return;

        CurrentHP = Mathf.Max(0, CurrentHP - damage);
        _invulnTimer = INVULN_DURATION;
        IsInvulnerable = true;

        OnHPChanged?.Invoke(CurrentHP, MaxHP);

        // 閃爍效果
        StartCoroutine(InvulnerabilityFlash());
    }

    /// <summary>
    /// 回復生命
    /// </summary>
    public void Heal(float amount)
    {
        CurrentHP = Mathf.Min(MaxHP, CurrentHP + amount);
        OnHPChanged?.Invoke(CurrentHP, MaxHP);
    }

    /// <summary>
    /// 增加經驗值，回傳是否升級
    /// </summary>
    public bool AddXP(int value)
    {
        XP += value;
        if (XP >= XPNeeded)
        {
            XP -= XPNeeded;
            Level++;
            XPNeeded = BASE_XP_NEEDED + (Level - 1) * XP_PER_LEVEL;
            BaseDamage *= 1.01f; // 每級 +1% 傷害

            OnLevelUp?.Invoke();
            return true;
        }
        return false;
    }

    public void UpgradeAttack()
    {
        _attackSystem?.Upgrade();
    }

    // === Setter 方法（供升級系統使用）===

    public void SetSpeed(float speed)
    {
        CurrentSpeed = speed;
    }

    public void SetPickupRange(float range)
    {
        PickupRange = range;
    }

    public void SetDamageMultiplier(float mult)
    {
        DamageMultiplier = mult;
    }

    public void IncreaseMaxHP(float amount)
    {
        MaxHP += amount;
        CurrentHP += amount;
        OnHPChanged?.Invoke(CurrentHP, MaxHP);
    }

    public void SetFireRate(float rate)
    {
        FireRate = rate;
    }

    public void SetProjectileCount(int count)
    {
        ProjectileCount = count;
    }

    public float GetTotalDamage()
    {
        return BaseDamage * DamageMultiplier;
    }

    private System.Collections.IEnumerator InvulnerabilityFlash()
    {
        var sr = GetComponent<SpriteRenderer>();
        if (sr == null) yield break;

        float elapsed = 0f;
        while (elapsed < INVULN_DURATION)
        {
            sr.enabled = !sr.enabled;
            yield return new WaitForSeconds(0.1f);
            elapsed += 0.1f;
        }
        sr.enabled = true;
    }
}
