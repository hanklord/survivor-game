using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// OrbitingShield — 旋轉護盾武器
/// 對應原始架構: weapons.js OrbitingShield class
/// 圍繞玩家旋轉的球體，碰觸敵人造成傷害與擊退
/// </summary>
public class OrbitingShield : WeaponBase
{
    private const float ORBIT_RADIUS = 1.6f;     // 原 80px
    private const float BALL_BASE_SIZE = 0.28f;  // 原 14px
    private const float SPEED = 3f;              // rad/s
    private const float BASE_DAMAGE = 8f;
    private const float KNOCKBACK = 1f;
    private const float HIT_CD = 0.3f;

    private int _count = 1;
    private float _damage;
    private float _angle;
    private float _ballSize;
    private Dictionary<string, float> _hitTimers = new Dictionary<string, float>();

    [SerializeField] private GameObject _shieldBallPrefab;
    private List<GameObject> _balls = new List<GameObject>();

    public override void Initialize(PlayerController player)
    {
        base.Initialize(player);
        _damage = BASE_DAMAGE;
        _ballSize = BALL_BASE_SIZE;
        MaxLevel = 15;
        UpdateBallVisuals();
    }

    public override void UpdateWeapon(float dt, PlayerController player)
    {
        _angle += SPEED * dt;

        // 更新球體位置
        for (int i = 0; i < _count; i++)
        {
            float a = _angle + (Mathf.PI * 2f / _count) * i;
            Vector3 pos = player.transform.position + new Vector3(
                Mathf.Cos(a) * ORBIT_RADIUS,
                Mathf.Sin(a) * ORBIT_RADIUS,
                0
            );

            if (i < _balls.Count)
            {
                _balls[i].transform.position = pos;
            }

            // 碰撞偵測
            CheckCollisions(pos, i, dt);
        }

        // 更新 CD
        var keysToRemove = new List<string>();
        var keys = new List<string>(_hitTimers.Keys);
        foreach (var key in keys)
        {
            _hitTimers[key] -= dt;
            if (_hitTimers[key] <= 0) keysToRemove.Add(key);
        }
        foreach (var key in keysToRemove)
        {
            _hitTimers.Remove(key);
        }
    }

    private void CheckCollisions(Vector3 ballPos, int ballIndex, float dt)
    {
        var hits = Physics2D.OverlapCircleAll(ballPos, _ballSize / 2f, LayerMask.GetMask("Enemy"));

        foreach (var hit in hits)
        {
            var enemy = hit.GetComponent<EnemyBase>();
            if (enemy == null) continue;

            string key = enemy.EntityID + "_" + ballIndex;
            if (_hitTimers.ContainsKey(key)) continue;

            enemy.TakeDamage(_damage * _player.DamageMultiplier);
            _hitTimers[key] = HIT_CD;

            // 擊退
            Vector2 knockDir = (hit.transform.position - _player.transform.position).normalized;
            enemy.ApplyKnockback(knockDir * KNOCKBACK);

            if (enemy.CurrentHP <= 0)
            {
                GameManager.Instance.HandleKill(enemy);
            }
        }
    }

    public override void Upgrade()
    {
        if (Level >= MaxLevel) return;
        Level++;

        // 每 3 級增加一顆球，其餘增加大小
        if (Level % 3 == 0 && _count < 6)
        {
            _count++;
        }
        else
        {
            _ballSize = Mathf.Min(0.8f, _ballSize + 0.04f);
            _damage += 2f;
        }

        UpdateBallVisuals();
    }

    private void UpdateBallVisuals()
    {
        // 確保球體數量正確
        while (_balls.Count < _count)
        {
            if (_shieldBallPrefab != null)
            {
                var ball = Instantiate(_shieldBallPrefab, transform);
                ball.transform.localScale = Vector3.one * _ballSize;
                _balls.Add(ball);
            }
        }

        // 更新大小
        foreach (var ball in _balls)
        {
            ball.transform.localScale = Vector3.one * _ballSize;
        }
    }

    public override WeaponVisualData GetVisualData()
    {
        var positions = new Vector3[_count];
        for (int i = 0; i < _count; i++)
        {
            float a = _angle + (Mathf.PI * 2f / _count) * i;
            positions[i] = _player.transform.position + new Vector3(
                Mathf.Cos(a) * ORBIT_RADIUS,
                Mathf.Sin(a) * ORBIT_RADIUS,
                0
            );
        }

        return new WeaponVisualData
        {
            Type = WeaponType.OrbitingShield,
            Positions = positions,
            Radius = _ballSize / 2f
        };
    }
}
