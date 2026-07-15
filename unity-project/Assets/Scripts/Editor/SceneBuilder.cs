using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

/// <summary>
/// SceneBuilder — 一鍵建構初始場景與所有 Prefab
/// 在 Unity Editor 選單中執行：EndlessHeroes → Build Scene & Prefabs
/// </summary>
public class SceneBuilder : Editor
{
    [MenuItem("EndlessHeroes/1. Build All Prefabs")]
    public static void BuildAllPrefabs()
    {
        SetupTagsAndLayers();

        BuildProjectilePrefab();
        BuildXPGemPrefab();
        BuildDamageNumberPrefab();
        BuildPlayerPrefabs();
        BuildEnemyPrefab();
        BuildBossPrefab();
        BuildEffectPrefabs();

        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();
        Debug.Log("[EndlessHeroes] All prefabs built successfully!");
    }

    [MenuItem("EndlessHeroes/2. Build Main Scene")]
    public static void BuildMainScene()
    {
        // 建立新場景
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
        var bootstrap = gmGO.AddComponent<GameBootstrap>();
        // 設定 Bootstrap（保留角色選擇）
        var bootstrapSO = new SerializedObject(bootstrap);
        bootstrapSO.FindProperty("_skipCharacterSelect").boolValue = false;
        bootstrapSO.FindProperty("_skipMetaShop").boolValue = true;
        bootstrapSO.ApplyModifiedProperties();

        // Audio Manager (子物件)
        var audioGO = new GameObject("AudioManager");
        audioGO.transform.SetParent(gmGO.transform);
        var audioMgr = audioGO.AddComponent<AudioManager>();
        // BGM Source
        var bgmSource = audioGO.AddComponent<AudioSource>();
        bgmSource.loop = true;
        bgmSource.playOnAwake = false;
        // SFX Source
        var sfxGO = new GameObject("SFX Source");
        sfxGO.transform.SetParent(audioGO.transform);
        sfxGO.AddComponent<AudioSource>().playOnAwake = false;
        // Ambient Source
        var ambientGO = new GameObject("Ambient Source");
        ambientGO.transform.SetParent(audioGO.transform);
        var ambSrc = ambientGO.AddComponent<AudioSource>();
        ambSrc.loop = true;
        ambSrc.playOnAwake = false;

        // Object Pool Manager (子物件)
        var poolGO = new GameObject("ObjectPoolManager");
        poolGO.transform.SetParent(gmGO.transform);
        var poolMgr = poolGO.AddComponent<ObjectPoolManager>();

        // 自動連結 Prefab 引用
        LinkPoolManagerPrefabs(poolMgr);

        // Wave Manager (子物件)
        var waveGO = new GameObject("WaveManager");
        waveGO.transform.SetParent(gmGO.transform);
        waveGO.AddComponent<WaveManager>();

        // Level Manager (子物件)
        var levelGO = new GameObject("LevelManager");
        levelGO.transform.SetParent(gmGO.transform);
        levelGO.AddComponent<LevelManager>();

        // Elite Spawner (子物件)
        var eliteGO = new GameObject("EliteSpawner");
        eliteGO.transform.SetParent(gmGO.transform);
        eliteGO.AddComponent<EliteSpawner>();

        // Rush Wave (子物件)
        var rushGO = new GameObject("RushWave");
        rushGO.transform.SetParent(gmGO.transform);
        rushGO.AddComponent<RushWave>();

        // Particle Spawner (子物件)
        var particleGO = new GameObject("ParticleSpawner");
        particleGO.transform.SetParent(poolGO.transform);
        particleGO.AddComponent<ParticleSpawner>();

        // Player Spawn Point
        var spawnPoint = new GameObject("PlayerSpawnPoint");
        spawnPoint.transform.SetParent(gmGO.transform);
        spawnPoint.transform.position = Vector3.zero;

        // === Damage Number Manager ===
        var dmgNumGO = new GameObject("DamageNumberManager");
        dmgNumGO.AddComponent<DamageNumberManager>();

        // === Background ===
        var bgGO = new GameObject("Background");
        bgGO.AddComponent<BackgroundScroller>();
        bgGO.transform.position = new Vector3(0, 0, 10f);
        // BackgroundScroller 的 Awake 會自動建立 Quad + Material
        // LevelManager.ApplyLevelSettings 會在遊戲開始時設定背景圖

        // === Level Up Effect ===
        var lvlEffectGO = new GameObject("LevelUpEffect");
        lvlEffectGO.AddComponent<LevelUpEffect>();

        // === Hardcore VFX ===
        var hcVfxGO = new GameObject("HardcoreVFX");
        hcVfxGO.AddComponent<HardcoreVFX>();

        // === UI Canvas ===
        BuildUICanvas();

        // === Sorting Layers (提示) ===
        Debug.Log("[EndlessHeroes] Scene built! Remember to set up:");
        Debug.Log("  1. Assign GameConfig ScriptableObject to GameManager");
        Debug.Log("  2. Assign Prefabs to ObjectPoolManager");
        Debug.Log("  3. Set up Sorting Layers: Background(-100), Default(0), Player(10), UI(100)");
        Debug.Log("  4. Set up Physics2D Layers: Player, Enemy, Projectile, Pickup");

        // 儲存場景
        EditorSceneManager.SaveScene(scene, "Assets/Scenes/MainScene.unity");

        // 自動連結所有引用
        LinkAllReferences();

        // 再次儲存（含引用）
        EditorSceneManager.SaveScene(scene, "Assets/Scenes/MainScene.unity");
        Debug.Log("[EndlessHeroes] Scene saved to Assets/Scenes/MainScene.unity");
    }

    [MenuItem("EndlessHeroes/3. Setup Physics Layers (Info)")]
    public static void SetupPhysicsLayers()
    {
        // 引導到新的自動設定
        EditorUtility.DisplayDialog("Physics Layers",
            "Tags and Layers have been auto-configured by 'Build All Prefabs'.\n\n" +
            "To set up the collision matrix, use:\n" +
            "EndlessHeroes → 3. Setup Physics2D Collision Matrix",
            "OK");
    }

    // =============================================
    // TAGS & LAYERS SETUP
    // =============================================

    private static void SetupTagsAndLayers()
    {
        // 開啟 TagManager
        SerializedObject tagManager = new SerializedObject(
            AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/TagManager.asset")[0]);

        // === 新增 Tags ===
        SerializedProperty tagsProp = tagManager.FindProperty("tags");
        AddTag(tagsProp, "Enemy");
        AddTag(tagsProp, "Boss");
        AddTag(tagsProp, "Projectile");
        AddTag(tagsProp, "Pickup");

        // === 新增 Layers ===
        SerializedProperty layersProp = tagManager.FindProperty("layers");
        SetLayer(layersProp, 6, "Player");
        SetLayer(layersProp, 7, "Enemy");
        SetLayer(layersProp, 8, "Projectile");
        SetLayer(layersProp, 9, "Pickup");

        tagManager.ApplyModifiedProperties();
        Debug.Log("[EndlessHeroes] Tags and Layers configured.");
    }

    private static void AddTag(SerializedProperty tagsProp, string tag)
    {
        // 檢查是否已存在
        for (int i = 0; i < tagsProp.arraySize; i++)
        {
            if (tagsProp.GetArrayElementAtIndex(i).stringValue == tag)
                return;
        }
        tagsProp.InsertArrayElementAtIndex(tagsProp.arraySize);
        tagsProp.GetArrayElementAtIndex(tagsProp.arraySize - 1).stringValue = tag;
    }

    private static void SetLayer(SerializedProperty layersProp, int index, string name)
    {
        SerializedProperty layerProp = layersProp.GetArrayElementAtIndex(index);
        if (string.IsNullOrEmpty(layerProp.stringValue))
        {
            layerProp.stringValue = name;
        }
    }

    // =============================================
    // PREFAB BUILDERS
    // =============================================

    private static void BuildProjectilePrefab()
    {
        var go = new GameObject("Projectile");

        var sr = go.AddComponent<SpriteRenderer>();
        sr.sortingOrder = 5;

        // 嘗試載入 projectile sprite
        var projSprite = AssetDatabase.LoadAssetAtPath<Sprite>("Assets/Sprites/Effects/projectile.png");
        if (projSprite != null)
        {
            sr.sprite = projSprite;
            sr.color = Color.white;
        }
        else
        {
            // 無圖時建立 placeholder
            sr.sprite = CreateCircleSprite();
            sr.color = new Color(1f, 0.4f, 0f); // 橘色火球
        }

        var rb = go.AddComponent<Rigidbody2D>();
        rb.gravityScale = 0;
        rb.freezeRotation = true;
        rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;

        var col = go.AddComponent<CircleCollider2D>();
        col.radius = 0.12f;
        col.isTrigger = true;

        go.AddComponent<ProjectileController>();
        go.layer = 8; // Projectile layer

        // Projectile HTML size = 24px → scale = 24/86.4 ≈ 0.28
        go.transform.localScale = Vector3.one * 0.28f;

        SavePrefab(go, "Assets/Prefabs/Projectiles/Projectile.prefab");
    }

    private static Sprite CreateCircleSprite()
    {
        int size = 32;
        var tex = new Texture2D(size, size);
        float center = size / 2f;
        float radius = size / 2f - 1;

        for (int y = 0; y < size; y++)
        {
            for (int x = 0; x < size; x++)
            {
                float dist = Vector2.Distance(new Vector2(x, y), new Vector2(center, center));
                tex.SetPixel(x, y, dist <= radius ? Color.white : Color.clear);
            }
        }
        tex.Apply();
        return Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), 32);
    }

    private static void BuildXPGemPrefab()
    {
        var go = new GameObject("XPGem");

        var sr = go.AddComponent<SpriteRenderer>();
        sr.color = new Color(0f, 1f, 0.53f); // 綠色
        sr.sortingOrder = 2;

        var col = go.AddComponent<CircleCollider2D>();
        col.radius = 0.15f;
        col.isTrigger = true;

        go.AddComponent<XPGemController>();
        go.layer = 9; // Pickup layer
        go.transform.localScale = Vector3.one * 0.3f;

        SavePrefab(go, "Assets/Prefabs/Pickups/XPGem.prefab");
    }

    private static void BuildDamageNumberPrefab()
    {
        var go = new GameObject("DamageNumber");

        var tm = go.AddComponent<TextMesh>();
        tm.fontSize = 40;
        tm.characterSize = 0.1f;
        tm.anchor = TextAnchor.MiddleCenter;
        tm.alignment = TextAlignment.Center;
        tm.color = Color.white;
        tm.fontStyle = FontStyle.Bold;

        go.AddComponent<DamageNumberInstance>();
        go.transform.localScale = Vector3.one * 0.5f;

        SavePrefab(go, "Assets/Prefabs/Effects/DamageNumber.prefab");
    }

    private static void BuildPlayerPrefabs()
    {
        // Mage (HTML size 66px, scale=0.76)
        BuildSinglePlayerPrefab("Player_Mage", CharacterType.Mage,
            typeof(MageAttack), typeof(WeaponManager),
            new Color(0.27f, 0.53f, 1f), 0.76f,
            "Assets/Sprites/Characters/mage_idle_4f.png",
            "Assets/Sprites/Characters/mage_run_4f.png", 6f, 10f);

        // Archer (HTML size 66px, scale=0.76)
        BuildSinglePlayerPrefab("Player_Archer", CharacterType.Archer,
            typeof(ArcherAttack), typeof(WeaponManager),
            new Color(0.2f, 0.8f, 0.2f), 0.76f,
            "Assets/Sprites/Characters/archer_idle_4f.png",
            "Assets/Sprites/Characters/archer_run_8f.png", 6f, 10f);

        // Knight (HTML size 98px, scale=1.14)
        BuildSinglePlayerPrefab("Player_Knight", CharacterType.Knight,
            typeof(MeleeAttack), typeof(WeaponManager),
            new Color(0.8f, 0.6f, 0.2f), 1.14f,
            "Assets/Sprites/Characters/golden_knight_idle_4f.png",
            "Assets/Sprites/Characters/golden_knight_run_8f.png", 6f, 10f);

        // Valkyrie (HTML size 77px, scale=0.89)
        BuildSinglePlayerPrefab("Player_Valkyrie", CharacterType.Valkyrie,
            typeof(ValkyrieAttack), typeof(WeaponManager),
            new Color(0.9f, 0.3f, 0.9f), 0.89f,
            "Assets/Sprites/Characters/valkyrie_idle_6f.png",
            "Assets/Sprites/Characters/valkyrie_run_6f.png", 6f, 10f);
    }

    private static void BuildSinglePlayerPrefab(string name, CharacterType type,
        System.Type attackComponent, System.Type weaponManager, Color color, float scale,
        string idleSpritePath, string runSpritePath, float idleFps, float runFps)
    {
        var go = new GameObject(name);
        go.tag = "Player";
        go.layer = 6; // Player layer

        var sr = go.AddComponent<SpriteRenderer>();
        sr.sortingOrder = 10;

        // 設定第一幀 sprite
        var idleSprites = SpriteStripImporter.GetSpritesFromStrip(idleSpritePath);
        if (idleSprites != null && idleSprites.Length > 0)
        {
            sr.sprite = idleSprites[0];
            sr.color = Color.white;
        }
        else
        {
            sr.color = color;
        }

        var rb = go.AddComponent<Rigidbody2D>();
        rb.gravityScale = 0;
        rb.freezeRotation = true;
        rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;

        var col = go.AddComponent<CircleCollider2D>();
        col.radius = 0.3f;

        go.AddComponent<SpriteAnimatorController>();
        go.AddComponent<PlayerController>();
        go.AddComponent(attackComponent);
        go.AddComponent(weaponManager);

        go.transform.localScale = Vector3.one * scale;

        string path = $"Assets/Prefabs/Player/{name}.prefab";
        SavePrefab(go, path);

        // 重新載入 Prefab 設定動畫幀
        var runSprites = SpriteStripImporter.GetSpritesFromStrip(runSpritePath);
        if ((idleSprites != null && idleSprites.Length > 0) || (runSprites != null && runSprites.Length > 0))
        {
            var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            var instance = PrefabUtility.InstantiatePrefab(prefab) as GameObject;
            var animator = instance.GetComponent<SpriteAnimatorController>();

            if (animator != null)
            {
                var so = new SerializedObject(animator);

                // Idle
                if (idleSprites != null && idleSprites.Length > 0)
                {
                    var idleAnim = so.FindProperty("_idleAnim");
                    if (idleAnim != null)
                    {
                        var frames = idleAnim.FindPropertyRelative("frames");
                        frames.arraySize = idleSprites.Length;
                        for (int i = 0; i < idleSprites.Length; i++)
                            frames.GetArrayElementAtIndex(i).objectReferenceValue = idleSprites[i];
                        idleAnim.FindPropertyRelative("fps").floatValue = idleFps;
                    }
                }

                // Run
                if (runSprites != null && runSprites.Length > 0)
                {
                    var runAnim = so.FindProperty("_runAnim");
                    if (runAnim != null)
                    {
                        var frames = runAnim.FindPropertyRelative("frames");
                        frames.arraySize = runSprites.Length;
                        for (int i = 0; i < runSprites.Length; i++)
                            frames.GetArrayElementAtIndex(i).objectReferenceValue = runSprites[i];
                        runAnim.FindPropertyRelative("fps").floatValue = runFps;
                    }
                }

                so.ApplyModifiedProperties();
            }

            PrefabUtility.SaveAsPrefabAsset(instance, path);
            DestroyImmediate(instance);
        }

        // 連結攻擊特效引用
        LinkAttackEffectPrefabs(path, attackComponent);
    }

    private static void LinkAttackEffectPrefabs(string prefabPath, System.Type attackType)
    {
        var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath);
        if (prefab == null) return;

        var instance = PrefabUtility.InstantiatePrefab(prefab) as GameObject;
        bool changed = false;

        // MeleeAttack — 需要 SlashEffect
        if (attackType == typeof(MeleeAttack))
        {
            var comp = instance.GetComponent<MeleeAttack>();
            if (comp != null)
            {
                var so = new SerializedObject(comp);
                var prop = so.FindProperty("_slashEffectPrefab");
                if (prop != null)
                {
                    var fx = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/Effects/SlashEffect.prefab");
                    if (fx != null) { prop.objectReferenceValue = fx; changed = true; }
                }
                so.ApplyModifiedProperties();
            }
        }

        // ValkyrieAttack — 需要 ThrustEffect + ShockwaveEffect
        if (attackType == typeof(ValkyrieAttack))
        {
            var comp = instance.GetComponent<ValkyrieAttack>();
            if (comp != null)
            {
                var so = new SerializedObject(comp);

                var thrustProp = so.FindProperty("_thrustEffectPrefab");
                if (thrustProp != null)
                {
                    var fx = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/Effects/ThrustEffect.prefab");
                    if (fx != null) { thrustProp.objectReferenceValue = fx; changed = true; }
                }

                var shockProp = so.FindProperty("_shockwaveEffectPrefab");
                if (shockProp != null)
                {
                    var fx = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/Effects/ShockwaveEffect.prefab");
                    if (fx != null) { shockProp.objectReferenceValue = fx; changed = true; }
                }
                so.ApplyModifiedProperties();
            }
        }

        // ArcherAttack — 需要 FireZone
        if (attackType == typeof(ArcherAttack))
        {
            var comp = instance.GetComponent<ArcherAttack>();
            if (comp != null)
            {
                var so = new SerializedObject(comp);
                var prop = so.FindProperty("_fireZonePrefab");
                if (prop != null)
                {
                    var fx = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/Effects/FireZone.prefab");
                    if (fx != null) { prop.objectReferenceValue = fx; changed = true; }
                }
                so.ApplyModifiedProperties();
            }
        }

        // MageAttack — 需要 FireExplosion
        if (attackType == typeof(MageAttack))
        {
            var comp = instance.GetComponent<MageAttack>();
            if (comp != null)
            {
                var so = new SerializedObject(comp);
                var prop = so.FindProperty("_fireExplosionPrefab");
                if (prop != null)
                {
                    var fx = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/Effects/ExplosionEffect.prefab");
                    if (fx != null) { prop.objectReferenceValue = fx; changed = true; }
                }
                so.ApplyModifiedProperties();
            }
        }

        if (changed)
        {
            PrefabUtility.SaveAsPrefabAsset(instance, prefabPath);
        }
        DestroyImmediate(instance);
    }

    private static void BuildEnemyPrefab()
    {
        var go = new GameObject("Enemy");
        go.tag = "Enemy";
        go.layer = 7; // Enemy layer

        var sr = go.AddComponent<SpriteRenderer>();
        sr.color = Color.red;
        sr.sortingOrder = 5;

        var rb = go.AddComponent<Rigidbody2D>();
        rb.gravityScale = 0;
        rb.freezeRotation = true;

        var col = go.AddComponent<CircleCollider2D>();
        col.radius = 0.35f;

        go.AddComponent<SpriteAnimatorController>();
        go.AddComponent<EnemyBase>();

        SavePrefab(go, "Assets/Prefabs/Enemies/Enemy.prefab");
    }

    private static void BuildBossPrefab()
    {
        // 10 個 Boss 各自獨立的 Prefab
        var bossDefs = new BossPrefabDef[]
        {
            new BossPrefabDef("Boss_01_Demon",         "Assets/Sprites/Bosses/boss_demon_idle_8f.png",          8, new Color(0.27f,1f,0.27f), 1.67f, 8),
            new BossPrefabDef("Boss_02_Gorilla",       "Assets/Sprites/Bosses/boss_gorilla_idle_8f.png",        8, new Color(0.33f,0.2f,0.07f), 2.71f, 7),
            new BossPrefabDef("Boss_03_BeetleKnight",  "Assets/Sprites/Bosses/boss_beetle_knight_idle_3f.png",  3, new Color(0.1f,0.2f,0.4f), 2.08f, 8),
            new BossPrefabDef("Boss_04_BigDragon",     "Assets/Sprites/Bosses/big_dragon_8f_4c2r.png",          8, new Color(1f,0f,0.4f), 2.50f, 6),
            new BossPrefabDef("Boss_05_SkeletonKing",  "Assets/Sprites/Bosses/boss_skeletonking_9f.png",        9, new Color(1f,0.27f,0f), 1.98f, 6),
            new BossPrefabDef("Boss_06_Gnu",           "Assets/Sprites/Bosses/boss_gnu_idle_5f.png",            5, new Color(0.27f,0.8f,1f), 2.29f, 7),
            new BossPrefabDef("Boss_07_Mage",          "Assets/Sprites/Bosses/boss_mage3_idle_4f.png",          4, new Color(0f,0.53f,0.27f), 2.50f, 6),
            new BossPrefabDef("Boss_08_MachineDragon", "Assets/Sprites/Bosses/boss_machine_dragon_idle_4f.png", 4, new Color(0.27f,0f,1f), 1.88f, 6),
            new BossPrefabDef("Boss_09_KingSlime",     "Assets/Sprites/Bosses/boss_kingslime_idle_4f.png",      4, new Color(1f,0.8f,0f), 2.08f, 6),
            new BossPrefabDef("Boss_10_DarkDragon",    "Assets/Sprites/Bosses/big_dark_dragon_8f_4c2r.png",     8, new Color(0.1f,0.1f,0.1f), 5.00f, 6),
        };

        foreach (var def in bossDefs)
        {
            BuildSingleBossPrefab(def);
        }
    }

    private struct BossPrefabDef
    {
        public string name;
        public string spritePath;
        public int frameCount;
        public Color color;
        public float scale;
        public float fps;

        public BossPrefabDef(string name, string spritePath, int frameCount, Color color, float scale, float fps)
        {
            this.name = name;
            this.spritePath = spritePath;
            this.frameCount = frameCount;
            this.color = color;
            this.scale = scale;
            this.fps = fps;
        }
    }

    private static void BuildSingleBossPrefab(BossPrefabDef def)
    {
        var go = new GameObject(def.name);
        go.tag = "Enemy";
        go.layer = 7;

        var sr = go.AddComponent<SpriteRenderer>();
        sr.color = Color.white;
        sr.sortingOrder = 6;

        // 設定第一幀 sprite
        var sprites = SpriteStripImporter.GetSpritesFromStrip(def.spritePath);
        if (sprites != null && sprites.Length > 0)
        {
            sr.sprite = sprites[0];
        }
        else
        {
            sr.color = def.color; // 無 sprite 時用顏色代替
        }

        var rb = go.AddComponent<Rigidbody2D>();
        rb.gravityScale = 0;
        rb.freezeRotation = true;

        var col = go.AddComponent<CircleCollider2D>();
        col.radius = 0.4f; // 碰撞半徑，由 size * scale 調整

        var animator = go.AddComponent<SpriteAnimatorController>();
        go.AddComponent<BossController>();

        go.transform.localScale = Vector3.one * def.scale;

        // 儲存 Prefab
        string path = $"Assets/Prefabs/Bosses/{def.name}.prefab";
        SavePrefab(go, path);

        // 重新載入並設定動畫幀
        if (sprites != null && sprites.Length > 0)
        {
            var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            var instance = PrefabUtility.InstantiatePrefab(prefab) as GameObject;
            var anim = instance.GetComponent<SpriteAnimatorController>();
            if (anim != null)
            {
                var so = new SerializedObject(anim);
                var idleAnim = so.FindProperty("_idleAnim");
                if (idleAnim != null)
                {
                    var frames = idleAnim.FindPropertyRelative("frames");
                    frames.arraySize = sprites.Length;
                    for (int i = 0; i < sprites.Length; i++)
                        frames.GetArrayElementAtIndex(i).objectReferenceValue = sprites[i];
                    idleAnim.FindPropertyRelative("fps").floatValue = def.fps;
                }
                so.ApplyModifiedProperties();
            }
            PrefabUtility.SaveAsPrefabAsset(instance, path);
            DestroyImmediate(instance);
        }
    }

    private static void BuildEffectPrefabs()
    {
        // Slash Effect (騎士近戰) — 使用 slash_effect_4f.png 動畫
        BuildAnimatedEffectPrefab("SlashEffect", "Assets/Sprites/Effects/slash_effect_4f.png",
            new Color(0.8f, 0.4f, 1f), 15, 0.8f, 12f);

        // Thrust Effect (女武神突刺) — 使用 spear_attack.png
        BuildStaticEffectPrefab("ThrustEffect", "Assets/Sprites/Effects/spear_attack.png",
            new Color(0.4f, 0.8f, 1f), 15, 0.5f);

        // Shockwave Effect — placeholder 圓形
        BuildShockwaveEffectPrefab();

        // Nova Effect — placeholder 圓形
        var nova = new GameObject("NovaEffect");
        var novaSR = nova.AddComponent<SpriteRenderer>();
        novaSR.sprite = CreateCircleSprite();
        novaSR.color = new Color(0.2f, 0.6f, 1f, 0.5f);
        novaSR.sortingOrder = 14;
        nova.transform.localScale = Vector3.one * 3f;
        SavePrefab(nova, "Assets/Prefabs/Effects/NovaEffect.prefab");

        // Thunder Effect — 細長矩形
        var thunder = new GameObject("ThunderEffect");
        var thunderSR = thunder.AddComponent<SpriteRenderer>();
        thunderSR.sprite = CreateCircleSprite();
        thunderSR.color = new Color(1f, 1f, 0.2f, 0.9f);
        thunderSR.sortingOrder = 16;
        thunder.transform.localScale = new Vector3(0.3f, 3f, 1f);
        SavePrefab(thunder, "Assets/Prefabs/Effects/ThunderEffect.prefab");

        // Explosion Effect (Mage 火焰 AOE) — 使用 flame_8f.png 動畫
        BuildAnimatedEffectPrefab("ExplosionEffect", "Assets/Sprites/Effects/flame_8f.png",
            new Color(1f, 0.5f, 0f), 15, 1.0f, 16f);

        // FireZone (Archer 火焰區域) — 使用 fire_zone_8f.png 動畫
        BuildFireZoneWithSprite();

        // Magnet Pickup
        var magnet = new GameObject("MagnetPickup");
        var magnetSR = magnet.AddComponent<SpriteRenderer>();
        magnetSR.sprite = CreateCircleSprite();
        magnetSR.color = new Color(1f, 0f, 0f, 1f);
        magnetSR.sortingOrder = 3;
        var magnetCol = magnet.AddComponent<CircleCollider2D>();
        magnetCol.radius = 0.4f;
        magnetCol.isTrigger = true;
        magnet.AddComponent<MagnetPickup>();
        magnet.layer = 9;
        magnet.transform.localScale = Vector3.one * 0.5f;
        SavePrefab(magnet, "Assets/Prefabs/Pickups/MagnetPickup.prefab");

        // Treasure Chest
        var chest = new GameObject("TreasureChest");
        var chestSR = chest.AddComponent<SpriteRenderer>();
        chestSR.sprite = CreateCircleSprite();
        chestSR.color = new Color(1f, 0.85f, 0f, 1f);
        chestSR.sortingOrder = 3;
        var chestCol = chest.AddComponent<CircleCollider2D>();
        chestCol.radius = 0.3f;
        chestCol.isTrigger = true;
        chest.AddComponent<TreasureChest>();
        chest.layer = 9;
        chest.transform.localScale = Vector3.one * 0.5f;
        SavePrefab(chest, "Assets/Prefabs/Pickups/TreasureChest.prefab");

        // Shield Orbit Ball — 使用 shield_orbit.png
        BuildStaticEffectPrefab("ShieldBall", "Assets/Sprites/Effects/shield_orbit.png",
            new Color(0.3f, 0.7f, 1f), 12, 0.4f);
    }

    private static void BuildAnimatedEffectPrefab(string name, string spritePath, Color fallbackColor, int sortOrder, float scale, float fps)
    {
        var go = new GameObject(name);
        var sr = go.AddComponent<SpriteRenderer>();
        sr.sortingOrder = sortOrder;
        go.transform.localScale = Vector3.one * scale;

        var sprites = SpriteStripImporter.GetSpritesFromStrip(spritePath);
        if (sprites != null && sprites.Length > 0)
        {
            sr.sprite = sprites[0];
            sr.color = Color.white;

            // 加上動畫元件
            var animator = go.AddComponent<SpriteAnimatorController>();
            string path = $"Assets/Prefabs/Effects/{name}.prefab";
            SavePrefab(go, path);

            // 重新載入設定動畫幀
            var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            var instance = PrefabUtility.InstantiatePrefab(prefab) as GameObject;
            var anim = instance.GetComponent<SpriteAnimatorController>();
            if (anim != null)
            {
                var so = new SerializedObject(anim);
                var idleAnim = so.FindProperty("_idleAnim");
                if (idleAnim != null)
                {
                    var frames = idleAnim.FindPropertyRelative("frames");
                    frames.arraySize = sprites.Length;
                    for (int i = 0; i < sprites.Length; i++)
                        frames.GetArrayElementAtIndex(i).objectReferenceValue = sprites[i];
                    idleAnim.FindPropertyRelative("fps").floatValue = fps;
                }
                so.ApplyModifiedProperties();
            }
            PrefabUtility.SaveAsPrefabAsset(instance, path);
            DestroyImmediate(instance);
        }
        else
        {
            sr.sprite = CreateCircleSprite();
            sr.color = fallbackColor;
            SavePrefab(go, $"Assets/Prefabs/Effects/{name}.prefab");
        }
    }

    private static void BuildStaticEffectPrefab(string name, string spritePath, Color fallbackColor, int sortOrder, float scale)
    {
        var go = new GameObject(name);
        var sr = go.AddComponent<SpriteRenderer>();
        sr.sortingOrder = sortOrder;
        go.transform.localScale = Vector3.one * scale;

        var sprite = AssetDatabase.LoadAssetAtPath<Sprite>(spritePath);
        if (sprite != null)
        {
            sr.sprite = sprite;
            sr.color = Color.white;
        }
        else
        {
            sr.sprite = CreateCircleSprite();
            sr.color = fallbackColor;
        }

        SavePrefab(go, $"Assets/Prefabs/Effects/{name}.prefab");
    }

    private static void BuildShockwaveEffectPrefab()
    {
        var go = new GameObject("ShockwaveEffect");
        var sr = go.AddComponent<SpriteRenderer>();
        sr.sprite = CreateCircleSprite();
        sr.color = new Color(1f, 1f, 0.4f, 0.4f);
        sr.sortingOrder = 14;
        go.transform.localScale = Vector3.one * 2f;
        SavePrefab(go, "Assets/Prefabs/Effects/ShockwaveEffect.prefab");
    }

    private static void BuildFireZoneWithSprite()
    {
        var go = new GameObject("FireZone");
        var sr = go.AddComponent<SpriteRenderer>();
        sr.sortingOrder = 3;
        go.transform.localScale = Vector3.one * 1.2f;

        var sprites = SpriteStripImporter.GetSpritesFromStrip("Assets/Sprites/Effects/fire_zone_8f.png");
        if (sprites != null && sprites.Length > 0)
        {
            sr.sprite = sprites[0];
            sr.color = Color.white;
            go.AddComponent<SpriteAnimatorController>();
        }
        else
        {
            sr.sprite = CreateCircleSprite();
            sr.color = new Color(1f, 0.3f, 0f, 0.5f);
        }

        var col = go.AddComponent<CircleCollider2D>();
        col.radius = 0.5f;
        col.isTrigger = true;
        go.AddComponent<FireZone>();

        string path = "Assets/Prefabs/Effects/FireZone.prefab";
        SavePrefab(go, path);

        // 設定動畫幀
        if (sprites != null && sprites.Length > 0)
        {
            var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            var instance = PrefabUtility.InstantiatePrefab(prefab) as GameObject;
            var anim = instance.GetComponent<SpriteAnimatorController>();
            if (anim != null)
            {
                var so = new SerializedObject(anim);
                var idleAnim = so.FindProperty("_idleAnim");
                if (idleAnim != null)
                {
                    var frames = idleAnim.FindPropertyRelative("frames");
                    frames.arraySize = sprites.Length;
                    for (int i = 0; i < sprites.Length; i++)
                        frames.GetArrayElementAtIndex(i).objectReferenceValue = sprites[i];
                    idleAnim.FindPropertyRelative("fps").floatValue = 12f;
                }
                so.ApplyModifiedProperties();
            }
            PrefabUtility.SaveAsPrefabAsset(instance, path);
            DestroyImmediate(instance);
        }
    }

    // =============================================
    // UI BUILDER
    // =============================================

    private static void BuildUICanvas()
    {
        // Main Canvas
        var canvasGO = new GameObject("Canvas");
        var canvas = canvasGO.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = 100;
        canvasGO.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        canvasGO.GetComponent<CanvasScaler>().referenceResolution = new Vector2(1920, 1080);
        canvasGO.AddComponent<GraphicRaycaster>();

        var uiManager = canvasGO.AddComponent<UIManager>();

        // --- HUD Panel ---
        var hudPanel = CreateUIPanel(canvasGO.transform, "HUD Panel");
        SetAnchors(hudPanel, new Vector2(0, 1), new Vector2(1, 1));
        hudPanel.sizeDelta = new Vector2(0, 120);

        // HP Bar
        CreateSlider(hudPanel.transform, "HP Bar", new Vector2(-700, -30), new Vector2(200, 16),
            new Color(1f, 0.27f, 0.27f));

        // XP Bar
        CreateSlider(hudPanel.transform, "XP Bar", new Vector2(0, -110), new Vector2(1920, 8),
            new Color(0f, 1f, 0.53f));

        // Level Text
        CreateText(hudPanel.transform, "Level Text", "Lv.1", new Vector2(-800, -60), 20);
        // Timer Text
        CreateText(hudPanel.transform, "Timer Text", "0:00", new Vector2(0, -30), 18);
        // Kills Text
        CreateText(hudPanel.transform, "Kills Text", "殺敵: 0", new Vector2(800, -30), 16);
        // Level Name Text
        CreateText(hudPanel.transform, "Level Name", "草地", new Vector2(0, -60), 14);

        // Combo Text
        CreateText(hudPanel.transform, "Combo Text", "", new Vector2(0, -80), 24);

        // --- Level Up Panel ---
        var levelUpPanel = CreateUIPanel(canvasGO.transform, "LevelUp Panel");
        levelUpPanel.gameObject.SetActive(false);
        var levelUpTitle = CreateText(levelUpPanel.transform, "Title", "LEVEL UP!", new Vector2(0, 200), 36);

        var upgradeContainer = new GameObject("UpgradeButtons");
        upgradeContainer.AddComponent<RectTransform>().SetParent(levelUpPanel.transform, false);
        var vlg = upgradeContainer.AddComponent<VerticalLayoutGroup>();
        vlg.spacing = 15;
        vlg.childAlignment = TextAnchor.MiddleCenter;

        // Upgrade Button Prefab
        BuildUpgradeButtonPrefab();

        // --- Game Over Panel ---
        var gameOverPanel = CreateUIPanel(canvasGO.transform, "GameOver Panel");
        gameOverPanel.gameObject.SetActive(false);
        CreateText(gameOverPanel.transform, "Title", "GAME OVER", new Vector2(0, 150), 48);
        CreateText(gameOverPanel.transform, "Stats", "", new Vector2(0, 50), 20);
        CreateText(gameOverPanel.transform, "Coins", "", new Vector2(0, -20), 22);

        var leaderboardContainer = new GameObject("LeaderboardContainer");
        leaderboardContainer.AddComponent<RectTransform>().SetParent(gameOverPanel.transform, false);
        leaderboardContainer.AddComponent<VerticalLayoutGroup>();

        // Restart Button
        CreateButton(gameOverPanel.transform, "Restart Button", "再來一次", new Vector2(0, -150));

        // --- Level Clear Panel ---
        var levelClearPanel = CreateUIPanel(canvasGO.transform, "LevelClear Panel");
        levelClearPanel.gameObject.SetActive(false);
        CreateText(levelClearPanel.transform, "Clear Text", "關卡通過！", new Vector2(0, 50), 36);
        CreateButton(levelClearPanel.transform, "Next Level Button", "下一關", new Vector2(0, -50));

        // --- All Clear Panel ---
        var allClearPanel = CreateUIPanel(canvasGO.transform, "AllClear Panel");
        allClearPanel.gameObject.SetActive(false);
        CreateText(allClearPanel.transform, "Title", "全部通關！", new Vector2(0, 80), 42);
        CreateButton(allClearPanel.transform, "Hardcore Button", "挑戰困難模式", new Vector2(0, -50));

        // --- Boss HP Panel ---
        var bossHPPanel = CreateUIPanel(canvasGO.transform, "BossHP Panel");
        bossHPPanel.gameObject.SetActive(false);
        SetAnchors(bossHPPanel, new Vector2(0.25f, 0.9f), new Vector2(0.75f, 0.95f));
        CreateSlider(bossHPPanel.transform, "Boss HP Bar", Vector2.zero, new Vector2(600, 12),
            new Color(1f, 0f, 0.3f));
        CreateText(bossHPPanel.transform, "Boss Name", "BOSS", new Vector2(0, 20), 16);

        // --- Boss Warning ---
        var bossWarning = CreateUIPanel(canvasGO.transform, "BossWarning Panel");
        bossWarning.gameObject.SetActive(false);
        CreateText(bossWarning.transform, "Warning Text", "⚠ BOSS 來了！", new Vector2(0, 0), 52);

        // --- Pause Overlay ---
        var pausePanel = CreateUIPanel(canvasGO.transform, "Pause Panel");
        pausePanel.gameObject.SetActive(false);
        CreateText(pausePanel.transform, "Pause Text", "PAUSED", new Vector2(0, 0), 48);

        // --- Rush Warning ---
        var rushPanel = CreateUIPanel(canvasGO.transform, "Rush Panel");
        rushPanel.gameObject.SetActive(false);
        CreateText(rushPanel.transform, "Rush Text", "⚡ RUSH WAVE ⚡", new Vector2(0, 300), 32);

        // --- Skill Icons Container ---
        var skillIcons = new GameObject("Skill Icons");
        var skillRT = skillIcons.AddComponent<RectTransform>();
        skillRT.SetParent(canvasGO.transform, false);
        SetAnchors(skillRT, new Vector2(0, 0), new Vector2(0.3f, 0.05f));
        skillIcons.AddComponent<HorizontalLayoutGroup>().spacing = 5;

        // --- Mute Button ---
        var muteGO = CreateText(canvasGO.transform, "Mute Indicator", "🔊", new Vector2(900, -20), 24);

        // --- Character Select Panel ---
        BuildCharacterSelectPanel(canvasGO.transform);

        // --- EventSystem ---
        var eventSys = new GameObject("EventSystem");
        eventSys.AddComponent<UnityEngine.EventSystems.EventSystem>();
        eventSys.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();

        Debug.Log("[EndlessHeroes] UI Canvas built with all panels.");
    }

    // =============================================
    // CHARACTER SELECT PANEL
    // =============================================

    private static void BuildCharacterSelectPanel(Transform canvasRoot)
    {
        // 全螢幕面板
        var panel = new GameObject("CharacterSelect Panel");
        var panelRT = panel.AddComponent<RectTransform>();
        panelRT.SetParent(canvasRoot, false);
        panelRT.anchorMin = Vector2.zero;
        panelRT.anchorMax = Vector2.one;
        panelRT.offsetMin = Vector2.zero;
        panelRT.offsetMax = Vector2.zero;

        // 半透明背景
        var bgImg = panel.AddComponent<Image>();
        bgImg.color = new Color(0.05f, 0.05f, 0.12f, 0.95f);

        panel.AddComponent<CharacterSelectUI>();

        // 標題
        CreateText(panelRT, "Title", "選擇你的英雄", new Vector2(0, 350), 42);

        // 說明文字
        CreateText(panelRT, "Description", "點擊角色開始遊戲", new Vector2(0, -300), 18);

        // 角色按鈕容器
        var btnContainer = new GameObject("ButtonContainer");
        var containerRT = btnContainer.AddComponent<RectTransform>();
        containerRT.SetParent(panelRT, false);
        containerRT.anchoredPosition = Vector2.zero;
        containerRT.sizeDelta = new Vector2(1200, 300);
        var hlg = btnContainer.AddComponent<HorizontalLayoutGroup>();
        hlg.spacing = 30;
        hlg.childAlignment = TextAnchor.MiddleCenter;
        hlg.childForceExpandWidth = false;
        hlg.childForceExpandHeight = false;

        // 4 個角色按鈕
        CreateCharacterButton(containerRT, "MageButton", "法師\n🔥 遠程火球\nHP: 100", new Color(0.2f, 0.3f, 0.8f));
        CreateCharacterButton(containerRT, "ArcherButton", "弓箭手\n🏹 扇形箭矢\nHP: 100", new Color(0.2f, 0.7f, 0.3f));
        CreateCharacterButton(containerRT, "KnightButton", "騎士\n⚔️ 近戰斬擊\nHP: 150", new Color(0.8f, 0.6f, 0.2f));
        CreateCharacterButton(containerRT, "ValkyrieButton", "女武神\n🔱 長槍突刺\nHP: 100", new Color(0.7f, 0.2f, 0.7f));
    }

    private static void CreateCharacterButton(RectTransform parent, string name, string label, Color color)
    {
        var go = new GameObject(name);
        var rt = go.AddComponent<RectTransform>();
        rt.SetParent(parent, false);
        rt.sizeDelta = new Vector2(250, 280);

        var img = go.AddComponent<Image>();
        img.color = new Color(color.r * 0.3f, color.g * 0.3f, color.b * 0.3f, 0.9f);

        var btn = go.AddComponent<Button>();
        btn.targetGraphic = img;

        // 色彩邊框效果
        var outline = go.AddComponent<Outline>();
        outline.effectColor = color;
        outline.effectDistance = new Vector2(3, 3);

        // 文字
        var textGO = new GameObject("Text");
        var textRT = textGO.AddComponent<RectTransform>();
        textRT.SetParent(rt, false);
        textRT.anchorMin = Vector2.zero;
        textRT.anchorMax = Vector2.one;
        textRT.offsetMin = new Vector2(10, 10);
        textRT.offsetMax = new Vector2(-10, -10);

        var text = textGO.AddComponent<Text>();
        text.text = label;
        text.fontSize = 20;
        text.color = Color.white;
        text.alignment = TextAnchor.MiddleCenter;
        text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
    }

    // =============================================
    // HELPER METHODS
    // =============================================

    private static void LinkPoolManagerPrefabs(ObjectPoolManager poolMgr)
    {
        var so = new SerializedObject(poolMgr);

        var projPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/Projectiles/Projectile.prefab");
        if (projPrefab != null)
            so.FindProperty("_projectilePrefab").objectReferenceValue = projPrefab;

        var xpPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/Pickups/XPGem.prefab");
        if (xpPrefab != null)
            so.FindProperty("_xpGemPrefab").objectReferenceValue = xpPrefab;

        so.ApplyModifiedProperties();
    }

    /// <summary>
    /// 自動連結場景中所有物件的 SerializeField 引用
    /// </summary>
    [MenuItem("EndlessHeroes/5. Link All References")]
    public static void LinkAllReferences()
    {
        // --- GameManager ---
        var gm = Object.FindObjectOfType<GameManager>();
        if (gm != null)
        {
            var so = new SerializedObject(gm);
            so.FindProperty("mainCamera").objectReferenceValue = Camera.main;

            var spawnPoint = GameObject.Find("PlayerSpawnPoint");
            if (spawnPoint != null)
                so.FindProperty("playerSpawnPoint").objectReferenceValue = spawnPoint.transform;

            // GameConfig
            var configAsset = AssetDatabase.LoadAssetAtPath<GameConfig>("Assets/ScriptableObjects/GameConfig.asset");
            if (configAsset != null)
                so.FindProperty("gameConfig").objectReferenceValue = configAsset;

            so.ApplyModifiedProperties();
            Debug.Log("  ✓ GameManager linked");
        }

        // --- AudioManager ---
        var audio = Object.FindObjectOfType<AudioManager>();
        if (audio != null)
        {
            var so = new SerializedObject(audio);
            var sources = audio.GetComponentsInChildren<AudioSource>();
            if (sources.Length >= 1) so.FindProperty("_bgmSource").objectReferenceValue = sources[0];
            if (sources.Length >= 2) so.FindProperty("_sfxSource").objectReferenceValue = sources[1];
            if (sources.Length >= 3) so.FindProperty("_ambientSource").objectReferenceValue = sources[2];
            so.ApplyModifiedProperties();
            Debug.Log("  ✓ AudioManager linked");
        }

        // --- ObjectPoolManager ---
        var pool = Object.FindObjectOfType<ObjectPoolManager>();
        if (pool != null)
        {
            LinkPoolManagerPrefabs(pool);

            // Link ParticleSpawner
            var particleSpawner = Object.FindObjectOfType<ParticleSpawner>();
            if (particleSpawner != null)
            {
                var so = new SerializedObject(pool);
                so.FindProperty("_particleSpawner").objectReferenceValue = particleSpawner;
                so.ApplyModifiedProperties();
            }
            Debug.Log("  ✓ ObjectPoolManager linked");
        }

        // --- DamageNumberManager ---
        var dmgMgr = Object.FindObjectOfType<DamageNumberManager>();
        if (dmgMgr != null)
        {
            var so = new SerializedObject(dmgMgr);
            var dmgPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/Effects/DamageNumber.prefab");
            if (dmgPrefab != null)
                so.FindProperty("_damageNumberPrefab").objectReferenceValue = dmgPrefab;
            so.ApplyModifiedProperties();
            Debug.Log("  ✓ DamageNumberManager linked");
        }

        // --- EliteSpawner ---
        var elite = Object.FindObjectOfType<EliteSpawner>();
        if (elite != null)
        {
            var so = new SerializedObject(elite);
            var magnetPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/Pickups/MagnetPickup.prefab");
            var chestPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/Pickups/TreasureChest.prefab");
            if (magnetPrefab != null) so.FindProperty("_magnetPrefab").objectReferenceValue = magnetPrefab;
            if (chestPrefab != null) so.FindProperty("_treasureChestPrefab").objectReferenceValue = chestPrefab;
            so.ApplyModifiedProperties();
            Debug.Log("  ✓ EliteSpawner linked");
        }

        // --- UIManager ---
        var ui = Object.FindObjectOfType<UIManager>();
        if (ui != null)
        {
            var so = new SerializedObject(ui);
            LinkUIManager(so, ui.transform);
            so.ApplyModifiedProperties();
            Debug.Log("  ✓ UIManager linked");
        }

        // --- Link GameConfig prefabs ---
        LinkGameConfigPrefabs();

        // --- GameBootstrap ---
        var bootstrap = Object.FindObjectOfType<GameBootstrap>();
        if (bootstrap != null)
        {
            var so = new SerializedObject(bootstrap);
            var charSelectUI = Object.FindObjectOfType<CharacterSelectUI>();
            if (charSelectUI != null)
                so.FindProperty("_characterSelectUI").objectReferenceValue = charSelectUI;

            var metaShopUI = Object.FindObjectOfType<MetaShopUI>();
            if (metaShopUI != null)
                so.FindProperty("_metaShopUI").objectReferenceValue = metaShopUI;

            // 不再跳過角色選擇
            so.FindProperty("_skipCharacterSelect").boolValue = false;
            so.ApplyModifiedProperties();
            Debug.Log("  ✓ GameBootstrap linked");
        }

        EditorSceneManager.MarkSceneDirty(EditorSceneManager.GetActiveScene());
        Debug.Log("[EndlessHeroes] All references linked successfully!");
    }

    private static void LinkUIManager(SerializedObject so, Transform canvasRoot)
    {
        // 查找 UI 元件
        LinkSlider(so, "_hpBar", canvasRoot, "HP Bar");
        LinkSlider(so, "_xpBar", canvasRoot, "XP Bar");
        LinkText(so, "_levelText", canvasRoot, "Level Text");
        LinkText(so, "_timerText", canvasRoot, "Timer Text");
        LinkText(so, "_killsText", canvasRoot, "Kills Text");
        LinkText(so, "_levelNameText", canvasRoot, "Level Name");
        LinkText(so, "_comboText", canvasRoot, "Combo Text");
        LinkPanel(so, "_hudPanel", canvasRoot, "HUD Panel");
        LinkPanel(so, "_levelUpPanel", canvasRoot, "LevelUp Panel");
        LinkPanel(so, "_gameOverPanel", canvasRoot, "GameOver Panel");
        LinkPanel(so, "_levelClearPanel", canvasRoot, "LevelClear Panel");
        LinkPanel(so, "_allClearPanel", canvasRoot, "AllClear Panel");
        LinkPanel(so, "_bossHPPanel", canvasRoot, "BossHP Panel");
        LinkPanel(so, "_bossWarningPanel", canvasRoot, "BossWarning Panel");
        LinkPanel(so, "_pausePanel", canvasRoot, "Pause Panel");
        LinkPanel(so, "_rushWarningPanel", canvasRoot, "Rush Panel");

        // Slider references
        LinkSlider(so, "_bossHPBar", canvasRoot, "Boss HP Bar");

        // Text references
        LinkText(so, "_gameOverStatsText", canvasRoot, "Stats");
        LinkText(so, "_gameOverCoinsText", canvasRoot, "Coins");
        LinkText(so, "_levelClearText", canvasRoot, "Clear Text");
        LinkText(so, "_bossNameText", canvasRoot, "Boss Name");
        LinkText(so, "_muteText", canvasRoot, "Mute Indicator");

        // Button references
        LinkButton(so, "_nextLevelButton", canvasRoot, "Next Level Button");
        LinkButton(so, "_hardcoreButton", canvasRoot, "Hardcore Button");
        LinkButton(so, "_muteButton", canvasRoot, "Mute Indicator");

        // Containers
        var upgradeContainer = FindDeep(canvasRoot, "UpgradeButtons");
        if (upgradeContainer != null)
            so.FindProperty("_upgradeButtonContainer").objectReferenceValue = upgradeContainer;

        var leaderboardContainer = FindDeep(canvasRoot, "LeaderboardContainer");
        if (leaderboardContainer != null)
            so.FindProperty("_leaderboardContainer").objectReferenceValue = leaderboardContainer;

        var skillIcons = FindDeep(canvasRoot, "Skill Icons");
        if (skillIcons != null)
            so.FindProperty("_skillIconContainer").objectReferenceValue = skillIcons;

        // Prefabs
        var upgradeBtnPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/UI/UpgradeButton.prefab");
        if (upgradeBtnPrefab != null)
            so.FindProperty("_upgradeButtonPrefab").objectReferenceValue = upgradeBtnPrefab;

        var leaderboardEntryPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/UI/UpgradeButton.prefab");
        if (leaderboardEntryPrefab != null)
            so.FindProperty("_leaderboardEntryPrefab").objectReferenceValue = leaderboardEntryPrefab;

        var skillIconPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/UI/UpgradeButton.prefab");
        if (skillIconPrefab != null)
            so.FindProperty("_skillIconPrefab").objectReferenceValue = skillIconPrefab;
    }

    private static void LinkGameConfigPrefabs()
    {
        var config = AssetDatabase.LoadAssetAtPath<GameConfig>("Assets/ScriptableObjects/GameConfig.asset");
        if (config == null) return;

        var so = new SerializedObject(config);

        // Player Prefabs array
        var playerPrefabs = so.FindProperty("playerPrefabs");
        if (playerPrefabs != null)
        {
            playerPrefabs.arraySize = 4;
            var prefabPaths = new string[]
            {
                "Assets/Prefabs/Player/Player_Mage.prefab",
                "Assets/Prefabs/Player/Player_Archer.prefab",
                "Assets/Prefabs/Player/Player_Knight.prefab",
                "Assets/Prefabs/Player/Player_Valkyrie.prefab"
            };
            for (int i = 0; i < 4; i++)
            {
                var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPaths[i]);
                if (prefab != null)
                    playerPrefabs.GetArrayElementAtIndex(i).objectReferenceValue = prefab;
            }
        }

        // Character Portraits
        var charactersProp = so.FindProperty("characters");
        if (charactersProp != null)
        {
            var portraitPaths = new string[]
            {
                "Assets/Sprites/UI/chars/mage.png",
                "Assets/Sprites/UI/chars/archer.png",
                "Assets/Sprites/UI/chars/knight.png",
                "Assets/Sprites/UI/chars/valkyrie.png"
            };
            for (int i = 0; i < Mathf.Min(charactersProp.arraySize, portraitPaths.Length); i++)
            {
                var elem = charactersProp.GetArrayElementAtIndex(i);
                var portraitProp = elem.FindPropertyRelative("portrait");
                if (portraitProp != null)
                {
                    var sprite = AssetDatabase.LoadAssetAtPath<Sprite>(portraitPaths[i]);
                    if (sprite != null)
                        portraitProp.objectReferenceValue = sprite;
                }
            }
        }

        // Enemy prefabs
        var enemiesProp = so.FindProperty("enemies");
        var enemyPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/Enemies/Enemy.prefab");
        if (enemiesProp != null && enemyPrefab != null)
        {
            for (int i = 0; i < enemiesProp.arraySize; i++)
            {
                var elem = enemiesProp.GetArrayElementAtIndex(i);
                var prefabProp = elem.FindPropertyRelative("prefab");
                if (prefabProp != null)
                    prefabProp.objectReferenceValue = enemyPrefab;
            }
        }

        // Boss prefabs — 每個 Boss 獨立 Prefab
        var bossesProp = so.FindProperty("bosses");
        if (bossesProp != null)
        {
            var bossPrefabPaths = new string[]
            {
                "Assets/Prefabs/Bosses/Boss_01_Demon.prefab",
                "Assets/Prefabs/Bosses/Boss_02_Gorilla.prefab",
                "Assets/Prefabs/Bosses/Boss_03_BeetleKnight.prefab",
                "Assets/Prefabs/Bosses/Boss_04_BigDragon.prefab",
                "Assets/Prefabs/Bosses/Boss_05_SkeletonKing.prefab",
                "Assets/Prefabs/Bosses/Boss_06_Gnu.prefab",
                "Assets/Prefabs/Bosses/Boss_07_Mage.prefab",
                "Assets/Prefabs/Bosses/Boss_08_MachineDragon.prefab",
                "Assets/Prefabs/Bosses/Boss_09_KingSlime.prefab",
                "Assets/Prefabs/Bosses/Boss_10_DarkDragon.prefab",
            };
            for (int i = 0; i < Mathf.Min(bossesProp.arraySize, bossPrefabPaths.Length); i++)
            {
                var elem = bossesProp.GetArrayElementAtIndex(i);
                var prefabProp = elem.FindPropertyRelative("prefab");
                if (prefabProp != null)
                {
                    var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(bossPrefabPaths[i]);
                    if (prefab != null)
                        prefabProp.objectReferenceValue = prefab;
                }
            }
        }

        so.ApplyModifiedProperties();
        Debug.Log("  ✓ GameConfig prefabs linked");
    }

    // --- UI Link Helpers ---

    private static void LinkSlider(SerializedObject so, string propName, Transform root, string objName)
    {
        var t = FindDeep(root, objName);
        if (t != null)
        {
            var slider = t.GetComponent<Slider>();
            if (slider != null)
                so.FindProperty(propName).objectReferenceValue = slider;
        }
    }

    private static void LinkText(SerializedObject so, string propName, Transform root, string objName)
    {
        var t = FindDeep(root, objName);
        if (t != null)
        {
            var text = t.GetComponent<Text>();
            if (text != null)
                so.FindProperty(propName).objectReferenceValue = text;
        }
    }

    private static void LinkButton(SerializedObject so, string propName, Transform root, string objName)
    {
        var t = FindDeep(root, objName);
        if (t != null)
        {
            var btn = t.GetComponent<Button>();
            if (btn != null)
                so.FindProperty(propName).objectReferenceValue = btn;
        }
    }

    private static void LinkPanel(SerializedObject so, string propName, Transform root, string objName)
    {
        var t = FindDeep(root, objName);
        if (t != null)
            so.FindProperty(propName).objectReferenceValue = t.gameObject;
    }

    private static Transform FindDeep(Transform parent, string name)
    {
        if (parent.name == name) return parent;
        foreach (Transform child in parent)
        {
            var result = FindDeep(child, name);
            if (result != null) return result;
        }
        return null;
    }

    private static void BuildUpgradeButtonPrefab()
    {
        var btnGO = new GameObject("UpgradeButton");
        var rt = btnGO.AddComponent<RectTransform>();
        rt.sizeDelta = new Vector2(400, 80);

        var img = btnGO.AddComponent<Image>();
        img.color = new Color(0.12f, 0.12f, 0.24f, 0.95f);

        var btn = btnGO.AddComponent<Button>();
        btn.targetGraphic = img;

        var outline = btnGO.AddComponent<Outline>();
        outline.effectColor = new Color(0.33f, 0.33f, 1f);
        outline.effectDistance = new Vector2(2, 2);

        var textGO = new GameObject("Text");
        var textRT = textGO.AddComponent<RectTransform>();
        textRT.SetParent(rt, false);
        textRT.anchorMin = Vector2.zero;
        textRT.anchorMax = Vector2.one;
        textRT.offsetMin = new Vector2(10, 5);
        textRT.offsetMax = new Vector2(-10, -5);

        var text = textGO.AddComponent<Text>();
        text.text = "Upgrade Option";
        text.fontSize = 16;
        text.color = Color.white;
        text.alignment = TextAnchor.MiddleCenter;
        text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

        SavePrefab(btnGO, "Assets/Prefabs/UI/UpgradeButton.prefab");
    }

    private static RectTransform CreateUIPanel(Transform parent, string name)
    {
        var go = new GameObject(name);
        var rt = go.AddComponent<RectTransform>();
        rt.SetParent(parent, false);
        rt.anchorMin = Vector2.zero;
        rt.anchorMax = Vector2.one;
        rt.offsetMin = Vector2.zero;
        rt.offsetMax = Vector2.zero;
        return rt;
    }

    private static void SetAnchors(RectTransform rt, Vector2 min, Vector2 max)
    {
        rt.anchorMin = min;
        rt.anchorMax = max;
        rt.offsetMin = Vector2.zero;
        rt.offsetMax = Vector2.zero;
    }

    private static Slider CreateSlider(Transform parent, string name, Vector2 pos, Vector2 size, Color fillColor)
    {
        var go = new GameObject(name);
        var rt = go.AddComponent<RectTransform>();
        rt.SetParent(parent, false);
        rt.anchoredPosition = pos;
        rt.sizeDelta = size;

        // Background
        var bgGO = new GameObject("Background");
        var bgRT = bgGO.AddComponent<RectTransform>();
        bgRT.SetParent(rt, false);
        bgRT.anchorMin = Vector2.zero;
        bgRT.anchorMax = Vector2.one;
        bgRT.offsetMin = Vector2.zero;
        bgRT.offsetMax = Vector2.zero;
        var bgImg = bgGO.AddComponent<Image>();
        bgImg.color = new Color(0.2f, 0.2f, 0.2f);

        // Fill Area
        var fillArea = new GameObject("Fill Area");
        var fillAreaRT = fillArea.AddComponent<RectTransform>();
        fillAreaRT.SetParent(rt, false);
        fillAreaRT.anchorMin = Vector2.zero;
        fillAreaRT.anchorMax = Vector2.one;
        fillAreaRT.offsetMin = Vector2.zero;
        fillAreaRT.offsetMax = Vector2.zero;

        // Fill
        var fillGO = new GameObject("Fill");
        var fillRT = fillGO.AddComponent<RectTransform>();
        fillRT.SetParent(fillAreaRT, false);
        fillRT.anchorMin = Vector2.zero;
        fillRT.anchorMax = Vector2.one;
        fillRT.offsetMin = Vector2.zero;
        fillRT.offsetMax = Vector2.zero;
        var fillImg = fillGO.AddComponent<Image>();
        fillImg.color = fillColor;

        var slider = go.AddComponent<Slider>();
        slider.fillRect = fillRT;
        slider.minValue = 0;
        slider.maxValue = 1;
        slider.value = 1;
        slider.interactable = false;
        slider.transition = Selectable.Transition.None;

        return slider;
    }

    private static RectTransform CreateText(Transform parent, string name, string content, Vector2 pos, int fontSize)
    {
        var go = new GameObject(name);
        var rt = go.AddComponent<RectTransform>();
        rt.SetParent(parent, false);
        rt.anchoredPosition = pos;
        rt.sizeDelta = new Vector2(400, 60);

        var text = go.AddComponent<Text>();
        text.text = content;
        text.fontSize = fontSize;
        text.color = Color.white;
        text.alignment = TextAnchor.MiddleCenter;
        text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

        return rt;
    }

    private static Button CreateButton(Transform parent, string name, string label, Vector2 pos)
    {
        var go = new GameObject(name);
        var rt = go.AddComponent<RectTransform>();
        rt.SetParent(parent, false);
        rt.anchoredPosition = pos;
        rt.sizeDelta = new Vector2(250, 50);

        var img = go.AddComponent<Image>();
        img.color = new Color(0.27f, 0.27f, 1f);

        var btn = go.AddComponent<Button>();
        btn.targetGraphic = img;

        var textGO = new GameObject("Text");
        var textRT = textGO.AddComponent<RectTransform>();
        textRT.SetParent(rt, false);
        textRT.anchorMin = Vector2.zero;
        textRT.anchorMax = Vector2.one;
        textRT.offsetMin = Vector2.zero;
        textRT.offsetMax = Vector2.zero;

        var text = textGO.AddComponent<Text>();
        text.text = label;
        text.fontSize = 18;
        text.color = Color.white;
        text.alignment = TextAnchor.MiddleCenter;
        text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

        return btn;
    }

    private static void SavePrefab(GameObject go, string path)
    {
        // 確保目錄存在
        string dir = System.IO.Path.GetDirectoryName(path);
        if (!AssetDatabase.IsValidFolder(dir))
        {
            string[] parts = dir.Replace("\\", "/").Split('/');
            string currentPath = parts[0];
            for (int i = 1; i < parts.Length; i++)
            {
                string nextPath = currentPath + "/" + parts[i];
                if (!AssetDatabase.IsValidFolder(nextPath))
                {
                    AssetDatabase.CreateFolder(currentPath, parts[i]);
                }
                currentPath = nextPath;
            }
        }

        PrefabUtility.SaveAsPrefabAsset(go, path);
        DestroyImmediate(go);
    }
}
