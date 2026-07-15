using UnityEngine;

/// <summary>
/// ParticleSpawner — 粒子生成工具
/// 對應原始架構: particle.js Particle class
/// </summary>
public class ParticleSpawner : MonoBehaviour
{
    [SerializeField] private ParticleSystem _deathParticlePrefab;
    [SerializeField] private ParticleSystem _bossDeathParticlePrefab;
    [SerializeField] private ParticleSystem _xpPickupParticlePrefab;

    /// <summary>
    /// 生成敵人死亡粒子
    /// </summary>
    public void SpawnDeathParticles(Vector3 position, Color color, int count = 5)
    {
        if (_deathParticlePrefab == null) return;

        var ps = Instantiate(_deathParticlePrefab, position, Quaternion.identity);
        var main = ps.main;
        main.startColor = color;
        ps.Emit(count);
        Destroy(ps.gameObject, main.startLifetime.constant + 0.5f);
    }

    /// <summary>
    /// 生成 Boss 死亡粒子（大量）
    /// </summary>
    public void SpawnBossDeathParticles(Vector3 position, int count = 20)
    {
        if (_bossDeathParticlePrefab == null) return;

        var ps = Instantiate(_bossDeathParticlePrefab, position, Quaternion.identity);
        ps.Emit(count);
        Destroy(ps.gameObject, 3f);
    }

    /// <summary>
    /// XP 撿取粒子
    /// </summary>
    public void SpawnPickupParticle(Vector3 position)
    {
        if (_xpPickupParticlePrefab == null) return;

        var ps = Instantiate(_xpPickupParticlePrefab, position, Quaternion.identity);
        ps.Emit(3);
        Destroy(ps.gameObject, 1f);
    }
}
