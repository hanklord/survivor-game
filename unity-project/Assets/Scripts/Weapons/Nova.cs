using UnityEngine;

/// <summary>
/// Nova — 範圍爆炸武器
/// 對應原始架構: weapons.js Nova class
/// 以玩家為中心的定時範圍爆炸
/// </summary>
public class Nova : WeaponBase
{
    private const float BASE_CD = 4f;
    private const float BASE_RADIUS = 3f;       // 原 150px
    private const float BASE_DAMAGE = 15f;
    private const float EXPAND_SPEED = 6f;      // units/s
    private const float DURATION = 0.4f;

    private float _cd;
    private float _timer;
    private float _radius;
    private float _damage;
    private float _expandTimer;
    private bool _expanding;
    private float _currentExpandRadius;

    [SerializeField] private GameObject _novaEffectPrefab;

    public override void Initialize(PlayerController player)
    {
        base.Initialize(player);
        _cd = BASE_CD;
        _radius = BASE_RADIUS;
        _damage = BASE_DAMAGE;
        _timer = _cd;
        MaxLevel = 15;
    }

    public override void UpdateWeapon(float dt, PlayerController player)
    {
        _timer -= dt;

        if (_timer <= 0)
        {
            Explode(player);
            _timer = _cd;
        }

        // 擴張動畫
        if (_expanding)
        {
            _expandTimer -= dt;
            _currentExpandRadius += EXPAND_SPEED * dt;

            if (_expandTimer <= 0)
            {
                _expanding = false;
            }
        }
    }

    private void Explode(PlayerController player)
    {
        _expanding = true;
        _expandTimer = DURATION;
        _currentExpandRadius = 0f;

        // 範圍傷害
        var hits = Physics2D.OverlapCircleAll(player.transform.position, _radius, LayerMask.GetMask("Enemy"));
        float totalDamage = _damage * player.DamageMultiplier;

        foreach (var hit in hits)
        {
            var enemy = hit.GetComponent<EnemyBase>();
            if (enemy != null)
            {
                enemy.TakeDamage(totalDamage);
                DamageNumberManager.Instance.Spawn(enemy.transform.position, totalDamage);

                if (enemy.CurrentHP <= 0)
                {
                    GameManager.Instance.HandleKill(enemy);
                }
            }

            var boss = hit.GetComponent<BossController>();
            if (boss != null)
            {
                boss.TakeDamage(totalDamage);
                DamageNumberManager.Instance.Spawn(boss.transform.position, totalDamage);
            }
        }

        // 視覺效果
        SpawnNovaEffect(player.transform.position);

        // 畫面震動
        CameraShake.Instance?.Shake(0.1f, 0.2f);
    }

    private void SpawnNovaEffect(Vector3 position)
    {
        if (_novaEffectPrefab != null)
        {
            var effect = Instantiate(_novaEffectPrefab, position, Quaternion.identity);
            effect.transform.localScale = Vector3.one * (_radius / BASE_RADIUS);
            Destroy(effect, DURATION + 0.1f);
        }
    }

    public override void Upgrade()
    {
        if (Level >= MaxLevel) return;
        Level++;

        _damage += 5f;
        _radius += 0.3f;
        _cd = Mathf.Max(1.5f, _cd * 0.9f);
    }

    public override WeaponVisualData GetVisualData()
    {
        if (!_expanding) return null;

        return new WeaponVisualData
        {
            Type = WeaponType.Nova,
            Positions = new[] { _player.transform.position },
            Radius = _currentExpandRadius,
            Alpha = _expandTimer / DURATION
        };
    }
}
