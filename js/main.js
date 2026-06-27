// main.js — Game 主類別，生命週期管理
(function() {
  window.SG = window.SG || {};

  var MAX_DT = 0.05;
  var PLAYER_HITBOX = 20;
  var BOSS_XP_DROP_COUNT = 10;
  var BOSS_XP_SPREAD = 40;
  var BOSS_PARTICLE_COUNT = 20;
  var SPATIAL_HASH_CELL = 120;
  var COLLISION_QUERY_MARGIN = 80;
  var REGEN_INTERVAL = 1; // 生命回復間隔秒

  function Game() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.W = 0;
    this.H = 0;

    var cfg = window.GAME_CONFIG || null;
    this.imgConfig = cfg || {
      player: { size: 40 },
      enemies: [{ level: 1, size: 36, color: '#ff4444', hp: 3, speed: 1.5, damage: 5 }],
      bosses: [],
      projectile: { color: '#ffff00', size: 12 },
      xpGem: { color: '#00ff88' },
      background: { color: '#1a1a2e' }
    };

    this.images = {};
    this.renderer = new SG.Renderer(this.canvas, this.ctx);
    this.input = new SG.InputManager();
    this.ui = new SG.UI();
    this.audio = new SG.AudioManager(cfg);
    this.leaderboard = new SG.Leaderboard();

    // 空間雜湊 + 物件池
    this.spatialHash = new SG.SpatialHash(SPATIAL_HASH_CELL);
    this.projectilePool = new SG.ObjectPool(function() { return new SG.Projectile(); });
    this.particlePool = new SG.ObjectPool(function() { return new SG.Particle(); });
    this.xpGemPool = new SG.ObjectPool(function() { return new SG.XPGem(); });

    // 遊戲狀態
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.xpGems = [];
    this.bosses = [];
    this.waveManager = null;
    this.weaponManager = null;
    this.skillTree = null;
    this.levelManager = null;
    this.gameTime = 0;
    this.kills = 0;
    this.paused = false;
    this.gameOver = false;
    this.levelingUp = false;
    this.levelClearing = false;
    this.lastTime = 0;
    this.regenTimer = 0;

    // 綁定
    var self = this;
    this.input._onPause = function() { self._togglePause(); };
    this.input._onMute = function() {
      var enabled = self.audio.toggleMute();
      self.ui.updateMute(enabled);
    };
    this._resize();
    window.addEventListener('resize', function() { self._resize(); });

    // 首次互動解鎖音頻 + 播放 BGM
    var unlockAudio = function() {
      self.audio.resume();
      self.audio.playBGM();
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    this._loadImages();
  }

  Game.prototype._resize = function() {
    this.W = this.canvas.width = window.innerWidth;
    this.H = this.canvas.height = window.innerHeight;
    this.renderer.onResize(this.W, this.H);
  };

  Game.prototype._togglePause = function() {
    this.paused = !this.paused;
    this.ui.togglePause(this.paused);
    if (this.paused) this.audio.pauseBGM();
    else this.audio.resumeBGM();
  };

  Game.prototype._loadImages = function() {
    var self = this;
    var cfg = window.GAME_CONFIG;
    if (!cfg) { this._start(); return; }
    var promises = [];
    var load = function(key, src) {
      if (!src) return;
      promises.push(new Promise(function(r) {
        var img = new Image();
        img.onload = function() { self.images[key] = img; r(); };
        img.onerror = function() { r(); };
        img.src = src;
      }));
    };
    load('player', cfg.player && cfg.player.image);
    // 載入玩家 sprite strips
    if (cfg.player && cfg.player.sprites) {
      for (var action in cfg.player.sprites) {
        load('player_sprite_' + action, cfg.player.sprites[action].file);
      }
    }
    (cfg.enemies || []).forEach(function(e, i) {
      load('enemy_' + i, e.image);
      if (e.sprites) {
        for (var action in e.sprites) {
          load('enemy_' + i + '_sprite_' + action, e.sprites[action].file);
        }
      }
    });
    (cfg.bosses || []).forEach(function(b, i) {
      load('boss_' + i, b.image);
      if (b.sprites) {
        for (var action in b.sprites) {
          load('boss_' + i + '_sprite_' + action, b.sprites[action].file);
        }
      }
    });
    load('projectile', cfg.projectile && cfg.projectile.image);
    load('xpGem', cfg.xpGem && cfg.xpGem.image);
    load('background', cfg.background && cfg.background.image);
    Promise.all(promises).then(function() { self._start(); });
  };

  Game.prototype._start = function() {
    this.renderer.init(this.images, this.imgConfig);
    this.player = new SG.Player();
    // 建立玩家動畫器
    this.player.animator = this._buildAnimator('player', this.imgConfig.player);
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.xpGems = [];
    this.bosses = [];
    this.waveManager = new SG.WaveManager(this.imgConfig);
    this.weaponManager = new SG.WeaponManager(this.player);
    this.skillTree = new SG.SkillTree();
    this.levelManager = new SG.LevelManager(this.imgConfig);
    this.gameTime = 0;
    this.kills = 0;
    this.paused = false;
    this.gameOver = false;
    this.levelingUp = false;
    this.levelClearing = false;
    this.regenTimer = 0;

    // 設定初始關卡背景
    this.renderer.setBgColor(this.levelManager.getBgColor());
    this.ui.updateLevelName(this.levelManager.getCurrent().name);

    var self = this;
    requestAnimationFrame(function(ts) { self.lastTime = ts; self._loop(ts); });
  };

  // 從 config sprites 欄位建立 SpriteAnimator（若無 sprites 欄位回傳 null）
  Game.prototype._buildAnimator = function(prefix, cfg) {
    if (!cfg || !cfg.sprites) return null;
    var animConfig = {};
    for (var action in cfg.sprites) {
      var s = cfg.sprites[action];
      var img = this.images[prefix + '_sprite_' + action];
      if (!img) continue;
      animConfig[action] = {
        image: img,
        fps: s.fps || 8,
        frames: SG.parseFrameCount(s.file)
      };
    }
    if (!Object.keys(animConfig).length) return null;
    return new SG.SpriteAnimator(animConfig);
  };

  Game.prototype._loop = function(ts) {
    if (this.gameOver) return;
    var dt = Math.min((ts - this.lastTime) / 1000, MAX_DT);
    this.lastTime = ts;

    if (!this.paused && !this.levelingUp && !this.levelClearing) this._update(dt);
    this.renderer.render({
      player: this.player,
      enemies: this.enemies,
      bosses: this.bosses,
      projectiles: this.projectiles,
      particles: this.particles,
      xpGems: this.xpGems,
      weaponVisuals: this.weaponManager.getVisuals()
    });

    var self = this;
    requestAnimationFrame(function(ts2) { self._loop(ts2); });
  };

  Game.prototype._update = function(dt) {
    var self = this;
    this.gameTime += dt;

    // 生命回復（被動技能）
    if (this.player.regen) {
      this.regenTimer += dt;
      if (this.regenTimer >= REGEN_INTERVAL) {
        this.regenTimer = 0;
        this.player.hp = Math.min(this.player.hp + this.player.regen, this.player.maxHp);
      }
    }

    // 玩家移動
    var dir = this.input.getDirection();
    this.player.move(dir, dt);
    this.player.updateAnimation(dt);

    // 空間雜湊
    this.spatialHash.clear();
    for (var i = 0; i < this.enemies.length; i++) this.spatialHash.insert(this.enemies[i]);
    for (var i = 0; i < this.bosses.length; i++) this.spatialHash.insert(this.bosses[i]);

    // 自動射擊
    this.player.fireTimer -= dt;
    if (this.player.fireTimer <= 0) {
      var allTargets = this.enemies.concat(this.bosses).sort(function(a, b) {
        return SG.dist(self.player, a) - SG.dist(self.player, b);
      });
      if (allTargets.length) {
        var bullets = SG.Projectile.fireAtTargets(this.player, allTargets, this.projectilePool);
        for (var i = 0; i < bullets.length; i++) this.projectiles.push(bullets[i]);
        this.player.triggerAttack();
        this.audio.playShoot();
      }
    }

    // 子彈碰撞
    var pSize = (this.imgConfig.projectile && this.imgConfig.projectile.size) || 12;
    for (var i = this.projectiles.length - 1; i >= 0; i--) {
      var p = this.projectiles[i];
      if (!p.update(dt)) { this.projectilePool.release(p); this.projectiles.splice(i, 1); continue; }
      var hit = false;
      var nearby = this.spatialHash.query(p.x, p.y, pSize / 2 + COLLISION_QUERY_MARGIN);
      for (var j = 0; j < nearby.length; j++) {
        var e = nearby[j];
        if (e.hp <= 0) continue;
        if (SG.dist(p, e) < (e.size / 2 + pSize / 2)) {
          // 暴擊判定
          var dmg = p.damage * (this.player.damageMultiplier || 1);
          if (this.player.critChance && Math.random() < this.player.critChance) dmg *= 2;
          e.hp -= dmg;
          hit = true;
          if (e.hp <= 0) this._handleKill(e);
          break;
        }
      }
      if (hit) { this.projectilePool.release(p); this.projectiles.splice(i, 1); }
    }

    // 武器系統更新
    var weaponKills = this.weaponManager.update(dt, this.enemies, this.bosses);
    for (var i = 0; i < weaponKills.length; i++) this._handleKill(weaponKills[i]);

    // 敵人移動 + 碰撞
    var speedMult = this.levelManager.getEnemySpeedMult();
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      // 套用關卡速度倍率
      var origSpeed = e.speed;
      e.speed *= speedMult;
      e.moveToward(this.player);
      e.speed = origSpeed;
      e.updateAnimation(dt);
      if (SG.dist(this.player, e) < (PLAYER_HITBOX + e.size / 2)) {
        if (this._playerTakeDamage(e.damage, e)) return;
      }
    }

    // Boss 移動 + 碰撞
    for (var i = 0; i < this.bosses.length; i++) {
      var b = this.bosses[i];
      b.moveToward(this.player);
      b.updateAnimation(dt);
      if (SG.dist(this.player, b) < (PLAYER_HITBOX + b.size / 2)) {
        if (this._playerTakeDamage(b.damage, b)) return;
      }
    }

    // XP 寶石
    for (var i = this.xpGems.length - 1; i >= 0; i--) {
      var g = this.xpGems[i];
      var result = g.update(this.player);
      if (result === 'picked') {
        var xpVal = g.value * (this.player.xpMultiplier || 1);
        var leveled = this.player.addXP(xpVal);
        this.xpGemPool.release(g);
        this.xpGems.splice(i, 1);
        this.audio.playPickup();
        if (leveled) this._showLevelUp();
      }
    }

    // 粒子
    for (var i = this.particles.length - 1; i >= 0; i--) {
      if (!this.particles[i].update(dt)) { this.particlePool.release(this.particles[i]); this.particles.splice(i, 1); }
    }

    // 波次
    var spawned = this.waveManager.updateWaves(dt, this.player, this.W, this.H, this.gameTime);
    for (var i = 0; i < spawned.length; i++) {
      spawned[i].animator = this._buildAnimator('enemy_' + spawned[i].cfgIdx, (this.imgConfig.enemies || [])[spawned[i].cfgIdx]);
      this.enemies.push(spawned[i]);
    }

    // Boss 排程
    var bossResult = this.waveManager.updateBoss(dt, this.gameTime, this.player, this.W, this.H);
    if (bossResult.showWarning) { this.ui.showBossWarning(); this.audio.playBossWarning(); }
    if (bossResult.hideWarning) this.ui.hideBossWarning();
    if (bossResult.boss) {
      bossResult.boss.animator = this._buildAnimator('boss_' + bossResult.boss.cfgIdx, (this.imgConfig.bosses || [])[bossResult.boss.cfgIdx]);
      this.bosses.push(bossResult.boss);
    }
    if (this.waveManager.isWarning()) this.ui.updateBossWarningOpacity(this.gameTime);

    // 關卡系統
    var levelEvent = this.levelManager.update(dt, this.bosses.length);
    if (levelEvent === 'level_clear') this._onLevelClear();

    // 無敵 + HUD
    this.player.updateInvuln(dt);
    this.ui.updateHUD(this.player, this.gameTime, this.kills);
    this.ui.updateSkillIcons(this.skillTree);
  };

  // 處理敵人/Boss 被殺死
  Game.prototype._handleKill = function(e) {
    var isBoss = e.type === 'boss';
    var pCount = isBoss ? BOSS_PARTICLE_COUNT : undefined;
    var parts = SG.Particle.spawn(e.x, e.y, e.color, pCount, this.particlePool);
    for (var k = 0; k < parts.length; k++) this.particles.push(parts[k]);

    if (isBoss) {
      for (var k = 0; k < BOSS_XP_DROP_COUNT; k++) {
        var gem = this.xpGemPool.get();
        gem.init(e.x + (Math.random() - 0.5) * BOSS_XP_SPREAD, e.y + (Math.random() - 0.5) * BOSS_XP_SPREAD, 1);
        this.xpGems.push(gem);
      }
      this._removeFrom(this.bosses, e);
    } else {
      var gem = this.xpGemPool.get();
      gem.init(e.x, e.y, 1);
      this.xpGems.push(gem);
      this._removeFrom(this.enemies, e);
    }
    this.kills++;
    this.audio.playEnemyDeath();
  };

  // 玩家受傷（含護甲、閃避、反射）
  Game.prototype._playerTakeDamage = function(damage, attacker) {
    if (this.player.dodgeChance && Math.random() < this.player.dodgeChance) return false;
    var finalDmg = Math.max(1, damage - (this.player.armor || 0));
    var dead = this.player.takeDamage(finalDmg);
    if (dead) { this._endGame(); return true; }
    this.audio.playHurt();
    // 傷害反射
    if (this.player.reflect && attacker && attacker.hp > 0) {
      attacker.hp -= this.player.reflect;
      if (attacker.hp <= 0) this._handleKill(attacker);
    }
    return false;
  };

  Game.prototype._onLevelClear = function() {
    var self = this;
    this.levelClearing = true;
    var levelName = this.levelManager.getCurrent().name;

    if (!this.levelManager.nextLevel()) {
      // 全通關
      this.ui.showAllClear(this.gameTime, this.player.level, this.kills);
      this.gameOver = true;
      this.leaderboard.addEntry(this.kills, this.player.level, this.gameTime);
      return;
    }

    this.ui.showLevelClear(levelName, function() {
      self.levelClearing = false;
      self.renderer.setBgColor(self.levelManager.getBgColor());
      self.ui.updateLevelName(self.levelManager.getCurrent().name);
      // 清場
      self.enemies = [];
      self.bosses = [];
      self.waveManager = new SG.WaveManager(self.imgConfig);
    });
  };

  Game.prototype._removeFrom = function(arr, obj) {
    var idx = arr.indexOf(obj);
    if (idx !== -1) arr.splice(idx, 1);
  };

  Game.prototype._showLevelUp = function() {
    this.levelingUp = true;
    this.audio.playLevelUp();
    var self = this;
    this.ui.showLevelUp(this.player, this.weaponManager, this.skillTree, function() {
      self.levelingUp = false;
    });
  };

  Game.prototype._endGame = function() {
    this.gameOver = true;
    this.audio.stopBGM();
    this.ui.showGameOver(this.gameTime, this.player.level, this.kills, this.leaderboard);
  };

  SG.Game = Game;
})();
