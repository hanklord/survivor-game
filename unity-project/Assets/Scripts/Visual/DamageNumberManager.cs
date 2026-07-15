using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// DamageNumberManager — 浮動傷害數字管理器
/// 對應原始架構: damage-numbers.js DamageNumbers class
/// 上浮淡出的傷害數字效果
/// </summary>
public class DamageNumberManager : MonoBehaviour
{
    public static DamageNumberManager Instance { get; private set; }

    [SerializeField] private GameObject _damageNumberPrefab;
    [SerializeField] private int _maxNumbers = 20;

    private const float FLOAT_SPEED = 1.2f;    // 原 60px/s
    private const float LIFETIME = 0.8f;
    private const float CRIT_SCALE = 1.5f;

    private List<DamageNumberInstance> _active = new List<DamageNumberInstance>();

    private void Awake()
    {
        Instance = this;
    }

    /// <summary>
    /// 生成傷害數字
    /// </summary>
    public void Spawn(Vector3 worldPos, float damage, bool isCrit = false)
    {
        if (_active.Count >= _maxNumbers) return;
        if (_damageNumberPrefab == null) return;

        var go = Instantiate(_damageNumberPrefab, worldPos, Quaternion.identity, transform);
        var instance = go.GetComponent<DamageNumberInstance>();

        if (instance != null)
        {
            instance.Initialize(damage, isCrit, LIFETIME, FLOAT_SPEED);
            _active.Add(instance);
        }
    }

    /// <summary>
    /// 生成文字（如 DODGE）
    /// </summary>
    public void SpawnText(Vector3 worldPos, string text, Color color)
    {
        if (_active.Count >= _maxNumbers) return;
        if (_damageNumberPrefab == null) return;

        var go = Instantiate(_damageNumberPrefab, worldPos, Quaternion.identity, transform);
        var instance = go.GetComponent<DamageNumberInstance>();

        if (instance != null)
        {
            instance.InitializeText(text, color, LIFETIME, FLOAT_SPEED);
            _active.Add(instance);
        }
    }

    private void Update()
    {
        for (int i = _active.Count - 1; i >= 0; i--)
        {
            if (_active[i] == null || !_active[i].IsActive)
            {
                if (_active[i] != null) Destroy(_active[i].gameObject);
                _active.RemoveAt(i);
            }
        }
    }
}
