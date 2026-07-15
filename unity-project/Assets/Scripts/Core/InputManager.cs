using UnityEngine;

/// <summary>
/// InputManager — 輸入管理（鍵盤 + 觸控搖桿 + Gamepad）
/// 對應原始架構: input.js InputManager class
/// Unity 版本直接使用 Input 系統，此為封裝層
/// </summary>
public class InputManager : MonoBehaviour
{
    [Header("Mobile")]
    [SerializeField] private GameObject _joystickUI;
    [SerializeField] private RectTransform _joystickKnob;
    [SerializeField] private RectTransform _joystickBase;

    private Vector2 _joystickDir;
    private bool _isMobile;
    private int _joystickTouchId = -1;
    private Vector2 _joystickCenter;

    private const float JOYSTICK_MAX_RADIUS = 50f;
    private const float GAMEPAD_DEADZONE = 0.15f;

    private void Awake()
    {
        _isMobile = Application.isMobilePlatform;
        if (_joystickUI != null)
        {
            _joystickUI.SetActive(_isMobile);
        }
    }

    private void Update()
    {
        // 暫停
        if (Input.GetKeyDown(KeyCode.Escape))
        {
            GameManager.Instance?.TogglePause();
        }

        // 靜音
        if (Input.GetKeyDown(KeyCode.M))
        {
            var enabled = GameManager.Instance?.AudioManager?.ToggleMute() ?? false;
            GameManager.Instance?.UIManager?.UpdateMute(enabled);
        }

        // 除錯
        if (Input.GetKeyDown(KeyCode.N) && Debug.isDebugBuild)
        {
            GameManager.Instance?.LevelManager?.Advance();
        }
        if (Input.GetKeyDown(KeyCode.L) && Debug.isDebugBuild)
        {
            GameManager.Instance?.ShowLevelUp();
        }

        // 行動裝置搖桿
        if (_isMobile)
        {
            UpdateTouchJoystick();
        }
    }

    /// <summary>
    /// 取得正規化移動方向（鍵盤/搖桿/Gamepad 統一）
    /// </summary>
    public Vector2 GetDirection()
    {
        float dx = 0f, dy = 0f;

        // 鍵盤
        if (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow)) dy += 1f;
        if (Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow)) dy -= 1f;
        if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow)) dx -= 1f;
        if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow)) dx += 1f;

        // 觸控搖桿
        if (_isMobile && (_joystickDir.x != 0 || _joystickDir.y != 0))
        {
            dx = _joystickDir.x;
            dy = _joystickDir.y;
        }

        // Gamepad
        float gpx = Input.GetAxis("Horizontal");
        float gpy = Input.GetAxis("Vertical");
        if (Mathf.Abs(gpx) > GAMEPAD_DEADZONE || Mathf.Abs(gpy) > GAMEPAD_DEADZONE)
        {
            dx = gpx;
            dy = gpy;
        }

        Vector2 dir = new Vector2(dx, dy);
        return dir.sqrMagnitude > 0.01f ? dir.normalized : Vector2.zero;
    }

    private void UpdateTouchJoystick()
    {
        if (Input.touchCount == 0)
        {
            ResetJoystick();
            return;
        }

        for (int i = 0; i < Input.touchCount; i++)
        {
            Touch touch = Input.GetTouch(i);

            if (touch.phase == TouchPhase.Began && _joystickTouchId < 0)
            {
                // 只處理螢幕下半部的觸控
                if (touch.position.y < Screen.height * 0.5f)
                {
                    _joystickTouchId = touch.fingerId;
                    _joystickCenter = touch.position;
                }
            }
            else if (touch.fingerId == _joystickTouchId)
            {
                if (touch.phase == TouchPhase.Moved || touch.phase == TouchPhase.Stationary)
                {
                    Vector2 delta = touch.position - _joystickCenter;
                    float mag = delta.magnitude;
                    if (mag > JOYSTICK_MAX_RADIUS)
                    {
                        delta = delta.normalized * JOYSTICK_MAX_RADIUS;
                    }

                    _joystickDir = delta / JOYSTICK_MAX_RADIUS;

                    // 更新 UI
                    if (_joystickKnob != null)
                    {
                        _joystickKnob.anchoredPosition = delta;
                    }
                }
                else if (touch.phase == TouchPhase.Ended || touch.phase == TouchPhase.Canceled)
                {
                    ResetJoystick();
                }
            }
        }
    }

    private void ResetJoystick()
    {
        _joystickTouchId = -1;
        _joystickDir = Vector2.zero;
        if (_joystickKnob != null)
        {
            _joystickKnob.anchoredPosition = Vector2.zero;
        }
    }
}
