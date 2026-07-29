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

        // 嘗試從 Resources 載入實際投射物圖片
        var loadedSprite = Resources.Load<Sprite>("Effects/projectile");
        if (loadedSprite != null)
        {
            sr.sprite = loadedSprite;
        }
        else
        {
            // Fallback: 生成火球形狀 sprite（32x32 橘紅漸層圓形）
            int size = 32;
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            tex.filterMode = FilterMode.Point;
            var colors = new Color[size * size];
            float center = size / 2f;
            float radius = size / 2f - 2f;

            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    float dist = Vector2.Distance(new Vector2(x, y), new Vector2(center, center));
                    if (dist < radius)
                    {
                        float t = dist / radius;
                        Color c = Color.Lerp(
                            new Color(1f, 0.95f, 0.4f),   // 中心亮黃
                            new Color(1f, 0.3f, 0f),       // 邊緣橘紅
                            t * t
                        );
                        c.a = Mathf.Lerp(1f, 0.4f, t * t);
                        colors[y * size + x] = c;
                    }
                    else
                    {
                        colors[y * size + x] = Color.clear;
                    }
                }
            }
            tex.SetPixels(colors);
            tex.Apply();
            sr.sprite = Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), 32f);
        }

        var rb = go.AddComponent<Rigidbody2D>();
        rb.gravityScale = 0;
        rb.freezeRotation = true;

        var col = go.AddComponent<CircleCollider2D>();
        col.radius = 0.15f;
        col.isTrigger = true;

        go.AddComponent<ProjectileController>();
        go.transform.localScale = Vector3.one * 0.5f;

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

    /// <summary>
    /// 通用物件池 Get — 從池中取得指定 prefab 的實例
    /// 若池中無可用物件則 Instantiate 一個新的
    /// </summary>
    private Dictionary<int, Queue<GameObject>> _genericPools = new Dictionary<int, Queue<GameObject>>();

    public GameObject Get(GameObject prefab)
    {
        if (prefab == null) return null;

        int id = prefab.GetInstanceID();
        if (!_genericPools.ContainsKey(id))
        {
            _genericPools[id] = new Queue<GameObject>();
        }

        GameObject go;
        var pool = _genericPools[id];

        if (pool.Count > 0)
        {
            go = pool.Dequeue();
        }
        else
        {
            go = Instantiate(prefab, transform);
        }

        go.SetActive(true);
        return go;
    }

    /// <summary>
    /// 通用物件池歸還
    /// </summary>
    public void Release(GameObject go, GameObject prefab)
    {
        if (go == null) return;
        go.SetActive(false);

        if (prefab != null)
        {
            int id = prefab.GetInstanceID();
            if (!_genericPools.ContainsKey(id))
                _genericPools[id] = new Queue<GameObject>();
            _genericPools[id].Enqueue(go);
        }
    }
}
