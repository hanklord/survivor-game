using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// GameManager — 主遊戲控制器，管理整個遊戲生命週期
/// 對應原始架構: main.js Game class
/// </summary>
public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    [Header("Configuration")]
    public GameConfig gameConfig;

    [Header("References")]
    public Camera mainCamera;
    public Transform playerSpawnPoint;

    // === 管理器參照 ===
    public WaveManager WaveManager { get; private set; }
    public WeaponManager WeaponManager { get; private set; }
    public LevelManager LevelManager { get; private set; }
    public ComboSystem ComboSystem { get; private set; }
    public BombSystem BombSystem { get; private set; }
    public SkillTree SkillTree { get; private set; }
    public PassiveItems PassiveItems { get; private set; }
    public EliteSpawner EliteSpawner { get; private set; }
    public RushWave RushWave { get; private set; }
    public MetaProgression MetaProgression { get; private set; }
    public AudioManager AudioManager { get; private set; }
    public UIManager UIManager { get; private set; }
    public LeaderboardManager Leaderboard { get; private set; }
    public ObjectPoolManager PoolManager { get; private set; }

    // === 遊戲狀態 ===
    public PlayerController Player { get; private set; }
    public List<EnemyBase> Enemies { get; private set; } = new List<EnemyBase>();
    public List<BossController> Bosses { get; private set; } = new List<BossController>();
    public float GameTime { get; private set; }
    public int Kills { get; private set; }
    public bool IsPaused { get; private set; }
    public bool IsGameOver { get; private set; }
    public bool IsLevelingUp { get; private set; }
    public int HardcoreLevel { get; private set; }

    // === 常數 ===
    public const int MAX_ENEMIES = 30;
    public const int MAX_XP_GEMS = 50;
    public const int MAX_DAMAGE_NUMBERS = 20;
    public const float LOW_FPS_THRESHOLD = 20f;
    public const float PLAYER_HITBOX = 0.4f; // Unity units
    public const int BOSS_XP_DROP_COUNT = 10;
    public const float BOSS_XP_SPREAD = 0.8f;
    public const float REGEN_INTERVAL = 1f;

    private float _regenTimer;
    private float _ultimateCharge;
    private bool _ultimateReady;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);

        InitializeManagers();
    }

    private void InitializeManagers()
    {
        PoolManager = GetComponentInChildren<ObjectPoolManager>();
        AudioManager = GetComponentInChildren<AudioManager>();
        UIManager = FindObjectOfType<UIManager>();
        Leaderboard = new LeaderboardManager();
        MetaProgression = new MetaProgression();
        ComboSystem = new ComboSystem();
        BombSystem = new BombSystem();
        SkillTree = new SkillTree();
        PassiveItems = new PassiveItems();
    }

    /// <summary>
    /// 角色選擇後初始化遊戲狀態
    /// </summary>
    public void InitGame(CharacterType characterType)
    {
        GameTime = 0f;
        Kills = 0;
        IsGameOver = false;
        IsPaused = false;
        HardcoreLevel = 0;
        _ultimateCharge = 0f;
        _ultimateReady = false;

        // 生成玩家
        SpawnPlayer(characterType);

        // 套用 MetaProgression 加成
        MetaProgression.ApplyBonuses(Player);

        // 初始化波次與關卡管理
        WaveManager = GetComponentInChildren<WaveManager>();
        LevelManager = GetComponentInChildren<LevelManager>();
        EliteSpawner = GetComponentInChildren<EliteSpawner>();
        RushWave = GetComponentInChildren<RushWave>();
        WeaponManager = Player.GetComponent<WeaponManager>();

        if (WaveManager != null) WaveManager.Initialize();
        if (LevelManager != null) LevelManager.Initialize();
        if (EliteSpawner != null) EliteSpawner.Initialize();
        if (RushWave != null) RushWave.Initialize();

        // 播放 BGM
        if (AudioManager != null && LevelManager != null)
        {
            AudioManager.PlayBGM(LevelManager.GetCurrentLevelBGM());
        }

        if (UIManager != null) UIManager.ShowHUD();

        Debug.Log("[EndlessHeroes] Game initialized! Player: " + Player.CharacterType);
    }

    private void Update()
    {
        if (IsGameOver || IsPaused || IsLevelingUp) return;
        if (Player == null) return;

        float dt = Time.deltaTime;
        GameTime += dt;

        // 生命回復
        UpdateRegen(dt);

        // 更新 Combo
        ComboSystem.UpdateTimer(dt);

        // 更新 UI
        if (UIManager != null) UIManager.UpdateHUD(Player, GameTime, Kills);
    }

    private void UpdateRegen(float dt)
    {
        float regenRate = SkillTree.GetBonus(SkillType.Regen);
        if (regenRate <= 0) return;

        _regenTimer += dt;
        if (_regenTimer >= REGEN_INTERVAL)
        {
            _regenTimer -= REGEN_INTERVAL;
            Player.Heal(regenRate);
        }
    }

    private void SpawnPlayer(CharacterType type)
    {
        GameObject go;

        if (gameConfig != null)
        {
            var prefab = gameConfig.GetPlayerPrefab(type);
            if (prefab != null)
            {
                go = Instantiate(prefab, playerSpawnPoint != null ? playerSpawnPoint.position : Vector3.zero, Quaternion.identity);
            }
            else
            {
                go = CreateFallbackPlayer(type);
            }
        }
        else
        {
            go = CreateFallbackPlayer(type);
        }

        Player = go.GetComponent<PlayerController>();

        // 取得或建立 CharacterStats
        CharacterStats stats;
        if (gameConfig != null)
        {
            stats = gameConfig.GetCharacterStats(type);
        }
        else
        {
            stats = new CharacterStats(); // 使用預設值
        }

        Player.Initialize(type, stats);
        Debug.Log("[EndlessHeroes] Player spawned: " + type);
    }

    private GameObject CreateFallbackPlayer(CharacterType type)
    {
        var go = new GameObject("Player_" + type);
        go.tag = "Player";
        go.layer = 6;

        var sr = go.AddComponent<SpriteRenderer>();
        sr.color = new Color(0.27f, 0.53f, 1f);
        sr.sortingOrder = 10;

        var rb = go.AddComponent<Rigidbody2D>();
        rb.gravityScale = 0;
        rb.freezeRotation = true;

        var col = go.AddComponent<CircleCollider2D>();
        col.radius = 0.3f;

        go.AddComponent<SpriteAnimatorController>();
        go.AddComponent<PlayerController>();
        go.AddComponent<WeaponManager>();

        // 根據類型加攻擊元件
        switch (type)
        {
            case CharacterType.Mage: go.AddComponent<MageAttack>(); break;
            case CharacterType.Archer: go.AddComponent<ArcherAttack>(); break;
            case CharacterType.Knight: go.AddComponent<MeleeAttack>(); break;
            case CharacterType.Valkyrie: go.AddComponent<ValkyrieAttack>(); break;
        }

        return go;
    }

    /// <summary>
    /// 處理擊殺：掉落 XP、粒子、combo 計數
    /// </summary>
    public void HandleKill(EnemyBase enemy)
    {
        Kills++;
        ComboSystem.AddKill();
        BombSystem.AddCharge(1);

        // 掉落 XP
        int xpValue = enemy.XPValue;
        float multiplier = ComboSystem.GetMultiplier();
        xpValue = Mathf.RoundToInt(xpValue * multiplier);

        PoolManager.SpawnXPGem(enemy.transform.position, xpValue);

        // 粒子效果
        PoolManager.SpawnDeathParticles(enemy.transform.position, enemy.DeathColor);

        // 音效
        AudioManager.PlaySFX(SFXType.EnemyDeath);

        // 移除敵人
        Enemies.Remove(enemy);
    }

    /// <summary>
    /// 處理 Boss 擊殺
    /// </summary>
    public void HandleBossKill(BossController boss)
    {
        Kills++;
        ComboSystem.AddKill();

        // Boss 掉落多顆 XP
        for (int i = 0; i < BOSS_XP_DROP_COUNT; i++)
        {
            Vector2 offset = Random.insideUnitCircle * BOSS_XP_SPREAD;
            Vector3 pos = boss.transform.position + (Vector3)offset;
            PoolManager.SpawnXPGem(pos, boss.XPValue / BOSS_XP_DROP_COUNT);
        }

        // 大量粒子
        PoolManager.SpawnBossDeathParticles(boss.transform.position);

        // 畫面震動
        CameraShake.Instance.Shake(0.3f, 0.5f);

        Bosses.Remove(boss);
        LevelManager.OnBossKilled();

        AudioManager.PlaySFX(SFXType.BossWarning);
    }

    /// <summary>
    /// 玩家受傷（含護甲、閃避、反彈計算）
    /// </summary>
    public void PlayerTakeDamage(float rawDamage)
    {
        if (Player.IsInvulnerable) return;

        // 閃避
        float dodgeChance = SkillTree.GetBonus(SkillType.Dodge);
        if (Random.value < dodgeChance)
        {
            UIManager.ShowDodgeText(Player.transform.position);
            return;
        }

        // 護甲減傷
        float armor = SkillTree.GetBonus(SkillType.Armor) + PassiveItems.GetBonus(PassiveItemType.Armor);
        float finalDamage = Mathf.Max(1, rawDamage - armor);

        Player.TakeDamage(finalDamage);

        // 反彈
        float reflectChance = SkillTree.GetBonus(SkillType.Reflect);
        if (reflectChance > 0 && Random.value < reflectChance)
        {
            // 對周圍敵人造成反彈傷害
            ReflectDamage(rawDamage * 0.5f);
        }

        AudioManager.PlaySFX(SFXType.Hurt);

        if (Player.CurrentHP <= 0)
        {
            EndGame();
        }
    }

    private void ReflectDamage(float damage)
    {
        var nearby = Physics2D.OverlapCircleAll(Player.transform.position, 2f, LayerMask.GetMask("Enemy"));
        foreach (var col in nearby)
        {
            var enemy = col.GetComponent<EnemyBase>();
            if (enemy != null)
            {
                enemy.TakeDamage(damage);
            }
        }
    }

    /// <summary>
    /// 顯示升級選單
    /// </summary>
    public void ShowLevelUp()
    {
        IsLevelingUp = true;
        Time.timeScale = 0f;

        var choices = SkillTree.GetRandomChoices(3);
        UIManager.ShowLevelUp(choices, OnUpgradeSelected);

        AudioManager.PlaySFX(SFXType.LevelUp);
    }

    private void OnUpgradeSelected(UpgradeOption upgrade)
    {
        ApplyUpgrade(upgrade);
        IsLevelingUp = false;
        Time.timeScale = 1f;
        UIManager.HideLevelUp();
    }

    /// <summary>
    /// 套用選擇的升級效果
    /// </summary>
    public void ApplyUpgrade(UpgradeOption upgrade)
    {
        switch (upgrade.Type)
        {
            case UpgradeType.Skill:
                SkillTree.Upgrade(upgrade.SkillType);
                ApplySkillEffect(upgrade.SkillType);
                break;
            case UpgradeType.Weapon:
                WeaponManager.UpgradeWeapon(upgrade.WeaponType);
                break;
            case UpgradeType.PassiveItem:
                PassiveItems.Add(upgrade.PassiveItemType);
                ApplyPassiveEffect(upgrade.PassiveItemType);
                break;
            case UpgradeType.CharacterAttack:
                Player.UpgradeAttack();
                break;
        }

        UIManager.UpdateSkillIcons(SkillTree.GetActiveSkills());
    }

    private void ApplySkillEffect(SkillType type)
    {
        switch (type)
        {
            case SkillType.Speed:
                Player.SetSpeed(Player.BaseSpeed * (1 + SkillTree.GetBonus(SkillType.Speed)));
                break;
            case SkillType.MaxHP:
                Player.IncreaseMaxHP(SkillTree.GetBonusPerLevel(SkillType.MaxHP));
                break;
            case SkillType.Pickup:
                Player.SetPickupRange(Player.BasePickupRange + SkillTree.GetBonus(SkillType.Pickup));
                break;
            case SkillType.Damage:
                Player.SetDamageMultiplier(1 + SkillTree.GetBonus(SkillType.Damage));
                break;
        }
    }

    private void ApplyPassiveEffect(PassiveItemType type)
    {
        switch (type)
        {
            case PassiveItemType.PickupRange:
                Player.SetPickupRange(Player.BasePickupRange + PassiveItems.GetBonus(PassiveItemType.PickupRange));
                break;
            case PassiveItemType.MaxHP:
                Player.IncreaseMaxHP(PassiveItems.GetBonusPerStack(PassiveItemType.MaxHP));
                break;
        }
    }

    /// <summary>
    /// 遊戲結束處理
    /// </summary>
    public void EndGame()
    {
        IsGameOver = true;
        Time.timeScale = 0f;

        var stats = new GameStats
        {
            Kills = Kills,
            Level = Player.Level,
            Time = GameTime,
            HardcoreLevel = HardcoreLevel
        };

        // 計算金幣獎勵
        int coins = MetaProgression.CalculateReward(Kills, GameTime);
        MetaProgression.AddCoins(coins);

        // 排行榜
        Leaderboard.AddEntry(stats);

        UIManager.ShowGameOver(stats, Leaderboard.GetTop(5), coins);
    }

    /// <summary>
    /// 啟動困難模式
    /// </summary>
    public void StartHardcore()
    {
        HardcoreLevel++;
        LevelManager.ResetToLevel(0);
        GameTime = 0f;

        // 敵人 HP 倍率
        float hpMult = Mathf.Pow(GameConfig.HARDCORE_HP_MULTIPLIER, HardcoreLevel);
        WaveManager.SetHPMultiplier(hpMult);

        // 啟動 VFX
        FindObjectOfType<HardcoreVFX>()?.SetLevel(HardcoreLevel);

        AudioManager.PlayBGM(LevelManager.GetCurrentLevelBGM());
    }

    /// <summary>
    /// 施放大招（全螢幕清場）
    /// </summary>
    public void ActivateUltimate()
    {
        if (!_ultimateReady || IsGameOver || IsPaused) return;

        var killed = BombSystem.Activate(Enemies);
        foreach (var enemy in killed)
        {
            HandleKill(enemy);
        }

        _ultimateCharge = 0f;
        _ultimateReady = false;

        CameraShake.Instance.Shake(0.5f, 0.8f);
    }

    public void TogglePause()
    {
        IsPaused = !IsPaused;
        Time.timeScale = IsPaused ? 0f : 1f;
        UIManager.ShowPause(IsPaused);
    }

    public void RegisterEnemy(EnemyBase enemy)
    {
        Enemies.Add(enemy);
    }

    public void RegisterBoss(BossController boss)
    {
        Bosses.Add(boss);
    }
}
