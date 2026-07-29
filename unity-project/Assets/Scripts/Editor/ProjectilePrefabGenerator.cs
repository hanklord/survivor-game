using UnityEngine;
using UnityEditor;

/// <summary>
/// ProjectilePrefabGenerator — 自動生成各角色投射物 Prefab
/// 
/// 從 Assets/Sprites/Effects/Generated/ 讀取已生成的投射物圖，
/// 建立對應的 Prefab 到 Assets/Prefabs/Projectiles/
/// 
/// 使用：EndlessHeroes → 12. Generate Projectile Prefabs
/// </summary>
public class ProjectilePrefabGenerator : Editor
{
    [MenuItem("EndlessHeroes/12. Generate Projectile Prefabs")]
    public static void GeneratePrefabs()
    {
        CreateProjectilePrefab("Projectile_Fireball", "Assets/Sprites/Effects/Generated/fireball_32x32.png",
            new Color(1f, 0.4f, 0f), 0.3f);

        CreateProjectilePrefab("Projectile_Arrow", "Assets/Sprites/Effects/Generated/arrow_32x32.png",
            Color.white, 0.35f);

        CreateProjectilePrefab("Projectile_Shuriken", "Assets/Sprites/Effects/Generated/shuriken_32x32.png",
            Color.white, 0.3f);

        CreateProjectilePrefab("Projectile_Boomerang", "Assets/Sprites/Effects/Generated/boomerang_32x32.png",
            new Color(0.9f, 0.7f, 0.2f), 0.4f);

        CreateProjectilePrefab("Projectile_EnergyBall", "Assets/Sprites/Effects/Generated/energy_ball_32x32.png",
            Color.white, 0.3f);

        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();
        Debug.Log("[EndlessHeroes] ✓ All projectile prefabs generated!");
    }

    private static void CreateProjectilePrefab(string prefabName, string spritePath, Color tint, float scale)
    {
        // 載入 sprite
        var sprite = AssetDatabase.LoadAssetAtPath<Sprite>(spritePath);
        if (sprite == null)
        {
            Debug.LogWarning($"  [PrefabGen] Sprite not found: {spritePath}");
            return;
        }

        // 建立 GameObject
        var go = new GameObject(prefabName);
        go.layer = 8; // Projectile layer

        // SpriteRenderer
        var sr = go.AddComponent<SpriteRenderer>();
        sr.sprite = sprite;
        sr.color = tint;
        sr.sortingOrder = 5;

        // Rigidbody2D
        var rb = go.AddComponent<Rigidbody2D>();
        rb.gravityScale = 0f;
        rb.freezeRotation = true;
        rb.bodyType = RigidbodyType2D.Kinematic;

        // CircleCollider2D (trigger)
        var col = go.AddComponent<CircleCollider2D>();
        col.radius = 0.15f;
        col.isTrigger = true;

        // ProjectileController
        go.AddComponent<ProjectileController>();

        // Scale
        go.transform.localScale = Vector3.one * scale;

        // 儲存為 Prefab
        string prefabPath = $"Assets/Prefabs/Projectiles/{prefabName}.prefab";

        // 確保目錄存在
        if (!AssetDatabase.IsValidFolder("Assets/Prefabs/Projectiles"))
        {
            AssetDatabase.CreateFolder("Assets/Prefabs", "Projectiles");
        }

        // 儲存（覆蓋已存在的）
        PrefabUtility.SaveAsPrefabAsset(go, prefabPath);
        Object.DestroyImmediate(go);

        Debug.Log($"  ✓ Created prefab: {prefabPath}");
    }
}
