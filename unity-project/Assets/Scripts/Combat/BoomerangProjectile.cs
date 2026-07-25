using UnityEngine;

/// <summary>
/// BoomerangProjectile — 迴力鏢投射物控制
/// 飛出 → 到達最大距離 → 折返 → 回到玩家
/// 接觸敵人觸發連鎖閃電
/// </summary>
public class BoomerangProjectile : MonoBehaviour
{
    private enum State { Outgoing, Returning }

    private State _state;
    private Vector2 _direction;
    private float _throwSpeed;
    private float _returnSpeed;
    private float _maxDistance;
    private float _damage;
    private int _hitPerPass;
    private Transform _owner;
    private float _distanceTraveled;
    private float _chainRange;
    private int _chainBounces;
    private float _chainDamageMultiplier;
    private int _hitCount;

    private Transform _transform;
    private float _spinSpeed = 720f; // 旋轉速度 (度/秒)

    private void Awake()
    {
        _transform = transform;
    }

    public void Initialize(Vector2 direction, float throwSpeed, float returnSpeed,
        float maxDistance, float damage, int hitPerPass, Transform owner,
        float chainRange, int chainBounces, float chainDamageMultiplier)
    {
        _direction = direction.normalized;
        _throwSpeed = throwSpeed;
        _returnSpeed = returnSpeed;
        _maxDistance = maxDistance;
        _damage = damage;
        _hitPerPass = hitPerPass;
        _owner = owner;
        _chainRange = chainRange;
        _chainBounces = chainBounces;
        _chainDamageMultiplier = chainDamageMultiplier;
        _state = State.Outgoing;
        _distanceTraveled = 0f;
        _hitCount = 0;
        gameObject.SetActive(true);
    }

    private void Update()
    {
        float dt = Time.deltaTime;

        // 旋轉動畫
        _transform.Rotate(0, 0, _spinSpeed * dt);

        switch (_state)
        {
            case State.Outgoing:
                float outStep = _throwSpeed * dt;
                _transform.position += (Vector3)(_direction * outStep);
                _distanceTraveled += outStep;

                if (_distanceTraveled >= _maxDistance)
                {
                    _state = State.Returning;
                    _hitCount = 0;
                }
                break;

            case State.Returning:
                if (_owner == null)
                {
                    gameObject.SetActive(false);
                    return;
                }

                Vector2 toOwner = (Vector2)(_owner.position - _transform.position);
                float dist = toOwner.magnitude;

                if (dist < 0.3f)
                {
                    gameObject.SetActive(false);
                    return;
                }

                Vector2 returnDir = toOwner.normalized;
                _transform.position += (Vector3)(returnDir * _returnSpeed * dt);
                break;
        }
    }

    private void OnTriggerEnter2D(Collider2D other)
    {
        if (!other.CompareTag("Enemy")) return;
        if (_hitCount >= _hitPerPass) return;

        _hitCount++;

        var enemy = other.GetComponent<EnemyBase>();
        if (enemy != null)
        {
            enemy.TakeDamage(_damage);
            TriggerChainLightning(other.transform.position);
        }
    }

    private void TriggerChainLightning(Vector3 startPos)
    {
        // 連鎖閃電邏輯（使用 ChainLightning weapon）
        var chainLightning = GetComponent<ChainLightning>();
        if (chainLightning != null)
        {
            chainLightning.Fire(startPos, _chainRange, _chainBounces,
                _damage * _chainDamageMultiplier);
        }
    }
}
