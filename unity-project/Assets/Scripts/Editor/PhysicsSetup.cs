using UnityEngine;
using UnityEditor;

/// <summary>
/// PhysicsSetup — 自動設定 Physics2D 碰撞矩陣
/// EndlessHeroes → 3. Setup Physics Layers
/// </summary>
public class PhysicsSetup : Editor
{
    // Layer indices
    private const int LAYER_DEFAULT = 0;
    private const int LAYER_PLAYER = 6;
    private const int LAYER_ENEMY = 7;
    private const int LAYER_PROJECTILE = 8;
    private const int LAYER_PICKUP = 9;

    [MenuItem("EndlessHeroes/3. Setup Physics2D Collision Matrix")]
    public static void SetupCollisionMatrix()
    {
        // 先清除所有碰撞（全部設為不碰撞）
        for (int i = 0; i < 32; i++)
        {
            for (int j = 0; j < 32; j++)
            {
                Physics2D.IgnoreLayerCollision(i, j, true);
            }
        }

        // 設定允許的碰撞
        // Default 與 Default
        Physics2D.IgnoreLayerCollision(LAYER_DEFAULT, LAYER_DEFAULT, false);

        // Player 與 Enemy 碰撞
        Physics2D.IgnoreLayerCollision(LAYER_PLAYER, LAYER_ENEMY, false);

        // Projectile 與 Enemy 碰撞
        Physics2D.IgnoreLayerCollision(LAYER_PROJECTILE, LAYER_ENEMY, false);

        // Pickup 與 Player 碰撞
        Physics2D.IgnoreLayerCollision(LAYER_PICKUP, LAYER_PLAYER, false);

        // Default 與 Player/Enemy（可選，保險起見）
        Physics2D.IgnoreLayerCollision(LAYER_DEFAULT, LAYER_PLAYER, false);
        Physics2D.IgnoreLayerCollision(LAYER_DEFAULT, LAYER_ENEMY, false);

        Debug.Log("[EndlessHeroes] Physics2D Collision Matrix configured:");
        Debug.Log("  ✓ Player ↔ Enemy");
        Debug.Log("  ✓ Projectile → Enemy");
        Debug.Log("  ✓ Pickup → Player");
        Debug.Log("  ✗ Projectile ✗ Player (no friendly fire)");
        Debug.Log("  ✗ Pickup ✗ Enemy (enemies can't pick up)");
        Debug.Log("  ✗ Enemy ✗ Enemy (no enemy collision)");

        EditorUtility.DisplayDialog("Physics2D Setup Complete",
            "Collision matrix configured:\n\n" +
            "✓ Player ↔ Enemy\n" +
            "✓ Projectile → Enemy\n" +
            "✓ Pickup → Player\n\n" +
            "All other layer pairs: No collision",
            "OK");
    }
}
