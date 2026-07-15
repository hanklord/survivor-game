using UnityEngine;

/// <summary>
/// CameraFollow — 相機跟隨玩家
/// 對應原始架構: renderer.js 中的 camX/camY 邏輯
/// </summary>
public class CameraFollow : MonoBehaviour
{
    [SerializeField] private float _smoothSpeed = 10f;
    [SerializeField] private Vector3 _offset = new Vector3(0, 0, -10f);

    private Transform _target;

    private void Start()
    {
        // 等待玩家生成
        InvokeRepeating(nameof(FindPlayer), 0.1f, 1f);
    }

    private void FindPlayer()
    {
        if (GameManager.Instance != null && GameManager.Instance.Player != null)
        {
            _target = GameManager.Instance.Player.transform;
            CancelInvoke(nameof(FindPlayer));
        }
    }

    private void LateUpdate()
    {
        if (_target == null) return;

        Vector3 desired = _target.position + _offset;
        Vector3 smoothed = Vector3.Lerp(transform.position, desired, _smoothSpeed * Time.deltaTime);
        transform.position = smoothed;
    }
}
