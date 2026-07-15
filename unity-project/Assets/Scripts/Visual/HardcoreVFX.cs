using UnityEngine;

/// <summary>
/// HardcoreVFX — 困難模式視覺效果
/// 對應原始架構: hardcore-vfx.js HardcoreVFX class
/// 紅色暈影 + 浮動灰燼粒子
/// </summary>
public class HardcoreVFX : MonoBehaviour
{
    [SerializeField] private SpriteRenderer _vignette;
    [SerializeField] private ParticleSystem _ashParticles;

    private int _level;
    private float _pulseTimer;
    private float _baseAlpha;

    private const float PULSE_SPEED = 2f;
    private const float BASE_ALPHA_PER_LEVEL = 0.1f;
    private const float MAX_ALPHA = 0.35f;
    private const int BASE_PARTICLE_COUNT = 28;
    private const int PARTICLES_PER_LEVEL = 3;

    /// <summary>
    /// 設定困難等級
    /// </summary>
    public void SetLevel(int level)
    {
        _level = level;
        _baseAlpha = Mathf.Min(MAX_ALPHA, 0.15f + (level - 1) * BASE_ALPHA_PER_LEVEL);

        // 更新粒子數量
        if (_ashParticles != null)
        {
            var emission = _ashParticles.emission;
            emission.rateOverTime = BASE_PARTICLE_COUNT + level * PARTICLES_PER_LEVEL;

            // 顏色主題
            var main = _ashParticles.main;
            switch (level)
            {
                case 1:
                    main.startColor = new Color(1f, 0.3f, 0.2f, 0.6f); // 紅
                    break;
                case 2:
                    main.startColor = new Color(1f, 0.85f, 0.2f, 0.6f); // 金
                    break;
                default:
                    main.startColor = new Color(0.6f, 0.2f, 1f, 0.6f); // 紫
                    break;
            }

            _ashParticles.Play();
        }

        // 暈影顏色
        if (_vignette != null)
        {
            Color vignetteColor;
            switch (level)
            {
                case 1: vignetteColor = new Color(1f, 0f, 0f, _baseAlpha); break;
                case 2: vignetteColor = new Color(1f, 0.8f, 0f, _baseAlpha); break;
                default: vignetteColor = new Color(0.5f, 0f, 1f, _baseAlpha); break;
            }
            _vignette.color = vignetteColor;
            _vignette.gameObject.SetActive(true);
        }
    }

    private void Update()
    {
        if (_level <= 0) return;

        // 脈動效果
        _pulseTimer += Time.deltaTime * PULSE_SPEED;
        float pulse = Mathf.Sin(_pulseTimer) * 0.05f;

        if (_vignette != null)
        {
            var c = _vignette.color;
            _vignette.color = new Color(c.r, c.g, c.b, _baseAlpha + pulse);
        }
    }

    public void Disable()
    {
        _level = 0;
        if (_vignette != null) _vignette.gameObject.SetActive(false);
        if (_ashParticles != null) _ashParticles.Stop();
    }
}
