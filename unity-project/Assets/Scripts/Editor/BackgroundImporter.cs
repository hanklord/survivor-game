using UnityEngine;
using UnityEditor;

/// <summary>
/// BackgroundImporter — 設定背景圖片為正確的匯入格式
/// 將背景設為 Sprite (Single)、Wrap Mode = Repeat、不壓縮
/// EndlessHeroes → 8. Setup Background Textures
/// </summary>
public class BackgroundImporter : Editor
{
    [MenuItem("EndlessHeroes/8. Setup Background Textures")]
    public static void SetupBackgrounds()
    {
        string[] bgPaths = new string[]
        {
            "Assets/Sprites/Backgrounds/grass.png",
            "Assets/Sprites/Backgrounds/desert.png",
            "Assets/Sprites/Backgrounds/cave.png",
            "Assets/Sprites/Backgrounds/swamp.png",
            "Assets/Sprites/Backgrounds/volcano.png",
            "Assets/Sprites/Backgrounds/hell.png",
        };

        foreach (var path in bgPaths)
        {
            SetupBackgroundTexture(path);
        }

        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();
        Debug.Log("[EndlessHeroes] Background textures configured for tiling (Sprite mode + Repeat).");
    }

    private static void SetupBackgroundTexture(string assetPath)
    {
        var importer = AssetImporter.GetAtPath(assetPath) as TextureImporter;
        if (importer == null)
        {
            Debug.LogWarning("  Not found: " + assetPath);
            return;
        }

        // 背景使用 Sprite 模式 (Single)，Wrap = Repeat，供 BackgroundScroller 的 SpriteRenderer 使用
        importer.textureType = TextureImporterType.Sprite;
        importer.spriteImportMode = SpriteImportMode.Single;
        importer.wrapMode = TextureWrapMode.Repeat;
        importer.filterMode = FilterMode.Bilinear;
        importer.textureCompression = TextureImporterCompression.Uncompressed;
        importer.spritePixelsPerUnit = 100;
        importer.mipmapEnabled = false;
        importer.isReadable = false;
        importer.maxTextureSize = 2048;

        importer.SaveAndReimport();
        Debug.Log("  ✓ " + assetPath + " → Sprite, Repeat, Bilinear");
    }
}
