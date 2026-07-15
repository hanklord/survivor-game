/// <summary>
/// GameStats — 遊戲結算統計資料
/// </summary>
[System.Serializable]
public class GameStats
{
    public int Kills;
    public int Level;
    public float Time;
    public int HardcoreLevel;
    public int Score => Kills * Level + (int)Time;
}
