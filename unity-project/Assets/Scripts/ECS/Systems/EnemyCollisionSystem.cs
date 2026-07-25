using Unity.Burst;
using Unity.Collections;
using Unity.Entities;
using Unity.Mathematics;
using Unity.Transforms;

/// <summary>
/// ECS System: 敵人碰撞偵測系統
/// 以玩家為中心檢測周圍敵人，產生傷害事件
/// </summary>
[BurstCompile]
[UpdateInGroup(typeof(SimulationSystemGroup))]
[UpdateAfter(typeof(EnemyMovementSystem))]
public partial struct EnemyCollisionSystem : ISystem
{
    [BurstCompile]
    public void OnCreate(ref SystemState state)
    {
        state.RequireForUpdate<PlayerPositionSingleton>();
    }

    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        var playerPos = SystemAPI.GetSingleton<PlayerPositionSingleton>().Position;
        float playerCollisionRadius = 0.4f; // 玩家碰撞半徑

        var ecb = new EntityCommandBuffer(Allocator.TempJob);

        foreach (var (transform, enemy, entity) in
            SystemAPI.Query<RefRO<LocalTransform>, RefRO<EnemyComponent>>()
            .WithAll<EnemyActiveTag>()
            .WithEntityAccess())
        {
            float dist = math.distance(transform.ValueRO.Position, playerPos);
            float combinedRadius = playerCollisionRadius + enemy.ValueRO.Size * 0.5f;

            if (dist < combinedRadius)
            {
                // 碰撞發生 - 此處可添加 DamageEvent buffer
                // 實際傷害邏輯由 MonoBehaviour 橋接處理
            }
        }

        ecb.Playback(state.EntityManager);
        ecb.Dispose();
    }
}
