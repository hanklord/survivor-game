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
        ProjectileController proj;

        if (_projectilePool.Count > 0)
        {
            proj = _projectilePool.Dequeue();
        }
        else if (_projectilePrefab != null)
        {
            var go = Instantiate(_projectilePrefab, transform);
            proj = go.GetComponent<ProjectileController>();
        }
        else
        {
            // 無 prefab 時動態建立
            proj = CreateFallbackProjectile();
        }

        if (proj != null) proj.gameObject.SetActive(true);
        return proj;
    }

    private ProjectileController CreateFallbackProjectile()
    {
        var go = new GameObject("Projectile_Runtime");
        go.transform.SetParent(transform);
        go.layer = 8;

        var sr = go.AddComponent<SpriteRenderer>();
        sr.sortingOrder = 5;
        // 建立圓形 placeholder
        var tex = new Texture2D(16, 16);
        var colors = new Color[16 * 16];
        float center = 8f;
        for (int i = 0; i < 16; i++)
            for (int j = 0; j < 16; j++)
                colors[i * 16 + j] = Vector2.Distance(new Vector2(j, i), new Vector2(center, center)) < 7 ? Color.white : Color.clear;
        tex.SetPixels(colors);
        tex.Apply();
        sr.sprite = Sprite.Create(tex, new Rect(0, 0, 16, 16), new Vector2(0.5f, 0.5f), 16);
        sr.color = new Color(1f, 0.5f, 0f);

        var rb = go.AddComponent<Rigidbody2D>();
        rb.gravityScale = 0;
        rb.freezeRotation = true;

        var col = go.AddComponent<CircleCollider2D>();
        col.radius = 0.12f;
        col.isTrigger = true;

        go.AddComponent<ProjectileController>();
        go.transform.localScale = Vector3.one * 0.3f;

        return go.GetComponent<ProjectileController>();
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
