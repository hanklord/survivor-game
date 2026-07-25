using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine.UI;
using TMPro;

/// <summary>
/// SceneBuilder — 一鍵建構初始場景與所有 Prefab
/// Unity 6 + URP + ECS/DOTS 版本
/// 選單：EndlessHeroes → Build Scene / Build Prefabs
/// </summary>
public class SceneBuilder : Editor
{
    // ============================================================
    // 選單項目
    // ============================================================

    [MenuItem("EndlessHeroes/0. Setup URP Pipeline", priority = 0)]
    public static void SetupURPProxy()
    {
        URPSetup.SetupURP();
    }

    [MenuItem("EndlessHeroes/1. Build All Prefabs", priority = 10)]
    public static void BuildAllPrefabs()
    {
        SetupTagsAndLayers();
        EnsureFolders();

        BuildProjectilePrefab();
        BuildXPGemPrefab();
        BuildDamageNumberPrefab();
        BuildPlayerPrefabs();
        BuildEnemyPrefabs();
        BuildBossPrefabs();
        BuildEffectPrefabs();
        BuildPickupPrefabs();

        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();
        Debug.Log("[EndlessHeroes] All prefabs built successfully!");
    }

    [MenuItem("EndlessHeroes/2. Build Main Scene", priority = 20)]
    public static void BuildMainScene()
    {
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        // === Main Camera ===
        var cameraGO = new GameObject("Main Camera");
        var cam = cameraGO.AddComponent<Camera>();
        cam.orthographic = true;
        cam.orthographicSize = 8f;
        cam.backgroundColor = new Color(0.1f, 0.1f, 0.18f);
        cam.clearFlags = CameraClearFlags.SolidColor;
        cameraGO.AddComponent<AudioListener>();
        cameraGO.AddComponent<CameraFollow>();
        cameraGO.AddComponent<CameraShake>();
        cameraGO.tag = "MainCamera";
        cameraGO.transform.position = new Vector3(0, 0, -10);

        // === GameManager ===
        var gmGO = new GameObject("GameManager");
        gmGO.AddComponent<GameManager>();
        gmGO.AddComponent<InputManager>();
        gmGO.AddComponent<GameBootstrap>();

        // Audio Manager
        var audioGO = new GameObject("AudioManager");
        audioGO.transform.SetParent(gmGO.transform);
        audioGO.AddComponent<AudioManager>();
        var bgmSource = audioGO.AddComponent<AudioSource>();
        bgmSource.loop = true;
        bgmSource.playOnAwake = false;
        var sfxGO = new GameObject("SFX Source");
        sfxGO.transform.SetParent(audioGO.transform);
        sfxGO.AddComponent<AudioSource>().playOnAwake = false;

        // Object Pool Manager
        var poolGO = new GameObject("ObjectPoolManager");
        poolGO.transform.SetParent(gmGO.transform);
        poolGO.AddComponent<ObjectPoolManager>();

        // Weapon Manager
        var weaponGO = new GameObject("WeaponManager");
        weaponGO.transform.SetParent(gmGO.transform);
        weaponGO.AddComponent<WeaponManager>();

        // Wave Manager
        var waveGO = new GameObject("WaveManager");
        waveGO.transform.SetParent(gmGO.transform);
        waveGO.AddComponent<WaveManager>();

        // Level Manager
        var levelGO = new GameObject("LevelManager");
        levelGO.transform.SetParent(gmGO.transform);
        levelGO.AddComponent<LevelManager>();

        // === ECS Enemy Spawner ===
        var ecsSpawnerGO = new GameObject("ECS_EnemySpawner");
        ecsSpawnerGO.AddComponent<EnemySpawnerAuthoring>();

        // === Background ===
        var bgGO = new GameObject("Background");
        bgGO.AddComponent<SpriteRenderer>();
        bgGO.AddComponent<BackgroundScroller>();
        bgGO.transform.position = new Vector3(0, 0, 5);

        // === Canvas (UI) ===
        var canvasGO = new GameObject("Canvas");
        var canvas = canvasGO.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvasGO.AddComponent<CanvasScaler>();
        canvasGO.AddComponent<GraphicRaycaster>();
        canvasGO.AddComponent<UIManager>();

        // HUD Panel
        var hudGO = new GameObject("HUD");
        hudGO.transform.SetParent(canvasGO.transform, false);
        var hudRT = hudGO.AddComponent<RectTransform>();
        hudRT.anchorMin = Vector2.zero;
        hudRT.anchorMax = Vector2.one;
        hudRT.sizeDelta = Vector2.zero;

        // HP Bar
        CreateUIText(hudGO.transform, "HPText", new Vector2(10, -10), "HP: 100/100");
        // Level / Kill Count
        CreateUIText(hudGO.transform, "LevelText", new Vector2(10, -40), "Lv.1 | Kills: 0");
        // Combo
        CreateUIText(hudGO.transform, "ComboText", new Vector2(10, -70), "");
        // Bomb gauge
        CreateUIText(hudGO.transform, "BombText", new Vector2(-10, -10), "Bomb: 0/30", TextAnchor.UpperRight);

        // Boss HP Bar (initially hidden)
        var bossBarGO = new GameObject("BossHealthBar");
        bossBarGO.transform.SetParent(canvasGO.transform, false);
        var bossBarRT = bossBarGO.AddComponent<RectTransform>();
        bossBarRT.anchorMin = new Vector2(0.2f, 0.9f);
        bossBarRT.anchorMax = new Vector2(0.8f, 0.93f);
        bossBarRT.sizeDelta = Vector2.zero;
        var bossBarImg = bossBarGO.AddComponent<Image>();
        bossBarImg.color = new Color(0.2f, 0.2f, 0.2f, 0.8f);
        bossBarGO.SetActive(false);

        // Game Over Panel (initially hidden)
        var gameOverGO = new GameObject("GameOverPanel");
        gameOverGO.transform.SetParent(canvasGO.transform, false);
        var goRT = gameOverGO.AddComponent<RectTransform>();
        goRT.anchorMin = Vector2.zero;
        goRT.anchorMax = Vector2.one;
        goRT.sizeDelta = Vector2.zero;
        gameOverGO.AddComponent<Image>().color = new Color(0, 0, 0, 0.7f);
        CreateUIText(gameOverGO.transform, "GameOverText", Vector2.zero, "GAME OVER", TextAnchor.MiddleCenter);
        gameOverGO.SetActive(false);

        // Level Up Panel (initially hidden)
        var levelUpGO = new GameObject("LevelUpPanel");
        levelUpGO.transform.SetParent(canvasGO.transform, false);
        var luRT = levelUpGO.AddComponent<RectTransform>();
        luRT.anchorMin = Vector2.zero;
        luRT.anchorMax = Vector2.one;
        luRT.sizeDelta = Vector2.zero;
        levelUpGO.AddComponent<Image>().color = new Color(0, 0, 0, 0.5f);
        CreateUIText(levelUpGO.transform, "LevelUpTitle", new Vector2(0, 100), "LEVEL UP!", TextAnchor.MiddleCenter);
        levelUpGO.SetActive(false);

        // === EventSystem ===
        var eventSysGO = new GameObject("EventSystem");
        eventSysGO.AddComponent<UnityEngine.EventSystems.EventSystem>();
        eventSysGO.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();

        // === Particle Systems Container ===
        var particlesGO = new GameObject("ParticleContainer");
        particlesGO.AddComponent<ParticleSpawner>();

        // Save Scene
        string scenePath = "Assets/Scenes/MainScene.unity";
        EditorSceneManager.SaveScene(scene, scenePath);
        Debug.Log($"[EndlessHeroes] Main Scene saved at {scenePath}");

        // 更新 Build Settings
        var buildScenes = new EditorBuildSettingsScene[]
        {
            new EditorBuildSettingsScene(scenePath, true)
        };
        EditorBuildSettings.scenes = buildScenes;
        Debug.Log("[EndlessHeroes] Build Settings updated.");
    }

    [MenuItem("EndlessHeroes/3. Setup Physics Layers", priority = 30)]
    public static void SetupPhysicsProxy()
    {
        PhysicsSetup.SetupCollisionMatrix();
    }

    // ============================================================
    // 內部方法
    // ============================================================

    private static void EnsureFolders()
    {
        string[] folders = new[]
        {
            "Assets/Prefabs",
            "Assets/Prefabs/Player",
            "Assets/Prefabs/Enemies",
            "Assets/Prefabs/Bosses",
            "Assets/Prefabs/Projectiles",
            "Assets/Prefabs/Effects",
            "Assets/Prefabs/Pickups",
            "Assets/Prefabs/UI",
            "Assets/Settings",
            "Assets/Settings/URP"
        };

        foreach (var f in folders)
        {
            var parts = f.Split('/');
            string current = parts[0];
            for (int i = 1; i < parts.Length; i++)
            {
                string next = current + "/" + parts[i];
                if (!AssetDatabase.IsValidFolder(next))
                    AssetDatabase.CreateFolder(current, parts[i]);
                current = next;
            }
        }
    }

    private static void SetupTagsAndLayers()
    {
        // Tags
        AddTag("Enemy");
        AddTag("Boss");
        AddTag("Projectile");
        AddTag("Pickup");
        AddTag("XPGem");

        // Layers (6-9 custom)
        SetLayer(6, "Player");
        SetLayer(7, "Enemy");
        SetLayer(8, "Projectile");
        SetLayer(9, "Pickup");

        Debug.Log("[EndlessHeroes] Tags & Layers configured.");
    }

    private static void AddTag(string tag)
    {
        var tagManager = new SerializedObject(
            AssetDatabase.LoadMainAssetAtPath("ProjectSettings/TagManager.asset"));
        var tags = tagManager.FindProperty("tags");

        for (int i = 0; i < tags.arraySize; i++)
        {
            if (tags.GetArrayElementAtIndex(i).stringValue == tag)
                return;
        }

        tags.arraySize++;
        tags.GetArrayElementAtIndex(tags.arraySize - 1).stringValue = tag;
        tagManager.ApplyModifiedProperties();
    }

    private static void SetLayer(int index, string name)
    {
        var tagManager = new SerializedObject(
            AssetDatabase.LoadMainAssetAtPath("ProjectSettings/TagManager.asset"));
        var layers = tagManager.FindProperty("layers");

        if (layers.GetArrayElementAtIndex(index).stringValue != name)
        {
            layers.GetArrayElementAtIndex(index).stringValue = name;
            tagManager.ApplyModifiedProperties();
        }
    }

    // === Prefab Builders ===

    private static void BuildProjectilePrefab()
    {
        var go = new GameObject("Projectile");
        var sr = go.AddComponent<SpriteRenderer>();
        sr.sortingOrder = 5;
        var rb = go.AddComponent<Rigidbody2D>();
        rb.gravityScale = 0;
        rb.bodyType = RigidbodyType2D.Kinematic;
        var col = go.AddComponent<CircleCollider2D>();
        col.isTrigger = true;
        col.radius = 0.12f;
        go.AddComponent<ProjectileController>();
        go.tag = "Projectile";
        go.layer = 8;

        SavePrefab(go, "Assets/Prefabs/Projectiles/Projectile.prefab");
    }

    private static void BuildXPGemPrefab()
    {
        var go = new GameObject("XPGem");
        var sr = go.AddComponent<SpriteRenderer>();
        sr.sortingOrder = 2;
        sr.color = new Color(0, 1, 0.53f);
        var col = go.AddComponent<CircleCollider2D>();
        col.isTrigger = true;
        col.radius = 0.15f;
        go.AddComponent<XPGemController>();
        go.tag = "XPGem";
        go.layer = 9;

        SavePrefab(go, "Assets/Prefabs/Pickups/XPGem.prefab");
    }

    private static void BuildDamageNumberPrefab()
    {
        var go = new GameObject("DamageNumber");
        var tmp = go.AddComponent<TextMeshPro>();
        tmp.alignment = TextAlignmentOptions.Center;
        tmp.fontSize = 4;
        tmp.color = Color.white;
        tmp.sortingOrder = 100;
        go.AddComponent<DamageNumberInstance>();

        SavePrefab(go, "Assets/Prefabs/Effects/DamageNumber.prefab");
    }

    private static void BuildPlayerPrefabs()
    {
        string[] names = { "Mage", "Archer", "Knight", "Valkyrie", "Boomerang", "Ninja" };
        System.Type[] attacks = {
            typeof(MageAttack),
            typeof(ArcherAttack),
            typeof(MeleeAttack),
            typeof(ValkyrieAttack),
            typeof(BoomerangAttack),
            typeof(NinjaAttack)
        };

        for (int i = 0; i < names.Length; i++)
        {
            var go = new GameObject($"Player_{names[i]}");
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sortingOrder = 10;
            var rb = go.AddComponent<Rigidbody2D>();
            rb.gravityScale = 0;
            rb.bodyType = RigidbodyType2D.Dynamic;
            rb.freezeRotation = true;
            var col = go.AddComponent<CircleCollider2D>();
            col.radius = 0.3f;
            go.AddComponent<PlayerController>();
            go.AddComponent(attacks[i]);
            go.AddComponent<SpriteAnimatorController>();
            go.AddComponent<PlayerPositionSync>(); // ECS 橋接
            go.tag = "Player";
            go.layer = 6;

            SavePrefab(go, $"Assets/Prefabs/Player/Player_{names[i]}.prefab");
        }
    }

    private static void BuildEnemyPrefabs()
    {
        // 基礎敵人 (MonoBehaviour 版 - 備用)
        for (int i = 0; i < 12; i++)
        {
            var go = new GameObject($"Enemy_{i:D2}");
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sortingOrder = 8;
            var rb = go.AddComponent<Rigidbody2D>();
            rb.gravityScale = 0;
            rb.bodyType = RigidbodyType2D.Kinematic;
            var col = go.AddComponent<CircleCollider2D>();
            col.isTrigger = true;
            col.radius = 0.36f;
            go.AddComponent<EnemyBase>();
            go.AddComponent<SpriteAnimatorController>();

            // ECS Authoring
            var authoring = go.AddComponent<EnemyAuthoring>();
            authoring.enemyTypeIndex = i;

            go.tag = "Enemy";
            go.layer = 7;

            SavePrefab(go, $"Assets/Prefabs/Enemies/Enemy_{i:D2}.prefab");
        }
    }

    private static void BuildBossPrefabs()
    {
        string[] bossNames = {
            "Demon", "Gorilla", "BeetleKnight", "BigDragon", "SkeletonKing",
            "Gnu", "Mage", "MachineDragon", "KingSlime", "DarkDragon"
        };

        for (int i = 0; i < bossNames.Length; i++)
        {
            var go = new GameObject($"Boss_{i + 1:D2}_{bossNames[i]}");
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sortingOrder = 9;
            var rb = go.AddComponent<Rigidbody2D>();
            rb.gravityScale = 0;
            rb.bodyType = RigidbodyType2D.Kinematic;
            var col = go.AddComponent<CircleCollider2D>();
            col.isTrigger = true;
            col.radius = 1.44f;
            go.AddComponent<BossController>();
            go.AddComponent<SpriteAnimatorController>();
            go.tag = "Boss";
            go.layer = 7;

            SavePrefab(go, $"Assets/Prefabs/Bosses/Boss_{i + 1:D2}_{bossNames[i]}.prefab");
        }
    }

    private static void BuildEffectPrefabs()
    {
        // Slash Effect
        BuildSimpleEffectPrefab("SlashEffect", "Assets/Prefabs/Effects/SlashEffect.prefab");
        // Thrust Effect (Valkyrie)
        BuildSimpleEffectPrefab("ThrustEffect", "Assets/Prefabs/Effects/ThrustEffect.prefab");
        // Explosion
        BuildSimpleEffectPrefab("ExplosionEffect", "Assets/Prefabs/Effects/ExplosionEffect.prefab");
        // Nova
        BuildSimpleEffectPrefab("NovaEffect", "Assets/Prefabs/Effects/NovaEffect.prefab");
        // Shockwave
        BuildSimpleEffectPrefab("ShockwaveEffect", "Assets/Prefabs/Effects/ShockwaveEffect.prefab");
        // Thunder
        BuildSimpleEffectPrefab("ThunderEffect", "Assets/Prefabs/Effects/ThunderEffect.prefab");
        // Fire Zone
        var fireZone = new GameObject("FireZone");
        fireZone.AddComponent<SpriteRenderer>().sortingOrder = 3;
        var fzCol = fireZone.AddComponent<CircleCollider2D>();
        fzCol.isTrigger = true;
        fzCol.radius = 1f;
        fireZone.AddComponent<FireZone>();
        fireZone.AddComponent<SpriteAnimatorController>();
        SavePrefab(fireZone, "Assets/Prefabs/Effects/FireZone.prefab");
        // Shield Ball
        var shieldBall = new GameObject("ShieldBall");
        shieldBall.AddComponent<SpriteRenderer>().sortingOrder = 11;
        var sbCol = shieldBall.AddComponent<CircleCollider2D>();
        sbCol.isTrigger = true;
        sbCol.radius = 0.2f;
        SavePrefab(shieldBall, "Assets/Prefabs/Effects/ShieldBall.prefab");
    }

    private static void BuildSimpleEffectPrefab(string name, string path)
    {
        var go = new GameObject(name);
        go.AddComponent<SpriteRenderer>().sortingOrder = 12;
        go.AddComponent<SpriteAnimatorController>();
        SavePrefab(go, path);
    }

    private static void BuildPickupPrefabs()
    {
        // Magnet
        var magnet = new GameObject("MagnetPickup");
        magnet.AddComponent<SpriteRenderer>().sortingOrder = 3;
        var mCol = magnet.AddComponent<CircleCollider2D>();
        mCol.isTrigger = true;
        mCol.radius = 0.2f;
        magnet.AddComponent<MagnetPickup>();
        magnet.tag = "Pickup";
        magnet.layer = 9;
        SavePrefab(magnet, "Assets/Prefabs/Pickups/MagnetPickup.prefab");

        // Treasure Chest
        var chest = new GameObject("TreasureChest");
        chest.AddComponent<SpriteRenderer>().sortingOrder = 3;
        var cCol = chest.AddComponent<CircleCollider2D>();
        cCol.isTrigger = true;
        cCol.radius = 0.3f;
        chest.AddComponent<TreasureChest>();
        chest.tag = "Pickup";
        chest.layer = 9;
        SavePrefab(chest, "Assets/Prefabs/Pickups/TreasureChest.prefab");
    }

    // === Helpers ===

    private static void SavePrefab(GameObject go, string path)
    {
        PrefabUtility.SaveAsPrefabAsset(go, path);
        Object.DestroyImmediate(go);
    }

    private static void CreateUIText(Transform parent, string name, Vector2 pos, string text,
        TextAnchor anchor = TextAnchor.UpperLeft)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        var rt = go.AddComponent<RectTransform>();

        switch (anchor)
        {
            case TextAnchor.UpperLeft:
                rt.anchorMin = new Vector2(0, 1);
                rt.anchorMax = new Vector2(0, 1);
                rt.pivot = new Vector2(0, 1);
                break;
            case TextAnchor.UpperRight:
                rt.anchorMin = new Vector2(1, 1);
                rt.anchorMax = new Vector2(1, 1);
                rt.pivot = new Vector2(1, 1);
                break;
            case TextAnchor.MiddleCenter:
                rt.anchorMin = new Vector2(0.5f, 0.5f);
                rt.anchorMax = new Vector2(0.5f, 0.5f);
                rt.pivot = new Vector2(0.5f, 0.5f);
                break;
        }

        rt.anchoredPosition = pos;
        rt.sizeDelta = new Vector2(300, 40);

        var tmp = go.AddComponent<TextMeshProUGUI>();
        tmp.text = text;
        tmp.fontSize = 24;
        tmp.color = Color.white;

        switch (anchor)
        {
            case TextAnchor.UpperLeft:
                tmp.alignment = TextAlignmentOptions.TopLeft;
                break;
            case TextAnchor.UpperRight:
                tmp.alignment = TextAlignmentOptions.TopRight;
                break;
            case TextAnchor.MiddleCenter:
                tmp.alignment = TextAlignmentOptions.Center;
                break;
        }
    }
}
