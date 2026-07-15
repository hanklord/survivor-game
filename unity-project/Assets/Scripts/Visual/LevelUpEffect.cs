using UnityEngine;

/// <summary>
/// LevelUpEffect — 升級視覺特效
/// 對應原始架構: level-up-effect.js LevelUpEffect class
/// 全螢幕閃光 + 金色光柱 + 光環 + 粒子
/// </summary>
public class LevelUpEffect : MonoBehaviour
{
    [SerializeField] private ParticleSystem _goldenParticles;
    [SerializeField] private SpriteRenderer _lightPillar;
    [SerializeField] private SpriteRenderer _lightRing;
    [SerializeField] private CanvasGroup _flashOverlay;

    private const float DURATION = 1.3f;
    private const float FLASH_DURATION = 0.15f;
    private const float PILLAR_HEIGHT = 8f;
    private const float RING_MAX_RADIUS = 4.8f;

    private float _timer;
    private bool _isActive;
    private Vector3 _position;

    public bool IsActive => _isActive;

    /// <summary>
    /// 在指定位置觸發升級特效
    /// </summary>
    public void Trigger(Vector3 position)
    {
        _position = position;
        _timer = DURATION;
        _isActive = true;
        transform.position = position;

        // 啟動粒子
        if (_goldenParticles != null)
        {
            _goldenParticles.transform.position = position;
            _goldenParticles.Play();
        }

        // 閃光
        if (_flashOverlay != null)
        {
            _flashOverlay.alpha = 1f;
        }
    }

    private void Update()
    {
        if (!_isActive) return;

        _timer -= Time.unscaledDeltaTime; // 使用 unscaled 因為遊戲暫停
        float progress = 1f - (_timer / DURATION);

        // 閃光淡出
        if (_flashOverlay != null)
        {
            float flashProgress = Mathf.Clamp01(progress / (FLASH_DURATION / DURATION));
            _flashOverlay.alpha = 1f - flashProgress;
        }

        // 光柱
        if (_lightPillar != null)
        {
            float pillarScale = Mathf.Lerp(0.5f, 1.5f, progress);
            _lightPillar.transform.localScale = new Vector3(pillarScale, PILLAR_HEIGHT * (1f - progress * 0.3f), 1f);
            var c = _lightPillar.color;
            _lightPillar.color = new Color(c.r, c.g, c.b, 1f - progress);
        }

        // 光環
        if (_lightRing != null)
        {
            float ringScale = Mathf.Lerp(0f, RING_MAX_RADIUS, progress);
            _lightRing.transform.localScale = Vector3.one * ringScale;
            var c = _lightRing.color;
            _lightRing.color = new Color(c.r, c.g, c.b, 1f - progress);
        }

        if (_timer <= 0)
        {
            _isActive = false;
            if (_lightPillar != null) _lightPillar.color = new Color(1, 1, 1, 0);
            if (_lightRing != null) _lightRing.color = new Color(1, 1, 1, 0);
            if (_flashOverlay != null) _flashOverlay.alpha = 0f;
        }
    }
}
