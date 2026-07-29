using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// ChainLightning — 鏈式閃電武器
/// 對應原始架構: weapons.js ChainLightning class
/// 從一個敵人跳到附近另一個，造成鏈式傷害
/// </summary>
public class ChainLightning : WeaponBase
{
    private const float BASE_CD = 2.5f;
    private const float BASE_DAMAGE = 20f;
    private const float CHAIN_RANGE = 3f;      // 原 150px
    private const int BASE_CHAIN_COUNT = 1;

    private float _cd;
    private float _timer;
    private float _damage;
    private int _chainCount;

    [SerializeField] private LineRenderer _lightningRenderer;

    public override void Initialize(PlayerController player)
    {
        base.Initialize(player);
        _cd = BASE_CD;
        _damage = BASE_DAMAGE;
        _chainCount = BASE_CHAIN_COUNT;
        _timer = _cd;
        MaxLevel = 15;
    }

    public override void UpdateWeapon(float dt, PlayerController player)
    {
        _timer -= dt;

        if (_timer <= 0)
        {
            FireChain(player);
            _timer = _cd;
        }
    }

    private void FireChain(PlayerController player)
    {
        var enemies = GameManager.Instance.Enemies;
        if (enemies.Count == 0) return;

        // 找最近的第一個目標
        EnemyBase firstTarget = null;
        float minDist = float.MaxValue;

        foreach (var enemy in enemies)
        {
            float dist = Vector2.Distance(player.transform.position, enemy.transform.position);
            if (dist < minDist)
            {
                minDist = dist;
                firstTarget = enemy;
            }
        }

        if (firstTarget == null) return;

        // 鏈式傷害
        HashSet<int> hitIds = new HashSet<int>();
        List<Vector3> chainPositions = new List<Vector3>();
        chainPositions.Add(player.transform.position);

        EnemyBase current = firstTarget;
        float totalDamage = _damage * player.DamageMultiplier;

        for (int i = 0; i < _chainCount && current != null; i++)
        {
            hitIds.Add(current.EntityID);
            current.TakeDamage(totalDamage);
            chainPositions.Add(current.transform.position);
            if (DamageNumberManager.Instance != null)
                DamageNumberManager.Instance.Spawn(current.transform.position, totalDamage);

            if (current.CurrentHP <= 0)
            {
                GameManager.Instance.HandleKill(current);
            }

            // 找下一個目標
            current = FindNextTarget(current.transform.position, hitIds);
        }

        // 視覺效果
        ShowLightningEffect(chainPositions);
    }

    private EnemyBase FindNextTarget(Vector3 from, HashSet<int> exclude)
    {
        float minDist = CHAIN_RANGE;
        EnemyBase nearest = null;

        foreach (var enemy in GameManager.Instance.Enemies)
        {
            if (exclude.Contains(enemy.EntityID)) continue;
            float dist = Vector2.Distance(from, enemy.transform.position);
            if (dist < minDist)
            {
                minDist = dist;
                nearest = enemy;
            }
        }
        return nearest;
    }

    private void ShowLightningEffect(List<Vector3> positions)
    {
        // 使用 LineRenderer 或粒子系統顯示閃電
        if (_lightningRenderer != null)
        {
            _lightningRenderer.positionCount = positions.Count;
            _lightningRenderer.SetPositions(positions.ToArray());
            _lightningRenderer.enabled = true;

            // 短暫顯示後關閉
            StartCoroutine(HideLightning());
        }
    }

    private System.Collections.IEnumerator HideLightning()
    {
        yield return new WaitForSeconds(0.2f);
        if (_lightningRenderer != null)
        {
            _lightningRenderer.enabled = false;
        }
    }

    public override void Upgrade()
    {
        if (Level >= MaxLevel) return;
        Level++;
        _chainCount = Mathf.Min(15, _chainCount + 1);
        _damage += 3f;
    }

    /// <summary>
    /// 外部呼叫的 Fire 方法 — 從指定位置發射鏈式閃電（供迴力鏢等觸發用）
    /// </summary>
    public void Fire(Vector3 startPos, float chainRange, int chainBounces, float chainDamageMultiplier)
    {
        var enemies = GameManager.Instance.Enemies;
        if (enemies.Count == 0) return;

        // 找起始位置最近的敵人
        EnemyBase firstTarget = null;
        float minDist = chainRange;

        foreach (var enemy in enemies)
        {
            float dist = Vector2.Distance(startPos, enemy.transform.position);
            if (dist < minDist)
            {
                minDist = dist;
                firstTarget = enemy;
            }
        }

        if (firstTarget == null) return;

        // 鏈式傷害
        HashSet<int> hitIds = new HashSet<int>();
        List<Vector3> chainPositions = new List<Vector3>();
        chainPositions.Add(startPos);

        EnemyBase current = firstTarget;
        float baseDamage = _damage * chainDamageMultiplier;

        for (int i = 0; i < chainBounces && current != null; i++)
        {
            hitIds.Add(current.EntityID);
            current.TakeDamage(baseDamage);
            chainPositions.Add(current.transform.position);

            if (DamageNumberManager.Instance != null)
                DamageNumberManager.Instance.Spawn(current.transform.position, baseDamage);

            // 找下一個目標（使用自訂範圍）
            EnemyBase next = null;
            float nextMin = chainRange;
            foreach (var enemy in enemies)
            {
                if (hitIds.Contains(enemy.EntityID)) continue;
                float dist = Vector2.Distance(current.transform.position, enemy.transform.position);
                if (dist < nextMin)
                {
                    nextMin = dist;
                    next = enemy;
                }
            }
            current = next;
        }

        // 視覺效果
        ShowLightningEffect(chainPositions);
    }
}
