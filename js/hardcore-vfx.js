// hardcore-vfx.js — Hardcore 模式視覺特效（紅色光暈 + 灰燼粒子）
(function() {
  window.SG = window.SG || {};

  var VIGNETTE_PERIOD = 2.5; // 脈動週期（秒）
  var VIGNETTE_MIN_ALPHA = 0.15;
  var VIGNETTE_MAX_ALPHA = 0.35;
  var EMBER_COUNT = 28;
  var EMBER_MIN_SIZE = 5;
  var EMBER_MAX_SIZE = 10;
  var EMBER_LIFE_MIN = 2.0;
  var EMBER_LIFE_MAX = 4.0;
  var EMBER_SPEED_Y = -30; // 上飄速度 px/s
  var EMBER_DRIFT_X = 15;  // 左右飄幅 px/s

  function HardcoreVFX() {
    this.active = false;
    this.timer = 0;
    this.embers = [];
    this.hardcoreLevel = 0;
  }

  HardcoreVFX.prototype.setActive = function(level) {
    this.hardcoreLevel = level;
    this.active = level > 0;
    if (this.active && this.embers.length === 0) {
      this._initEmbers();
    }
  };

  HardcoreVFX.prototype._initEmbers = function() {
    this.embers = [];
    var count = EMBER_COUNT + Math.min(this.hardcoreLevel * 3, 15);
    for (var i = 0; i < count; i++) {
      this.embers.push(this._newEmber(true));
    }
  };

  HardcoreVFX.prototype._newEmber = function(randomLife) {
    return {
      x: Math.random(),  // 0~1 normalized screen position
      y: Math.random(),
      vx: (Math.random() - 0.5) * 2, // drift direction
      size: EMBER_MIN_SIZE + Math.random() * (EMBER_MAX_SIZE - EMBER_MIN_SIZE),
      life: randomLife ? Math.random() * EMBER_LIFE_MAX : EMBER_LIFE_MIN + Math.random() * (EMBER_LIFE_MAX - EMBER_LIFE_MIN),
      maxLife: EMBER_LIFE_MAX,
      color: Math.random() > 0.4 ? '#ff4400' : '#ff8800'
    };
  };

  HardcoreVFX.prototype.update = function(dt) {
    if (!this.active) return;
    this.timer += dt;

    // 更新灰燼粒子
    for (var i = 0; i < this.embers.length; i++) {
      var e = this.embers[i];
      e.y += (EMBER_SPEED_Y / 800) * dt; // normalize by ~screen height
      e.x += (e.vx * EMBER_DRIFT_X / 500) * dt;
      e.life -= dt;
      if (e.life <= 0 || e.y < -0.05) {
        this.embers[i] = this._newEmber(false);
        this.embers[i].y = 1.05; // 從底部重生
      }
    }
  };

  HardcoreVFX.prototype.draw = function(ctx, W, H) {
    if (!this.active) return;

    // 1. 紅色邊緣光暈（vignette）
    var pulse = Math.sin(this.timer * Math.PI * 2 / VIGNETTE_PERIOD) * 0.5 + 0.5; // 0~1
    var vigAlpha = VIGNETTE_MIN_ALPHA + pulse * (VIGNETTE_MAX_ALPHA - VIGNETTE_MIN_ALPHA);
    // Hardcore 等級越高光暈越強
    vigAlpha *= Math.min(1 + (this.hardcoreLevel - 1) * 0.3, 2.5);

    var grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.15, W / 2, H / 2, Math.max(W, H) * 0.6);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.7, 'rgba(80,0,0,' + (vigAlpha * 0.5).toFixed(3) + ')');
    grad.addColorStop(1, 'rgba(150,0,0,' + vigAlpha.toFixed(3) + ')');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 2. 飄浮灰燼粒子
    for (var i = 0; i < this.embers.length; i++) {
      var e = this.embers[i];
      var lifeRatio = e.life / e.maxLife;
      // 淡入淡出：前 20% 淡入，後 20% 淡出
      var alpha;
      if (lifeRatio > 0.8) alpha = (1 - lifeRatio) * 5; // fade in
      else if (lifeRatio < 0.2) alpha = lifeRatio * 5;   // fade out
      else alpha = 1;
      alpha *= 0.7;

      var px = e.x * W;
      var py = e.y * H;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = e.color;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(px, py, e.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  SG.HardcoreVFX = HardcoreVFX;
})();
