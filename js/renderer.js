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
    // 磁鐵道具 + 寶箱
    if (state.eliteVisuals) {
      var ev = state.eliteVisuals;
      // 磁鐵
      for (var mi = 0; mi < ev.magnets.length; mi++) {
        var mg = ev.magnets[mi];
        if (!this._isVisible(mg.x, mg.y, camX, camY, CULL_MARGIN)) continue;
        ctx.save();
        ctx.translate(mg.x, mg.y);
        ctx.fillStyle = '#ff2222';
        ctx.beginPath(); ctx.arc(-6, -5, 5, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#2222ff';
        ctx.beginPath(); ctx.arc(6, -5, 5, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, -5, 10, Math.PI, 0); ctx.stroke();
        ctx.restore();
      }
      // 寶箱
      for (var ci = 0; ci < ev.chests.length; ci++) {
        var ch = ev.chests[ci];
        if (!this._isVisible(ch.x, ch.y, camX, camY, CULL_MARGIN)) continue;
        ctx.save();
        ctx.translate(ch.x, ch.y);
        ctx.fillStyle = '#cc8800';
        ctx.fillRect(-12, -6, 24, 16);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(-10, -4, 20, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-3, 0, 6, 4);
        // 光暈
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(0, 2, 14, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }
    this._drawEnemies(state.enemies, camX, camY);
    this._drawBosses(state.bosses, camX, camY);
    this._drawProjectiles(state.projectiles, camX, camY);
    this._drawPlayer(player);
    if (state.weaponVisuals) this._drawWeapons(state.weaponVisuals, camX, camY);
    // 近戰揮砍視覺（綁定角色位置的紫色弧形斬擊）
    if (state.meleeVisual) {
      var mv = state.meleeVisual;
      var alpha = 1 - mv.progress;
      ctx.save();
      ctx.translate(mv.x, mv.y);

      // 黃金騎士：用 sprite strip 斬擊特效
      var slashImg = this.images.slash_effect;
      if (state.meleeIsKnight && slashImg) {
        // 不用 lighter 合成（避免閃爍），用正常混合 + 平滑淡出
        ctx.globalCompositeOperation = 'source-over';
        var baseAlpha = Math.min(1, alpha * 1.5);
        var slashFrames = 4;
        var fw = slashImg.width / slashFrames;
        var fh = slashImg.height;
        var drawSize = mv.range * 1.2;
        // 向左時只做水平翻轉，不旋轉
        var facingLeft = (Math.abs(mv.angle) > Math.PI / 2);
        if (facingLeft) {
          ctx.scale(-1, 1);
        }
        // 16 幀插值：在 4 原始幀之間 crossfade
        var virtualPos = mv.progress * (slashFrames - 1); // 0 ~ 3 之間的連續值
        var frameA = Math.min(Math.floor(virtualPos), slashFrames - 1);
        var frameB = Math.min(frameA + 1, slashFrames - 1);
        var blend = virtualPos - frameA; // 0~1 之間，代表 B 幀的比例
        // 繪製 A 幀
        ctx.globalAlpha = baseAlpha * (1 - blend);
        ctx.drawImage(slashImg, frameA * fw, 0, fw, fh, -drawSize * 0.2, -drawSize / 2, drawSize, drawSize);
        // 繪製 B 幀（crossfade 疊加）
        if (blend > 0.01 && frameB !== frameA) {
          ctx.globalAlpha = baseAlpha * blend;
          ctx.drawImage(slashImg, frameB * fw, 0, fw, fh, -drawSize * 0.2, -drawSize / 2, drawSize, drawSize);
        }
      } else {
        ctx.rotate(mv.angle);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(0, 0, mv.range, -1.75, 1.75);
        ctx.strokeStyle = 'rgba(100,0,150,0.5)';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, mv.range * 0.9, -1.6, 1.6);
        ctx.strokeStyle = 'rgba(180,50,255,0.7)';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, mv.range * 0.8, -1.45, 1.45);
        ctx.strokeStyle = 'rgba(230,150,255,1)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    // 女武神長槍貫通視覺
    if (state.valkyrieVisual) {
      var vvData = state.valkyrieVisual;
      var self = this;
      // 繪製單支刺擊
      function drawThrust(vv) {
        if (!vv) return;
        var vAlpha = 1 - vv.progress;
        ctx.save();
        ctx.translate(state.player.x, state.player.y);
        ctx.rotate(vv.angle);
        ctx.globalAlpha = vAlpha;
        var spearImg = self.images.spear_attack;
        if (spearImg) {
          var drawW = vv.range * 1.3;
          var drawH = drawW * (spearImg.height / spearImg.width);
          ctx.drawImage(spearImg, 0, -drawH / 2, drawW, drawH);
        } else {
          var extendLen = vv.range * Math.min(1, vv.progress * 4 + 0.3);
          ctx.fillStyle = 'rgba(220,230,255,0.9)';
          ctx.beginPath();
          ctx.moveTo(extendLen, 0);
          ctx.lineTo(extendLen - 20, -10);
          ctx.lineTo(extendLen - 20, 10);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(200,220,255,' + (vAlpha * 0.7).toFixed(2) + ')';
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(extendLen - 20, 0); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }
      drawThrust(vvData.thrust);
      drawThrust(vvData.thrust2);
      // 震退波（跟隨玩家位置）
      if (vvData.shockwaves) {
        for (var si = 0; si < vvData.shockwaves.length; si++) {
          var sw = vvData.shockwaves[si];
          var swAlpha = (1 - sw.progress) * 0.9;
          var swRadius = 80 * (0.2 + sw.progress * 0.8);
          ctx.save();
          ctx.globalAlpha = swAlpha;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(state.player.x, state.player.y, swRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(200,220,255,0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(state.player.x, state.player.y, swRadius * 0.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
    // 弓箭投射物
    if (state.archerVisual) {
      var arrows = state.archerVisual;
      for (var ai = 0; ai < arrows.length; ai++) {
        var ar = arrows[ai];
        if (!this._isVisible(ar.x, ar.y, camX, camY, CULL_MARGIN)) continue;
        ctx.save();
        ctx.translate(ar.x, ar.y);
        ctx.rotate(ar.angle);
        // 箭身（棕色線 + 白色箭頭）
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(8, 0); ctx.stroke();
        // 箭頭
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(6, -3); ctx.lineTo(6, 3); ctx.closePath(); ctx.fill();
        // 尾羽
        ctx.fillStyle = '#44cc44';
        ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-15, -3); ctx.lineTo(-14, 0); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-15, 3); ctx.lineTo(-14, 0); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    // 爆炸箭視覺
    if (state.explosiveVisual) {
      var ev = state.explosiveVisual;
      // 飛行中的爆炸箭（紅色箭頭）
      if (ev.arrow) {
        var ea = ev.arrow;
        ctx.save();
        ctx.translate(ea.x, ea.y);
        ctx.rotate(ea.angle);
        ctx.strokeStyle = '#ff4400';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke();
        ctx.fillStyle = '#ff0000';
        ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(8, -4); ctx.lineTo(8, 4); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      // 爆炸效果
      if (ev.explosion) {
        var ex = ev.explosion;
        var progress = 1 - ex.timer / 0.3;
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = 'rgba(255, 100, 0, 0.8)';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(ex.x, ex.y, ex.radius * progress, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(255, 200, 50, ' + (0.3 * (1 - progress)) + ')';
        ctx.beginPath(); ctx.arc(ex.x, ex.y, ex.radius * progress * 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }
    // 貫通箭視覺（含空氣擾動特效）
    if (state.piercingVisual) {
      var parrows = state.piercingVisual;
      for (var pi = 0; pi < parrows.length; pi++) {
        var pa = parrows[pi];
        if (!this._isVisible(pa.x, pa.y, camX, camY, CULL_MARGIN)) continue;
        ctx.save();
        ctx.translate(pa.x, pa.y);
        ctx.rotate(pa.angle);
        // 空氣擾動波紋（衝擊波紋）
        var numWaves = 4;
        for (var wi = 0; wi < numWaves; wi++) {
          var wOffset = -wi * 15 - (pa.time * 200) % 15;
          ctx.globalAlpha = 0.3 * (1 - wi / numWaves);
          ctx.strokeStyle = 'rgba(200,220,255,0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(wOffset, 0, 8 + wi * 3, -1.2, 1.2);
          ctx.stroke();
        }
        // 箭身（亮白色，更長）
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#aaddff';
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(14, 0); ctx.stroke();
        // 箭頭
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(12, -4); ctx.lineTo(12, 4); ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
        // 速度線拖尾
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = '#aaddff';
        ctx.lineWidth = 1;
        for (var sl = 0; sl < 3; sl++) {
          var sy = (sl - 1) * 6;
          ctx.beginPath(); ctx.moveTo(-20 - sl * 10, sy); ctx.lineTo(-35 - sl * 10, sy); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }
    if (!state.lowQuality) this._drawParticles(state.particles, camX, camY);

    // 傷害數字（低效能時跳過）
    if (state.damageNumbers && !state.lowQuality) state.damageNumbers.draw(ctx);

    // Combo 顯示
    if (state.comboVisual) {
      var cv = state.comboVisual;
      var fontSize = Math.min(36, 18 + cv.count);
      ctx.font = 'bold ' + fontSize + 'px Segoe UI, sans-serif';
      ctx.fillStyle = cv.flash ? '#ffff00' : (cv.count >= 20 ? '#ff4400' : cv.count >= 10 ? '#ffaa00' : '#ffffff');
      ctx.textAlign = 'right';
      ctx.fillText(cv.count + ' COMBO!', camX + W - 80, camY + 60);
      if (cv.count >= 10) {
        ctx.font = '12px Segoe UI';
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('XP x' + (cv.count >= 20 ? '2.0' : '1.5'), camX + W - 80, camY + 78);
      }
      ctx.textAlign = 'left';
    }

    // 炸彈全屏閃爍
    if (state.bombFlash) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(camX, camY, W, H);
    }

    // 升級聖光特效
    if (state.levelUpEffect && state.levelUpEffect.active) {
      state.levelUpEffect.draw(ctx, camX, camY, W, H);
    }

    // FPS 顯示
    if (state.fps !== undefined) {
      ctx.fillStyle = state.lowQuality ? '#ff4444' : '#44ff44';
      ctx.font = '12px monospace';
      ctx.fillText('FPS: ' + state.fps, camX + 10, camY + 20);
    }

    // 炸彈充能進度（右下角）
    if (state.bombProgress !== undefined) {
      var bx = camX + W - 50, by = camY + H - 50;
      ctx.beginPath(); ctx.arc(bx, by, 22, 0, Math.PI * 2);
      ctx.strokeStyle = '#333'; ctx.lineWidth = 4; ctx.stroke();
      ctx.beginPath(); ctx.arc(bx, by, 22, -Math.PI/2, -Math.PI/2 + Math.PI * 2 * state.bombProgress);
      ctx.strokeStyle = state.bombReady ? '#ff4400' : '#ff8800'; ctx.lineWidth = 4; ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.restore();

    // Hardcore 視覺特效（螢幕空間）
    if (state.hardcoreVFX && state.hardcoreVFX.active) {
      state.hardcoreVFX.draw(ctx, W, H);
    }

    // Boss 指示箭頭（螢幕空間，在 restore 之後繪製）
    if (state.bosses && state.bosses.length > 0 && state.player) {
      var px = state.player.x - camX; // 玩家螢幕座標
      var py = state.player.y - camY;
      var arrowDist = 55; // 箭頭離玩家中心的距離
      for (var bi = 0; bi < state.bosses.length; bi++) {
        var boss = state.bosses[bi];
        var bsx = boss.x - camX; // Boss 螢幕座標
        var bsy = boss.y - camY;
        // Boss 在螢幕內時不顯示
        if (bsx > -30 && bsx < W + 30 && bsy > -30 && bsy < H + 30) continue;
        // 計算方向
        var adir = Math.atan2(bsy - py, bsx - px);
        var ax = px + Math.cos(adir) * arrowDist;
        var ay = py + Math.sin(adir) * arrowDist;
        // 繪製箭頭
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(adir);
        ctx.fillStyle = '#ff4400';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 8;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(-8, -9);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-8, 9);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
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
      // 精英怪光圈
      if (e.isElite) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,200,0,0.6)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.size / 2 + 8, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
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
    var projImg = this.images.projectile;
    var projFrames = (this.imgConfig.projectile && this.imgConfig.projectile.frames) || 1;
    var projFW = projImg ? Math.floor(projImg.width / projFrames) : 0;
    var projFH = projImg ? projImg.height : 0;

    for (var i = 0; i < projectiles.length; i++) {
      var p = projectiles[i];
      if (!this._isVisible(p.x, p.y, camX, camY, CULL_MARGIN)) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.atan2(p.vy, p.vx));
      if (projImg && projFrames > 1) {
        // 動畫子彈：用 life 計算當前幀
        var frameIdx = Math.floor((1 - p.life / 2) * projFrames * 3) % projFrames;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(projImg, frameIdx * projFW, 0, projFW, projFH, -pSize / 2, -pSize / 2, pSize, pSize);
      } else if (projImg) {
        ctx.drawImage(projImg, -pSize / 2, -pSize / 2, pSize, pSize);
      } else {
        // 火球視覺：橘紅色發光球體 + 火焰拖尾
        // 拖尾
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#ff4400';
        ctx.beginPath(); ctx.ellipse(-pSize * 0.4, 0, pSize * 0.5, pSize * 0.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath(); ctx.ellipse(-pSize * 0.7, 0, pSize * 0.35, pSize * 0.15, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1.0;
        // 核心火球
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(0, 0, pSize / 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffcc00';
        ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(0, 0, pSize / 4, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }
  };

  Renderer.prototype._drawPlayer = function(player) {
    var ctx = this.ctx;
    var ps = ((this.imgConfig.player && this.imgConfig.player.size) || 40) * (player.scale || 1.0);

    // 刷光計算
    var shineTime = (Date.now() / 1000) % 3.5;
    var shineDuration = 0.35;
    var doShine = shineTime < shineDuration;

    // 使用離屏 canvas 繪製角色 + 刷光（source-atop 限制在不透明區域）
    if (doShine && player.animator && player.animator.isLoaded()) {
      var size = Math.ceil(ps) + 4;
      if (!this._playerOffscreen || this._playerOffscreen.width !== size) {
        this._playerOffscreen = document.createElement('canvas');
        this._playerOffscreen.width = size;
        this._playerOffscreen.height = size;
      }
      var oc = this._playerOffscreen;
      var octx = oc.getContext('2d');
      octx.clearRect(0, 0, size, size);
      // 繪製角色到離屏
      player.animator.draw(octx, size / 2, size / 2, ps, player.facingLeft, player.spriteWidthRatio);
      // source-atop：刷光只出現在不透明像素上
      octx.globalCompositeOperation = 'source-atop';
      octx.globalAlpha = 0.4;
      octx.fillStyle = '#ffffff';
      var t = shineTime / shineDuration;
      var bandW = ps * 0.3;
      var offset = (t - 0.5) * ps * 2;
      octx.save();
      octx.translate(size / 2 + offset, size / 2);
      octx.rotate(-0.6);
      octx.fillRect(-bandW / 2, -ps, bandW, ps * 2);
      octx.restore();
      octx.globalCompositeOperation = 'source-over';
      octx.globalAlpha = 1;
      // 畫到主 canvas
      ctx.drawImage(oc, player.x - size / 2, player.y - size / 2);
    } else if (player.animator && player.animator.isLoaded()) {
      player.animator.draw(ctx, player.x, player.y, ps, player.facingLeft, player.spriteWidthRatio);
    } else if (this.images.player) {
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
      ctx.fillStyle = player.invuln > 0 ? PLAYER_HIT_COLOR : PLAYER_COLOR;
      ctx.shadowColor = PLAYER_COLOR;
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(player.x, player.y, ps / 2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    // 撿取範圍圓圈
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.pickupRange, 0, Math.PI * 2);
    ctx.stroke();

    // 玩家血條（角色頭上）
    var hpBarW = ps * 0.7;
    var hpBarH = 4;
    var hpBarY = player.y - ps / 2 - 10;
    var hpRatio = Math.max(0, player.hp / player.maxHp);
    ctx.fillStyle = '#222';
    ctx.fillRect(player.x - hpBarW / 2, hpBarY, hpBarW, hpBarH);
    ctx.fillStyle = hpRatio > 0.5 ? '#44dd44' : hpRatio > 0.25 ? '#ddaa00' : '#dd2222';
    ctx.fillRect(player.x - hpBarW / 2, hpBarY, hpBarW * hpRatio, hpBarH);
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
