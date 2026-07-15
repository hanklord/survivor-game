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
        Debug.Log("[EndlessHeroes] Background textures configured for tiling.");
    }

    private static void SetupBackgroundTexture(string assetPath)
    {
        var importer = AssetImporter.GetAtPath(assetPath) as TextureImporter;
        if (importer == null)
        {
            Debug.LogWarning("  Not found: " + assetPath);
            return;
        }

        // 背景紋理：不用 Sprite 模式，改用 Default（給 Quad Material 用）
        importer.textureType = TextureImporterType.Default;
        importer.wrapMode = TextureWrapMode.Repeat;
        importer.filterMode = FilterMode.Bilinear;
        importer.textureCompression = TextureImporterCompression.Uncompressed;
        importer.mipmapEnabled = true;
        importer.isReadable = false;
        importer.maxTextureSize = 1024;
        importer.npotScale = TextureImporterNPOTScale.ToNearest;

        importer.SaveAndReimport();
        Debug.Log("  ✓ " + assetPath + " → Default, Repeat, Bilinear");
    }
}
