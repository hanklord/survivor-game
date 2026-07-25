using Unity.Entities;
using Unity.Mathematics;

/// <summary>
/// ECS Component: 傷害事件（用於碰撞系統）
/// </summary>
[InternalBufferCapacity(8)]
public struct DamageEvent : IBufferElementData
{
    public float Amount;
    public float3 SourcePosition;
    public bool IsCritical;
}

/// <summary>
/// ECS Component: 碰撞半徑
/// </summary>
public struct CollisionRadius : IComponentData
{
    public float Value;
}

/// <summary>
/// ECS Tag: 可被投射物擊中
/// </summary>
public struct HittableTag : IComponentData { }
