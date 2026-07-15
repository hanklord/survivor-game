using UnityEngine;

/// <summary>
/// XPGemController — 經驗寶石控制器
/// 對應原始架構: xp-gem.js XPGem class
/// 支援物件池重用、吸引靠近機制
/// </summary>
public class XPGemController : MonoBehaviour
{
    public int Value { get; private set; } = 1;
    public bool IsActive { get; private set; }

    private const float ATTRACT_SPEED = 6f;   // 原 300px/s
    private const float PICKUP_RADIUS = 0.3f;

    private Transform _player;
    private float _pickupRange;

    /// <summary>
    /// 初始化（從物件池取出時呼叫）
    /// </summary>
    public void Initialize(int value)
    {
        Value = value;
        IsActive = true;
        gameObject.SetActive(true);
    }

    private void Update()
    {
        if (!IsActive) return;

        if (_player == null)
        {
            if (GameManager.Instance.Player != null)
            {
                _player = GameManager.Instance.Player.transform;
            }
            return;
        }

        _pickupRange = GameManager.Instance.Player.PickupRange;

        float dist = Vector2.Distance(transform.position, _player.position);

        // 進入拾取範圍後被吸引
        if (dist < _pickupRange)
        {
            Vector3 dir = (_player.position - transform.position).normalized;
            transform.position += dir * ATTRACT_SPEED * Time.deltaTime;
        }

        // 碰觸撿取
        if (dist < PICKUP_RADIUS)
        {
            PickUp();
        }
    }

    private void PickUp()
    {
        IsActive = false;

        // XP 加成
        float xpBonus = GameManager.Instance.SkillTree.GetBonus(SkillType.XPBonus)
                      + GameManager.Instance.PassiveItems.GetBonus(PassiveItemType.XPBonus);
        int finalValue = Mathf.RoundToInt(Value * (1f + xpBonus));

        bool leveledUp = GameManager.Instance.Player.AddXP(finalValue);

        if (leveledUp)
        {
            GameManager.Instance.ShowLevelUp();
        }

        GameManager.Instance.AudioManager.PlaySFX(SFXType.Pickup);

        // 歸還物件池
        gameObject.SetActive(false);
        GameManager.Instance.PoolManager.ReleaseXPGem(this);
    }

    /// <summary>
    /// 強制吸取（磁鐵效果）
    /// </summary>
    public void ForceAttract()
    {
        if (!IsActive) return;

        // 直接設定為被吸引狀態（下一幀會自動靠近）
        _pickupRange = float.MaxValue;
    }
}
