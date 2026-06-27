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
})();
