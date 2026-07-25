using Unity.Burst;
using Unity.Entities;
using Unity.Mathematics;
using Unity.Transforms;

/// <summary>
/// ECS System: 清理已死亡的敵人
/// 處理 EnemyDeadTag，回收或銷毀 Entity
/// </summary>
[BurstCompile]
[UpdateInGroup(typeof(SimulationSystemGroup))]
[UpdateAfter(typeof(EnemyCollisionSystem))]
public partial struct EnemyCleanupSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        var ecb = new EntityCommandBuffer(Unity.Collections.Allocator.TempJob);

        foreach (var (enemy, entity) in
            SystemAPI.Query<RefRO<EnemyComponent>>()
            .WithAll<EnemyDeadTag>()
            .WithEntityAccess())
        {
            ecb.DestroyEntity(entity);
        }

        ecb.Playback(state.EntityManager);
        ecb.Dispose();
    }
}
