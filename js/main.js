// main.js — Game 主類別，生命週期管理
(function() {
  window.SG = window.SG || {};

  var MAX_DT = 0.05;
  var MAX_ENEMIES = 30;
  var MAX_XP_GEMS = 50;
  var MAX_DAMAGE_NUMBERS = 20;
  var LOW_FPS_THRESHOLD = 20;
  var FPS_SAMPLE_INTERVAL = 1; // 每秒計算一次
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
      enemies: [{ level: 1, size: 36, color: '#ff4444', hp: 3, speed: 90, damage: 5 }],
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
    this._fpsFrames = 0;
    this._fpsTimer = 0;
    this._currentFps = 60;
    this._lowQuality = false;
    this.regenTimer = 0;
    this._damageNumbers = new SG.DamageNumbers();
    this._damageNumbers = new SG.DamageNumbers();
    this._magnetDelay = 0;
    this._magnetDelay = 0;
    this._magnetAllXP = false;

    // 綁定
    var self = this;
    this.input._onPause = function() { self._togglePause(); };
    this.input._onMute = function() {
      var enabled = self.audio.toggleMute();
      self.ui.updateMute(enabled);
    };
    this._resize();
    // 炸彈按鈕
    var bombBtn = document.getElementById("bomb-btn");
    var self2 = this;
    var doBomb = function(e) {
      if (e) e.preventDefault();
      if (!self2._bomb || !self2._bomb.ready) return;
      var killed = self2._bomb.activate(self2.enemies);
      for (var i = 0; i < killed.length; i++) self2._handleKill(killed[i]);
      self2.enemies = [];
    };
    bombBtn.onclick = doBomb;
    bombBtn.addEventListener("touchend", doBomb);
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

    this._selectedCharacter = null;
    this._archerAttack = null;
    this._passiveItems = new SG.PassiveItems();
    this._rushWave = new SG.RushWave();
    this._eliteSpawner = new SG.EliteSpawner(null);
    this._combo = new SG.ComboSystem();
    this._bomb = new SG.BombSystem();
    this.meta = new SG.MetaProgression();
    this._meleeAttack = null;
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
    // 載入近戰角色 sprite strips
    load('melee_sprite_idle', 'assets/strips/zero_idle_4f.png');
    load('melee_sprite_run', 'assets/strips/zero_run_8f.png');
    load('archer_sprite_idle', 'assets/strips/archer_idle_4f.png');
    load('archer_sprite_run', 'assets/strips/archer_run_8f.png');
    load('shield_icon', 'assets/shield_icon.png');
    // 載入各關卡背景圖
    (cfg.levels || []).forEach(function(lv, i) {
      if (lv.bgImage) load('level_bg_' + i, lv.bgImage);
    });
    Promise.all(promises).then(function() { self._start(); });
  };

  Game.prototype._start = function() {
    this.renderer.init(this.images, this.imgConfig);
    var self = this;
    // 顯示商店 → 角色選擇
    self._showMetaShop(function() {
      new SG.CharacterSelect(function(character) {
        self._selectedCharacter = character;
        self._initGame();
      });
    });
  };

  // 永久升級商店
  Game.prototype._showMetaShop = function(callback) {
    var self = this;
    var el = document.getElementById('meta-shop');
    var coins = this.meta.getCoins();
    if (coins === 0 && Object.keys(this.meta.upgrades).length === 0) { callback(); return; }
    el.innerHTML = '<h2 style="color:#ffcc00;">💰 永久升級商店</h2>' +
      '<p style="color:#ffcc00;">金幣: ' + coins + '</p><div id="meta-items"></div>' +
      '<button id="meta-start" style="margin-top:15px;padding:10px 25px;font-size:16px;background:#4444ff;border:none;color:#fff;border-radius:8px;cursor:pointer;">開始遊戲</button>';
    var itemsEl = document.getElementById('meta-items');
    var list = this.meta.getUpgradeList();
    for (var i = 0; i < list.length; i++) {
      (function(u) {
        var btn = document.createElement('button');
        btn.style.cssText = 'display:block;width:260px;margin:8px auto;padding:10px;background:rgba(30,30,60,0.95);border:1px solid #888;border-radius:8px;color:#fff;font-size:14px;cursor:pointer;';
        btn.textContent = u.name + ' [Lv' + u.level + '/' + u.maxLevel + '] - ' + (u.maxed ? 'MAX' : u.cost + '💰');
        btn.disabled = u.maxed || self.meta.getCoins() < u.cost;
        btn.onclick = function() { if (self.meta.buyUpgrade(u.id)) self._showMetaShop(callback); };
        itemsEl.appendChild(btn);
      })(list[i]);
    }
    document.getElementById('meta-start').onclick = function() { el.style.display = 'none'; callback(); };
    el.style.display = 'block';
  };

  Game.prototype._initGame = function() {
    var self = this;
    this.player = new SG.Player();
    this.player.attackType = this._selectedCharacter.attackType;
    this.meta.applyToPlayer(this.player);
    this._eliteSpawner = new SG.EliteSpawner(this.player);
    this._combo = new SG.ComboSystem();
    this._bomb = new SG.BombSystem();

    // 根據角色類型設定動畫
    if (this._selectedCharacter.id === 'melee') {
      var meleeCfg = { sprites: { idle: { file: 'assets/strips/zero_idle_4f.png', fps: 6 }, run: { file: 'assets/strips/zero_run_8f.png', fps: 10 } } };
      this.player.animator = this._buildAnimator('melee', meleeCfg);
      this.player.spriteDefaultRight = true;
      this._meleeAttack = new SG.MeleeAttack(this.player);
      this._archerAttack = null;
    this._passiveItems = new SG.PassiveItems();
    this._rushWave = new SG.RushWave();
    this._eliteSpawner = new SG.EliteSpawner(null);
    this._combo = new SG.ComboSystem();
    this._bomb = new SG.BombSystem();
    this.meta = new SG.MetaProgression();
    } else if (this._selectedCharacter.id === 'archer') {
      var archerCfg = { sprites: { idle: { file: 'assets/strips/archer_idle_4f.png', fps: 6 }, run: { file: 'assets/strips/archer_run_8f.png', fps: 10 } } };
      this.player.animator = this._buildAnimator('archer', archerCfg);
      this.player.spriteDefaultRight = true;
      this._archerAttack = new SG.ArcherAttack(this.player);
      this._meleeAttack = null;
    } else {
      this.player.animator = this._buildAnimator('player', this.imgConfig.player);
      this.player.spriteDefaultRight = true; // X4 面向右
      this.player.spriteWidthRatio = 0.75; // X4 較寬，縮窄顯示
      this._meleeAttack = null;
      this._archerAttack = null;
    this._passiveItems = new SG.PassiveItems();
    this._rushWave = new SG.RushWave();
    this._eliteSpawner = new SG.EliteSpawner(null);
    this._combo = new SG.ComboSystem();
    this._bomb = new SG.BombSystem();
    this.meta = new SG.MetaProgression();
    }

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
    this._damageNumbers = new SG.DamageNumbers();
    this._damageNumbers = new SG.DamageNumbers();
    this._magnetDelay = 0;
    this._magnetDelay = 0;
    this._magnetAllXP = false;

    // 設定初始關卡背景
    this._applyLevelBg();
    this.ui.updateLevelName(this.levelManager.getCurrent().name);
    this.audio.playAmbient(this.levelManager.getCurrent().name);

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
      // 從檔名解析 frames/cols/rows（config 中的 cols/rows 可覆蓋）
      var info = s.file ? SG.parseSpriteInfo(s.file) : { frames: 1, cols: 1, rows: 1 };
      animConfig[action] = {
        image: img,
        fps: s.fps || 8,
        frames: s.frames || info.frames,
        cols: s.cols || info.cols,
        rows: s.rows || info.rows
      };
    }
    if (!Object.keys(animConfig).length) return null;
    return new SG.SpriteAnimator(animConfig);
  };

  Game.prototype._loop = function(ts) {
    if (this.gameOver) return;
    var dt = Math.min((ts - this.lastTime) / 1000, MAX_DT);
    this.lastTime = ts;

    // FPS 監控 + 自動降質
    this._fpsFrames++;
    this._fpsTimer += dt;
    if (this._fpsTimer >= FPS_SAMPLE_INTERVAL) {
      this._currentFps = Math.round(this._fpsFrames / this._fpsTimer);
      this._fpsFrames = 0;
      this._fpsTimer = 0;
      this._lowQuality = this._currentFps < LOW_FPS_THRESHOLD;
    }

    if (!this.paused && !this.levelingUp && !this.levelClearing) {
      try { this._update(dt); } catch(err) { console.error('[Game] _update error:', err); }
    }
    this.renderer.render({
      player: this.player,
      enemies: this.enemies,
      bosses: this.bosses,
      projectiles: this.projectiles,
      particles: this.particles,
      xpGems: this.xpGems,
      weaponVisuals: this.weaponManager.getVisuals(),
      meleeVisual: this._meleeAttack ? this._meleeAttack.getVisual() : null,
      archerVisual: this._archerAttack ? this._archerAttack.getVisual() : null,
      explosiveVisual: this._archerAttack ? this._archerAttack.getExplosiveArrow().getVisual() : null,
      eliteVisuals: this._eliteSpawner.getVisuals(),
      piercingVisual: this._archerAttack ? this._archerAttack.getPiercingArrow().getVisual() : null,
      damageNumbers: this._damageNumbers,
      lowQuality: this._lowQuality,
      fps: this._currentFps,
      comboVisual: this._combo.getVisual(),
      bombFlash: this._bomb.isFlashing(),
      bombProgress: this._bomb.getProgress(),
      bombReady: this._bomb.ready,
      dt: dt
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
    this._damageNumbers = new SG.DamageNumbers();
    this._damageNumbers = new SG.DamageNumbers();
    this._magnetDelay = 0;
    this._magnetDelay = 0;
    this._magnetAllXP = false;
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

    // 自動射擊（遠程角色）/ 近戰斬擊（近戰角色）
    if (this.player.attackType === 'melee' && this._meleeAttack) {
      var meleeHits = this._meleeAttack.update(dt, this.enemies, this.bosses);
      for (var i = 0; i < meleeHits.length; i++) this._handleKill(meleeHits[i]);
      var mhits = this._meleeAttack.getLastHits();
      for (var i = 0; i < mhits.length; i++) if (!this._lowQuality) this._damageNumbers.add(mhits[i].x, mhits[i].y, mhits[i].dmg, false);
    } else if (this.player.attackType === 'archer' && this._archerAttack) {
      var archerHits = this._archerAttack.update(dt, this.enemies, this.bosses);
      if (this._archerAttack.didFire()) { this.audio.playArrowShoot(); this.player.triggerAttack(); }
      for (var i = 0; i < archerHits.length; i++) this._handleKill(archerHits[i]);
      var ahits = this._archerAttack.getLastHits();
      // 爆炸箭
      var ea = this._archerAttack.getExplosiveArrow();
      var eaHits = ea.update(dt, this.enemies, this.bosses);
      // 貫通箭
      var pa = this._archerAttack.getPiercingArrow();
      var paHits = pa.update(dt, this.enemies, this.bosses);
      for (var i = 0; i < paHits.length; i++) this._handleKill(paHits[i]);
      for (var i = 0; i < eaHits.length; i++) this._handleKill(eaHits[i]);
      for (var i = 0; i < ahits.length; i++) if (!this._lowQuality) this._damageNumbers.add(ahits[i].x, ahits[i].y, ahits[i].dmg, false);
    } else {
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
          var isCrit = this.player.critChance && Math.random() < this.player.critChance;
          if (isCrit) dmg *= 2;
          dmg = Math.round(dmg);
          e.hp -= dmg;
          if (!this._lowQuality) this._damageNumbers.add(e.x, e.y, dmg, isCrit);
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
      e.moveToward(this.player, dt);
      e.speed = origSpeed;
      e.updateAnimation(dt);
      if (SG.dist(this.player, e) < (PLAYER_HITBOX + e.size / 2)) {
        if (this._playerTakeDamage(e.damage, e)) return;
      }
    }

    // Boss 移動 + 碰撞
    for (var i = 0; i < this.bosses.length; i++) {
      var b = this.bosses[i];
      b.moveToward(this.player, dt);
      b.updateAnimation(dt);
      if (SG.dist(this.player, b) < (PLAYER_HITBOX + b.size / 2)) {
        if (this._playerTakeDamage(b.damage, b)) return;
      }
    }

    // XP 寶石數量限制（超出上限移除最遠的）
    while (this.xpGems.length > MAX_XP_GEMS) {
      var farthest = 0, farthestD = 0;
      for (var gi = 0; gi < this.xpGems.length; gi++) {
        var gd = SG.dist(this.player, this.xpGems[gi]);
        if (gd > farthestD) { farthestD = gd; farthest = gi; }
      }
      this.xpGemPool.release(this.xpGems[farthest]);
      this.xpGems.splice(farthest, 1);
    }
    // Boss 死亡延遲吸取
    if (this._magnetDelay > 0) {
      this._magnetDelay -= dt;
      if (this._magnetDelay <= 0) { this._magnetAllXP = true; this._magnetDelay = 0; }
    }
    var magnetRange = this._magnetAllXP ? 99999 : 0;
    for (var i = this.xpGems.length - 1; i >= 0; i--) {
      var g = this.xpGems[i];
      // Boss 擊敗時強制吸取所有寶石
      if (magnetRange) {
        var a = Math.atan2(this.player.y - g.y, this.player.x - g.x);
        g.x += Math.cos(a) * 480 * dt;
        g.y += Math.sin(a) * 480 * dt;
      }
      var result = g.update(this.player, dt);
      if (result === 'picked') {
        var xpVal = g.value * (this.player.xpMultiplier || 1) * this._combo.getXPMultiplier();
        var leveled = this.player.addXP(xpVal);
        this.xpGemPool.release(g);
        this.xpGems.splice(i, 1);
        this.audio.playPickup();
        if (leveled && !this.levelingUp) this._showLevelUp();
      }
    }
    // 全部吸完後關閉磁鐵
    if (this._magnetAllXP && this.xpGems.length === 0) this._magnetAllXP = false;

    // 粒子
    for (var i = this.particles.length - 1; i >= 0; i--) {
      if (!this.particles[i].update(dt)) { this.particlePool.release(this.particles[i]); this.particles.splice(i, 1); }
    }

    // 波次
    var spawned = this.waveManager.updateWaves(dt, this.player, this.W, this.H, this.gameTime);
    for (var i = 0; i < spawned.length; i++) {
      spawned[i].animator = this._buildAnimator('enemy_' + spawned[i].cfgIdx, (this.imgConfig.enemies || [])[spawned[i].cfgIdx]);
      if (this.enemies.length < MAX_ENEMIES) this.enemies.push(spawned[i]);
    }

    // Boss 排程
    var bossResult = this.waveManager.updateBoss(dt, this.gameTime, this.player, this.W, this.H);
    // Rush Wave
    var rushEvent = this._rushWave.update(dt);
    if (rushEvent === "rush_start") {
      document.getElementById("rush-warning").style.display = "block";
    } else if (rushEvent === "rush_spawn") {
      var rushSpawned = this.waveManager.spawnRushWave(this._rushWave.getSpawnCount(), this.player, this.W, this.H, this.imgConfig);
      if (rushSpawned) for (var ri = 0; ri < rushSpawned.length; ri++) {
        rushSpawned[ri].animator = this._buildAnimator("enemy_" + rushSpawned[ri].cfgIdx, (this.imgConfig.enemies || [])[rushSpawned[ri].cfgIdx]);
        if (this.enemies.length < MAX_ENEMIES) this.enemies.push(rushSpawned[ri]);
      }
    } else if (rushEvent === "rush_end") {
      document.getElementById("rush-warning").style.display = "none";
      // Rush 獎勵：給予經驗但只觸發一次升級（避免多次 _showLevelUp 衝突）
      var rushLeveled = false;
      for (var rx = 0; rx < this._rushWave.getRewardXP(); rx++) {
        if (this.player.addXP(this.player.xpNeeded)) rushLeveled = true;
      }
      if (rushLeveled && !this.levelingUp) this._showLevelUp();
    } else if (!this._rushWave.active) {
      document.getElementById("rush-warning").style.display = "none";
    }
    // 精英怪 + 磁鐵道具
    var eliteResult = this._eliteSpawner.update(dt, this.W, this.H, this.imgConfig);
    if (eliteResult.elite && this.enemies.length < MAX_ENEMIES) {
      eliteResult.elite.animator = this._buildAnimator("enemy_" + eliteResult.elite.cfgIdx, (this.imgConfig.enemies || [])[eliteResult.elite.cfgIdx]);
      this.enemies.push(eliteResult.elite);
    }
    if (eliteResult.triggerLevelUp && !this.levelingUp) this._showLevelUp();
    // 磁鐵效果：吸取所有 XP
    if (this._eliteSpawner.isMagnetActive()) this._magnetAllXP = true;
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
    this._combo.update(dt);
    this._bomb.update(dt);
    this._damageNumbers.update(dt);
    this.ui.updateHUD(this.player, this.gameTime, this.kills);
    this.ui.updateSkillIcons(this.skillTree);
  };

  // 處理敵人/Boss 被殺死
  Game.prototype._handleKill = function(e) {
    var isBoss = e.type === 'boss';
    var pCount = isBoss ? BOSS_PARTICLE_COUNT : undefined;
    var parts = SG.Particle.spawn(e.x, e.y, e.color, pCount, this.particlePool);
    for (var k = 0; k < parts.length && this.particles.length < 100; k++) this.particles.push(parts[k]);

    if (isBoss) {
      for (var k = 0; k < BOSS_XP_DROP_COUNT; k++) {
        var gem = this.xpGemPool.get();
        gem.init(e.x + (Math.random() - 0.5) * BOSS_XP_SPREAD, e.y + (Math.random() - 0.5) * BOSS_XP_SPREAD, 1);
        this.xpGems.push(gem);
      }
      this._removeFrom(this.bosses, e);
      // Boss 擊敗特效：畫面震動 + 吸取所有經驗
      this.renderer.shake(0.5, 12);
      this._magnetDelay = 0.5;
    } else {
      var gem = this.xpGemPool.get();
      gem.init(e.x, e.y, 1);
      this.xpGems.push(gem);
      this._removeFrom(this.enemies, e);
      // 精英怪掉落寶箱
      if (e.isElite) this._eliteSpawner.onEliteKill(e.x, e.y);
    }
    this.kills++;
    this._combo.addKill();
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

  // 套用當前關卡的背景圖片/顏色
  Game.prototype._applyLevelBg = function() {
    var idx = this.levelManager.currentLevel;
    var bgImg = this.images['level_bg_' + idx];
    if (bgImg) {
      this.renderer.setBgImage(bgImg);
    } else {
      this.renderer.setBgImage(null);
      this.renderer.setBgColor(this.levelManager.getBgColor());
    }
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
      self._applyLevelBg();
      self.ui.updateLevelName(self.levelManager.getCurrent().name);
      self.audio.playAmbient(self.levelManager.getCurrent().name);
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
    if (this.levelingUp) return; // 防止重複觸發
    this.levelingUp = true;
    this.audio.playLevelUp();
    var self = this;
    this.ui.showLevelUp(this.player, this.weaponManager, this.skillTree, function() {
      self.levelingUp = false;
    }, this._meleeAttack, this._archerAttack, this._passiveItems);
  };

  Game.prototype._endGame = function() {
    this.gameOver = true;
    this.audio.stopBGM();
    var earned = this.meta.earnCoins(this.kills, this.gameTime);
    this.ui.showGameOver(this.gameTime, this.player.level, this.kills, this.leaderboard, earned, this.meta.getCoins());
  };

  SG.Game = Game;
})();
