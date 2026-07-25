using UnityEngine;

/// <summary>
/// NinjaAttack — 忍者攻擊
/// 手裏劍連射 + 貫穿
/// 對應原始 JS: ninja-attack.js
/// </summary>
public class NinjaAttack : MonoBehaviour, IPlayerAttack
{
    [Header("Shuriken Settings")]
    [SerializeField] private float _fireRate = 0.2f; // 連射間隔
    [SerializeField] private float _damage = 6f;
    [SerializeField] private float _speed = 14f;
    [SerializeField] private int _burstCount = 3;    // 連射數量
    [SerializeField] private float _burstInterval = 0.08f;
    [SerializeField] private bool _piercing = true;
    [SerializeField] private int _maxPierce = 3;     // 最大穿透數

    [Header("References")]
    [SerializeField] private GameObject _shurikenPrefab;
    [SerializeField] private ObjectPoolManager _poolManager;

    private float _cooldownTimer;
    private int _burstRemaining;
    private float _burstTimer;
    private Vector2 _lastDirection;
    private PlayerController _player;
    private Transform _transform;

    private void Awake()
    {
        _player = GetComponent<PlayerController>();
        _transform = transform;
    }

    public void Attack(Vector2 direction)
    {
        if (_cooldownTimer > 0) return;
        if (direction == Vector2.zero) return;

        _lastDirection = direction.normalized;
        _burstRemaining = _burstCount;
        _burstTimer = 0f;
        _cooldownTimer = _fireRate * _burstCount / _player.GetFireRateMultiplier();
    }

    private void Update()
    {
        float dt = Time.deltaTime;

        if (_cooldownTimer > 0)
            _cooldownTimer -= dt;

        // 連射 burst
        if (_burstRemaining > 0)
        {
            _burstTimer -= dt;
            if (_burstTimer <= 0)
            {
                FireShuriken(_lastDirection);
                _burstRemaining--;
                _burstTimer = _burstInterval;
            }
        }
    }

    private void FireShuriken(Vector2 direction)
    {
        var shuriken = _poolManager != null
            ? _poolManager.Get(_shurikenPrefab)
            : Instantiate(_shurikenPrefab);

        shuriken.transform.position = _transform.position;

        var controller = shuriken.GetComponent<ProjectileController>();
        if (controller != null)
        {
            float actualDamage = _damage * _player.GetDamageMultiplier();
            controller.Initialize(
                direction,
                _speed,
                actualDamage,
                _piercing,
                _maxPierce
            );
        }
    }

    public void OnLevelUp(int level)
    {
        _damage += 1.5f;
        if (level % 3 == 0)
            _burstCount = Mathf.Min(_burstCount + 1, 7);
        if (level >= 8)
            _maxPierce++;
    }
}
