// pixi-renderer.js — PixiJS 渲染器（取代 Canvas 2D renderer.js）
(function() {
  window.SG = window.SG || {};

  var CULL_MARGIN = 100;
  var PARTICLE_RADIUS = 3;
  var HP_BAR_HEIGHT = 4;
  var BOSS_HP_BAR_HEIGHT = 8;

  function Renderer(canvas, ctx) {
    this.canvas = canvas;
    this.W = canvas.width || 400;
    this.H = canvas.height || 700;
    this.images = {};
    this.imgConfig = null;

    // Screen shake
    this._shakeTimer = 0;
    this._shakeDuration = 0;
    this._shakeIntensity = 0;

    // PixiJS Application
    this.app = new PIXI.Application({
      view: canvas,
      width: this.W,
      height: this.H,
      backgroundColor: 0x1a1a2e,
      antialias: false,
      autoDensity: true,
      autoStart: false
    });

    // Containers (layers)
    this._bgContainer = new PIXI.Container();
    this._gameContainer = new PIXI.Container();
    this._hudContainer = new PIXI.Container();

    this.app.stage.addChild(this._bgContainer);
    this.app.stage.addChild(this._gameContainer);
    this.app.stage.addChild(this._hudContainer);

    // Sub-containers in game layer
    this._xpGemsContainer = new PIXI.Container();
    this._enemiesContainer = new PIXI.Container();
    this._bossesContainer = new PIXI.Container();
    this._projectilesContainer = new PIXI.Container();
    this._playerContainer = new PIXI.Container();
    this._weaponsContainer = new PIXI.Container();
    this._particlesContainer = new PIXI.Container();
    this._effectsContainer = new PIXI.Container();

    this._gameContainer.addChild(this._xpGemsContainer);
    this._gameContainer.addChild(this._enemiesContainer);
    this._gameContainer.addChild(this._bossesContainer);
    this._gameContainer.addChild(this._projectilesContainer);
    this._gameContainer.addChild(this._playerContainer);
    this._gameContainer.addChild(this._weaponsContainer);
    this._gameContainer.addChild(this._particlesContainer);
    this._gameContainer.addChild(this._effectsContainer);

    // Background tile sprite
    this._bgTile = null;
    this._bgColor = 0x1a1a2e;

    // Sprite pools
    this._enemySprites = [];
    this._bossSprites = [];
    this._projectileSprites = [];
    this._particleGraphics = [];
    this._xpGemSprites = [];

    // Player sprite
    this._playerSprite = null;
    this._playerHpBar = null;
    this._playerHpText = null;
    this._playerUltBar = null;

    // HUD elements
    this._comboText = null;
    this._fpsText = null;
    this._bossHudContainer = null;

    // Textures cache
    this._textures = {};

    this._initHUD();
  }

  Renderer.prototype._initHUD = function() {
    var textStyle = new PIXI.TextStyle({
      fontFamily: window.GAME_FONT || 'Cinzel, serif',
      fontSize: 14,
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });

    // Combo text
    this._comboText = new PIXI.Text('', new PIXI.TextStyle({
      fontFamily: window.GAME_FONT || 'Cinzel, serif',
      fontSize: 18,
      fontStyle: 'italic',
      fontWeight: 'bold',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }));
    this._comboText.visible = false;
    this._hudContainer.addChild(this._comboText);

    // FPS text
    this._fpsText = new PIXI.Text('', new PIXI.TextStyle({
      fontFamily: window.GAME_FONT || 'Cinzel, serif',
      fontSize: 12,
      fill: '#44ff44',
      stroke: '#000000',
      strokeThickness: 2
    }));
    this._fpsText.position.set(10, 5);
    this._fpsText.visible = false;
    this._hudContainer.addChild(this._fpsText);

    // Boss HUD (name + HP bar drawn via graphics)
    this._bossHudContainer = new PIXI.Container();
    this._bossHudContainer.visible = false;
    this._hudContainer.addChild(this._bossHudContainer);
  };

  Renderer.prototype.shake = function(duration, intensity) {
    this._shakeTimer = duration;
    this._shakeDuration = duration;
    this._shakeIntensity = intensity || 10;
  };

  Renderer.prototype.onResize = function(W, H) {
    this.W = W;
    this.H = H;
    this.app.renderer.resize(W, H);
  };

  Renderer.prototype.init = function(images, imgConfig) {
    this.images = images;
    this.imgConfig = imgConfig;
    // Create textures from loaded images
    for (var key in images) {
      if (images[key]) {
        this._textures[key] = PIXI.Texture.from(images[key]);
      }
    }
  };

  Renderer.prototype.setBgColor = function(color) {
    // Parse hex color string to number
    if (typeof color === 'string') {
      this._bgColor = parseInt(color.replace('#', ''), 16);
    } else {
      this._bgColor = color;
    }
    this.app.renderer.background.color = this._bgColor;
  };

  Renderer.prototype.setBgImage = function(img) {
    // Remove old tile
    if (this._bgTile) {
      this._bgContainer.removeChild(this._bgTile);
      this._bgTile.destroy();
      this._bgTile = null;
    }
    if (img) {
      var tex = PIXI.Texture.from(img);
      this._bgTile = new PIXI.TilingSprite(tex, this.W * 3, this.H * 3);
      this._bgTile.anchor = undefined; // TilingSprite doesn't use anchor
      this._bgContainer.addChild(this._bgTile);
    }
  };

  Renderer.prototype._isVisible = function(x, y, camX, camY, margin) {
    return x >= camX - margin && x <= camX + this.W + margin &&
           y >= camY - margin && y <= camY + this.H + margin;
  };

  // Main render method — translates game state to PixiJS scene
  Renderer.prototype.render = function(state) {
    var player = state.player;
    var camX = player.x - this.W / 2;
    var camY = player.y - this.H / 2;

    // Screen shake
    if (this._shakeTimer > 0) {
      this._shakeTimer -= state.dt || 0.016;
      var intensity = this._shakeIntensity * (this._shakeTimer / this._shakeDuration);
      camX += (Math.random() - 0.5) * intensity * 2;
      camY += (Math.random() - 0.5) * intensity * 2;
    }

    // Position game container (camera)
    this._gameContainer.position.set(-camX, -camY);

    // Background tile offset
    if (this._bgTile) {
      this._bgTile.tilePosition.set(-camX, -camY);
      this._bgTile.position.set(camX, camY);
    }

    // Render entities
    this._renderXPGems(state.xpGems, camX, camY);
    this._renderEnemies(state.enemies, camX, camY);
    this._renderBosses(state.bosses, camX, camY);
    this._renderProjectiles(state.projectiles, camX, camY);
    this._renderPlayer(player, state.hardcoreLevel || 0, state.ultimateReady, state.ultimateCharge);
    this._renderParticles(state.particles || [], camX, camY);

    // HUD updates
    this._renderCombo(state.comboVisual);
    this._renderFPS(state.fps, state.lowQuality);
    this._renderBossHUD(state.activeBoss);

    // Ultimate flash
    if (state.ultimateFlash > 0) {
      this._renderFlash(state.ultimateFlash);
    }

    // Damage numbers (Canvas 2D overlay with camera transform)
    if (state.damageNumbers) {
      var dmgCtx = this._getDmgCtx();
      dmgCtx.save();
      dmgCtx.translate(-camX, -camY);
      state.damageNumbers.draw(dmgCtx);
      dmgCtx.restore();
    }

    // Trigger PixiJS render
    this.app.render();
  };

  // Fallback: damage numbers still use Canvas 2D overlay
  Renderer.prototype._getDmgCtx = function() {
    // We'll keep a small overlay canvas for damage numbers for now
    if (!this._dmgCanvas) {
      this._dmgCanvas = document.createElement('canvas');
      this._dmgCanvas.width = this.W;
      this._dmgCanvas.height = this.H;
      this._dmgCanvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:3;';
      this.canvas.parentElement.appendChild(this._dmgCanvas);
      this._dmgCtx = this._dmgCanvas.getContext('2d');
    }
    this._dmgCtx.clearRect(0, 0, this.W, this.H);
    return this._dmgCtx;
  };

  // === Entity Rendering ===

  Renderer.prototype._getOrCreateSprite = function(pool, index, texture, parent) {
    if (index < pool.length) {
      var s = pool[index];
      s.visible = true;
      if (texture && s.texture !== texture) s.texture = texture;
      return s;
    }
    var sprite = texture ? new PIXI.Sprite(texture) : new PIXI.Sprite(PIXI.Texture.WHITE);
    sprite.anchor.set(0.5);
    parent.addChild(sprite);
    pool.push(sprite);
    return sprite;
  };

  Renderer.prototype._hideExtraSprites = function(pool, usedCount) {
    for (var i = usedCount; i < pool.length; i++) {
      pool[i].visible = false;
    }
  };

  Renderer.prototype._renderXPGems = function(gems, camX, camY) {
    var gemTex = this._textures['xpGem'] || null;
    var count = 0;
    for (var i = 0; i < gems.length; i++) {
      var g = gems[i];
      if (!this._isVisible(g.x, g.y, camX, camY, CULL_MARGIN)) continue;
      var sprite = this._getOrCreateSprite(this._xpGemSprites, count, gemTex, this._xpGemsContainer);
      sprite.position.set(g.x, g.y);
      sprite.width = 16;
      sprite.height = 16;
      if (!gemTex) sprite.tint = 0x00ff88;
      count++;
    }
    this._hideExtraSprites(this._xpGemSprites, count);
  };

  Renderer.prototype._renderEnemies = function(enemies, camX, camY) {
    var count = 0;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!this._isVisible(e.x, e.y, camX, camY, CULL_MARGIN)) continue;

      var tex = this._textures['enemy_' + e.cfgIdx] || this._getAnimFrame(e) || null;
      var sprite = this._getOrCreateSprite(this._enemySprites, count, tex, this._enemiesContainer);
      sprite.position.set(e.x, e.y);
      sprite.width = e.size;
      sprite.height = e.size;
      if (!tex) sprite.tint = parseInt((e.color || '#ff4444').replace('#', ''), 16);
      if (e.facingLeft) sprite.scale.x = -Math.abs(sprite.scale.x);
      else sprite.scale.x = Math.abs(sprite.scale.x);
      count++;
    }
    this._hideExtraSprites(this._enemySprites, count);
  };

  Renderer.prototype._renderBosses = function(bosses, camX, camY) {
    var count = 0;
    for (var i = 0; i < bosses.length; i++) {
      var b = bosses[i];
      if (!this._isVisible(b.x, b.y, camX, camY, CULL_MARGIN)) continue;

      var tex = this._textures['boss_' + b.cfgIdx] || this._getAnimFrame(b) || null;
      var sprite = this._getOrCreateSprite(this._bossSprites, count, tex, this._bossesContainer);
      sprite.position.set(b.x, b.y);
      sprite.width = b.size;
      sprite.height = b.size;
      if (!tex) sprite.tint = parseInt((b.color || '#ff0000').replace('#', ''), 16);
      if (b.facingLeft) sprite.scale.x = -Math.abs(sprite.scale.x);
      else sprite.scale.x = Math.abs(sprite.scale.x);
      count++;
    }
    this._hideExtraSprites(this._bossSprites, count);
  };

  Renderer.prototype._renderProjectiles = function(projectiles, camX, camY) {
    var pSize = (this.imgConfig && this.imgConfig.projectile && this.imgConfig.projectile.size) || 12;
    var pTex = this._textures['projectile'] || null;
    var count = 0;
    for (var i = 0; i < projectiles.length; i++) {
      var p = projectiles[i];
      if (!this._isVisible(p.x, p.y, camX, camY, CULL_MARGIN)) continue;
      var sprite = this._getOrCreateSprite(this._projectileSprites, count, pTex, this._projectilesContainer);
      sprite.position.set(p.x, p.y);
      sprite.width = pSize;
      sprite.height = pSize;
      if (!pTex) sprite.tint = 0xff6600;
      count++;
    }
    this._hideExtraSprites(this._projectileSprites, count);
  };

  Renderer.prototype._renderPlayer = function(player, hardcoreLevel, ultimateReady, ultimateCharge) {
    var ps = ((this.imgConfig && this.imgConfig.player && this.imgConfig.player.size) || 40) * (player.scale || 1.0);

    // Player sprite
    if (!this._playerSprite) {
      this._playerSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      this._playerSprite.anchor.set(0.5);
      this._playerContainer.addChild(this._playerSprite);
    }

    // Try to get animated frame
    var tex = this._getAnimFrame(player);
    if (tex) {
      this._playerSprite.texture = tex;
    } else {
      this._playerSprite.tint = 0x4488ff;
    }
    this._playerSprite.position.set(player.x, player.y);
    this._playerSprite.width = ps;
    this._playerSprite.height = ps;
    if (player.facingLeft) this._playerSprite.scale.x = -Math.abs(this._playerSprite.scale.x);
    else this._playerSprite.scale.x = Math.abs(this._playerSprite.scale.x);

    // Ultimate ready glow
    if (ultimateReady) {
      this._playerSprite.tint = 0xffd700;
      this._playerSprite.alpha = 0.8 + Math.sin(Date.now() / 200) * 0.2;
    } else {
      this._playerSprite.alpha = 1;
      if (tex) this._playerSprite.tint = 0xffffff;
    }

    // HP bar + text + ultimate bar are drawn as Graphics
    this._renderPlayerHUD(player, ps, ultimateCharge, ultimateReady);
  };

  Renderer.prototype._renderPlayerHUD = function(player, ps, ultimateCharge, ultimateReady) {
    if (!this._playerHudGfx) {
      this._playerHudGfx = new PIXI.Graphics();
      this._playerContainer.addChild(this._playerHudGfx);
      this._playerHpText = new PIXI.Text('', new PIXI.TextStyle({
        fontFamily: window.GAME_FONT || 'Cinzel, serif',
        fontSize: 10,
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }));
      this._playerHpText.anchor.set(0.5, 1);
      this._playerContainer.addChild(this._playerHpText);
    }

    var g = this._playerHudGfx;
    g.clear();

    var barW = ps * 0.7;
    var barH = 4;
    var barY = player.y - ps / 2 - 10;
    var barX = player.x - barW / 2;
    var hpRatio = Math.max(0, player.hp / player.maxHp);

    // HP text
    this._playerHpText.text = Math.ceil(player.hp) + '/' + Math.ceil(player.maxHp);
    this._playerHpText.position.set(player.x, barY - 2);

    // HP bar background
    g.beginFill(0x222222);
    g.drawRect(barX, barY, barW, barH);
    g.endFill();

    // HP bar fill
    var hpColor = hpRatio > 0.5 ? 0x44dd44 : hpRatio > 0.25 ? 0xddaa00 : 0xdd2222;
    g.beginFill(hpColor);
    g.drawRect(barX, barY, barW * hpRatio, barH);
    g.endFill();

    // Ultimate bar
    if (ultimateCharge !== undefined) {
      var ultBarH = 3;
      var ultBarY = barY + barH + 2;
      g.beginFill(0x222222);
      g.drawRect(barX, ultBarY, barW, ultBarH);
      g.endFill();
      if (ultimateCharge > 0) {
        var ultColor = ultimateReady ? 0xffd700 : 0xffaa00;
        g.beginFill(ultColor);
        g.drawRect(barX, ultBarY, barW * ultimateCharge, ultBarH);
        g.endFill();
      }
    }
  };

  Renderer.prototype._renderParticles = function(particles, camX, camY) {
    // Use a single Graphics object for particles
    if (!this._particleGfx) {
      this._particleGfx = new PIXI.Graphics();
      this._particlesContainer.addChild(this._particleGfx);
    }
    var g = this._particleGfx;
    g.clear();
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (!this._isVisible(p.x, p.y, camX, camY, CULL_MARGIN)) continue;
      var color = parseInt((p.color || '#ffffff').replace('#', ''), 16);
      g.beginFill(color, p.life * 2);
      g.drawCircle(p.x, p.y, PARTICLE_RADIUS);
      g.endFill();
    }
  };

  // === HUD Rendering ===

  Renderer.prototype._renderCombo = function(comboVisual) {
    if (!comboVisual) {
      this._comboText.visible = false;
      return;
    }
    var cv = comboVisual;
    var fontSize = Math.min(24, 14 + cv.count);
    this._comboText.style.fontSize = fontSize;
    var color = cv.flash ? '#ffff00' : (cv.count >= 20 ? '#ff4400' : cv.count >= 10 ? '#ffaa00' : '#ffffff');
    this._comboText.style.fill = color;
    this._comboText.text = '🔥 ' + cv.count + ' COMBO';
    this._comboText.position.set(12, 115);
    this._comboText.visible = true;
  };

  Renderer.prototype._renderFPS = function(fps, lowQuality) {
    if (fps === undefined) {
      this._fpsText.visible = false;
      return;
    }
    this._fpsText.style.fill = lowQuality ? '#ff4444' : '#44ff44';
    this._fpsText.text = 'FPS: ' + fps;
    this._fpsText.visible = true;
  };

  Renderer.prototype._renderBossHUD = function(activeBoss) {
    if (!activeBoss) {
      this._bossHudContainer.visible = false;
      return;
    }
    this._bossHudContainer.visible = true;
    // Rebuild boss HUD each frame (simple approach)
    this._bossHudContainer.removeChildren();

    var W = this.W;
    var barW = W * 0.6;
    var barH = 8;
    var barX = (W - barW) / 2;
    var barY = 56;
    var hpRatio = Math.max(0, activeBoss.hp / activeBoss.maxHp);

    var g = new PIXI.Graphics();
    // Background
    g.beginFill(0x333333);
    g.drawRect(barX, barY, barW, barH);
    g.endFill();
    // HP fill
    var grad = hpRatio > 0.5 ? 0xff4444 : 0xff0000;
    g.beginFill(grad);
    g.drawRect(barX, barY, barW * hpRatio, barH);
    g.endFill();
    // Border
    g.lineStyle(1, 0x888888);
    g.drawRect(barX, barY, barW, barH);
    this._bossHudContainer.addChild(g);

    // Boss name
    var bossNames = ['紫龍','大猩猩','蠍王','沙蟲','甲蟲騎士','龍騎','骷髏王','牛頭怪','暗法師','機械龍','史萊姆王','暗黑巨龍'];
    var bName = bossNames[activeBoss.cfgIdx] || 'BOSS';
    var nameText = new PIXI.Text('👹 ' + bName, new PIXI.TextStyle({
      fontFamily: window.GAME_FONT || 'Cinzel, serif',
      fontSize: 12,
      fontWeight: 'bold',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }));
    nameText.anchor.set(0.5, 0);
    nameText.position.set(W / 2, barY + barH + 2);
    this._bossHudContainer.addChild(nameText);
  };

  Renderer.prototype._renderFlash = function(flashTime) {
    // Full screen flash effect
    if (!this._flashGfx) {
      this._flashGfx = new PIXI.Graphics();
      this._hudContainer.addChild(this._flashGfx);
    }
    this._flashGfx.clear();
    var alpha = Math.min(0.8, flashTime * 2);
    this._flashGfx.beginFill(0xffffff, alpha);
    this._flashGfx.drawRect(0, 0, this.W, this.H);
    this._flashGfx.endFill();
  };

  // === Helpers ===

  Renderer.prototype._getAnimFrame = function(entity) {
    if (entity.animator && entity.animator.isLoaded()) {
      // Get current frame image from animator
      var frame = entity.animator.getCurrentFrame();
      if (frame && frame.image) {
        var key = 'anim_' + frame.image.src + '_' + frame.frameIndex;
        if (!this._textures[key]) {
          // Create texture from sprite sheet region
          var baseTex = PIXI.BaseTexture.from(frame.image);
          var rect = new PIXI.Rectangle(frame.sx, frame.sy, frame.sw, frame.sh);
          this._textures[key] = new PIXI.Texture(baseTex, rect);
        }
        return this._textures[key];
      }
    }
    return null;
  };

  SG.Renderer = Renderer;
})();
