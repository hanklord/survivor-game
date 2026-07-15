using UnityEngine;

/// <summary>
/// Thunder — 雷擊武器
/// 對應原始架構: weapons.js Thunder class
/// 隨機鎖定敵人並造成雷擊傷害
/// </summary>
public class Thunder : WeaponBase
{
    private const float BASE_CD = 3f;
    private const float BASE_DAMAGE = 25f;
    private const float DAMAGE_PER_LEVEL = 10f;
    private const float MIN_CD = 0.8f;

    private float _cd;
    private float _timer;
    private float _damage;

    [SerializeField] private GameObject _thunderEffectPrefab;

    public override void Initialize(PlayerController player)
    {
        base.Initialize(player);
        _cd = BASE_CD;
        _damage = BASE_DAMAGE;
        _timer = _cd;
        MaxLevel = 15;
    }

    public override void UpdateWeapon(float dt, PlayerController player)
    {
        _timer -= dt;

        if (_timer <= 0)
        {
            Strike(player);
            _timer = _cd;
        }
    }

    private void Strike(PlayerController player)
    {
        var enemies = GameManager.Instance.Enemies;
        if (enemies.Count == 0) return;

        // 隨機選取目標
        var target = enemies[Random.Range(0, enemies.Count)];
        float totalDamage = _damage * player.DamageMultiplier;

        target.TakeDamage(totalDamage);
        DamageNumberManager.Instance.Spawn(target.transform.position, totalDamage);

        if (target.CurrentHP <= 0)
        {
            GameManager.Instance.HandleKill(target);
        }

        // 雷擊視覺
        SpawnThunderEffect(target.transform.position);
        CameraShake.Instance?.Shake(0.05f, 0.1f);
    }

    private void SpawnThunderEffect(Vector3 position)
    {
        if (_thunderEffectPrefab != null)
        {
            var effect = Instantiate(_thunderEffectPrefab, position, Quaternion.identity);
            Destroy(effect, 0.3f);
        }
    }

    public override void Upgrade()
    {
        if (Level >= MaxLevel) return;
        Level++;
        _damage += DAMAGE_PER_LEVEL;
        _cd = Mathf.Max(MIN_CD, _cd * 0.85f);
    }
}
