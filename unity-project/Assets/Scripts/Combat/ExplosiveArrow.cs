using UnityEngine;

/// <summary>
/// ExplosiveArrow — 弓箭手爆炸箭
/// 對應原始架構: archer-attack.js ExplosiveArrow class
/// 追蹤飛彈式箭矢，命中後 AOE 爆炸
/// </summary>
public class ExplosiveArrow : MonoBehaviour
{
    [Header("Stats")]
    [SerializeField] private float _baseCD = 3f;
    [SerializeField] private float _baseDamage = 20f;
    [SerializeField] private float _aoeRadius = 1f;
    [SerializeField] private float _speed = 8f;
    [SerializeField] private float _lifetime = 3f;

    [Header("Prefab")]
    [SerializeField] private GameObject _explosionEffectPrefab;
    [SerializeField] private GameObject _arrowPrefab;

    private int _level = 1;
    private float _timer;
    private float _currentCD;
    private float _currentDamage;
    private const int MAX_LEVEL = 10;

    private PlayerController _player;

    private void Start()
    {
        _player = GetComponentInParent<PlayerController>();
        _currentCD = _baseCD;
        _currentDamage = _baseDamage;
        _timer = _currentCD;
    }

    private void Update()
    {
        _timer -= Time.deltaTime;
        if (_timer <= 0)
        {
            _timer = _currentCD;
            Fire();
        }
    }

    private void Fire()
    {
        // 找最近敵人
        Transform target = FindTarget();
        if (target == null) return;

        if (_arrowPrefab == null) return;

        var go = Instantiate(_arrowPrefab, transform.position, Quaternion.identity);
        var missile = go.AddComponent<ExplosiveArrowInstance>();
        missile.Initialize(target, _speed, _currentDamage * _player.DamageMultiplier,
            _aoeRadius, _lifetime, _explosionEffectPrefab);
    }

    private Transform FindTarget()
    {
        float minDist = float.MaxValue;
        Transform nearest = null;

        foreach (var enemy in GameManager.Instance.Enemies)
        {
            float dist = Vector2.Distance(transform.position, enemy.transform.position);
            if (dist < minDist)
            {
                minDist = dist;
                nearest = enemy.transform;
            }
        }
        return nearest;
    }

    /// <summary>
    /// 提升等級
    /// </summary>
    public void Upgrade()
    {
        if (_level >= MAX_LEVEL) return;
        _level++;
        _currentDamage += 5f;
        _aoeRadius += 0.1f;
        _currentCD = Mathf.Max(1f, _currentCD * 0.9f);
    }

    public int Level => _level;
}

/// <summary>
/// 爆炸箭實體
/// </summary>
public class ExplosiveArrowInstance : MonoBehaviour
{
    private Transform _target;
    private float _speed;
    private float _damage;
    private float _aoeRadius;
    private float _lifetime;
    private float _timer;
    private GameObject _explosionPrefab;

    public void Initialize(Transform target, float speed, float damage, float aoeRadius, float lifetime, GameObject explosionPrefab)
    {
        _target = target;
        _speed = speed;
        _damage = damage;
        _aoeRadius = aoeRadius;
        _lifetime = lifetime;
        _timer = 0f;
        _explosionPrefab = explosionPrefab;
    }

    private void Update()
    {
        _timer += Time.deltaTime;
        if (_timer >= _lifetime)
        {
            Explode();
            return;
        }

        if (_target != null && _target.gameObject.activeInHierarchy)
        {
            Vector3 dir = (_target.position - transform.position).normalized;
            transform.position += dir * _speed * Time.deltaTime;

            float dist = Vector2.Distance(transform.position, _target.position);
            if (dist < 0.3f)
            {
                Explode();
            }
        }
        else
        {
            Explode();
        }
    }

    private void Explode()
    {
        // AOE 傷害
        var hits = Physics2D.OverlapCircleAll(transform.position, _aoeRadius, LayerMask.GetMask("Enemy"));
        foreach (var hit in hits)
        {
            var enemy = hit.GetComponent<EnemyBase>();
            if (enemy != null)
            {
                enemy.TakeDamage(_damage);
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
            effect.transform.localScale = Vector3.one * (_aoeRadius * 2f);
            Destroy(effect, 0.5f);
        }

        Destroy(gameObject);
    }
}
