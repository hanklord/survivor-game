using Unity.Entities;
using Unity.Mathematics;
using UnityEngine;

/// <summary>
/// MonoBehaviour 橋接：將 Player Transform 位置同步到 ECS Singleton
/// 掛在 Player GameObject 上
/// </summary>
public class PlayerPositionSync : MonoBehaviour
{
    private EntityManager _entityManager;
    private Entity _singletonEntity;
    private bool _initialized;

    private void Start()
    {
        InitializeECS();
    }

    private void InitializeECS()
    {
        if (World.DefaultGameObjectInjectionWorld == null) return;

        _entityManager = World.DefaultGameObjectInjectionWorld.EntityManager;

        // 找或建 PlayerPositionSingleton
        var query = _entityManager.CreateEntityQuery(typeof(PlayerPositionSingleton));
        if (query.CalculateEntityCount() == 0)
        {
            _singletonEntity = _entityManager.CreateEntity(typeof(PlayerPositionSingleton));
        }
        else
        {
            _singletonEntity = query.GetSingletonEntity();
        }

        _initialized = true;
    }

    private void LateUpdate()
    {
        if (!_initialized)
        {
            InitializeECS();
            return;
        }

        if (!_entityManager.Exists(_singletonEntity)) return;

        _entityManager.SetComponentData(_singletonEntity, new PlayerPositionSingleton
        {
            Position = new float3(transform.position.x, transform.position.y, 0f)
        });
    }
}
