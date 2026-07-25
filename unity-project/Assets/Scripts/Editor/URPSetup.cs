using UnityEngine;
using UnityEditor;

/// <summary>
/// URPSetup — 一鍵建立 URP 資源檔案
/// 選單：EndlessHeroes → 0. Setup URP
/// </summary>
public class URPSetup : Editor
{
    [MenuItem("EndlessHeroes/0. Setup URP Pipeline")]
    public static void SetupURP()
    {
        // 檢查 URP 是否已安裝
        var urpPipelineType = System.Type.GetType(
            "UnityEngine.Rendering.Universal.UniversalRenderPipelineAsset, Unity.RenderPipelines.Universal.Runtime");

        if (urpPipelineType == null)
        {
            Debug.LogError("[EndlessHeroes] URP package not found! Please install 'Universal RP' from Package Manager.");
            return;
        }

        // 確保資料夾存在
        if (!AssetDatabase.IsValidFolder("Assets/Settings"))
            AssetDatabase.CreateFolder("Assets", "Settings");

        if (!AssetDatabase.IsValidFolder("Assets/Settings/URP"))
            AssetDatabase.CreateFolder("Assets/Settings", "URP");

        // 建立 URP Asset
        var createMethod = urpPipelineType.GetMethod("CreateRendererAsset",
            System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.NonPublic);

        // 使用 ScriptableObject.CreateInstance 方式建立
        var rendererData = ScriptableObject.CreateInstance(
            System.Type.GetType("UnityEngine.Rendering.Universal.UniversalRendererData, Unity.RenderPipelines.Universal.Runtime"));

        if (rendererData != null)
        {
            AssetDatabase.CreateAsset(rendererData, "Assets/Settings/URP/URP_Renderer_2D.asset");
            Debug.Log("[EndlessHeroes] Created URP Renderer Data at Assets/Settings/URP/URP_Renderer_2D.asset");
        }

        var pipelineAsset = ScriptableObject.CreateInstance(urpPipelineType);
        if (pipelineAsset != null)
        {
            AssetDatabase.CreateAsset(pipelineAsset, "Assets/Settings/URP/URP_Asset_2D.asset");
            Debug.Log("[EndlessHeroes] Created URP Pipeline Asset at Assets/Settings/URP/URP_Asset_2D.asset");

            // 設定為專案的 Render Pipeline
            UnityEngine.Rendering.GraphicsSettings.defaultRenderPipeline =
                pipelineAsset as UnityEngine.Rendering.RenderPipelineAsset;

            Debug.Log("[EndlessHeroes] URP Pipeline assigned to Graphics Settings.");
        }

        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();

        Debug.Log("[EndlessHeroes] URP Setup Complete! " +
                  "For 2D games, manually switch Renderer Type to '2D Renderer' in the URP Asset inspector.");
    }
}
