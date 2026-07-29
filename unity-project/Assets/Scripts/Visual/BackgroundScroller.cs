using UnityEngine;

/// <summary>
/// BackgroundScroller — 無限背景
/// 背景固定在世界座標原點，尺寸足夠覆蓋相機可視範圍 + 玩家移動範圍。
/// 不跟隨相機（讓玩家移動時有明顯的位移感）。
/// </summary>
public class BackgroundScroller : MonoBehaviour
{
    private SpriteRenderer _sr;

    // 背景覆蓋的世界範圍（正方形半邊長），足以讓玩家在範圍內移動時都看得到背景
    private const float WORLD_COVERAGE = 60f;

    private void Awake()
    {
        _sr = GetComponent<SpriteRenderer>();
        if (_sr == null) _sr = gameObject.AddComponent<SpriteRenderer>();
        _sr.sortingOrder = -100;

        // 固定在 z=10（在所有物件後面）
        transform.position = new Vector3(0, 0, 10f);

        // 預設顯示 grid 背景
        SetGridBackground(new Color(0.08f, 0.08f, 0.14f), new Color(0.15f, 0.15f, 0.22f));
    }

    private void Start()
    {
        FitToWorld();
    }

    /// <summary>
    /// 動態切換背景圖片 (Sprite)
    /// </summary>
    public void SetBackground(Sprite sprite)
    {
        if (sprite == null || _sr == null) return;
        _sr.sprite = sprite;
        _sr.color = Color.white;
        FitToWorld();
    }

    /// <summary>
    /// 動態切換背景紋理 (Texture2D) — 轉為 Sprite 後套用
    /// </summary>
    public void SetBackgroundTexture(Texture2D texture)
    {
        if (texture == null || _sr == null) return;
        var sprite = Sprite.Create(texture,
            new Rect(0, 0, texture.width, texture.height),
            new Vector2(0.5f, 0.5f), 100f);
        _sr.sprite = sprite;
        _sr.color = Color.white;
        FitToWorld();
    }

    /// <summary>
    /// 設定背景顏色（無圖片時用純色填充）
    /// </summary>
    public void SetBackgroundColor(Color color)
    {
        if (_sr == null) return;
        // 建立一個 4x4 純色 sprite
        var tex = new Texture2D(4, 4);
        var pixels = new Color[16];
        for (int i = 0; i < 16; i++) pixels[i] = Color.white;
        tex.SetPixels(pixels);
        tex.Apply();
        _sr.sprite = Sprite.Create(tex, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f), 4f);
        _sr.color = color;
        FitToWorld();
    }

    /// <summary>
    /// 設定平鋪密度（此版本預留介面）
    /// </summary>
    public void SetTileScale(float scale)
    {
        // 預留介面
    }

    /// <summary>
    /// 拉伸 sprite 覆蓋整個遊戲世界範圍
    /// </summary>
    private void FitToWorld()
    {
        if (_sr == null || _sr.sprite == null) return;

        var bounds = _sr.sprite.bounds;
        float spriteW = bounds.size.x;
        float spriteH = bounds.size.y;

        if (spriteW <= 0 || spriteH <= 0) return;

        // 覆蓋 WORLD_COVERAGE × WORLD_COVERAGE 的世界空間
        float targetSize = WORLD_COVERAGE * 2f;
        float scaleX = targetSize / spriteW;
        float scaleY = targetSize / spriteH;
        float scale = Mathf.Max(scaleX, scaleY);

        transform.localScale = new Vector3(scale, scale, 1f);
    }

    /// <summary>
    /// 產生 Grid 格線背景（程式碼生成 Texture）
    /// </summary>
    /// <param name="bgColor">背景底色</param>
    /// <param name="lineColor">格線顏色</param>
    /// <param name="cellSize">每格像素大小</param>
    /// <param name="lineWidth">線寬（像素）</param>
    public void SetGridBackground(Color bgColor, Color lineColor, int cellSize = 32, int lineWidth = 1)
    {
        if (_sr == null) return;

        int texSize = 256; // 256x256 tile（會被放大覆蓋世界）
        var tex = new Texture2D(texSize, texSize, TextureFormat.RGBA32, false);
        tex.filterMode = FilterMode.Point;
        tex.wrapMode = TextureWrapMode.Repeat;

        var pixels = new Color[texSize * texSize];

        for (int y = 0; y < texSize; y++)
        {
            for (int x = 0; x < texSize; x++)
            {
                bool onLine = (x % cellSize < lineWidth) || (y % cellSize < lineWidth);
                pixels[y * texSize + x] = onLine ? lineColor : bgColor;
            }
        }

        tex.SetPixels(pixels);
        tex.Apply();

        _sr.sprite = Sprite.Create(tex, new Rect(0, 0, texSize, texSize), new Vector2(0.5f, 0.5f), 32f);
        _sr.color = Color.white;
        FitToWorld();
    }
}
