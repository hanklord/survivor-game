using UnityEngine;

/// <summary>
/// HomingMissileInstance — 追蹤飛彈實體
/// 對應原始架構: weapons.js HomingMissile class
/// </summary>
public class HomingMissileInstance : MonoBehaviour
{
    public bool IsActive { get; private set; }

    private Transform _target;
    private float _speed;
    private float _damage;
    private float _aoeRadius;
    private float _aoeDamage;
    private float _lifetime;
    private float _turnRate;
    private float _timer;
    private Vector2 _direction;
    private GameObject _explosionPrefab;

    public void Initialize(Transform target, float speed, float damage,
        float aoeRadius, float aoeDamage, float lifetime, float turnRate,
        GameObject explosionPrefab)
    {
        _target = target;
        _speed = speed;
        _damage = damage;
        _aoeRadius = aoeRadius;
        _aoeDamage = aoeDamage;
        _lifetime = lifetime;
        _turnRate = turnRate;
        _timer = 0f;
        _explosionPrefab = explosionPrefab;
        IsActive = true;

        // 初始方向朝向目標
        if (_target != null)
        {
            _direction = (_target.position - transform.position).normalized;
        }
        else
        {
            _direction = Vector2.right;
        }
    }

    private void Update()
    {
        if (!IsActive) return;

        _timer += Time.deltaTime;
        if (_timer >= _lifetime)
        {
            Explode();
            return;
        }

        // 追蹤轉向
        if (_target != null && _target.gameObject.activeInHierarchy)
        {
            Vector2 toTarget = (_target.position - transform.position).normalized;
            float angleToTarget = Vector2.SignedAngle(_direction, toTarget);
            float maxTurn = _turnRate * Mathf.Rad2Deg * Time.deltaTime;
            float actualTurn = Mathf.Clamp(angleToTarget, -maxTurn, maxTurn);
            _direction = RotateVector(_direction, actualTurn);
        }

        // 移動
        transform.position += (Vector3)(_direction * _speed * Time.deltaTime);

        // 旋轉朝向
        float angle = Mathf.Atan2(_direction.y, _direction.x) * Mathf.Rad2Deg;
        transform.rotation = Quaternion.Euler(0, 0, angle);
    }

    private void OnTriggerEnter2D(Collider2D other)
    {
        if (!IsActive) return;

        if (other.CompareTag("Enemy") || other.CompareTag("Boss"))
        {
            var enemy = other.GetComponent<EnemyBase>();
            if (enemy != null) enemy.TakeDamage(_damage);

            var boss = other.GetComponent<BossController>();
            if (boss != null) boss.TakeDamage(_damage);

            Explode();
        }
    }

    private void Explode()
    {
        IsActive = false;

        // AOE 傷害
        var hits = Physics2D.OverlapCircleAll(transform.position, _aoeRadius, LayerMask.GetMask("Enemy"));
        foreach (var hit in hits)
        {
            var enemy = hit.GetComponent<EnemyBase>();
            if (enemy != null)
            {
                enemy.TakeDamage(_aoeDamage);
                if (enemy.CurrentHP <= 0)
                {
                    GameManager.Instance.HandleKill(enemy);
                }
            }
        }

        // 爆炸特效
        if (_explosionPrefab != null)
        {
            var effect = Instantiate(_explosionPrefab, transform.position, Quaternion.identity);
            Destroy(effect, 0.5f);
        }

        Destroy(gameObject);
    }

    private Vector2 RotateVector(Vector2 v, float degrees)
    {
        float rad = degrees * Mathf.Deg2Rad;
        float cos = Mathf.Cos(rad);
        float sin = Mathf.Sin(rad);
        return new Vector2(v.x * cos - v.y * sin, v.x * sin + v.y * cos);
    }
}
