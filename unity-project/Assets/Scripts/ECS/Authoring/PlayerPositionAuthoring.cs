using Unity.Entities;
using Unity.Mathematics;
using UnityEngine;

/// <summary>
/// Authoring Component: 玩家位置同步到 ECS
/// 掛在 Player GameObject 上，每幀將 MonoBehaviour 位置同步到 ECS Singleton
/// </summary>
public class PlayerPositionAuthoring : MonoBehaviour
{
    class Baker : Baker<PlayerPositionAuthoring>
    {
        public override void Bake(PlayerPositionAuthoring authoring)
        {
            var entity = GetEntity(TransformUsageFlags.Dynamic);
            AddComponent(entity, new PlayerPositionSingleton
            {
                Position = float3.zero
            });
        }
    }
}
