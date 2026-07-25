using Unity.Burst;
using Unity.Collections;
using Unity.Entities;
using Unity.Mathematics;
using Unity.Transforms;

/// <summary>
/// ECS System: 敵人生成系統
/// 實作 kill-to-respawn 機制：維持場上 MAX_ENEMIES (30) 隻敵人
/// 死亡的敵人被回收，新敵人在畫面外生成
/// </summary>
[UpdateInGroup(typeof(SimulationSystemGroup))]
public partial struct EnemySpawnSystem : ISystem
{
    private Unity.Mathematics.Random _random;

    public void OnCreate(ref SystemState state)
    {
        state.RequireForUpdate<EnemySpawnConfig>();
        _random = new Unity.Mathematics.Random(42);
    }

    public void OnUpdate(ref SystemState state)
    {
        var config = SystemAPI.GetSingletonRW<EnemySpawnConfig>();

        // 計算活躍敵人數
        int activeCount = 0;
        foreach (var _ in SystemAPI.Query<RefRO<EnemyComponent>>().WithAll<EnemyActiveTag>())
        {
            activeCount++;
        }

        config.ValueRW.CurrentCount = activeCount;

        // Kill-to-respawn: 如果少於 MaxEnemies，發出生成請求
        int deficit = config.ValueRO.MaxEnemies - activeCount;
        if (deficit <= 0) return;

        // 透過 EnemySpawnRequest buffer 讓 Managed 層處理實際 Instantiate
        // （因為 Prefab 引用需要 Managed 環境）
        var playerPos = float3.zero;
        if (SystemAPI.HasSingleton<PlayerPositionSingleton>())
        {
            playerPos = SystemAPI.GetSingleton<PlayerPositionSingleton>().Position;
        }

        // 生成位置：在玩家周圍 SpawnRadius 的圓上隨機
        foreach (var requestBuffer in SystemAPI.Query<DynamicBuffer<EnemySpawnRequest>>())
        {
            for (int i = 0; i < deficit && i < 5; i++) // 每幀最多補 5 隻
            {
                float angle = _random.NextFloat(0f, math.PI * 2f);
                float radius = config.ValueRO.SpawnRadius;
                float3 spawnPos = playerPos + new float3(
                    math.cos(angle) * radius,
                    math.sin(angle) * radius,
                    0f
                );

                requestBuffer.Add(new EnemySpawnRequest
                {
                    EnemyTypeIndex = _random.NextInt(0, 5), // 隨機敵人類型
                    SpawnPosition = spawnPos,
                    HP = 3f,   // 由 Managed 層根據 level 覆寫
                    Speed = 1.8f,
                    Damage = 5f,
                    XPValue = 1,
                    Size = 0.72f
                });
            }
        }
    }
}
