using UnityEngine;

/// <summary>
/// TreasureChest — 寶箱道具
/// 對應原始架構: elite-spawner.js 寶箱邏輯
/// 玩家拾取後觸發升級選單
/// </summary>
public class TreasureChest : MonoBehaviour
{
    private bool _opened;

    private void OnTriggerEnter2D(Collider2D other)
    {
        if (_opened) return;
        if (!other.CompareTag("Player")) return;

        _opened = true;
        GameManager.Instance.ShowLevelUp();
        Destroy(gameObject, 0.1f);
    }
}
