using UnityEngine;

/// <summary>
/// MageAttack — 法師遠程火球攻擊
/// 對應原始架構: projectile.js + main.js 法師攻擊邏輯
/// 多目標火球投射，Lv13+ 火焰 AOE
/// </summary>
public class MageAttack : MonoBehaviour, IPlayerAttack
{
    [Header("Stats")]
    [SerializeField] private float _projectileSpeed = 8f;
    [SerializeField] private float _lifetime = 2f;

    [Header("Fire AOE (Lv13+)")]
    [SerializeField] private GameObject _fireExplosionPrefab;

    private int _level = 1;
    private PlayerController _player;

    // Lv13+ 火焰 AOE
    private const int FIRE_AOE_LEVEL = 13;
    private const float FIRE_AOE_CHANCE = 0.4f;
    private const float FIRE_AOE_DAMAGE_RATIO = 0.5f;
    private const float FIRE_AOE_RADIUS = 1f;

    public void Attack(PlayerController player)
    {
        _player = player;
        ProjectileFirer.FireAtTargets(player, _projectileSpeed, _lifetime);

        // Lv13+ 機率觸發火焰 AOE
        if (_level >= FIRE_AOE_LEVEL && Random.value < FIRE_AOE_CHANCE)
        {
            // 在最近敵人位置產生 AOE（延遲觸發）
            var nearest = FindNearestEnemy();
            if (nearest != null)
            {
                SpawnFireAOE(nearest.transform.position);
            }
        }
    }

    private void SpawnFireAOE(Vector3 position)
    {
        if (_fireExplosionPrefab != null)
        {
            var effect = Instantiate(_fireExplosionPrefab, position, Quaternion.identity);
            Destroy(effect, 0.5f);
        }

        // AOE 傷害
        var hits = Physics2D.OverlapCircleAll(position, FIRE_AOE_RADIUS, LayerMask.GetMask("Enemy"));
        float aoeDamage = _player.GetTotalDamage() * FIRE_AOE_DAMAGE_RATIO;

        foreach (var hit in hits)
        {
            var enemy = hit.GetComponent<EnemyBase>();
            if (enemy != null)
            {
                enemy.TakeDamage(aoeDamage);
            }
        }
    }

    private EnemyBase FindNearestEnemy()
    {
        float minDist = float.MaxValue;
        EnemyBase nearest = null;

        foreach (var enemy in GameManager.Instance.Enemies)
        {
            float dist = Vector2.Distance(transform.position, enemy.transform.position);
            if (dist < minDist)
            {
                minDist = dist;
                nearest = enemy;
            }
        }
        return nearest;
    }

    public void Upgrade()
    {
        _level++;
        // 奇數 = 投射物數量++，偶數 = 攻速++
        if (_level % 2 == 1)
        {
            _player.SetProjectileCount(_player.ProjectileCount + 1);
        }
        else
        {
            _player.SetFireRate(_player.FireRate * 1.1f);
        }
    }

    public int GetLevel() => _level;
}
