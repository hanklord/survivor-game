using Unity.Entities;
using Unity.Mathematics;
using UnityEngine;

/// <summary>
/// Authoring Component: 敵人 Entity
/// 掛在 Enemy Prefab 上，Baker 轉換為 ECS Entity
/// </summary>
public class EnemyAuthoring : MonoBehaviour
{
    [Header("Base Stats")]
    public float hp = 3f;
    public float speed = 1.8f;
    public float damage = 5f;
    public int xpValue = 1;
    public int enemyTypeIndex = 0;
    public float size = 0.72f;

    [Header("Animation")]
    public int totalFrames = 3;
    public float frameDuration = 0.15f;

    class Baker : Baker<EnemyAuthoring>
    {
        public override void Bake(EnemyAuthoring authoring)
        {
            var entity = GetEntity(TransformUsageFlags.Dynamic);

            AddComponent(entity, new EnemyComponent
            {
                HP = authoring.hp,
                MaxHP = authoring.hp,
                Speed = authoring.speed,
                Damage = authoring.damage,
                XPValue = authoring.xpValue,
                EnemyTypeIndex = authoring.enemyTypeIndex,
                Size = authoring.size,
                Target = Entity.Null
            });

            AddComponent(entity, new EnemyAnimationState
            {
                CurrentFrame = 0,
                TotalFrames = authoring.totalFrames,
                FrameTimer = 0f,
                FrameDuration = authoring.frameDuration
            });

            AddComponent(entity, new EnemyActiveTag());
            AddComponent(entity, new HittableTag());

            AddComponent(entity, new CollisionRadius
            {
                Value = authoring.size * 0.5f
            });

            AddBuffer<DamageEvent>(entity);
        }
    }
}
