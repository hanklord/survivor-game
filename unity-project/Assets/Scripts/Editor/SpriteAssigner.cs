using UnityEngine;
using UnityEditor;
using System.Collections.Generic;

/// <summary>
/// SpriteAssigner — 自動將切割好的 sprite 指定到 Prefab 和 GameConfig
/// EndlessHeroes → 7. Assign Sprites to Prefabs
/// </summary>
public class SpriteAssigner : Editor
{
    [MenuItem("EndlessHeroes/7. Assign Sprites to Prefabs & Config")]
    public static void AssignAll()
    {
        AssignPlayerSprites();
        AssignProjectileSprite();
        AssignXPGemSprite();
        AssignBackgroundSprites();

        AssetDatabase.SaveAssets();
        Debug.Log("[EndlessHeroes] All sprites assigned!");
    }

    private static void AssignPlayerSprites()
    {
        // Mage
        AssignPlayerPrefabSprites("Assets/Prefabs/Player/Player_Mage.prefab",
            "Assets/Sprites/Characters/mage_idle_4f.png",
            "Assets/Sprites/Characters/mage_run_4f.png", 6, 10);

        // Archer
        AssignPlayerPrefabSprites("Assets/Prefabs/Player/Player_Archer.prefab",
            "Assets/Sprites/Characters/archer_idle_4f.png",
            "Assets/Sprites/Characters/archer_run_8f.png", 6, 10);

        // Knight
        AssignPlayerPrefabSprites("Assets/Prefabs/Player/Player_Knight.prefab",
            "Assets/Sprites/Characters/golden_knight_idle_4f.png",
            "Assets/Sprites/Characters/golden_knight_run_8f.png", 6, 10);

        // Valkyrie
        AssignPlayerPrefabSprites("Assets/Prefabs/Player/Player_Valkyrie.prefab",
            "Assets/Sprites/Characters/valkyrie_idle_6f.png",
            "Assets/Sprites/Characters/valkyrie_run_6f.png", 6, 10);
    }

    private static void AssignPlayerPrefabSprites(string prefabPath, string idlePath, string runPath, float idleFps, float runFps)
    {
        var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath);
        if (prefab == null) { Debug.LogWarning("Prefab not found: " + prefabPath); return; }

        var idleSprites = SpriteStripImporter.GetSpritesFromStrip(idlePath);
        var runSprites = SpriteStripImporter.GetSpritesFromStrip(runPath);

        // 修改 prefab
        var instance = PrefabUtility.InstantiatePrefab(prefab) as GameObject;
        var animator = instance.GetComponent<SpriteAnimatorController>();

        if (animator != null)
        {
            var so = new SerializedObject(animator);

            // Idle animation
            var idleAnim = so.FindProperty("_idleAnim");
            if (idleAnim != null && idleSprites.Length > 0)
            {
                var frames = idleAnim.FindPropertyRelative("frames");
                frames.arraySize = idleSprites.Length;
                for (int i = 0; i < idleSprites.Length; i++)
                    frames.GetArrayElementAtIndex(i).objectReferenceValue = idleSprites[i];
                idleAnim.FindPropertyRelative("fps").floatValue = idleFps;
            }

            // Run animation
            var runAnim = so.FindProperty("_runAnim");
            if (runAnim != null && runSprites.Length > 0)
            {
                var frames = runAnim.FindPropertyRelative("frames");
                frames.arraySize = runSprites.Length;
                for (int i = 0; i < runSprites.Length; i++)
                    frames.GetArrayElementAtIndex(i).objectReferenceValue = runSprites[i];
                runAnim.FindPropertyRelative("fps").floatValue = runFps;
            }

            so.ApplyModifiedProperties();
        }

        // 設定預設 Sprite 為第一幀
        var sr = instance.GetComponent<SpriteRenderer>();
        if (sr != null && idleSprites.Length > 0)
        {
            sr.sprite = idleSprites[0];
        }

        PrefabUtility.SaveAsPrefabAsset(instance, prefabPath);
        DestroyImmediate(instance);
        Debug.Log("  ✓ " + prefabPath);
    }

    private static void AssignProjectileSprite()
    {
        var sprite = AssetDatabase.LoadAssetAtPath<Sprite>("Assets/Sprites/Effects/projectile.png");
        if (sprite == null) return;

        var prefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/Projectiles/Projectile.prefab");
        if (prefab == null) return;

        var instance = PrefabUtility.InstantiatePrefab(prefab) as GameObject;
        var sr = instance.GetComponent<SpriteRenderer>();
        if (sr != null) sr.sprite = sprite;

        PrefabUtility.SaveAsPrefabAsset(instance, "Assets/Prefabs/Projectiles/Projectile.prefab");
        DestroyImmediate(instance);
        Debug.Log("  ✓ Projectile sprite assigned");
    }

    private static void AssignXPGemSprite()
    {
        var sprite = AssetDatabase.LoadAssetAtPath<Sprite>("Assets/Sprites/Pickups/xp_gem.png");
        if (sprite == null) return;

        var prefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/Pickups/XPGem.prefab");
        if (prefab == null) return;

        var instance = PrefabUtility.InstantiatePrefab(prefab) as GameObject;
        var sr = instance.GetComponent<SpriteRenderer>();
        if (sr != null) sr.sprite = sprite;

        PrefabUtility.SaveAsPrefabAsset(instance, "Assets/Prefabs/Pickups/XPGem.prefab");
        DestroyImmediate(instance);
        Debug.Log("  ✓ XP Gem sprite assigned");
    }

    private static void AssignBackgroundSprites()
    {
        var config = AssetDatabase.LoadAssetAtPath<GameConfig>("Assets/ScriptableObjects/GameConfig.asset");
        if (config == null) return;

        var so = new SerializedObject(config);
        var levels = so.FindProperty("levels");
        if (levels == null) return;

        string[] bgPaths = new string[]
        {
            "Assets/Sprites/Backgrounds/grass.png",
            "Assets/Sprites/Backgrounds/cave.png",
            "Assets/Sprites/Backgrounds/swamp.png",
            "Assets/Sprites/Backgrounds/volcano.png",
            "Assets/Sprites/Backgrounds/hell.png",
        };

        string[] bgmPaths = new string[]
        {
            "Assets/Audio/BGM/bgm.mp3",
            "Assets/Audio/BGM/bgm_level2.mp3",
            "Assets/Audio/BGM/bgm_level3.mp3",
            "Assets/Audio/BGM/bgm_level4.mp3",
            "Assets/Audio/BGM/bgm_level5.mp3",
        };

        for (int i = 0; i < Mathf.Min(levels.arraySize, bgPaths.Length); i++)
        {
            var elem = levels.GetArrayElementAtIndex(i);

            // Background texture (Texture2D)
            var bgTex = AssetDatabase.LoadAssetAtPath<Texture2D>(bgPaths[i]);
            if (bgTex != null)
            {
                var bgProp = elem.FindPropertyRelative("bgTexture");
                if (bgProp != null) bgProp.objectReferenceValue = bgTex;
            }

            // BGM
            var bgmClip = AssetDatabase.LoadAssetAtPath<AudioClip>(bgmPaths[i]);
            if (bgmClip != null)
            {
                var bgmProp = elem.FindPropertyRelative("bgm");
                if (bgmProp != null) bgmProp.objectReferenceValue = bgmClip;
            }
        }

        // Default BGM
        var defaultBgm = AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/Audio/BGM/bgm.mp3");
        if (defaultBgm != null)
        {
            var audioProp = so.FindProperty("audio");
            if (audioProp != null)
            {
                var defBgmProp = audioProp.FindPropertyRelative("defaultBGM");
                if (defBgmProp != null) defBgmProp.objectReferenceValue = defaultBgm;
            }
        }

        so.ApplyModifiedProperties();
        Debug.Log("  ✓ Level backgrounds (Texture2D) & BGM assigned to GameConfig");
    }
}
