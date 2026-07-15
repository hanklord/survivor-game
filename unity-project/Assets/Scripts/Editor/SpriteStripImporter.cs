using UnityEngine;
using UnityEditor;
using System.IO;
using System.Text.RegularExpressions;
using System.Collections.Generic;

/// <summary>
/// SpriteStripImporter — 自動切割 Sprite Strip
/// 
/// 檔名規則：
///   name_Nf.png       → N 幀，水平排列 (1 行 N 列)
///   name_Nf_XcYr.png  → N 幀，X 列 Y 行排列（二維）
///
/// 切割邏輯：
///   - 讀取原始 PNG 檔案尺寸（不受 Unity importer 縮放）
///   - 圖片寬度 ÷ 列數 = 每幀寬度
///   - 圖片高度 ÷ 行數 = 每幀高度
/// </summary>
public class SpriteStripImporter : Editor
{
    [MenuItem("EndlessHeroes/6. Import & Slice All Sprite Strips")]
    public static void ImportAllStrips()
    {
        int processed = 0;
        int skipped = 0;

        string[] guids = AssetDatabase.FindAssets("t:Texture2D", new[] { "Assets/Sprites" });

        foreach (var guid in guids)
        {
            string path = AssetDatabase.GUIDToAssetPath(guid);
            string filename = Path.GetFileNameWithoutExtension(path);

            var parseResult = ParseFilename(filename);
            if (parseResult.frameCount > 1)
            {
                if (ProcessSpriteStrip(path, parseResult))
                    processed++;
            }
            else
            {
                SetAsSingleSprite(path);
                skipped++;
            }
        }

        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();
        Debug.Log($"[EndlessHeroes] Sprite import complete: {processed} strips sliced, {skipped} single sprites.");
    }

    // =========================================
    // 檔名解析
    // =========================================

    private struct ParseResult
    {
        public int frameCount;
        public int cols;
        public int rows;
    }

    private static ParseResult ParseFilename(string filename)
    {
        var result = new ParseResult { frameCount = 1, cols = 1, rows = 1 };

        // 格式: _Nf_CcRr (e.g., big_dragon_8f_4c2r)
        var match = Regex.Match(filename, @"_(\d+)f_(\d+)c(\d+)r$");
        if (match.Success)
        {
            result.frameCount = int.Parse(match.Groups[1].Value);
            result.cols = int.Parse(match.Groups[2].Value);
            result.rows = int.Parse(match.Groups[3].Value);
            return result;
        }

        // 格式: _Nf (e.g., mage_idle_4f)
        match = Regex.Match(filename, @"_(\d+)f$");
        if (match.Success)
        {
            result.frameCount = int.Parse(match.Groups[1].Value);
            result.cols = result.frameCount;
            result.rows = 1;
            return result;
        }

        return result;
    }

    // =========================================
    // 切割處理
    // =========================================

    private static bool ProcessSpriteStrip(string assetPath, ParseResult parse)
    {
        string filename = Path.GetFileNameWithoutExtension(assetPath);

        // 讀取原始圖片尺寸
        int texWidth, texHeight;
        GetOriginalTextureSize(assetPath, out texWidth, out texHeight);

        if (texWidth <= 0 || texHeight <= 0)
        {
            Debug.LogWarning($"  Skip (cannot read size): {filename}");
            return false;
        }

        int cols = parse.cols;
        int rows = parse.rows;
        int frameCount = parse.frameCount;

        int cellWidth = texWidth / cols;
        int cellHeight = texHeight / rows;

        if (cellWidth <= 0 || cellHeight <= 0)
        {
            Debug.LogWarning($"  Skip (invalid cell): {filename} — tex:{texWidth}x{texHeight} cols:{cols} rows:{rows}");
            return false;
        }

        // 設定 TextureImporter
        var importer = AssetImporter.GetAtPath(assetPath) as TextureImporter;
        if (importer == null) return false;

        importer.textureType = TextureImporterType.Sprite;
        importer.spriteImportMode = SpriteImportMode.Multiple;
        importer.filterMode = FilterMode.Point;
        importer.textureCompression = TextureImporterCompression.Uncompressed;
        importer.spritePixelsPerUnit = 100;
        importer.mipmapEnabled = false;
        importer.isReadable = true;

        // maxTextureSize 必須 >= 圖片最大邊，且為 2 的冪次
        int maxSide = Mathf.Max(texWidth, texHeight);
        int pot = 256;
        while (pot < maxSide) pot *= 2;
        importer.maxTextureSize = pot;

        // 建立 SpriteMetaData
        var spriteSheet = new List<SpriteMetaData>();
        int frameIdx = 0;

        for (int row = 0; row < rows; row++)
        {
            for (int col = 0; col < cols; col++)
            {
                if (frameIdx >= frameCount) break;

                int x = col * cellWidth;
                int y = texHeight - (row + 1) * cellHeight;
                if (y < 0) y = 0;

                int w = Mathf.Min(cellWidth, texWidth - x);
                int h = Mathf.Min(cellHeight, texHeight - y);
                if (w <= 0 || h <= 0) { frameIdx++; continue; }

                var meta = new SpriteMetaData();
                meta.name = $"{filename}_{frameIdx}";
                meta.rect = new Rect(x, y, w, h);
                meta.alignment = (int)SpriteAlignment.Center;
                meta.pivot = new Vector2(0.5f, 0.5f);

                spriteSheet.Add(meta);
                frameIdx++;
            }
        }

        importer.spritesheet = spriteSheet.ToArray();
        importer.SaveAndReimport();

        Debug.Log($"  ✓ Sliced: {filename} → {spriteSheet.Count} frames ({cols}c × {rows}r), cell: {cellWidth}x{cellHeight}px, tex: {texWidth}x{texHeight}");
        return true;
    }

    // =========================================
    // 原始尺寸讀取
    // =========================================

    private static void GetOriginalTextureSize(string assetPath, out int width, out int height)
    {
        width = 0;
        height = 0;

        // 方法1: 使用反射呼叫 TextureImporter.GetWidthAndHeight
        var importer = AssetImporter.GetAtPath(assetPath) as TextureImporter;
        if (importer != null)
        {
            object[] args = new object[2] { 0, 0 };
            var method = typeof(TextureImporter).GetMethod("GetWidthAndHeight",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            if (method != null)
            {
                method.Invoke(importer, args);
                width = (int)args[0];
                height = (int)args[1];
                if (width > 0 && height > 0) return;
            }
        }

        // 方法2: 直接讀取 PNG header
        string fullPath = Path.GetFullPath(assetPath);
        if (!File.Exists(fullPath)) return;

        string ext = Path.GetExtension(assetPath).ToLower();
        if (ext == ".png")
        {
            ReadPngSize(fullPath, out width, out height);
        }
        else if (ext == ".jpg" || ext == ".jpeg")
        {
            ReadJpgSize(fullPath, out width, out height);
        }
    }

    private static void ReadPngSize(string fullPath, out int width, out int height)
    {
        width = 0;
        height = 0;

        using (var stream = File.OpenRead(fullPath))
        using (var reader = new BinaryReader(stream))
        {
            // PNG: 8 byte signature + IHDR chunk (4 len + 4 type + 4 width + 4 height)
            if (stream.Length < 24) return;
            stream.Seek(16, SeekOrigin.Begin);

            byte[] wBytes = reader.ReadBytes(4);
            byte[] hBytes = reader.ReadBytes(4);

            if (System.BitConverter.IsLittleEndian)
            {
                System.Array.Reverse(wBytes);
                System.Array.Reverse(hBytes);
            }

            width = System.BitConverter.ToInt32(wBytes, 0);
            height = System.BitConverter.ToInt32(hBytes, 0);
        }
    }

    private static void ReadJpgSize(string fullPath, out int width, out int height)
    {
        width = 0;
        height = 0;

        using (var stream = File.OpenRead(fullPath))
        using (var reader = new BinaryReader(stream))
        {
            // JPEG: 搜尋 SOF0 marker (0xFF 0xC0)
            while (stream.Position < stream.Length - 1)
            {
                byte b = reader.ReadByte();
                if (b != 0xFF) continue;
                byte marker = reader.ReadByte();
                if (marker == 0xC0 || marker == 0xC2)
                {
                    stream.Seek(3, SeekOrigin.Current); // skip length + precision
                    byte[] hBytes = reader.ReadBytes(2);
                    byte[] wBytes = reader.ReadBytes(2);
                    if (System.BitConverter.IsLittleEndian)
                    {
                        System.Array.Reverse(hBytes);
                        System.Array.Reverse(wBytes);
                    }
                    height = System.BitConverter.ToInt16(hBytes, 0);
                    width = System.BitConverter.ToInt16(wBytes, 0);
                    return;
                }
                else if (marker != 0xD8 && marker != 0xFF)
                {
                    // Skip segment
                    byte[] lenBytes = reader.ReadBytes(2);
                    if (System.BitConverter.IsLittleEndian) System.Array.Reverse(lenBytes);
                    int segLen = System.BitConverter.ToInt16(lenBytes, 0) - 2;
                    if (segLen > 0) stream.Seek(segLen, SeekOrigin.Current);
                }
            }
        }
    }

    // =========================================
    // 單張 Sprite 設定
    // =========================================

    private static void SetAsSingleSprite(string assetPath)
    {
        var importer = AssetImporter.GetAtPath(assetPath) as TextureImporter;
        if (importer == null) return;

        if (importer.spriteImportMode == SpriteImportMode.Single && importer.textureType == TextureImporterType.Sprite)
            return;

        importer.textureType = TextureImporterType.Sprite;
        importer.spriteImportMode = SpriteImportMode.Single;
        importer.filterMode = FilterMode.Point;
        importer.textureCompression = TextureImporterCompression.Uncompressed;
        importer.spritePixelsPerUnit = 100;
        importer.mipmapEnabled = false;
        importer.SaveAndReimport();
    }

    private static void EnsureReadable(string assetPath)
    {
        var importer = AssetImporter.GetAtPath(assetPath) as TextureImporter;
        if (importer == null) return;
        if (!importer.isReadable)
        {
            importer.isReadable = true;
            importer.SaveAndReimport();
        }
    }

    // =========================================
    // 公用工具
    // =========================================

    /// <summary>
    /// 取得切割後的子 Sprite 陣列（按幀序號排列）
    /// </summary>
    public static Sprite[] GetSpritesFromStrip(string assetPath)
    {
        var objects = AssetDatabase.LoadAllAssetsAtPath(assetPath);
        var sprites = new List<Sprite>();
        string mainName = Path.GetFileNameWithoutExtension(assetPath);

        foreach (var obj in objects)
        {
            if (obj is Sprite sprite && sprite.name != mainName)
            {
                sprites.Add(sprite);
            }
        }

        sprites.Sort((a, b) =>
        {
            var matchA = Regex.Match(a.name, @"_(\d+)$");
            var matchB = Regex.Match(b.name, @"_(\d+)$");
            if (matchA.Success && matchB.Success)
                return int.Parse(matchA.Groups[1].Value).CompareTo(int.Parse(matchB.Groups[1].Value));
            return string.Compare(a.name, b.name);
        });

        return sprites.ToArray();
    }

    public static bool IsMultiFrameStrip(string assetPath)
    {
        string filename = Path.GetFileNameWithoutExtension(assetPath);
        return ParseFilename(filename).frameCount > 1;
    }
}
