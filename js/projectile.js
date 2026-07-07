// projectile.js — 子彈類別（支援物件池重用）
(function() {
  window.SG = window.SG || {};

  var PROJECTILE_SPEED = 360;
  var PROJECTILE_LIFE = 2;
  var SPREAD_ANGLE = 0.3; // 多發散射角度

  function Projectile() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.damage = 0;
    this.life = 0;
    this.active = false;
  }

  // 初始化（重用時呼叫）
  Projectile.prototype.init = function(x, y, angle, damage) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * PROJECTILE_SPEED;
    this.vy = Math.sin(angle) * PROJECTILE_SPEED;
    this.damage = damage;
    this.life = PROJECTILE_LIFE;
    this.active = true;
  };

  // 更新位置，回傳 false 表示已過期
  Projectile.prototype.update = function(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.active = false;
    return this.active;
  };

  // 從玩家向目標群射擊，使用 pool 取得子彈
  Projectile.fireAtTargets = function(player, targets, pool) {
    if (!targets.length) return [];
    var bullets = [];
    for (var i = 0; i < player.projectileCount; i++) {
      var t = targets[i % targets.length];
      var a = Math.atan2(t.y - player.y, t.x - player.x);
      if (i > 0) a += (Math.random() - 0.5) * SPREAD_ANGLE;
      var p = pool.get();
      p.init(player.x, player.y, a, player.damage);
      bullets.push(p);
    }
    player.fireTimer = player.fireRate;
    return bullets;
  };

  SG.Projectile = Projectile;
})();
