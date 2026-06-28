// renderer.js — 所有 Canvas 繪製邏輯（含 off-screen culling + 分層 canvas）
(function() {
  window.SG = window.SG || {};

  var GRID_SIZE = 60;
  var GRID_COLOR = 'rgba(255,255,255,0.03)';
  var PLAYER_COLOR = '#4488ff';
  var PLAYER_HIT_COLOR = '#ffffff';
  var PARTICLE_RADIUS = 3;
  var GEM_DRAW_OFFSET = 8;
  var GEM_DRAW_SIZE = 16;
  var GEM_RADIUS = 6;
  var GEM_GLOW = 8;
  var HP_BAR_HEIGHT = 4;
  var BOSS_HP_BAR_HEIGHT = 8;
  var CULL_MARGIN = 150; // Off-screen culling 邊距，避免物件在邊緣突然出現

  function Renderer(canvas, ctx) {
    this.canvas = canvas;       // 主遊戲 canvas
    this.ctx = ctx;
    this.images = {};
    this.imgConfig = null;
    this.bgPattern = null;

    // 分層 canvas：背景層（只在相機移動時重繪）
    this.bgCanvas = document.getElementById('bg-canvas');
    this.bgCtx = this.bgCanvas ? this.bgCanvas.getContext('2d') : null;
    this._lastCamX = null;
    this._lastCamY = null;

    // Screen shake
    this._shakeTimer = 0;
    this._shakeDuration = 0;
    this._shakeIntensity = 0;

    this.W = 0;
    this.H = 0;
  }

  // 觸發畫面震動
  Renderer.prototype.shake = function(duration, intensity) {
    this._shakeTimer = duration;
    this._shakeDuration = duration;
    this._shakeIntensity = intensity || 10;
  };

  // 視窗大小改變時同步所有 canvas
  Renderer.prototype.onResize = function(W, H) {
    this.W = W;
    this.H = H;
    if (this.bgCanvas) {
      this.bgCanvas.width = W;
      this.bgCanvas.height = H;
    }
    // 強制重繪背景
    this._lastCamX = null;
  };

  // 設定圖片資源與設定
  Renderer.prototype.init = function(images, imgConfig) {
    this.images = images;
    this.imgConfig = imgConfig;
    if (imgConfig.background && imgConfig.background.image && images.background) {
      this.bgPattern = this.ctx.createPattern(images.background, 'repeat');
    }
  };

  // 動態切換背景色（關卡系統用）
  Renderer.prototype.setBgColor = function(color) {
    this._overrideBgColor = color;
    this._lastCamX = null; // 強制重繪背景
  };

  // 動態切換背景圖片（關卡系統用）
  Renderer.prototype.setBgImage = function(img) {
    if (img) {
      this.bgPattern = (this.bgCtx || this.ctx).createPattern(img, 'repeat');
      this._bgPatternImg = img;
    } else {
      this.bgPattern = null;
      this._bgPatternImg = null;
    }
    this._lastCamX = null; // 強制重繪背景
  };

  // 判斷物件是否在可見區域內
  Renderer.prototype._isVisible = function(x, y, camX, camY, margin) {
    return x >= camX - margin && x <= camX + this.W + margin &&
           y >= camY - margin && y <= camY + this.H + margin;
  };

  // 主繪製
  Renderer.prototype.render = function(state) {
    var ctx = this.ctx;
    var W = this.W || this.canvas.width;
    var H = this.H || this.canvas.height;
    var player = state.player;
    var camX = player.x - W / 2;
    var camY = player.y - H / 2;

    // Screen shake 偏移
    if (this._shakeTimer > 0) {
      this._shakeTimer -= state.dt || 0.016;
      var intensity = this._shakeIntensity * (this._shakeTimer / this._shakeDuration);
      camX += (Math.random() - 0.5) * intensity * 2;
      camY += (Math.random() - 0.5) * intensity * 2;
    }

    // 背景層：只在相機移動時重繪
    if (this.bgCtx) {
      if (this._lastCamX !== camX || this._lastCamY !== camY) {
        this._drawBackgroundLayer(camX, camY, W, H);
        this._lastCamX = camX;
        this._lastCamY = camY;
      }
      // 主 canvas 清空（背景已在下層）
      ctx.clearRect(0, 0, W, H);
    } else {
      // 無分層時，背景繪製在主 canvas
      ctx.save();
      ctx.translate(-camX, -camY);
      this._drawBackground(ctx, camX, camY, W, H);
      ctx.restore();
    }

    // 遊戲物件繪製（帶 off-screen culling）
    ctx.save();
    ctx.translate(-camX, -camY);

    this._drawXPGems(state.xpGems, camX, camY);
    this._drawEnemies(state.enemies, camX, camY);
    this._drawBosses(state.bosses, camX, camY);
    this._drawProjectiles(state.projectiles, camX, camY);
    this._drawPlayer(player);
    if (state.weaponVisuals) this._drawWeapons(state.weaponVisuals, camX, camY);
    // 劍氣投射物視覺
    if (state.meleeVisual) {
      var qis = state.meleeVisual; // 陣列
      for (var qi = 0; qi < qis.length; qi++) {
        var p = qis[qi];
        if (!this._isVisible(p.x, p.y, camX, camY, CULL_MARGIN)) continue;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalCompositeOperation = 'lighter';

        // 拖尾（淡化的弧形殘影）
        var trail = 3;
        for (var ti = trail; ti > 0; ti--) {
          ctx.globalAlpha = 0.15 * ti;
          ctx.beginPath();
          ctx.arc(-ti * 12, 0, 23, -0.8, 0.8);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // 主體新月弧形
        ctx.globalAlpha = 0.9;
        // 外層
        ctx.beginPath();
        ctx.arc(0, 0, 26, -0.9, 0.9);
        ctx.strokeStyle = 'rgba(200,200,200,0.5)';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.stroke();
        // 中層
        ctx.beginPath();
        ctx.arc(0, 0, 26, -0.9, 0.9);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 6;
        ctx.stroke();
        // 核心
        ctx.beginPath();
        ctx.arc(0, 0, 26, -0.9, 0.9);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }
    this._drawParticles(state.particles, camX, camY);

    // 傷害數字
    if (state.damageNumbers) state.damageNumbers.draw(ctx);

    ctx.globalAlpha = 1;
    ctx.restore();
  };

  // 背景層繪製（分層 canvas）
  Renderer.prototype._drawBackgroundLayer = function(camX, camY, W, H) {
    var bgCtx = this.bgCtx;
    bgCtx.save();
    bgCtx.translate(-camX, -camY);
    this._drawBackground(bgCtx, camX, camY, W, H);
    bgCtx.restore();
  };

  Renderer.prototype._drawBackground = function(ctx, camX, camY, W, H) {
    if (this.bgPattern) {
      // 使用 setTransform 重置矩陣讓 pattern 以螢幕座標填充，
      // 用 modulo 偏移模擬鏡頭平移的無限重複背景效果。
      var bgImg = this._bgPatternImg || (this.images && this.images.background);
      var pw = bgImg ? bgImg.width : 256;
      var ph = bgImg ? bgImg.height : 256;
      ctx.save();
      ctx.fillStyle = this.bgPattern;
      ctx.setTransform(1, 0, 0, 1, -(camX % pw + pw) % pw, -(camY % ph + ph) % ph);
      ctx.fillRect(0, 0, W + pw, H + ph);
      ctx.restore();
    } else {
      ctx.fillStyle = this._overrideBgColor || (this.imgConfig.background && this.imgConfig.background.color) || '#1a1a2e';
      ctx.fillRect(camX, camY, W, H);
    }
  };

  Renderer.prototype._drawXPGems = function(gems, camX, camY) {
    var ctx = this.ctx;
    var gemColor = (this.imgConfig.xpGem && this.imgConfig.xpGem.color) || '#00ff88';
    for (var i = 0; i < gems.length; i++) {
      var g = gems[i];
      if (!this._isVisible(g.x, g.y, camX, camY, CULL_MARGIN)) continue;
      if (this.images.xpGem) {
        ctx.drawImage(this.images.xpGem, g.x - GEM_DRAW_OFFSET, g.y - GEM_DRAW_OFFSET, GEM_DRAW_SIZE, GEM_DRAW_SIZE);
      } else {
        ctx.fillStyle = gemColor;
        ctx.shadowColor = gemColor;
        ctx.shadowBlur = GEM_GLOW;
        ctx.beginPath(); ctx.arc(g.x, g.y, GEM_RADIUS, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  };

  Renderer.prototype._drawEnemies = function(enemies, camX, camY) {
    var ctx = this.ctx;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!this._isVisible(e.x, e.y, camX, camY, CULL_MARGIN)) continue;
      if (e.animator && e.animator.isLoaded()) {
        e.animator.draw(ctx, e.x, e.y, e.size, e.facingLeft);
      } else {
        var img = this.images['enemy_' + e.cfgIdx];
        if (img) {
          ctx.drawImage(img, e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);
        } else {
          ctx.fillStyle = e.color;
          ctx.shadowColor = e.color;
          ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(e.x, e.y, e.size / 2, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      // 血條
      var bw = e.size * 0.8;
      ctx.fillStyle = '#333';
      ctx.fillRect(e.x - bw / 2, e.y - e.size / 2 - 8, bw, HP_BAR_HEIGHT);
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(e.x - bw / 2, e.y - e.size / 2 - 8, bw * (e.hp / e.maxHp), HP_BAR_HEIGHT);
    }
  };

  Renderer.prototype._drawBosses = function(bosses, camX, camY) {
    var ctx = this.ctx;
    for (var i = 0; i < bosses.length; i++) {
      var b = bosses[i];
      if (!this._isVisible(b.x, b.y, camX, camY, CULL_MARGIN)) continue;
      if (b.animator && b.animator.isLoaded()) {
        b.animator.draw(ctx, b.x, b.y, b.size, b.facingLeft);
      } else {
        var img = this.images['boss_' + b.cfgIdx];
        if (img) {
          ctx.drawImage(img, b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
        } else {
          ctx.fillStyle = b.color;
          ctx.shadowColor = b.color;
          ctx.shadowBlur = 20;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.size / 2, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      // Boss 血條
      var bw = b.size;
      ctx.fillStyle = '#333';
      ctx.fillRect(b.x - bw / 2, b.y - b.size / 2 - 14, bw, BOSS_HP_BAR_HEIGHT);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(b.x - bw / 2, b.y - b.size / 2 - 14, bw * (b.hp / b.maxHp), BOSS_HP_BAR_HEIGHT);
    }
  };

  Renderer.prototype._drawProjectiles = function(projectiles, camX, camY) {
    var ctx = this.ctx;
    var pSize = (this.imgConfig.projectile && this.imgConfig.projectile.size) || 12;
    var pColor = (this.imgConfig.projectile && this.imgConfig.projectile.color) || '#ffff00';
    for (var i = 0; i < projectiles.length; i++) {
      var p = projectiles[i];
      if (!this._isVisible(p.x, p.y, camX, camY, CULL_MARGIN)) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.atan2(p.vy, p.vx));
      if (this.images.projectile) {
        ctx.drawImage(this.images.projectile, -pSize / 2, -pSize / 2, pSize, pSize);
      } else {
        ctx.fillStyle = pColor;
        ctx.shadowColor = pColor;
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.ellipse(0, 0, pSize / 2, pSize / 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }
  };

  Renderer.prototype._drawPlayer = function(player) {
    var ctx = this.ctx;
    var ps = (this.imgConfig.player && this.imgConfig.player.size) || 40;
    if (player.animator && player.animator.isLoaded()) {
      player.animator.draw(ctx, player.x, player.y, ps, player.facingLeft);
    } else if (this.images.player) {
      // 靜態圖左右翻轉
      if (player.facingLeft) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.scale(-1, 1);
        ctx.drawImage(this.images.player, -ps / 2, -ps / 2, ps, ps);
        ctx.restore();
      } else {
        ctx.drawImage(this.images.player, player.x - ps / 2, player.y - ps / 2, ps, ps);
      }
    } else {
      // 幾何 fallback
      ctx.fillStyle = player.invuln > 0 ? PLAYER_HIT_COLOR : PLAYER_COLOR;
      ctx.shadowColor = PLAYER_COLOR;
      ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(player.x, player.y, ps / 2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    // 撿取範圍圓圈
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.pickupRange, 0, Math.PI * 2);
    ctx.stroke();
  };

  Renderer.prototype._drawParticles = function(particles, camX, camY) {
    var ctx = this.ctx;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (!this._isVisible(p.x, p.y, camX, camY, CULL_MARGIN)) continue;
      ctx.globalAlpha = p.life * 2;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, PARTICLE_RADIUS, 0, Math.PI * 2); ctx.fill();
    }
  };

  // 繪製武器視覺效果（護盾、Nova、飛彈）
  Renderer.prototype._drawWeapons = function(visuals, camX, camY) {
    var ctx = this.ctx;

    // 旋轉護盾
    var shields = visuals.shieldPositions;
    var shieldImg = this.images.shield_icon;
    for (var i = 0; i < shields.length; i++) {
      var s = shields[i];
      if (!this._isVisible(s.x, s.y, camX, camY, CULL_MARGIN)) continue;
      if (shieldImg) {
        ctx.drawImage(shieldImg, s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
      } else {
        ctx.fillStyle = '#44aaff';
        ctx.shadowColor = '#44aaff';
        ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Nova 擴散波
    var nova = visuals.novaVisual;
    if (nova) {
      ctx.strokeStyle = 'rgba(255, 200, 50, ' + nova.alpha + ')';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ffcc33';
      ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(nova.x, nova.y, nova.radius, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 追蹤飛彈
    var missiles = visuals.missiles;
    for (var i = 0; i < missiles.length; i++) {
      var m = missiles[i];
      if (!m.active) continue;
      if (!this._isVisible(m.x, m.y, camX, camY, CULL_MARGIN)) continue;
      // 拖尾
      for (var j = 0; j < m.trail.length; j++) {
        var t = m.trail[j];
        ctx.globalAlpha = (j + 1) / m.trail.length * 0.5;
        ctx.fillStyle = '#ff8844';
        ctx.beginPath(); ctx.arc(t.x, t.y, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // 飛彈本體
      ctx.fillStyle = '#ff4400';
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(m.x, m.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 落雷視覺效果
    var thunder = visuals.thunderVisual;
    if (thunder) {
      var tx = thunder.x, ty = thunder.y;
      ctx.save();
      ctx.globalAlpha = 0.8 + Math.random() * 0.2;
      // 閃電光柱（從上方到目標）
      ctx.strokeStyle = '#ffff88';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      var topY = ty - 300;
      ctx.moveTo(tx, topY);
      // Z 字形閃電
      for (var seg = 0; seg < 6; seg++) {
        var py = topY + (ty - topY) * ((seg + 1) / 7);
        var px = tx + (Math.random() - 0.5) * 30;
        ctx.lineTo(px, py);
      }
      ctx.lineTo(tx, ty);
      ctx.stroke();
      // 命中光暈
      ctx.fillStyle = 'rgba(255, 255, 200, 0.6)';
      ctx.beginPath(); ctx.arc(tx, ty, 20, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // 連鎖閃電
    var chain = visuals.chainVisual;
    if (chain) {
      ctx.save();
      ctx.globalAlpha = 0.7 + Math.random() * 0.3;
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = '#aa44ff';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 3;
      for (var ci = 0; ci < chain.segments.length; ci++) {
        var seg = chain.segments[ci];
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        // Z 字形鋸齒
        var dx = seg.x2 - seg.x1, dy = seg.y2 - seg.y1;
        var steps = 5;
        for (var si = 1; si < steps; si++) {
          var t = si / steps;
          var mx = seg.x1 + dx * t + (Math.random() - 0.5) * 20;
          var my = seg.y1 + dy * t + (Math.random() - 0.5) * 20;
          ctx.lineTo(mx, my);
        }
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
        // 命中點光暈
        ctx.fillStyle = 'rgba(200, 230, 255, 0.5)';
        ctx.beginPath(); ctx.arc(seg.x2, seg.y2, 10, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  };

  SG.Renderer = Renderer;
})();
