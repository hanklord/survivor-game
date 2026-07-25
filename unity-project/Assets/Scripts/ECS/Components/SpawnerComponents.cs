using Unity.Entities;
using Unity.Mathematics;

/// <summary>
/// ECS Component: 玩家位置（供敵人系統查詢用）
/// </summary>
public struct PlayerPositionSingleton : IComponentData
{
    public float3 Position;
}

/// <summary>
/// ECS Component: 生成器設定
/// </summary>
public struct EnemySpawnConfig : IComponentData
{
    public int MaxEnemies;
    public int CurrentCount;
    public float SpawnRadius;
    public int CurrentLevelIndex;
    public bool KillToRespawn; // kill-to-respawn 模式
}

/// <summary>
/// ECS Component: Hardcore 模式資料
/// </summary>
public struct HardcoreModeData : IComponentData
{
    public bool IsActive;
    public int Cycle; // N in HP ×3^N
    public float HPMultiplier;
}

/// <summary>
/// ECS Buffer: 待生成的敵人佇列
/// </summary>
[InternalBufferCapacity(16)]
public struct EnemySpawnRequest : IBufferElementData
{
    public int EnemyTypeIndex;
    public float3 SpawnPosition;
    public float HP;
    public float Speed;
    public float Damage;
    public int XPValue;
    public float Size;
}
