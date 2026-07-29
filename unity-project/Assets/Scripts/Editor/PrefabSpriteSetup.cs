using UnityEngine;
using UnityEditor;

/// <summary>
/// PrefabSpriteSetup — 自動將切好的 Sprite Frames 設定到 Prefab 的 SpriteAnimatorController
/// 
/// 使用方式：
///   1. 先執行 "EndlessHeroes → 6. Import & Slice All Sprite Strips"
///   2. 再執行 "EndlessHeroes → 10. Auto Setup Prefab Sprites"
/// 
/// 此工具會：
///   - 對每個 Player prefab 設定 idle/run 動畫幀
///   - 對每個 Enemy prefab 設定 idle 動畫幀
///   - 對每個 Boss prefab 設定 idle 動畫幀
/// </summary>
public class PrefabSpriteSetup : Editor
{
    [MenuItem("EndlessHeroes/10. Auto Setup Prefab Sprites")]
    public static void SetupAllPrefabSprites()
    {
        SetupPlayerPrefabs();
        SetupEnemyPrefabs();
        SetupBossPrefabs();

        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();
        Debug.Log("[PrefabSpriteSetup] ✓ All prefab sprites configured!");
    }

    // ============================================================
    // Player Prefabs
    // ============================================================

    private static void SetupPlayerPrefabs()
    {
        // Character sprite mapping: (prefabPath, idleStripPath, runStripPath, idleFps, runFps)
        var players = new (string prefab, string idle, string run, float idleFps, float runFps)[]
        {
            ("Assets/Prefabs/Player/Player_Mage.prefab",
             "Assets/Sprites/Characters/mage_idle_4f.png",
             "Assets/Sprites/Characters/mage_run_4f.png", 6f, 10f),

            ("Assets/Prefabs/Player/Player_Archer.prefab",
             "Assets/Sprites/Characters/archer_idle_4f.png",
             "Assets/Sprites/Characters/archer_run_8f.png", 6f, 10f),

            ("Assets/Prefabs/Player/Player_Knight.prefab",
             "Assets/Sprites/Characters/golden_knight_idle_4f.png",
             "Assets/Sprites/Characters/golden_knight_run_8f.png", 6f, 10f),

            ("Assets/Prefabs/Player/Player_Valkyrie.prefab",
             "Assets/Sprites/Characters/valkyrie_idle_6f.png",
             "Assets/Sprites/Characters/valkyrie_run_6f.png", 6f, 10f),

            ("Assets/Prefabs/Player/Player_Boomerang.prefab",
             "Assets/Sprites/Characters/boomerang_idle_8f.png",
             "Assets/Sprites/Characters/boomerang_run_8f.png", 8f, 10f),

            ("Assets/Prefabs/Player/Player_Ninja.prefab",
             "Assets/Sprites/Characters/ninja_idle_8f.png",
             "Assets/Sprites/Characters/ninja_run_8f.png", 8f, 10f),
        };

        foreach (var p in players)
        {
            SetupPrefabAnim(p.prefab, p.idle, p.run, p.idleFps, p.runFps);
        }

        Debug.Log("  ✓ Player prefab sprites assigned");
    }

    // ============================================================
    // Enemy Prefabs
    // ============================================================

    private static void SetupEnemyPrefabs()
    {
        // Enemy index → idle sprite strip (matching HTML config.js order)
        var enemies = new (string prefab, string idle, float fps)[]
        {
            ("Assets/Prefabs/Enemies/Enemy_00.prefab", "Assets/Sprites/Enemies/enemy_slime2_idle_4f.png", 8f),
            ("Assets/Prefabs/Enemies/Enemy_01.prefab", "Assets/Sprites/Enemies/desert_scorpion_6f.png", 8f),
            ("Assets/Prefabs/Enemies/Enemy_02.prefab", "Assets/Sprites/Enemies/desert_skeleton_8f_4c2r.png", 8f),
            ("Assets/Prefabs/Enemies/Enemy_03.prefab", "Assets/Sprites/Enemies/monster4_idle_4f.png", 8f),
            ("Assets/Prefabs/Enemies/Enemy_04.prefab", "Assets/Sprites/Enemies/enemy_beetle_idle_8f_4c2r.png", 8f),
            ("Assets/Prefabs/Enemies/Enemy_05.prefab", "Assets/Sprites/Characters/dark_knight_walk_8f.png", 8f),
            ("Assets/Prefabs/Enemies/Enemy_06.prefab", "Assets/Sprites/Enemies/dragon_8f.png", 8f),
            ("Assets/Prefabs/Enemies/Enemy_07.prefab", "Assets/Sprites/Enemies/monster1_idle_3f.png", 8f),
            ("Assets/Prefabs/Enemies/Enemy_08.prefab", "Assets/Sprites/Enemies/monster4_idle_4f.png", 8f),
            ("Assets/Prefabs/Enemies/Enemy_09.prefab", "Assets/Sprites/Characters/dark_knight_walk_8f.png", 8f),
            ("Assets/Prefabs/Enemies/Enemy_10.prefab", "Assets/Sprites/Enemies/dragon_8f.png", 8f),
            ("Assets/Prefabs/Enemies/Enemy_11.prefab", "Assets/Sprites/Enemies/enemy_beetle_idle_8f_4c2r.png", 6f),
        };

        foreach (var e in enemies)
        {
            SetupPrefabAnim(e.prefab, e.idle, null, e.fps, 0f);
        }

        Debug.Log("  ✓ Enemy prefab sprites assigned");
    }

    // ============================================================
    // Boss Prefabs
    // ============================================================

    private static void SetupBossPrefabs()
    {
        var bosses = new (string prefab, string idle, float fps)[]
        {
            ("Assets/Prefabs/Bosses/Boss_01_Demon.prefab",       "Assets/Sprites/Bosses/boss_demon_idle_8f.png", 8f),
            ("Assets/Prefabs/Bosses/Boss_02_Gorilla.prefab",     "Assets/Sprites/Bosses/boss_gorilla_idle_8f.png", 7f),
            ("Assets/Prefabs/Bosses/Boss_03_BeetleKnight.prefab","Assets/Sprites/Bosses/desert_boss_scorpion_king_8f_4c2r.png", 8f),
            ("Assets/Prefabs/Bosses/Boss_04_BigDragon.prefab",   "Assets/Sprites/Bosses/desert_boss_sandworm_8f_4c2r.png", 8f),
            ("Assets/Prefabs/Bosses/Boss_05_SkeletonKing.prefab","Assets/Sprites/Bosses/boss_beetle_knight_idle_3f.png", 8f),
            ("Assets/Prefabs/Bosses/Boss_06_Gnu.prefab",         "Assets/Sprites/Bosses/big_dragon_8f_4c2r.png", 6f),
            ("Assets/Prefabs/Bosses/Boss_07_Mage.prefab",        "Assets/Sprites/Bosses/boss_skeletonking_9f.png", 6f),
            ("Assets/Prefabs/Bosses/Boss_08_MachineDragon.prefab","Assets/Sprites/Bosses/boss_gnu_idle_5f.png", 7f),
            ("Assets/Prefabs/Bosses/Boss_09_KingSlime.prefab",   "Assets/Sprites/Bosses/boss_mage3_idle_4f.png", 6f),
            ("Assets/Prefabs/Bosses/Boss_10_DarkDragon.prefab",  "Assets/Sprites/Bosses/boss_machine_dragon_idle_4f.png", 6f),
        };

        foreach (var b in bosses)
        {
            SetupPrefabAnim(b.prefab, b.idle, null, b.fps, 0f);
        }

        // Extra bosses reuse the generic prefab
        Debug.Log("  ✓ Boss prefab sprites assigned");
    }

    // ============================================================
    // Core: Open prefab, find SpriteAnimatorController, assign frames
    // ============================================================

    private static void SetupPrefabAnim(string prefabPath, string idlePath, string runPath, float idleFps, float runFps)
    {
        var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath);
        if (prefab == null)
        {
            Debug.LogWarning($"  [PrefabSpriteSetup] Prefab not found: {prefabPath}");
            return;
        }

        // 使用 SerializedObject 修改 prefab 中的 SpriteAnimatorController
        var animator = prefab.GetComponent<SpriteAnimatorController>();
        if (animator == null)
        {
            // 嘗試子物件
            animator = prefab.GetComponentInChildren<SpriteAnimatorController>();
        }

        if (animator == null)
        {
            Debug.LogWarning($"  [PrefabSpriteSetup] No SpriteAnimatorController on: {prefabPath}");
            return;
        }

        var so = new SerializedObject(animator);

        // Idle Animation
        if (!string.IsNullOrEmpty(idlePath))
        {
            var idleFrames = GetFrames(idlePath);
            if (idleFrames.Length > 0)
            {
                var idleAnimProp = so.FindProperty("_idleAnim");
                SetAnimationSet(idleAnimProp, idleFrames, idleFps);
            }
        }

        // Run Animation
        if (!string.IsNullOrEmpty(runPath))
        {
            var runFrames = GetFrames(runPath);
            if (runFrames.Length > 0)
            {
                var runAnimProp = so.FindProperty("_runAnim");
                SetAnimationSet(runAnimProp, runFrames, runFps);
            }
        }

        so.ApplyModifiedPropertiesWithoutUndo();
        EditorUtility.SetDirty(prefab);
    }

    private static void SetAnimationSet(SerializedProperty animProp, Sprite[] frames, float fps)
    {
        if (animProp == null) return;

        var framesProp = animProp.FindPropertyRelative("frames");
        var fpsProp = animProp.FindPropertyRelative("fps");

        framesProp.ClearArray();
        for (int i = 0; i < frames.Length; i++)
        {
            framesProp.InsertArrayElementAtIndex(i);
            framesProp.GetArrayElementAtIndex(i).objectReferenceValue = frames[i];
        }

        fpsProp.floatValue = fps;
    }

    private static Sprite[] GetFrames(string assetPath)
    {
        var sprites = SpriteStripImporter.GetSpritesFromStrip(assetPath);
        if (sprites != null && sprites.Length > 0) return sprites;

        // 嘗試載入為 single sprite
        var single = AssetDatabase.LoadAssetAtPath<Sprite>(assetPath);
        if (single != null) return new Sprite[] { single };

        Debug.LogWarning($"  [PrefabSpriteSetup] No frames: {assetPath}");
        return new Sprite[0];
    }
}
