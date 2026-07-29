using UnityEngine;

/// <summary>
/// PlayerController — 玩家控制器
/// 對應原始架構: player.js (V263)
/// 管理移動、狀態、經驗值、動畫
/// 支援鍵盤 + 手把 (Gamepad) 輸入
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
    public float FireRateMultiplier { get; private set; } = 1f;
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
    public Vector2 MoveDirection => _moveDirection;
    public Vector2 AimDirection => _aimDirection;

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
    private Vector2 _aimDirection = Vector2.right;
    private IPlayerAttack _attackSystem;

    // === 事件 ===
    public System.Action OnLevelUp;
    public System.Action<float, float> OnHPChanged;

    private void Awake()
    {
        _rb = GetComponent<Rigidbody2D>();
        _animator = GetComponent<SpriteAnimatorController>();
        if (_rb != null)
        {
            _rb.gravityScale = 0f;
            _rb.freezeRotation = true;
        }
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
        FireRateMultiplier = 1f;
        ProjectileCount = stats.projectileCount;
        BasePickupRange = stats.pickupRange;
        PickupRange = stats.pickupRange;
        XPNeeded = BASE_XP_NEEDED;
        Level = 1;
        XP = 0;
        DamageMultiplier = 1f;

        transform.localScale = Vector3.one * stats.scale;

        // 設定攻擊類型
        AttackType = type switch
        {
            CharacterType.Mage => AttackType.Ranged,
            CharacterType.Archer => AttackType.Archer,
            CharacterType.Knight => AttackType.Melee,
            CharacterType.Valkyrie => AttackType.Valkyrie,
            CharacterType.Boomerang => AttackType.Boomerang,
            CharacterType.Ninja => AttackType.Ninja,
            _ => AttackType.Ranged
        };

        _attackSystem = GetComponent<IPlayerAttack>();

        Debug.Log($"[Player] Initialized: {type}, Speed={CurrentSpeed}, HP={MaxHP}");
    }

    private void Update()
    {
        if (CurrentSpeed <= 0) return;
        if (GameManager.Instance == null) return;
        if (GameManager.Instance.IsGameOver || GameManager.Instance.IsPaused) return;

        HandleInput();
        UpdateInvulnerability();
        UpdateAttack();
        UpdateAnimation();
    }

    private void FixedUpdate()
    {
        if (_rb == null) _rb = GetComponent<Rigidbody2D>();
        Move();
    }

    private void HandleInput()
    {
        float h = 0f, v = 0f;

        // 鍵盤
        if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow)) h -= 1f;
        if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow)) h += 1f;
        if (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow)) v += 1f;
        if (Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow)) v -= 1f;

        // 手把 (Gamepad) - 左搖桿移動
        float gpH = Input.GetAxis("Horizontal");
        float gpV = Input.GetAxis("Vertical");
        if (Mathf.Abs(gpH) > 0.1f || Mathf.Abs(gpV) > 0.1f)
        {
            h = gpH;
            v = gpV;
        }

        _moveDirection = new Vector2(h, v).normalized;

        // 更新面向方向
        if (h != 0) FacingLeft = h < 0;

        // 瞄準方向（右搖桿或移動方向）
        float aimH = GetAxisSafe("RightStickHorizontal");
        float aimV = GetAxisSafe("RightStickVertical");
        if (Mathf.Abs(aimH) > 0.1f || Mathf.Abs(aimV) > 0.1f)
        {
            _aimDirection = new Vector2(aimH, aimV).normalized;
        }
        else if (_moveDirection.sqrMagnitude > 0.01f)
        {
            _aimDirection = _moveDirection;
        }

        // 大招（空白鍵或手把按鈕）
        if (Input.GetKeyDown(KeyCode.Space) || GetButtonDownSafe("Fire2"))
        {
            GameManager.Instance.ActivateUltimate();
        }
    }

    private void Move()
    {
        _rb.linearVelocity = _moveDirection * CurrentSpeed;
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
            _fireTimer = 1f / (FireRate * FireRateMultiplier);
            if (_attackSystem != null)
            {
                _attackSystem.Attack(_aimDirection);
            }
            else
            {
                _attackSystem = GetComponent<IPlayerAttack>();
            }
        }
    }

    private void UpdateAnimation()
    {
        bool isMoving = _moveDirection.sqrMagnitude > 0.01f;
        _animator.SetState(isMoving ? AnimState.Run : AnimState.Idle);
        _animator.SetFlipX(FacingLeft);
    }

    // === Public API ===

    public void TakeDamage(float damage)
    {
        if (IsInvulnerable) return;

        CurrentHP = Mathf.Max(0, CurrentHP - damage);
        _invulnTimer = INVULN_DURATION;
        IsInvulnerable = true;

        OnHPChanged?.Invoke(CurrentHP, MaxHP);
        StartCoroutine(InvulnerabilityFlash());

        if (CurrentHP <= 0)
        {
            GameManager.Instance.OnPlayerDeath();
        }
    }

    public void Heal(float amount)
    {
        CurrentHP = Mathf.Min(MaxHP, CurrentHP + amount);
        OnHPChanged?.Invoke(CurrentHP, MaxHP);
    }

    public bool AddXP(int value)
    {
        XP += value;
        if (XP >= XPNeeded)
        {
            XP -= XPNeeded;
            Level++;
            XPNeeded = BASE_XP_NEEDED + (Level - 1) * XP_PER_LEVEL;
            BaseDamage *= 1.01f;
            OnLevelUp?.Invoke();
            return true;
        }
        return false;
    }

    /// <summary>取得攻擊倍率（供 Attack 系統用）</summary>
    public float GetDamageMultiplier() => DamageMultiplier;

    /// <summary>取得攻速倍率</summary>
    public float GetFireRateMultiplier() => FireRateMultiplier;

    /// <summary>取得面向方向 (Vector2)</summary>
    public Vector2 GetFacingDirection() => FacingLeft ? Vector2.left : Vector2.right;

    // === Setter 方法（供升級系統使用）===

    public void SetSpeed(float speed) => CurrentSpeed = speed;
    public void SetPickupRange(float range) => PickupRange = range;
    public void SetDamageMultiplier(float mult) => DamageMultiplier = mult;
    public void SetFireRateMultiplier(float mult) => FireRateMultiplier = mult;
    public void SetFireRate(float rate) => FireRate = rate;
    public void SetProjectileCount(int count) => ProjectileCount = count;

    public void IncreaseMaxHP(float amount)
    {
        MaxHP += amount;
        CurrentHP += amount;
        OnHPChanged?.Invoke(CurrentHP, MaxHP);
    }

    public float GetTotalDamage() => BaseDamage * DamageMultiplier;

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

    public void UpgradeAttack()
    {
        var attack = GetComponent<IPlayerAttack>();
        if (attack != null)
        {
            attack.OnLevelUp(Level);
        }
    }

    /// <summary>
    /// 安全讀取軸值，避免未設定的軸拋出 ArgumentException
    /// </summary>
    private float GetAxisSafe(string axisName)
    {
        try { return Input.GetAxis(axisName); }
        catch (System.ArgumentException) { return 0f; }
    }

    /// <summary>
    /// 安全讀取按鈕，避免未設定的按鈕拋出 ArgumentException
    /// </summary>
    private bool GetButtonDownSafe(string buttonName)
    {
        try { return Input.GetButtonDown(buttonName); }
        catch (System.ArgumentException) { return false; }
    }
}
