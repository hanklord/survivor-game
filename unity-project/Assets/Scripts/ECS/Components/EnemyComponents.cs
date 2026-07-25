using Unity.Entities;
using Unity.Mathematics;

/// <summary>
/// ECS Component: 敵人資料
/// 用於大量敵人的高效生成/移動/碰撞
/// </summary>
public struct EnemyComponent : IComponentData
{
    public float HP;
    public float MaxHP;
    public float Speed;
    public float Damage;
    public int XPValue;
    public int EnemyTypeIndex;
    public float Size;
    public Entity Target; // 追蹤的玩家 Entity
}

/// <summary>
/// ECS Component: 敵人移動方向（每幀更新）
/// </summary>
public struct EnemyMoveDirection : IComponentData
{
    public float2 Value;
}

/// <summary>
/// ECS Tag: 標記活躍的敵人
/// </summary>
public struct EnemyActiveTag : IComponentData { }

/// <summary>
/// ECS Tag: 標記已死亡等待回收的敵人
/// </summary>
public struct EnemyDeadTag : IComponentData { }

/// <summary>
/// ECS Component: 敵人動畫狀態
/// </summary>
public struct EnemyAnimationState : IComponentData
{
    public int CurrentFrame;
    public int TotalFrames;
    public float FrameTimer;
    public float FrameDuration;
}

/// <summary>
/// ECS Component: Boss 專屬資料
/// </summary>
public struct BossComponent : IComponentData
{
    public float HP;
    public float MaxHP;
    public float Speed;
    public float Damage;
    public int BossIndex;
    public bool HasRangedAttack;
    public float RangedAttackInterval;
    public float RangedAttackTimer;
}

/// <summary>
/// ECS Tag: Boss 標記
/// </summary>
public struct BossTag : IComponentData { }
