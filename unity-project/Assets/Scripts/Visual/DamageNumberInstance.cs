using UnityEngine;

/// <summary>
/// DamageNumberInstance — 單個傷害數字實體
/// 使用 TextMesh (Unity 內建) 無需額外套件
/// </summary>
public class DamageNumberInstance : MonoBehaviour
{
    [SerializeField] private TextMesh _text;

    public bool IsActive { get; private set; }

    private float _lifetime;
    private float _timer;
    private float _floatSpeed;
    private Color _baseColor;

    /// <summary>
    /// 初始化為傷害數字
    /// </summary>
    public void Initialize(float damage, bool isCrit, float lifetime, float floatSpeed)
    {
        IsActive = true;
        _lifetime = lifetime;
        _timer = 0f;
        _floatSpeed = floatSpeed;

        if (_text == null) _text = GetComponent<TextMesh>();
        if (_text == null) return;

        int displayDamage = Mathf.RoundToInt(damage);
        _text.text = isCrit ? $"{displayDamage}!" : displayDamage.ToString();
        _text.fontSize = isCrit ? 60 : 40;
        _baseColor = isCrit ? Color.yellow : Color.white;
        _text.color = _baseColor;

        if (isCrit)
        {
            transform.localScale = Vector3.one * 1.3f;
        }
        else
        {
            transform.localScale = Vector3.one;
        }
    }

    /// <summary>
    /// 初始化為文字（如 DODGE、MISS）
    /// </summary>
    public void InitializeText(string text, Color color, float lifetime, float floatSpeed)
    {
        IsActive = true;
        _lifetime = lifetime;
        _timer = 0f;
        _floatSpeed = floatSpeed;

        if (_text == null) _text = GetComponent<TextMesh>();
        if (_text == null) return;

        _text.text = text;
        _text.fontSize = 48;
        _baseColor = color;
        _text.color = color;
    }

    private void Update()
    {
        if (!IsActive) return;

        _timer += Time.deltaTime;

        // 上浮
        transform.position += Vector3.up * _floatSpeed * Time.deltaTime;

        // 淡出
        float alpha = 1f - (_timer / _lifetime);
        if (_text != null)
        {
            _text.color = new Color(_baseColor.r, _baseColor.g, _baseColor.b, alpha);
        }

        if (_timer >= _lifetime)
        {
            IsActive = false;
        }
    }
}
