// utils.js — 工具函式
(function() {
  window.SG = window.SG || {};

  // 計算兩點距離
  SG.dist = function(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  // 格式化時間為 m:ss
  SG.formatTime = function(t) {
    return Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  };

  // 實體唯一 ID 計數器
  SG.nextEntityId = 0;

  // AABB 碰撞：兩個以中心點 + 半徑為基礎的物件
  // 物件需有 x, y, hitboxRadius（用 radius×2 作為寬高）
  SG.aabbHit = function(a, aRadius, b, bRadius) {
    var ar = aRadius || a.hitboxRadius || 10;
    var br = bRadius || b.hitboxRadius || 10;
    return a.x - ar < b.x + br &&
           a.x + ar > b.x - br &&
           a.y - ar < b.y + br &&
           a.y + ar > b.y - br;
  };
})();
