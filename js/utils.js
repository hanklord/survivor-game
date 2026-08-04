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

  // AABB 碰撞：優先使用精確 AABB 半寬/半高，fallback 到 hitboxRadius
  SG.aabbHit = function(a, aRadius, b, bRadius) {
    var aHalfW = a._aabbHalfW || aRadius || a.hitboxRadius || 10;
    var aHalfH = a._aabbHalfH || aRadius || a.hitboxRadius || 10;
    var bHalfW = b._aabbHalfW || bRadius || b.hitboxRadius || 10;
    var bHalfH = b._aabbHalfH || bRadius || b.hitboxRadius || 10;
    return a.x - aHalfW < b.x + bHalfW &&
           a.x + aHalfW > b.x - bHalfW &&
           a.y - aHalfH < b.y + bHalfH &&
           a.y + aHalfH > b.y - bHalfH;
  };
})();
