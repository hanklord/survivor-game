// xp-gem.js — 經驗寶石類別（支援物件池重用）
(function() {
  window.SG = window.SG || {};

  var ATTRACT_SPEED = 300;
  var PICKUP_RADIUS = 15;

  function XPGem() {
    this.x = 0;
    this.y = 0;
    this.value = 1;
    this.active = false;
  }

  // 初始化（重用時呼叫）
  XPGem.prototype.init = function(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value || 1;
    this.active = true;
  };

  // 更新：被吸引朝玩家靠近，回傳 'picked' 表示已撿取
  XPGem.prototype.update = function(player, dt) {
    var d = SG.dist(player, this);
    if (d < player.pickupRange) {
      var a = Math.atan2(player.y - this.y, player.x - this.x);
      this.x += Math.cos(a) * ATTRACT_SPEED * dt;
      this.y += Math.sin(a) * ATTRACT_SPEED * dt;
    }
    if (d < PICKUP_RADIUS) return 'picked';
    return null;
  };

  SG.XPGem = XPGem;
})();
