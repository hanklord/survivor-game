using UnityEngine;

/// <summary>
/// ProjectileController — 投射物控制器
/// 對應原始架構: projectile.js Projectile class
/// 支援物件池重用、命中回調
/// </summary>
public class ProjectileController : MonoBehaviour
{
    public float Damage { get; private set; }
    public bool IsActive { get; private set; }

    /// <summary>
    /// 命中時的回調（用於火焰區域等特效）
    /// </summary>
    public System.Action<Vector3> OnHitCallback { get; set; }

    private Vector2 _velocity;
    private float _lifetime;
    private float _timer;
    private bool _piercing;
    private int _pierceCount;
    private int _maxPierce = 1;

    /// <summary>
    /// 初始化投射物（從物件池取出時呼叫）
    /// </summary>
    public void Initialize(Vector2 velocity, float damage, float lifetime, bool piercing = false, int maxPierce = 1)
    {
        _velocity = velocity;
        Damage = damage;
        _lifetime = lifetime;
        _timer = 0f;
        _piercing = piercing;
        _maxPierce = maxPierce;
        _pierceCount = 0;
        IsActive = true;
        OnHitCallback = null;

        // 設定旋轉朝向飛行方向
        float angle = Mathf.Atan2(velocity.y, velocity.x) * Mathf.Rad2Deg;
        transform.rotation = Quaternion.Euler(0, 0, angle);

        gameObject.SetActive(true);

        // 確保 SpriteRenderer 可見
        var sr = GetComponent<SpriteRenderer>();
        if (sr != null && sr.sprite == null)
        {
            // 建立 placeholder sprite
            var tex = new Texture2D(16, 16);
            var colors = new Color[16 * 16];
            for (int i = 0; i < colors.Length; i++) colors[i] = Color.white;
            tex.SetPixels(colors);
            tex.Apply();
            sr.sprite = Sprite.Create(tex, new Rect(0, 0, 16, 16), new Vector2(0.5f, 0.5f), 16);
            sr.color = new Color(1f, 0.5f, 0f);
        }
    }

    private void Update()
    {
        if (!IsActive) return;

        // 移動
        transform.position += (Vector3)_velocity * Time.deltaTime;

        // 壽命
        _timer += Time.deltaTime;
        if (_timer >= _lifetime)
        {
            Deactivate();
        }
    }

    private void OnTriggerEnter2D(Collider2D other)
    {
        if (!IsActive) return;

        // 碰到敵人
        var enemy = other.GetComponent<EnemyBase>();
        if (enemy != null)
        {
            enemy.TakeDamage(Damage);
            DamageNumberManager.Instance.Spawn(other.transform.position, Damage);
            OnHitCallback?.Invoke(other.transform.position);

            _pierceCount++;
            if (!_piercing || _pierceCount >= _maxPierce)
            {
                Deactivate();
            }
            return;
        }

        // 碰到 Boss
        var boss = other.GetComponent<BossController>();
        if (boss != null)
        {
            boss.TakeDamage(Damage);
            DamageNumberManager.Instance.Spawn(other.transform.position, Damage);
            OnHitCallback?.Invoke(other.transform.position);

            _pierceCount++;
            if (!_piercing || _pierceCount >= _maxPierce)
            {
                Deactivate();
            }
        }
    }

    /// <summary>
    /// 停用並歸還物件池
    /// </summary>
    public void Deactivate()
    {
        IsActive = false;
        gameObject.SetActive(false);
        GameManager.Instance.PoolManager.ReleaseProjectile(this);
    }
}

/// <summary>
/// 法師投射物發射器（靜態工具類）
/// 對應原始架構: Projectile.fireAtTargets
/// </summary>
public static class ProjectileFirer
{
    /// <summary>
    /// 向多目標發射多顆投射物
    /// </summary>
    public static void FireAtTargets(PlayerController player, float projectileSpeed, float lifetime)
    {
        var enemies = GameManager.Instance.Enemies;
        var bosses = GameManager.Instance.Bosses;
        int count = player.ProjectileCount;

        // 收集所有目標
        var targets = new System.Collections.Generic.List<Transform>();
        foreach (var e in enemies) targets.Add(e.transform);
        foreach (var b in bosses) targets.Add(b.transform);

        if (targets.Count == 0)
        {
            // 無目標時向面朝方向發射
            Vector2 dir = player.FacingLeft ? Vector2.left : Vector2.right;
            for (int i = 0; i < count; i++)
            {
                float spread = (i - count / 2f) * 10f;
                Vector2 spreadDir = RotateVector(dir, spread);
                SpawnProjectile(player.transform.position, spreadDir * projectileSpeed, player.GetTotalDamage(), lifetime);
            }
            return;
        }

        // 對最近的目標發射
        targets.Sort((a, b) =>
            Vector2.Distance(player.transform.position, a.position)
            .CompareTo(Vector2.Distance(player.transform.position, b.position)));

        for (int i = 0; i < count; i++)
        {
            Transform target = targets[i % targets.Count];
            Vector2 dir = (target.position - player.transform.position).normalized;

            // 加入少量散射
            float spread = (i - count / 2f) * 5f;
            dir = RotateVector(dir, spread);

            SpawnProjectile(player.transform.position, dir * projectileSpeed, player.GetTotalDamage(), lifetime);
        }

        GameManager.Instance.AudioManager.PlaySFX(SFXType.Shoot);
    }

    private static void SpawnProjectile(Vector3 pos, Vector2 velocity, float damage, float lifetime)
    {
        var proj = GameManager.Instance.PoolManager.GetProjectile();
        if (proj == null) return;

        proj.transform.position = pos;
        proj.Initialize(velocity, damage, lifetime);
    }

    private static Vector2 RotateVector(Vector2 v, float degrees)
    {
        float rad = degrees * Mathf.Deg2Rad;
        float cos = Mathf.Cos(rad);
        float sin = Mathf.Sin(rad);
        return new Vector2(v.x * cos - v.y * sin, v.x * sin + v.y * cos);
    }
}
