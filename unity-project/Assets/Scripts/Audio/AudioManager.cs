using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// AudioManager — 音訊管理器
/// 對應原始架構: audio.js AudioManager class
/// 管理 BGM 播放與 SFX 音效
/// </summary>
public class AudioManager : MonoBehaviour
{
    [Header("Sources")]
    [SerializeField] private AudioSource _bgmSource;
    [SerializeField] private AudioSource _sfxSource;
    [SerializeField] private AudioSource _ambientSource;

    [Header("SFX Clips")]
    [SerializeField] private AudioClip _shootClip;
    [SerializeField] private AudioClip _arrowShootClip;
    [SerializeField] private AudioClip _enemyDeathClip;
    [SerializeField] private AudioClip _levelUpClip;
    [SerializeField] private AudioClip _bossWarningClip;
    [SerializeField] private AudioClip _hurtClip;
    [SerializeField] private AudioClip _pickupClip;

    [Header("Settings")]
    [SerializeField] [Range(0f, 1f)] private float _masterVolume = 0.5f;

    private bool _bgmMuted;
    private bool _sfxMuted;
    private Dictionary<SFXType, AudioClip> _sfxMap;

    private const string BGM_MUTE_KEY = "audio_bgm_mute";
    private const string SFX_MUTE_KEY = "audio_sfx_mute";

    private void Awake()
    {
        _sfxMap = new Dictionary<SFXType, AudioClip>
        {
            { SFXType.Shoot, _shootClip },
            { SFXType.ArrowShoot, _arrowShootClip },
            { SFXType.EnemyDeath, _enemyDeathClip },
            { SFXType.LevelUp, _levelUpClip },
            { SFXType.BossWarning, _bossWarningClip },
            { SFXType.Hurt, _hurtClip },
            { SFXType.Pickup, _pickupClip },
        };

        // 載入設定
        _bgmMuted = PlayerPrefs.GetInt(BGM_MUTE_KEY, 0) == 1;
        _sfxMuted = PlayerPrefs.GetInt(SFX_MUTE_KEY, 0) == 1;

        if (_bgmSource != null) _bgmSource.mute = _bgmMuted;
    }

    /// <summary>
    /// 播放/切換背景音樂
    /// </summary>
    public void PlayBGM(AudioClip clip)
    {
        if (clip == null || _bgmSource == null) return;

        if (_bgmSource.clip == clip && _bgmSource.isPlaying) return;

        _bgmSource.clip = clip;
        _bgmSource.loop = true;
        _bgmSource.volume = _masterVolume;
        _bgmSource.Play();
    }

    /// <summary>
    /// 停止背景音樂
    /// </summary>
    public void StopBGM()
    {
        if (_bgmSource != null) _bgmSource.Stop();
    }

    /// <summary>
    /// 播放指定音效
    /// </summary>
    public void PlaySFX(SFXType type)
    {
        if (_sfxMuted || _sfxSource == null) return;

        if (_sfxMap.TryGetValue(type, out var clip) && clip != null)
        {
            _sfxSource.PlayOneShot(clip, _masterVolume);
        }
    }

    /// <summary>
    /// 播放環境音
    /// </summary>
    public void PlayAmbient(AudioClip clip)
    {
        if (clip == null || _ambientSource == null) return;

        _ambientSource.clip = clip;
        _ambientSource.loop = true;
        _ambientSource.volume = _masterVolume * 0.3f;
        _ambientSource.Play();
    }

    public void StopAmbient()
    {
        if (_ambientSource != null) _ambientSource.Stop();
    }

    /// <summary>
    /// 切換靜音
    /// </summary>
    public bool ToggleMute()
    {
        _bgmMuted = !_bgmMuted;
        _sfxMuted = _bgmMuted;

        if (_bgmSource != null) _bgmSource.mute = _bgmMuted;

        PlayerPrefs.SetInt(BGM_MUTE_KEY, _bgmMuted ? 1 : 0);
        PlayerPrefs.SetInt(SFX_MUTE_KEY, _sfxMuted ? 1 : 0);
        PlayerPrefs.Save();

        return !_bgmMuted; // 回傳是否啟用
    }

    /// <summary>
    /// 設定音量 (0~1)
    /// </summary>
    public void SetVolume(float v)
    {
        _masterVolume = Mathf.Clamp01(v);
        if (_bgmSource != null) _bgmSource.volume = _masterVolume;
    }

    public bool IsMuted => _bgmMuted;
}

/// <summary>
/// 音效類型列舉
/// </summary>
public enum SFXType
{
    Shoot,
    ArrowShoot,
    EnemyDeath,
    LevelUp,
    BossWarning,
    Hurt,
    Pickup
}
