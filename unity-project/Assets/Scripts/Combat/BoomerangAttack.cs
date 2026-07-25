using UnityEngine;

/// <summary>
/// BoomerangAttack — 迴力鏢手攻擊
/// 迴力鏢飛出後自動折返 + 連鎖閃電
/// 對應原始 JS: boomerang-attack.js
/// </summary>
public class BoomerangAttack : MonoBehaviour, IPlayerAttack
{
    [Header("Boomerang Settings")]
    [SerializeField] private float _throwSpeed = 10f;
    [SerializeField] private float _returnSpeed = 12f;
    [SerializeField] private float _maxDistance = 6f;
    [SerializeField] private float _cooldown = 1.0f;
    [SerializeField] private float _damage = 12f;
    [SerializeField] private int _hitPerPass = 3; // 每次穿過最多命中數

    [Header("Chain Lightning")]
    [SerializeField] private float _chainRange = 3f;
    [SerializeField] private int _chainBounces = 3;
    [SerializeField] private float _chainDamageMultiplier = 0.6f;

    [Header("References")]
    [SerializeField] private GameObject _boomerangPrefab;
    [SerializeField] private ObjectPoolManager _poolManager;

    private float _cooldownTimer;
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

        _cooldownTimer = _cooldown / _player.GetFireRateMultiplier();

        // 發射迴力鏢
        SpawnBoomerang(direction);
    }

    private void SpawnBoomerang(Vector2 direction)
    {
        // 使用物件池取得迴力鏢
        var boomerang = _poolManager != null
            ? _poolManager.Get(_boomerangPrefab)
            : Instantiate(_boomerangPrefab);

        boomerang.transform.position = _transform.position;

        var controller = boomerang.GetComponent<BoomerangProjectile>();
        if (controller != null)
        {
            controller.Initialize(
                direction,
                _throwSpeed,
                _returnSpeed,
                _maxDistance,
                _damage * _player.GetDamageMultiplier(),
                _hitPerPass,
                _transform,
                _chainRange,
                _chainBounces,
                _chainDamageMultiplier
            );
        }
    }

    private void Update()
    {
        if (_cooldownTimer > 0)
            _cooldownTimer -= Time.deltaTime;
    }

    public void OnLevelUp(int level)
    {
        _damage += 2f;
        _chainBounces = Mathf.Min(_chainBounces + 1, 6);
        if (level >= 5)
            _hitPerPass++;
    }
}
