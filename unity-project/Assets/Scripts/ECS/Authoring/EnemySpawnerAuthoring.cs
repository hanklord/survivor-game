using Unity.Entities;
using Unity.Mathematics;
using UnityEngine;

/// <summary>
/// Authoring Component: 敵人生成器
/// 放在場景中的 GameObject 上，Baker 會轉換為 ECS Entity
/// </summary>
public class EnemySpawnerAuthoring : MonoBehaviour
{
    [Header("Spawn Settings")]
    public int maxEnemies = 30;
    public float spawnRadius = 12f;
    public bool killToRespawn = true;

    class Baker : Baker<EnemySpawnerAuthoring>
    {
        public override void Bake(EnemySpawnerAuthoring authoring)
        {
            var entity = GetEntity(TransformUsageFlags.None);

            AddComponent(entity, new EnemySpawnConfig
            {
                MaxEnemies = authoring.maxEnemies,
                CurrentCount = 0,
                SpawnRadius = authoring.spawnRadius,
                CurrentLevelIndex = 0,
                KillToRespawn = authoring.killToRespawn
            });

            AddComponent(entity, new HardcoreModeData
            {
                IsActive = false,
                Cycle = 0,
                HPMultiplier = 1f
            });

            AddBuffer<EnemySpawnRequest>(entity);
        }
    }
}
