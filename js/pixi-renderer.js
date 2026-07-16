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

    // Elite visuals (magnets + chests)
    this._renderEliteVisuals(state.eliteVisuals, camX, camY);

    // Render entities
    this._renderXPGems(state.xpGems, camX, camY);
    this._renderEnemies(state.enemies, camX, camY);
    this._renderBosses(state.bosses, camX, camY);
    this._renderProjectiles(state.projectiles, camX, camY);
    this._renderPlayer(player, state.hardcoreLevel || 0, state.ultimateReady, state.ultimateCharge);
    this._renderParticles(state.particles || [], camX, camY);

    // Attack visuals
    this._renderMeleeVisual(state.meleeVisual, state.meleeIsKnight, player);
    this._renderValkyrieVisual(state.valkyrieVisual, player);
    this._renderArcherVisual(state.archerVisual, camX, camY);
    this._renderFireZones(state.archerFireZones, camX, camY);
    this._renderExplosiveVisual(state.explosiveVisual, camX, camY);
    this._renderPiercingVisual(state.piercingVisual, camX, camY);
    this._renderFireExplosions(state.fireExplosions);

    // Weapon visuals
    if (state.weaponVisuals) this._renderWeapons(state.weaponVisuals, camX, camY);

    // Level up effect
    if (state.levelUpEffect && state.levelUpEffect.active) {
      this._renderLevelUpEffect(state.levelUpEffect, player);
    }

    // Debug hitbox
    if (state.debugHitbox) {
      this._renderDebugHitbox(state);
    }

    // HUD updates
    this._renderCombo(state.comboVisual);
    this._renderFPS(state.fps, state.lowQuality);
    this._renderBossHUD(state.activeBoss);

    // Hardcore VFX (screen-space)
    if (state.hardcoreLevel > 0) {
      this._renderHardcoreVFX(state.hardcoreVFX, state.hardcoreLevel);
    }

    // Flash effects
    if (state.ultimateFlash > 0) this._renderFlash(state.ultimateFlash);
    if (state.bombFlash) this._renderBombFlash();

    // Damage numbers (PixiJS Text pool)
    if (state.damageNumbers && !state.lowQuality) {
      this._renderDamageNumbers(state.damageNumbers, camX, camY);
    }

    // Trigger PixiJS render
    this.app.render();
  };

  // === Phase 3: Damage Numbers (PIXI.Text pool) ===

  Renderer.prototype._renderDamageNumbers = function(dmgNumbers, camX, camY) {
    if (!this._dmgTextPool) {
      this._dmgTextPool = [];
      this._dmgTextContainer = new PIXI.Container();
      this._gameContainer.addChild(this._dmgTextContainer);
    }
    var numbers = dmgNumbers.numbers;
    var count = 0;
    for (var i = 0; i < numbers.length; i++) {
      var n = numbers[i];
      var alpha = Math.min(1, n.timer / 0.3);
      if (alpha <= 0) continue;
      // Get or create text from pool
      var txt;
      if (count < this._dmgTextPool.length) {
        txt = this._dmgTextPool[count];
        txt.visible = true;
      } else {
        txt = new PIXI.Text('', new PIXI.TextStyle({
          fontFamily: window.GAME_FONT || 'Cinzel, serif',
          fontSize: 14,
          fill: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2
        }));
        this._dmgTextContainer.addChild(txt);
        this._dmgTextPool.push(txt);
      }
      txt.text = n.text;
      txt.position.set(n.x, n.y);
      txt.alpha = alpha;
      if (n.crit) {
        txt.style.fontSize = 20;
        txt.style.fontWeight = 'bold';
        txt.style.fill = '#ffdd00';
      } else {
        txt.style.fontSize = 14;
        txt.style.fontWeight = 'normal';
        txt.style.fill = '#ffffff';
      }
      count++;
    }
    // Hide unused pool entries
    for (var j = count; j < this._dmgTextPool.length; j++) {
      this._dmgTextPool[j].visible = false;
    }
  };

  // === Phase 3: Debug Hitbox ===

  Renderer.prototype._renderDebugHitbox = function(state) {
    if (!this._debugGfx) {
      this._debugGfx = new PIXI.Graphics();
      this._effectsContainer.addChild(this._debugGfx);
    }
    this._debugGfx.clear();
    var g = this._debugGfx;
    g.alpha = 0.6;

    // Player hitbox (green)
    g.lineStyle(1.5, 0x00ff00);
    g.drawCircle(state.player.x, state.player.y, state.playerHitboxRadius);

    // Enemy hitbox (red)
    g.lineStyle(1.5, 0xff0000);
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      g.drawCircle(e.x, e.y, e.hitboxRadius);
    }

    // Boss hitbox (red, thick)
    g.lineStyle(2.5, 0xff0000);
    for (var bi = 0; bi < state.bosses.length; bi++) {
      var b = state.bosses[bi];
      g.drawCircle(b.x, b.y, b.hitboxRadius);
    }

    // Projectile hitbox (yellow)
    var pSize = (this.imgConfig && this.imgConfig.projectile && this.imgConfig.projectile.size) || 12;
    g.lineStyle(1.5, 0xffff00);
    for (var pi = 0; pi < state.projectiles.length; pi++) {
      var p = state.projectiles[pi];
      g.drawCircle(p.x, p.y, pSize / 2);
    }

    // Melee hitbox (blue arc)
    if (state.meleeVisual) {
      var mv = state.meleeVisual;
      g.lineStyle(1.5, 0x4488ff);
      g.arc(mv.x, mv.y, mv.range, mv.angle - 1.75, mv.angle + 1.75);
      g.lineTo(mv.x, mv.y);
      g.closePath();
    }

    // Valkyrie thrust hitbox (blue rect)
    if (state.valkyrieVisual && state.valkyrieVisual.thrust) {
      var vt = state.valkyrieVisual.thrust;
      var cos = Math.cos(vt.angle);
      var sin = Math.sin(vt.angle);
      var px = state.player.x;
      var py = state.player.y;
      g.lineStyle(1.5, 0x4488ff);
      // Draw rotated rectangle
      var hw = 15;
      var corners = [
        [px + cos * 0 - sin * (-hw), py + sin * 0 + cos * (-hw)],
        [px + cos * vt.range - sin * (-hw), py + sin * vt.range + cos * (-hw)],
        [px + cos * vt.range - sin * hw, py + sin * vt.range + cos * hw],
        [px + cos * 0 - sin * hw, py + sin * 0 + cos * hw]
      ];
      g.moveTo(corners[0][0], corners[0][1]);
      for (var ci = 1; ci < 4; ci++) g.lineTo(corners[ci][0], corners[ci][1]);
      g.closePath();
    }
  };

  // === Phase 3: Elite Visuals (Magnets + Chests + Aura) ===

  Renderer.prototype._renderEliteVisuals = function(eliteVisuals, camX, camY) {
    if (!this._eliteGfx) {
      this._eliteGfx = new PIXI.Graphics();
      this._gameContainer.addChild(this._eliteGfx);
    }
    this._eliteGfx.clear();
    if (!eliteVisuals) return;

    var g = this._eliteGfx;

    // Magnets
    for (var mi = 0; mi < eliteVisuals.magnets.length; mi++) {
      var mg = eliteVisuals.magnets[mi];
      if (!this._isVisible(mg.x, mg.y, camX, camY, CULL_MARGIN)) continue;
      // Red pole
      g.beginFill(0xff2222);
      g.drawCircle(mg.x - 6, mg.y - 5, 5);
      g.endFill();
      // Blue pole
      g.beginFill(0x2222ff);
      g.drawCircle(mg.x + 6, mg.y - 5, 5);
      g.endFill();
      // Arc
      g.lineStyle(4, 0x888888);
      g.arc(mg.x, mg.y - 5, 10, Math.PI, 0);
    }

    // Chests
    for (var ci = 0; ci < eliteVisuals.chests.length; ci++) {
      var ch = eliteVisuals.chests[ci];
      if (!this._isVisible(ch.x, ch.y, camX, camY, CULL_MARGIN)) continue;
      g.lineStyle(0);
      // Chest body
      g.beginFill(0xcc8800);
      g.drawRect(ch.x - 12, ch.y - 6, 24, 16);
      g.endFill();
      // Chest face
      g.beginFill(0xffcc00);
      g.drawRect(ch.x - 10, ch.y - 4, 20, 12);
      g.endFill();
      // Lock
      g.beginFill(0xffffff);
      g.drawRect(ch.x - 3, ch.y, 6, 4);
      g.endFill();
      // Glow ring
      g.lineStyle(1, 0xffcc00, 0.5);
      g.drawCircle(ch.x, ch.y + 2, 14);
    }
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
    // Elite aura graphics
    if (!this._eliteAuraGfx) {
      this._eliteAuraGfx = new PIXI.Graphics();
      this._enemiesContainer.addChild(this._eliteAuraGfx);
    }
    this._eliteAuraGfx.clear();

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!this._isVisible(e.x, e.y, camX, camY, CULL_MARGIN)) continue;

      // Elite golden ring
      if (e.isElite) {
        this._eliteAuraGfx.lineStyle(3, 0xffc800, 0.6);
        this._eliteAuraGfx.drawCircle(e.x, e.y, e.size / 2 + 8);
      }

      var tex = this._textures['enemy_' + e.cfgIdx] || this._getAnimFrame(e) || null;
      var sprite = this._getOrCreateSprite(this._enemySprites, count, tex, this._enemiesContainer);
      sprite.position.set(e.x, e.y);
      sprite.width = e.size;
      sprite.height = e.size;
      if (!tex) sprite.tint = parseInt((e.color || '#ff4444').replace('#', ''), 16);
      else sprite.tint = 0xffffff;
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

    // Shine overlay sprite (for hardcore glow)
    if (!this._shineSprite) {
      this._shineSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      this._shineSprite.anchor.set(0.5);
      this._shineSprite.visible = false;
      this._playerContainer.addChild(this._shineSprite);
    }

    // Try to get animated frame
    var tex = this._getAnimFrame(player);
    if (tex) {
      this._playerSprite.texture = tex;
      this._playerSprite.tint = 0xffffff;
    } else {
      this._playerSprite.tint = 0x4488ff;
    }
    this._playerSprite.position.set(player.x, player.y);
    this._playerSprite.width = ps;
    this._playerSprite.height = ps;
    if (player.facingLeft) this._playerSprite.scale.x = -Math.abs(this._playerSprite.scale.x);
    else this._playerSprite.scale.x = Math.abs(this._playerSprite.scale.x);

    // Invulnerability flash
    if (player.invuln > 0) {
      this._playerSprite.alpha = 0.5 + Math.sin(Date.now() / 50) * 0.3;
    } else {
      this._playerSprite.alpha = 1;
    }

    // Hardcore shine effect (using tint overlay)
    var shineTime = (Date.now() / 1000) % 3.5;
    var shineDuration = 0.35;
    var doShine = hardcoreLevel > 0 && shineTime < shineDuration;
    if (doShine && tex) {
      var shineColor = 0xffffff;
      if (hardcoreLevel === 2) shineColor = 0xffd700;
      else if (hardcoreLevel >= 3) shineColor = 0xb450ff;
      // Flash the player sprite tint briefly
      this._playerSprite.tint = shineColor;
      this._playerSprite.alpha = 0.7 + (shineTime / shineDuration) * 0.3;
    }

    // Ultimate ready golden glow
    if (ultimateReady) {
      var glowPulse = Math.sin(Date.now() / 200) * 0.15 + 0.85;
      this._playerSprite.tint = 0xffd700;
      this._playerSprite.alpha = glowPulse;
    }

    // HP bar + text + ultimate bar
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

  // === Phase 2: Attack Effects ===

  Renderer.prototype._getEffectsGfx = function() {
    if (!this._effectsGfx) {
      this._effectsGfx = new PIXI.Graphics();
      this._effectsContainer.addChild(this._effectsGfx);
    }
    this._effectsGfx.clear();
    return this._effectsGfx;
  };

  Renderer.prototype._renderMeleeVisual = function(mv, isKnight, player) {
    if (!this._meleeGfx) {
      this._meleeGfx = new PIXI.Graphics();
      this._effectsContainer.addChild(this._meleeGfx);
    }
    this._meleeGfx.clear();
    if (!mv) return;

    var alpha = Math.min(1, (1 - mv.progress) * 2);
    if (isKnight && this._textures['slash_effect']) {
      // Slash sprite — use two overlapping sprites for crossfade
      if (!this._slashSprite1) {
        this._slashSprite1 = new PIXI.Sprite(this._textures['slash_effect']);
        this._slashSprite1.anchor.set(0.2, 0.5);
        this._slashSprite1.visible = false;
        this._effectsContainer.addChild(this._slashSprite1);
        this._slashSprite2 = new PIXI.Sprite(this._textures['slash_effect']);
        this._slashSprite2.anchor.set(0.2, 0.5);
        this._slashSprite2.visible = false;
        this._effectsContainer.addChild(this._slashSprite2);
      }
      // For now use the full texture (crossfade frames would need texture regions)
      var drawSize = mv.range * 1.2;
      var facingLeft = (Math.abs(mv.angle) > Math.PI / 2);
      this._slashSprite1.visible = true;
      this._slashSprite1.position.set(mv.x, mv.y);
      this._slashSprite1.width = drawSize;
      this._slashSprite1.height = drawSize;
      this._slashSprite1.alpha = alpha;
      this._slashSprite1.scale.x = facingLeft ? -Math.abs(this._slashSprite1.scale.x) : Math.abs(this._slashSprite1.scale.x);
    } else {
      if (this._slashSprite1) this._slashSprite1.visible = false;
      if (this._slashSprite2) this._slashSprite2.visible = false;
      // Purple arc slash effect
      var g = this._meleeGfx;
      g.lineStyle(14, 0x640096, alpha * 0.5);
      g.arc(mv.x, mv.y, mv.range, mv.angle - 1.75, mv.angle + 1.75);
      g.lineStyle(8, 0xB432FF, alpha * 0.7);
      g.arc(mv.x, mv.y, mv.range * 0.9, mv.angle - 1.6, mv.angle + 1.6);
      g.lineStyle(3, 0xE696FF, alpha);
      g.arc(mv.x, mv.y, mv.range * 0.8, mv.angle - 1.45, mv.angle + 1.45);
    }

    // Back slash
    if (mv.backSlash) {
      var bs = mv.backSlash;
      var bsAlpha = Math.min(1, (1 - bs.progress) * 1.5);
      var g2 = this._meleeGfx;
      g2.lineStyle(14, 0x640096, bsAlpha * 0.5);
      g2.arc(mv.x, mv.y, mv.range, bs.angle - 1.75, bs.angle + 1.75);
      g2.lineStyle(8, 0xB432FF, bsAlpha * 0.7);
      g2.arc(mv.x, mv.y, mv.range * 0.9, bs.angle - 1.6, bs.angle + 1.6);
    }
  };

  Renderer.prototype._renderValkyrieVisual = function(vvData, player) {
    if (!this._valkGfx) {
      this._valkGfx = new PIXI.Graphics();
      this._effectsContainer.addChild(this._valkGfx);
    }
    this._valkGfx.clear();
    if (!vvData) return;

    var g = this._valkGfx;
    var self = this;

    function drawThrust(vv) {
      if (!vv) return;
      var vAlpha = 1 - vv.progress;
      var spearTex = self._textures['spear_attack'];
      if (spearTex) {
        if (!self._spearSprite) {
          self._spearSprite = new PIXI.Sprite(spearTex);
          self._spearSprite.anchor.set(0, 0.5);
          self._effectsContainer.addChild(self._spearSprite);
        }
        var drawW = vv.range * 1.3;
        self._spearSprite.visible = true;
        self._spearSprite.position.set(player.x, player.y);
        self._spearSprite.rotation = vv.angle;
        self._spearSprite.width = drawW;
        self._spearSprite.height = drawW * 0.3;
        self._spearSprite.alpha = vAlpha;
      } else {
        // Fallback: line + triangle
        var extendLen = vv.range * Math.min(1, vv.progress * 4 + 0.3);
        var cos = Math.cos(vv.angle);
        var sin = Math.sin(vv.angle);
        var ex = player.x + cos * extendLen;
        var ey = player.y + sin * extendLen;
        g.lineStyle(4, 0xC8DCFF, vAlpha * 0.7);
        g.moveTo(player.x + cos * 20, player.y + sin * 20);
        g.lineTo(ex, ey);
        // Arrowhead
        g.beginFill(0xDCE6FF, vAlpha * 0.9);
        g.moveTo(ex + cos * 10, ey + sin * 10);
        g.lineTo(ex - sin * 10, ey + cos * 10);
        g.lineTo(ex + sin * 10, ey - cos * 10);
        g.closePath();
        g.endFill();
      }
    }
    drawThrust(vvData.thrust);
    drawThrust(vvData.thrust2);

    // Shockwaves
    if (vvData.shockwaves) {
      for (var si = 0; si < vvData.shockwaves.length; si++) {
        var sw = vvData.shockwaves[si];
        var swAlpha = (1 - sw.progress) * 0.9;
        var swRadius = 80 * (0.2 + sw.progress * 0.8);
        g.lineStyle(4, 0xffffff, swAlpha);
        g.drawCircle(player.x, player.y, swRadius);
        g.lineStyle(2, 0xC8DCFF, swAlpha * 0.6);
        g.drawCircle(player.x, player.y, swRadius * 0.5);
      }
    }
  };

  Renderer.prototype._renderArcherVisual = function(arrows, camX, camY) {
    if (!this._arrowGfx) {
      this._arrowGfx = new PIXI.Graphics();
      this._effectsContainer.addChild(this._arrowGfx);
    }
    this._arrowGfx.clear();
    if (!arrows) return;

    var g = this._arrowGfx;
    for (var i = 0; i < arrows.length; i++) {
      var ar = arrows[i];
      if (!this._isVisible(ar.x, ar.y, camX, camY, CULL_MARGIN)) continue;
      var cos = Math.cos(ar.angle);
      var sin = Math.sin(ar.angle);
      // Arrow shaft
      g.lineStyle(2, 0x8B4513);
      g.moveTo(ar.x - cos * 12, ar.y - sin * 12);
      g.lineTo(ar.x + cos * 8, ar.y + sin * 8);
      // Arrowhead
      g.beginFill(0xffffff);
      g.moveTo(ar.x + cos * 12, ar.y + sin * 12);
      g.lineTo(ar.x + cos * 6 - sin * 3, ar.y + sin * 6 + cos * 3);
      g.lineTo(ar.x + cos * 6 + sin * 3, ar.y + sin * 6 - cos * 3);
      g.closePath();
      g.endFill();
      // Tail feathers
      g.beginFill(0x44cc44);
      g.moveTo(ar.x - cos * 12, ar.y - sin * 12);
      g.lineTo(ar.x - cos * 15 - sin * 3, ar.y - sin * 15 + cos * 3);
      g.lineTo(ar.x - cos * 14, ar.y - sin * 14);
      g.closePath();
      g.endFill();
    }
  };

  Renderer.prototype._renderFireZones = function(fireZones, camX, camY) {
    if (!this._fzGfx) {
      this._fzGfx = new PIXI.Graphics();
      this._effectsContainer.addChild(this._fzGfx);
    }
    this._fzGfx.clear();
    if (!fireZones || fireZones.length === 0) return;

    var g = this._fzGfx;
    var fzImg = this._textures['fire_zone'];
    for (var i = 0; i < fireZones.length; i++) {
      var fz = fireZones[i];
      if (!this._isVisible(fz.x, fz.y, camX, camY, CULL_MARGIN)) continue;
      var fzAlpha = Math.min(1, fz.life / 0.5) * 0.8;
      // Orange fire circle
      g.beginFill(0xff4400, fzAlpha * 0.6);
      g.drawCircle(fz.x, fz.y, 45);
      g.endFill();
      g.beginFill(0xffaa00, fzAlpha * 0.4);
      g.drawCircle(fz.x, fz.y, 30);
      g.endFill();
    }
  };

  Renderer.prototype._renderExplosiveVisual = function(ev, camX, camY) {
    if (!this._expGfx) {
      this._expGfx = new PIXI.Graphics();
      this._effectsContainer.addChild(this._expGfx);
    }
    this._expGfx.clear();
    if (!ev) return;

    var g = this._expGfx;
    // Flying explosive arrow
    if (ev.arrow) {
      var ea = ev.arrow;
      var cos = Math.cos(ea.angle);
      var sin = Math.sin(ea.angle);
      g.lineStyle(3, 0xff4400);
      g.moveTo(ea.x - cos * 10, ea.y - sin * 10);
      g.lineTo(ea.x + cos * 10, ea.y + sin * 10);
      g.beginFill(0xff0000);
      g.moveTo(ea.x + cos * 14, ea.y + sin * 14);
      g.lineTo(ea.x + cos * 8 - sin * 4, ea.y + sin * 8 + cos * 4);
      g.lineTo(ea.x + cos * 8 + sin * 4, ea.y + sin * 8 - cos * 4);
      g.closePath();
      g.endFill();
    }
    // Explosion
    if (ev.explosion) {
      var ex = ev.explosion;
      var progress = 1 - ex.timer / 0.3;
      var alpha = 1 - progress;
      g.lineStyle(4, 0xff6400, alpha * 0.8);
      g.drawCircle(ex.x, ex.y, ex.radius * progress);
      g.beginFill(0xffc832, alpha * 0.3);
      g.drawCircle(ex.x, ex.y, ex.radius * progress * 0.6);
      g.endFill();
    }
  };

  Renderer.prototype._renderPiercingVisual = function(parrows, camX, camY) {
    if (!this._pierceGfx) {
      this._pierceGfx = new PIXI.Graphics();
      this._effectsContainer.addChild(this._pierceGfx);
    }
    this._pierceGfx.clear();
    if (!parrows) return;

    var g = this._pierceGfx;
    for (var i = 0; i < parrows.length; i++) {
      var pa = parrows[i];
      if (!this._isVisible(pa.x, pa.y, camX, camY, CULL_MARGIN)) continue;
      var cos = Math.cos(pa.angle);
      var sin = Math.sin(pa.angle);
      // Bright white arrow
      g.lineStyle(3, 0xffffff);
      g.moveTo(pa.x - cos * 18, pa.y - sin * 18);
      g.lineTo(pa.x + cos * 14, pa.y + sin * 14);
      // Arrowhead
      g.beginFill(0xffffff);
      g.moveTo(pa.x + cos * 18, pa.y + sin * 18);
      g.lineTo(pa.x + cos * 12 - sin * 4, pa.y + sin * 12 + cos * 4);
      g.lineTo(pa.x + cos * 12 + sin * 4, pa.y + sin * 12 - cos * 4);
      g.closePath();
      g.endFill();
      // Speed trails
      g.lineStyle(1, 0xAADDFF, 0.3);
      for (var sl = 0; sl < 3; sl++) {
        var perpOffset = (sl - 1) * 6;
        var trailStart = pa.x - cos * (20 + sl * 10) + sin * perpOffset;
        var trailStartY = pa.y - sin * (20 + sl * 10) - cos * perpOffset;
        g.moveTo(trailStart, trailStartY);
        g.lineTo(trailStart - cos * 15, trailStartY - sin * 15);
      }
    }
  };

  Renderer.prototype._renderFireExplosions = function(explosions) {
    if (!this._feGfx) {
      this._feGfx = new PIXI.Graphics();
      this._effectsContainer.addChild(this._feGfx);
    }
    this._feGfx.clear();
    if (!explosions || explosions.length === 0) return;

    var g = this._feGfx;
    for (var i = 0; i < explosions.length; i++) {
      var fe = explosions[i];
      var feAlpha = (1 - fe.progress) * 0.7;
      var feRadius = 70 * (0.3 + fe.progress * 0.7);
      g.beginFill(0xff4400, feAlpha);
      g.drawCircle(fe.x, fe.y, feRadius);
      g.endFill();
      g.beginFill(0xffaa00, feAlpha * 0.7);
      g.drawCircle(fe.x, fe.y, feRadius * 0.5);
      g.endFill();
    }
  };

  // === Weapon Effects ===

  Renderer.prototype._renderWeapons = function(visuals, camX, camY) {
    if (!this._weaponGfx) {
      this._weaponGfx = new PIXI.Graphics();
      this._weaponsContainer.addChild(this._weaponGfx);
    }
    this._weaponGfx.clear();
    var g = this._weaponGfx;

    // Orbiting shields
    var shields = visuals.shieldPositions;
    var shieldTex = this._textures['shield_icon'];
    if (shields.length > 0) {
      if (!this._shieldSprites) this._shieldSprites = [];
      for (var i = 0; i < shields.length; i++) {
        var s = shields[i];
        if (!this._isVisible(s.x, s.y, camX, camY, CULL_MARGIN)) continue;
        var sprite = this._getOrCreateSprite(this._shieldSprites, i, shieldTex, this._weaponsContainer);
        sprite.position.set(s.x, s.y);
        sprite.width = s.size;
        sprite.height = s.size;
        if (!shieldTex) sprite.tint = 0x44aaff;
        sprite.visible = true;
      }
      for (var j = shields.length; j < this._shieldSprites.length; j++) {
        this._shieldSprites[j].visible = false;
      }
    } else if (this._shieldSprites) {
      for (var k = 0; k < this._shieldSprites.length; k++) this._shieldSprites[k].visible = false;
    }

    // Nova expansion wave
    var nova = visuals.novaVisual;
    if (nova) {
      g.lineStyle(3, 0xFFC832, nova.alpha);
      g.drawCircle(nova.x, nova.y, nova.radius);
    }

    // Homing missiles
    var missiles = visuals.missiles;
    for (var mi = 0; mi < missiles.length; mi++) {
      var m = missiles[mi];
      if (!m.active) continue;
      if (!this._isVisible(m.x, m.y, camX, camY, CULL_MARGIN)) continue;
      // Trail
      for (var ti = 0; ti < m.trail.length; ti++) {
        var t = m.trail[ti];
        var trailAlpha = (ti + 1) / m.trail.length * 0.5;
        g.beginFill(0xff8844, trailAlpha);
        g.drawCircle(t.x, t.y, 3);
        g.endFill();
      }
      // Missile body
      g.beginFill(0xff4400);
      g.drawCircle(m.x, m.y, 6);
      g.endFill();
    }

    // Thunder bolt
    var thunder = visuals.thunderVisual;
    if (thunder) {
      var tx = thunder.x, ty = thunder.y;
      var topY = ty - 300;
      g.lineStyle(4, 0xFFFF88, 0.9);
      g.moveTo(tx, topY);
      for (var seg = 0; seg < 6; seg++) {
        var py = topY + (ty - topY) * ((seg + 1) / 7);
        var px = tx + (Math.random() - 0.5) * 30;
        g.lineTo(px, py);
      }
      g.lineTo(tx, ty);
      // Impact glow
      g.beginFill(0xFFFFC8, 0.6);
      g.drawCircle(tx, ty, 20);
      g.endFill();
    }

    // Chain lightning
    var chain = visuals.chainVisual;
    if (chain) {
      g.lineStyle(3, 0xffffff, 0.8);
      for (var ci = 0; ci < chain.segments.length; ci++) {
        var seg = chain.segments[ci];
        g.moveTo(seg.x1, seg.y1);
        var dx = seg.x2 - seg.x1, dy = seg.y2 - seg.y1;
        var steps = 5;
        for (var si = 1; si < steps; si++) {
          var tt = si / steps;
          var mx = seg.x1 + dx * tt + (Math.random() - 0.5) * 20;
          var my = seg.y1 + dy * tt + (Math.random() - 0.5) * 20;
          g.lineTo(mx, my);
        }
        g.lineTo(seg.x2, seg.y2);
        // Hit point glow
        g.lineStyle(0);
        g.beginFill(0xC8E6FF, 0.5);
        g.drawCircle(seg.x2, seg.y2, 10);
        g.endFill();
        g.lineStyle(3, 0xffffff, 0.8);
      }
    }
  };

  // === Level Up + Hardcore Effects ===

  Renderer.prototype._renderLevelUpEffect = function(effect, player) {
    if (!this._lvUpGfx) {
      this._lvUpGfx = new PIXI.Graphics();
      this._effectsContainer.addChild(this._lvUpGfx);
    }
    this._lvUpGfx.clear();
    var g = this._lvUpGfx;

    // Golden light pillar effect
    var progress = effect.progress || 0;
    var alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
    var radius = 30 + progress * 40;

    g.beginFill(0xFFDD44, alpha * 0.3);
    g.drawCircle(player.x, player.y, radius);
    g.endFill();
    g.beginFill(0xFFFFAA, alpha * 0.5);
    g.drawCircle(player.x, player.y, radius * 0.5);
    g.endFill();

    // Light rays (vertical lines)
    g.lineStyle(2, 0xFFDD44, alpha * 0.6);
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2 + progress * 2;
      var rx = player.x + Math.cos(angle) * radius * 0.7;
      var ry = player.y + Math.sin(angle) * radius * 0.7;
      g.moveTo(rx, ry - 20);
      g.lineTo(rx, ry + 20);
    }
  };

  Renderer.prototype._renderHardcoreVFX = function(vfx, level) {
    if (!this._hcGfx) {
      this._hcGfx = new PIXI.Graphics();
      this._hudContainer.addChild(this._hcGfx);
    }
    this._hcGfx.clear();
    var g = this._hcGfx;

    // Red vignette overlay
    var pulse = Math.sin(Date.now() / 500) * 0.1 + 0.15;
    var alpha = Math.min(0.3, pulse * level);

    // Draw border vignette
    g.beginFill(0xff0000, alpha);
    g.drawRect(0, 0, this.W, 8);
    g.drawRect(0, this.H - 8, this.W, 8);
    g.drawRect(0, 0, 8, this.H);
    g.drawRect(this.W - 8, 0, 8, this.H);
    g.endFill();
  };

  Renderer.prototype._renderBombFlash = function() {
    if (!this._bombFlashGfx) {
      this._bombFlashGfx = new PIXI.Graphics();
      this._hudContainer.addChild(this._bombFlashGfx);
    }
    this._bombFlashGfx.clear();
    this._bombFlashGfx.beginFill(0xffffff, 0.6);
    this._bombFlashGfx.drawRect(0, 0, this.W, this.H);
    this._bombFlashGfx.endFill();
  };

  SG.Renderer = Renderer;
})();
