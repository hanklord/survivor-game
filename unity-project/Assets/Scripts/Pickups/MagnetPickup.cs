using UnityEngine;

/// <summary>
/// MagnetPickup — 磁鐵道具
/// 對應原始架構: elite-spawner.js 磁鐵邏輯
/// 玩家拾取後自動吸收所有 XP 寶石
/// </summary>
public class MagnetPickup : MonoBehaviour
{
    private float _duration = 2f;
    private bool _activated;

    public void Initialize(float duration)
    {
        _duration = duration;
        _activated = false;
    }

    private void OnTriggerEnter2D(Collider2D other)
    {
        if (_activated) return;
        if (!other.CompareTag("Player")) return;

        _activated = true;
        ActivateMagnet();
        Destroy(gameObject, 0.1f);
    }

    private void ActivateMagnet()
    {
        // 吸引所有場上的 XP 寶石
        var gems = FindObjectsOfType<XPGemController>();
        foreach (var gem in gems)
        {
            gem.ForceAttract();
        }
    }
}
