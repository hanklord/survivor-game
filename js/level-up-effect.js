// level-up-effect.js — 升級聖光特效（跟隨角色）
(function() {
  window.SG = window.SG || {};

  var DURATION = 1.3; // 總持續時間
  var FLASH_DURATION = 0.15; // 閃白持續
  var PILLAR_MAX_HEIGHT = 200;
  var RING_MAX_RADIUS = 120;
  var PARTICLE_COUNT = 20;

  function LevelUpEffect() {
    this.active = false;
    this.timer = 0;
    this.player = null; // 追蹤玩家物件
    this.particles = [];
  }

  LevelUpEffect.prototype.trigger = function(x, y, player) {
    this.active = true;
    this.timer = DURATION;
    this.player = player || null;
    // 生成粒子（相對於角色的偏移量）
    this.particles = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      this.particles.push({
        ox: (Math.random() - 0.5) * 40, // 相對偏移
        oy: 0,
        vx: (Math.random() - 0.5) * 60,
        vy: -(60 + Math.random() * 120),
        life: 0.6 + Math.random() * 0.7,
        size: 2 + Math.random() * 4
      });
    }
  };

  LevelUpEffect.prototype.update = function(dt) {
    if (!this.active) return;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.active = false;
      return;
    }
    // 更新粒子偏移
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      p.ox += p.vx * dt;
      p.oy += p.vy * dt;
      p.vy += 20 * dt; // 微重力減速
      p.life -= dt;
    }
  };

  LevelUpEffect.prototype.draw = function(ctx, camX, camY, W, H) {
    if (!this.active) return;

    // 取得玩家當前位置
    var cx = this.player ? this.player.x : 0;
    var cy = this.player ? this.player.y : 0;

    var progress = 1 - (this.timer / DURATION); // 0→1
    var fadeOut = Math.max(0, this.timer / DURATION); // 1→0

    // 1. 全螢幕閃白（前 0.15 秒）
    if (this.timer > DURATION - FLASH_DURATION) {
      var flashProgress = (DURATION - this.timer) / FLASH_DURATION;
      var flashAlpha = (1 - flashProgress) * 0.5;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = 'rgba(255,255,220,' + flashAlpha.toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // 2. 金色光柱（從角色中心向上）
    var pillarHeight = PILLAR_MAX_HEIGHT * Math.min(1, progress * 3);
    var pillarAlpha = fadeOut * 0.6;
    var pillarWidth = 20 + progress * 10;

    ctx.save();
    var grad = ctx.createLinearGradient(cx, cy, cx, cy - pillarHeight);
    grad.addColorStop(0, 'rgba(255,215,0,' + pillarAlpha.toFixed(3) + ')');
    grad.addColorStop(0.5, 'rgba(255,255,200,' + (pillarAlpha * 0.7).toFixed(3) + ')');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - pillarWidth / 2, cy - pillarHeight, pillarWidth, pillarHeight);

    // 柔光外暈
    var glowGrad = ctx.createLinearGradient(cx, cy, cx, cy - pillarHeight * 0.8);
    glowGrad.addColorStop(0, 'rgba(255,200,50,' + (pillarAlpha * 0.3).toFixed(3) + ')');
    glowGrad.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(cx - pillarWidth * 1.5, cy - pillarHeight * 0.8, pillarWidth * 3, pillarHeight * 0.8);
    ctx.restore();

    // 3. 光圈從腳底向外擴張
    var ringRadius = RING_MAX_RADIUS * Math.min(1, progress * 2.5);
    var ringAlpha = fadeOut * 0.5 * (1 - Math.min(1, progress * 2));
    if (ringAlpha > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,215,0,' + ringAlpha.toFixed(3) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10, ringRadius, ringRadius * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,200,' + (ringAlpha * 0.5).toFixed(3) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10, ringRadius * 0.6, ringRadius * 0.18, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 4. 金色粒子（相對角色位置）
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      if (p.life <= 0) continue;
      var pAlpha = Math.min(1, p.life * 2) * fadeOut;
      var px = cx + p.ox;
      var py = cy + p.oy;
      ctx.save();
      ctx.globalAlpha = pAlpha;
      ctx.fillStyle = Math.random() > 0.3 ? '#ffd700' : '#fffacd';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  SG.LevelUpEffect = LevelUpEffect;
})();
