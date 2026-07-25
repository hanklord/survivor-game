using Unity.Burst;
using Unity.Collections;
using Unity.Entities;
using Unity.Mathematics;
using Unity.Transforms;

/// <summary>
/// ECS System: 敵人移動系統
/// 使用 Burst 編譯加速，批量處理所有活躍敵人的追蹤移動
/// </summary>
[BurstCompile]
[UpdateInGroup(typeof(SimulationSystemGroup))]
public partial struct EnemyMovementSystem : ISystem
{
    [BurstCompile]
    public void OnCreate(ref SystemState state)
    {
        state.RequireForUpdate<PlayerPositionSingleton>();
        state.RequireForUpdate<EnemyActiveTag>();
    }

    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        var playerPos = SystemAPI.GetSingleton<PlayerPositionSingleton>().Position;
        float dt = SystemAPI.Time.DeltaTime;

        new MoveTowardsPlayerJob
        {
            PlayerPosition = playerPos,
            DeltaTime = dt
        }.ScheduleParallel();
    }

    [BurstCompile]
    partial struct MoveTowardsPlayerJob : IJobEntity
    {
        public float3 PlayerPosition;
        public float DeltaTime;

        void Execute(ref LocalTransform transform, in EnemyComponent enemy, in EnemyActiveTag _)
        {
            float3 currentPos = transform.Position;
            float3 direction = math.normalizesafe(PlayerPosition - currentPos);
            float3 newPos = currentPos + direction * enemy.Speed * DeltaTime;
            transform.Position = newPos;
        }
    }
}
