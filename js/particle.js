// particle.js — 粒子特效類別（支援物件池重用）
(function() {
  window.SG = window.SG || {};

  var DEFAULT_LIFE = 0.5;
  var DEFAULT_COUNT = 8;

  function Particle() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.color = '';
    this.active = false;
  }

  // 初始化（重用時呼叫）
  Particle.prototype.init = function(x, y, color) {
    var a = Math.random() * Math.PI * 2;
    var s = (1 + Math.random() * 3) * 60;
    this.x = x;
    this.y = y;
    this.vx = Math.cos(a) * s;
    this.vy = Math.sin(a) * s;
    this.life = DEFAULT_LIFE;
    this.color = color;
    this.active = true;
  };

  // 更新位置，回傳 false 表示已消失
  Particle.prototype.update = function(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.active = false;
    return this.active;
  };

  // 生成一組粒子（使用 pool）
  Particle.spawn = function(x, y, color, count, pool) {
    count = count || DEFAULT_COUNT;
    var result = [];
    for (var i = 0; i < count; i++) {
      var p = pool.get();
      p.init(x, y, color);
      result.push(p);
    }
    return result;
  };

  SG.Particle = Particle;
})();
