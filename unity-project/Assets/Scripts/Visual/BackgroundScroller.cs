using UnityEngine;

/// <summary>
/// BackgroundScroller — 無限背景平鋪
/// 使用 MeshRenderer + Quad 配合紋理 Offset 實現無限滾動
/// 不依賴 SpriteRenderer Tiled 模式（避免相容性問題）
/// </summary>
public class BackgroundScroller : MonoBehaviour
{
    private MeshRenderer _renderer;
    private Material _material;
    private Transform _camera;
    private float _textureScale = 3f; // 紋理重複次數（值越大背景越密）

    private void Awake()
    {
        // 建立一個全螢幕 Quad
        var meshFilter = gameObject.GetComponent<MeshFilter>();
        if (meshFilter == null) meshFilter = gameObject.AddComponent<MeshFilter>();
        meshFilter.mesh = CreateQuadMesh();

        _renderer = gameObject.GetComponent<MeshRenderer>();
        if (_renderer == null) _renderer = gameObject.AddComponent<MeshRenderer>();

        // 建立材質
        _material = new Material(Shader.Find("Unlit/Texture"));
        _material.mainTextureScale = new Vector2(_textureScale, _textureScale);
        _renderer.material = _material;
        _renderer.sortingOrder = -100;

        // 移除 SpriteRenderer（如果有的話）
        var sr = GetComponent<SpriteRenderer>();
        if (sr != null) Destroy(sr);
    }

    private void Start()
    {
        _camera = Camera.main.transform;

        // 大小覆蓋整個可視區域 + 預留空間
        float camHeight = Camera.main.orthographicSize * 2f;
        float camWidth = camHeight * Camera.main.aspect;
        transform.localScale = new Vector3(camWidth + 4f, camHeight + 4f, 1f);
    }

    private void LateUpdate()
    {
        if (_camera == null) return;

        // 跟隨相機
        transform.position = new Vector3(_camera.position.x, _camera.position.y, 10f);

        // 紋理 Offset 產生滾動效果
        if (_material != null)
        {
            float offsetX = _camera.position.x * _textureScale / transform.localScale.x;
            float offsetY = _camera.position.y * _textureScale / transform.localScale.y;
            _material.mainTextureOffset = new Vector2(offsetX, offsetY);
        }
    }

    /// <summary>
    /// 動態切換背景圖片 (Sprite)
    /// </summary>
    public void SetBackground(Sprite sprite)
    {
        if (sprite == null) return;
        if (_material == null) return;
        _material.mainTexture = sprite.texture;
    }

    /// <summary>
    /// 動態切換背景紋理 (Texture2D)
    /// </summary>
    public void SetBackgroundTexture(Texture2D texture)
    {
        if (texture == null) return;
        if (_material == null) return;
        _material.mainTexture = texture;
    }

    /// <summary>
    /// 設定背景顏色（無圖片時）
    /// </summary>
    public void SetBackgroundColor(Color color)
    {
        if (_material == null) return;
        _material.mainTexture = null;
        _material.color = color;
    }

    /// <summary>
    /// 設定平鋪密度（值越大重複越多、每格越小）
    /// </summary>
    public void SetTileScale(float scale)
    {
        _textureScale = scale;
        if (_material != null)
        {
            _material.mainTextureScale = new Vector2(scale, scale);
        }
    }

    private Mesh CreateQuadMesh()
    {
        var mesh = new Mesh();
        mesh.vertices = new Vector3[]
        {
            new Vector3(-0.5f, -0.5f, 0),
            new Vector3(0.5f, -0.5f, 0),
            new Vector3(0.5f, 0.5f, 0),
            new Vector3(-0.5f, 0.5f, 0),
        };
        mesh.uv = new Vector2[]
        {
            new Vector2(0, 0),
            new Vector2(1, 0),
            new Vector2(1, 1),
            new Vector2(0, 1),
        };
        mesh.triangles = new int[] { 0, 2, 1, 0, 3, 2 };
        mesh.RecalculateNormals();
        return mesh;
    }
}
