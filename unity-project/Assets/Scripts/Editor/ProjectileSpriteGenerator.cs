using UnityEngine;
using UnityEditor;
using System.IO;

/// <summary>
/// ProjectileSpriteGenerator — 生成各角色投射物 sprite PNG
/// 
/// 生成：
///   - fireball_16x16.png  — 法師火球（橘紅漸層圓形+光暈）
///   - arrow_16x16.png     — 弓手箭矢（細長三角形）
///   - shuriken_16x16.png  — 忍者手裏劍（十字星形）
///   - boomerang_16x16.png — 迴力鏢手（弧形迴力鏢）
///   - energy_16x16.png    — 通用能量球（白色發光圓）
///
/// 使用：EndlessHeroes → 11. Generate Projectile Sprites
/// </summary>
public class ProjectileSpriteGenerator : Editor
{
    private const int SIZE = 32; // 32x32 pixel art
    private const string OUTPUT_DIR = "Assets/Sprites/Effects/Generated";

    [MenuItem("EndlessHeroes/11. Generate Projectile Sprites")]
    public static void GenerateAll()
    {
        if (!Directory.Exists(Path.GetFullPath(OUTPUT_DIR)))
        {
            Directory.CreateDirectory(Path.GetFullPath(OUTPUT_DIR));
        }

        GenerateFireball();
        GenerateArrow();
        GenerateShuriken();
        GenerateBoomerang();
        GenerateEnergyBall();

        AssetDatabase.Refresh();

        // 設定所有生成的圖為 Sprite
        string[] guids = AssetDatabase.FindAssets("t:Texture2D", new[] { OUTPUT_DIR });
        foreach (var guid in guids)
        {
            string path = AssetDatabase.GUIDToAssetPath(guid);
            var importer = AssetImporter.GetAtPath(path) as TextureImporter;
            if (importer != null)
            {
                importer.textureType = TextureImporterType.Sprite;
                importer.spriteImportMode = SpriteImportMode.Single;
                importer.filterMode = FilterMode.Point;
                importer.textureCompression = TextureImporterCompression.Uncompressed;
                importer.spritePixelsPerUnit = 32;
                importer.mipmapEnabled = false;
                importer.SaveAndReimport();
            }
        }

        Debug.Log("[EndlessHeroes] ✓ Projectile sprites generated at " + OUTPUT_DIR);
    }

    // ============================================================
    // Fireball — 橘紅色火球，中心亮外圈漸暗
    // ============================================================
    private static void GenerateFireball()
    {
        var tex = new Texture2D(SIZE, SIZE, TextureFormat.RGBA32, false);
        var pixels = new Color[SIZE * SIZE];
        float center = SIZE / 2f;
        float radius = SIZE / 2f - 1f;

        for (int y = 0; y < SIZE; y++)
        {
            for (int x = 0; x < SIZE; x++)
            {
                float dist = Vector2.Distance(new Vector2(x, y), new Vector2(center, center));
                if (dist < radius)
                {
                    float t = dist / radius;
                    // 中心黃 → 邊緣橘紅
                    Color c = Color.Lerp(
                        new Color(1f, 0.95f, 0.4f),  // 中心：亮黃
                        new Color(1f, 0.25f, 0f),     // 邊緣：橘紅
                        t * t
                    );
                    c.a = Mathf.Lerp(1f, 0.3f, t * t);
                    pixels[y * SIZE + x] = c;
                }
                else if (dist < radius + 1.5f)
                {
                    // 外圈光暈
                    pixels[y * SIZE + x] = new Color(1f, 0.4f, 0f, 0.15f);
                }
                else
                {
                    pixels[y * SIZE + x] = Color.clear;
                }
            }
        }

        tex.SetPixels(pixels);
        tex.Apply();
        SaveTexture(tex, "fireball_32x32.png");
    }

    // ============================================================
    // Arrow — 箭矢，尖銳三角形向右
    // ============================================================
    private static void GenerateArrow()
    {
        var tex = new Texture2D(SIZE, SIZE, TextureFormat.RGBA32, false);
        var pixels = new Color[SIZE * SIZE];
        float cx = SIZE / 2f;
        float cy = SIZE / 2f;

        for (int y = 0; y < SIZE; y++)
        {
            for (int x = 0; x < SIZE; x++)
            {
                pixels[y * SIZE + x] = Color.clear;

                // 箭頭（右指三角形）
                float nx = (float)x / SIZE;
                float ny = (float)(y - cy) / (SIZE / 2f);

                // 箭桿（中間水平細條）
                if (Mathf.Abs(y - cy) < 1.5f && x >= 4 && x <= SIZE - 6)
                {
                    pixels[y * SIZE + x] = new Color(0.55f, 0.35f, 0.15f); // 木桿色
                }

                // 箭頭三角形
                if (x >= SIZE - 10)
                {
                    float progress = (float)(x - (SIZE - 10)) / 10f;
                    float halfWidth = (1f - progress) * 5f;
                    if (Mathf.Abs(y - cy) <= halfWidth)
                    {
                        pixels[y * SIZE + x] = new Color(0.7f, 0.8f, 0.9f); // 鋼色箭頭
                    }
                }

                // 箭羽（左端）
                if (x >= 2 && x <= 7)
                {
                    float featherDist = Mathf.Abs(y - cy) - (x - 2) * 0.5f;
                    if (featherDist >= 0 && featherDist < 3f && Mathf.Abs(y - cy) > 1.5f)
                    {
                        pixels[y * SIZE + x] = new Color(0.2f, 0.8f, 0.2f, 0.9f); // 綠色羽毛
                    }
                }
            }
        }

        tex.SetPixels(pixels);
        tex.Apply();
        SaveTexture(tex, "arrow_32x32.png");
    }

    // ============================================================
    // Shuriken — 手裏劍，四角星形
    // ============================================================
    private static void GenerateShuriken()
    {
        var tex = new Texture2D(SIZE, SIZE, TextureFormat.RGBA32, false);
        var pixels = new Color[SIZE * SIZE];
        float center = SIZE / 2f;

        for (int y = 0; y < SIZE; y++)
        {
            for (int x = 0; x < SIZE; x++)
            {
                float dx = x - center;
                float dy = y - center;
                float dist = Mathf.Sqrt(dx * dx + dy * dy);
                float angle = Mathf.Atan2(dy, dx);

                // 四角星：r = a * cos(2θ) 的變形
                float starRadius = 5f + 8f * Mathf.Abs(Mathf.Cos(2f * angle));

                if (dist < starRadius && dist < center - 1)
                {
                    float t = dist / starRadius;
                    Color c = Color.Lerp(
                        new Color(0.9f, 0.9f, 1f),   // 中心亮
                        new Color(0.3f, 0.3f, 0.5f),  // 邊緣深
                        t
                    );
                    pixels[y * SIZE + x] = c;
                }
                else if (dist < 3f)
                {
                    // 中心孔
                    pixels[y * SIZE + x] = new Color(0.2f, 0.2f, 0.3f);
                }
                else
                {
                    pixels[y * SIZE + x] = Color.clear;
                }
            }
        }

        tex.SetPixels(pixels);
        tex.Apply();
        SaveTexture(tex, "shuriken_32x32.png");
    }

    // ============================================================
    // Boomerang — 迴力鏢，弧形
    // ============================================================
    private static void GenerateBoomerang()
    {
        var tex = new Texture2D(SIZE, SIZE, TextureFormat.RGBA32, false);
        var pixels = new Color[SIZE * SIZE];
        float center = SIZE / 2f;

        for (int y = 0; y < SIZE; y++)
        {
            for (int x = 0; x < SIZE; x++)
            {
                pixels[y * SIZE + x] = Color.clear;

                float dx = x - center;
                float dy = y - center;
                float dist = Mathf.Sqrt(dx * dx + dy * dy);
                float angle = Mathf.Atan2(dy, dx) * Mathf.Rad2Deg;

                // V 形迴力鏢：只在 -60° ~ 60° 和 120° ~ 240° 角度範圍內畫弧
                bool inArc = (angle > -70f && angle < 70f);

                if (inArc && dist > 6f && dist < 13f)
                {
                    float t = (dist - 6f) / 7f;
                    Color c = Color.Lerp(
                        new Color(0.9f, 0.7f, 0.2f),  // 木色
                        new Color(0.6f, 0.4f, 0.1f),  // 深木
                        t
                    );
                    pixels[y * SIZE + x] = c;
                }

                // 迴力鏢的另一片翼
                bool inArc2 = (angle > 110f && angle < 250f) || (angle < -110f && angle > -250f);
                if (inArc2 && dist > 6f && dist < 13f)
                {
                    float t = (dist - 6f) / 7f;
                    Color c = Color.Lerp(
                        new Color(0.9f, 0.7f, 0.2f),
                        new Color(0.6f, 0.4f, 0.1f),
                        t
                    );
                    pixels[y * SIZE + x] = c;
                }
            }
        }

        tex.SetPixels(pixels);
        tex.Apply();
        SaveTexture(tex, "boomerang_32x32.png");
    }

    // ============================================================
    // Energy Ball — 通用能量球（白藍發光）
    // ============================================================
    private static void GenerateEnergyBall()
    {
        var tex = new Texture2D(SIZE, SIZE, TextureFormat.RGBA32, false);
        var pixels = new Color[SIZE * SIZE];
        float center = SIZE / 2f;
        float radius = SIZE / 2f - 2f;

        for (int y = 0; y < SIZE; y++)
        {
            for (int x = 0; x < SIZE; x++)
            {
                float dist = Vector2.Distance(new Vector2(x, y), new Vector2(center, center));
                if (dist < radius)
                {
                    float t = dist / radius;
                    Color c = Color.Lerp(
                        new Color(1f, 1f, 1f),         // 中心白
                        new Color(0.3f, 0.6f, 1f),     // 邊緣藍
                        t
                    );
                    c.a = Mathf.Lerp(1f, 0.5f, t * t);
                    pixels[y * SIZE + x] = c;
                }
                else if (dist < radius + 2f)
                {
                    float fade = 1f - (dist - radius) / 2f;
                    pixels[y * SIZE + x] = new Color(0.4f, 0.7f, 1f, fade * 0.3f);
                }
                else
                {
                    pixels[y * SIZE + x] = Color.clear;
                }
            }
        }

        tex.SetPixels(pixels);
        tex.Apply();
        SaveTexture(tex, "energy_ball_32x32.png");
    }

    // ============================================================
    // Save
    // ============================================================
    private static void SaveTexture(Texture2D tex, string filename)
    {
        byte[] pngData = tex.EncodeToPNG();
        string fullPath = Path.Combine(Path.GetFullPath(OUTPUT_DIR), filename);
        File.WriteAllBytes(fullPath, pngData);
        Object.DestroyImmediate(tex);
        Debug.Log($"  ✓ Generated: {filename}");
    }
}
