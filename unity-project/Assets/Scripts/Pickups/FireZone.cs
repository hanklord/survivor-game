using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// FireZone — 火焰區域 DOT
/// 對應原始架構: archer-attack.js 火焰區域邏輯
/// 持續傷害進入範圍的敵人
/// </summary>
public class FireZone : MonoBehaviour
{
    private float _damagePerTick;
    private float _duration;
    private float _timer;
    private float _tickInterval = 0.5f;
    private float _tickTimer;
    private HashSet<int> _hitThisTick = new HashSet<int>();

    public void Initialize(float damagePerTick, float duration)
    {
        _damagePerTick = damagePerTick;
        _duration = duration;
        _timer = 0f;
        _tickTimer = 0f;
    }

    private void Update()
    {
        _timer += Time.deltaTime;
        _tickTimer += Time.deltaTime;

        if (_tickTimer >= _tickInterval)
        {
            _tickTimer -= _tickInterval;
            DamageTick();
        }

        if (_timer >= _duration)
        {
            Destroy(gameObject);
        }
    }

    private void DamageTick()
    {
        _hitThisTick.Clear();
        var hits = Physics2D.OverlapCircleAll(transform.position, transform.localScale.x * 0.5f, LayerMask.GetMask("Enemy"));

        foreach (var hit in hits)
        {
            var enemy = hit.GetComponent<EnemyBase>();
            if (enemy != null && !_hitThisTick.Contains(enemy.EntityID))
            {
                _hitThisTick.Add(enemy.EntityID);
                enemy.TakeDamage(_damagePerTick);

                if (enemy.CurrentHP <= 0)
                {
                    GameManager.Instance.HandleKill(enemy);
                }
            }
        }
    }
}
