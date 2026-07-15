using UnityEngine;

/// <summary>
/// CameraShake — 畫面震動效果
/// 對應原始架構: renderer.js Renderer.shake
/// </summary>
public class CameraShake : MonoBehaviour
{
    public static CameraShake Instance { get; private set; }

    private float _duration;
    private float _timer;
    private float _intensity;
    private Vector3 _originalPosition;

    private void Awake()
    {
        Instance = this;
    }

    /// <summary>
    /// 觸發畫面震動
    /// </summary>
    /// <param name="duration">持續時間 (秒)</param>
    /// <param name="intensity">震動強度</param>
    public void Shake(float duration, float intensity)
    {
        _duration = duration;
        _timer = duration;
        _intensity = intensity;
        _originalPosition = transform.localPosition;
    }

    private void Update()
    {
        if (_timer <= 0) return;

        _timer -= Time.deltaTime;
        float progress = _timer / _duration;
        float currentIntensity = _intensity * progress;

        Vector2 offset = Random.insideUnitCircle * currentIntensity;
        transform.localPosition = _originalPosition + new Vector3(offset.x, offset.y, 0);

        if (_timer <= 0)
        {
            transform.localPosition = _originalPosition;
        }
    }
}
