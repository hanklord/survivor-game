using UnityEngine;

/// <summary>
/// EliteSpawner — 菁英怪/磁鐵/寶箱生成管理
/// 對應原始架構: elite-spawner.js EliteSpawner class
/// </summary>
public class EliteSpawner : MonoBehaviour
{
    private const float ELITE_INTERVAL = 60f;
    private const float MAGNET_INTERVAL = 45f;
    private const float MAGNET_DURATION = 2f;

    [SerializeField] private GameObject _magnetPrefab;
    [SerializeField] private GameObject _treasureChestPrefab;

    private float _eliteTimer;
    private float _magnetTimer;

    public void Initialize()
    {
        _eliteTimer = ELITE_INTERVAL;
        _magnetTimer = MAGNET_INTERVAL;
    }

    private void Update()
    {
        if (GameManager.Instance == null || GameManager.Instance.IsGameOver || GameManager.Instance.IsPaused) return;
        if (GameManager.Instance.Player == null) return;

        _eliteTimer -= Time.deltaTime;
        _magnetTimer -= Time.deltaTime;

        if (_eliteTimer <= 0)
        {
            SpawnElite();
            _eliteTimer = ELITE_INTERVAL;
        }

        if (_magnetTimer <= 0)
        {
            SpawnMagnet();
            _magnetTimer = MAGNET_INTERVAL;
        }
    }

    private void SpawnElite()
    {
        var config = GameManager.Instance.gameConfig;
        var player = GameManager.Instance.Player;
        if (config == null || player == null) return;

        var enemyConfig = EnemySpawner.PickConfig(config, GameManager.Instance.GameTime);
        if (enemyConfig == null) return;

        var elite = EnemySpawner.SpawnElite(enemyConfig, player.transform.position);
    }

    private void SpawnMagnet()
    {
        if (_magnetPrefab == null) return;

        var player = GameManager.Instance.Player;
        float angle = Random.Range(0f, Mathf.PI * 2f);
        Vector3 pos = player.transform.position + new Vector3(
            Mathf.Cos(angle) * 5f,
            Mathf.Sin(angle) * 5f,
            0
        );

        var magnet = Instantiate(_magnetPrefab, pos, Quaternion.identity);
        var magnetComp = magnet.GetComponent<MagnetPickup>();
        if (magnetComp != null)
        {
            magnetComp.Initialize(MAGNET_DURATION);
        }
    }

    /// <summary>
    /// 掉落寶箱（菁英擊殺時呼叫）
    /// </summary>
    public void SpawnTreasureChest(Vector3 position)
    {
        if (_treasureChestPrefab == null) return;

        var chest = Instantiate(_treasureChestPrefab, position, Quaternion.identity);
        // 撿取後觸發升級
    }
}
