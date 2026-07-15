using UnityEngine;

/// <summary>
/// PiercingArrow — 弓箭手穿透箭
/// 對應原始架構: archer-attack.js PiercingArrow class
/// 高速穿透箭矢，穿過多個敵人
/// </summary>
public class PiercingArrow : MonoBehaviour
{
    [Header("Stats")]
    [SerializeField] private float _baseCD = 2.5f;
    [SerializeField] private float _baseDamage = 18f;
    [SerializeField] private float _baseSpeed = 12f;    // 原 600px/s
    [SerializeField] private float _range = 12f;        // 原 600px

    [Header("Prefab")]
    [SerializeField] private GameObject _arrowPrefab;

    private int _level = 1;
    private float _timer;
    private float _currentCD;
    private const int MAX_LEVEL = 10;

    private PlayerController _player;

    private void Start()
    {
        _player = GetComponentInParent<PlayerController>();
        _currentCD = _baseCD;
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
        Transform target = FindTarget();
        Vector2 dir;

        if (target != null)
        {
            dir = (target.position - transform.position).normalized;
        }
        else
        {
            dir = _player.FacingLeft ? Vector2.left : Vector2.right;
        }

        float speed = _baseSpeed + _level * 1f;
        float lifetime = _range / speed;
        float damage = _baseDamage * _player.DamageMultiplier;

        var proj = GameManager.Instance.PoolManager.GetProjectile();
        proj.transform.position = transform.position;
        proj.Initialize(dir * speed, damage, lifetime, piercing: true, maxPierce: 99);

        // 視覺：穿透箭稍大
        proj.transform.localScale = Vector3.one * 1.5f;
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

    public void Upgrade()
    {
        if (_level >= MAX_LEVEL) return;
        _level++;
        _currentCD = Mathf.Max(1f, _currentCD * 0.9f);
    }

    public int Level => _level;
}
