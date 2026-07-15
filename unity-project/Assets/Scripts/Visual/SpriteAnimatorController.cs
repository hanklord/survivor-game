using UnityEngine;

/// <summary>
/// SpriteAnimatorController — Sprite 動畫控制器
/// 對應原始架構: sprite-animator.js SpriteAnimator class
/// 基於 Sprite 陣列的幀動畫系統
/// </summary>
[RequireComponent(typeof(SpriteRenderer))]
public class SpriteAnimatorController : MonoBehaviour
{
    [Header("Animation Sets")]
    [SerializeField] private SpriteAnimationSet _idleAnim;
    [SerializeField] private SpriteAnimationSet _runAnim;
    [SerializeField] private SpriteAnimationSet _attackAnim;

    private SpriteRenderer _sr;
    private AnimState _currentState = AnimState.Idle;
    [SerializeField] private AnimState _defaultState = AnimState.Idle;
    private SpriteAnimationSet _currentAnim;
    private int _currentFrame;
    private float _frameTimer;
    

    private void Awake()
    {
        _sr = GetComponent<SpriteRenderer>();
        SetState(AnimState.None);
        SetState(_defaultState);
    }

    private void Update()
    {
        if (_currentAnim == null || _currentAnim.frames == null || _currentAnim.frames.Length == 0) return;

        _frameTimer += Time.deltaTime;
        float frameDuration = 1f / _currentAnim.fps;

        if (_frameTimer >= frameDuration)
        {
            _frameTimer -= frameDuration;
            _currentFrame = (_currentFrame + 1) % _currentAnim.frames.Length;
            _sr.sprite = _currentAnim.frames[_currentFrame];
        }
    }

    /// <summary>
    /// 切換動畫狀態
    /// </summary>
    public void SetState(AnimState state)
    {
        if (state == _currentState) return;

        _currentState = state;
        _currentFrame = 0;
        _frameTimer = 0f;

        switch (state)
        {
            case AnimState.Idle:
                _currentAnim = _idleAnim;
                break;
            case AnimState.Run:
                _currentAnim = _runAnim ?? _idleAnim;
                break;
            case AnimState.Attack:
                _currentAnim = _attackAnim ?? _idleAnim;
                break;
        }

        if (_currentAnim != null && _currentAnim.frames != null && _currentAnim.frames.Length > 0)
        {
            _sr.sprite = _currentAnim.frames[0];
        }
    }

    /// <summary>
    /// 設定水平翻轉
    /// </summary>
    public void SetFlipX(bool flip)
    {
        _sr.flipX = flip;
    }
    
    /// <summary>
    /// 設定水平翻轉
    /// </summary>
    public void SetFlipY(bool flip)
    {
        _sr.flipY = flip;
    }

    /// <summary>
    /// 取得當前狀態
    /// </summary>
    public AnimState GetCurrentState() => _currentState;
}

/// <summary>
/// 動畫狀態列舉
/// </summary>
public enum AnimState
{
    None = -1,
    Idle,
    Run,
    Attack
}

/// <summary>
/// Sprite 動畫集
/// </summary>
[System.Serializable]
public class SpriteAnimationSet
{
    public Sprite[] frames;
    public float fps = 8f;
}
