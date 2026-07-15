using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// ObjectPoolManager — 物件池管理器
/// 對應原始架構: object-pool.js ObjectPool class
/// 管理 Projectile、XPGem、Particle 的物件重用
/// </summary>
public class ObjectPoolManager : MonoBehaviour
{
    [Header("Prefabs")]
    [SerializeField] private GameObject _projectilePrefab;
    [SerializeField] private GameObject _xpGemPrefab;

    [Header("Pool Sizes")]
    [SerializeField] private int _projectilePoolSize = 50;
    [SerializeField] private int _xpGemPoolSize = 50;

    [Header("Particle")]
    [SerializeField] private ParticleSpawner _particleSpawner;

    private Queue<ProjectileController> _projectilePool = new Queue<ProjectileController>();
    private Queue<XPGemController> _xpGemPool = new Queue<XPGemController>();

    private void Start()
    {
        // 延遲初始化 — 等待 Prefab 被指定
        if (_projectilePrefab != null) PrewarmProjectiles();
        if (_xpGemPrefab != null) PrewarmXPGems();
    }

    private void PrewarmProjectiles()
    {
        for (int i = 0; i < _projectilePoolSize; i++)
        {
            var go = Instantiate(_projectilePrefab, transform);
            go.SetActive(false);
            var proj = go.GetComponent<ProjectileController>();
            _projectilePool.Enqueue(proj);
        }
    }

    private void PrewarmXPGems()
    {
        for (int i = 0; i < _xpGemPoolSize; i++)
        {
            var go = Instantiate(_xpGemPrefab, transform);
            go.SetActive(false);
            var gem = go.GetComponent<XPGemController>();
            _xpGemPool.Enqueue(gem);
        }
    }

    // === Projectile ===

    /// <summary>
    /// 從池中取得投射物
    /// </summary>
    public ProjectileController GetProjectile()
    {
        if (_projectilePrefab == null) return null;

        ProjectileController proj;
        if (_projectilePool.Count > 0)
        {
            proj = _projectilePool.Dequeue();
        }
        else
        {
            var go = Instantiate(_projectilePrefab, transform);
            proj = go.GetComponent<ProjectileController>();
        }
        proj.gameObject.SetActive(true);
        return proj;
    }

    /// <summary>
    /// 歸還投射物至池
    /// </summary>
    public void ReleaseProjectile(ProjectileController proj)
    {
        proj.gameObject.SetActive(false);
        _projectilePool.Enqueue(proj);
    }

    // === XP Gem ===

    /// <summary>
    /// 生成 XP 寶石
    /// </summary>
    public void SpawnXPGem(Vector3 position, int value)
    {
        if (_xpGemPrefab == null) return;
        if (FindObjectsOfType<XPGemController>().Length >= GameManager.MAX_XP_GEMS) return;

        XPGemController gem;
        if (_xpGemPool.Count > 0)
        {
            gem = _xpGemPool.Dequeue();
        }
        else
        {
            var go = Instantiate(_xpGemPrefab, transform);
            gem = go.GetComponent<XPGemController>();
        }

        gem.transform.position = position;
        gem.Initialize(value);
    }

    /// <summary>
    /// 歸還 XP 寶石至池
    /// </summary>
    public void ReleaseXPGem(XPGemController gem)
    {
        gem.gameObject.SetActive(false);
        _xpGemPool.Enqueue(gem);
    }

    // === Particles ===

    public void SpawnDeathParticles(Vector3 position, Color color)
    {
        if (_particleSpawner != null)
            _particleSpawner.SpawnDeathParticles(position, color);
    }

    public void SpawnBossDeathParticles(Vector3 position)
    {
        if (_particleSpawner != null)
            _particleSpawner.SpawnBossDeathParticles(position);
    }
}
