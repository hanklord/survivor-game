// main.js — Game 主類別，生命週期管理
(function() {
  window.SG = window.SG || {};

  var MAX_DT = 0.05;
  var MAX_ENEMIES = 120;
  var TARGET_ENEMY_COUNT = 60; // 場上目標怪物數量（擊殺即補充）
  var MAX_XP_GEMS = 50;
  var MAX_DAMAGE_NUMBERS = 20;
  var LOW_FPS_THRESHOLD = 20;
  var FPS_SAMPLE_INTERVAL = 1; // 每秒計算一次
  var PLAYER_HITBOX = 20;
  var BOSS_XP_DROP_COUNT = 10;
  var BOSS_XP_SPREAD = 40;
  var BOSS_PARTICLE_COUNT = 20;
  var SPATIAL_HASH_CELL = 120;
  var COLLISION_QUERY_MARGIN = 250;
  var REGEN_INTERVAL = 1; // 生命回復間隔秒
  var HEAL_SPAWN_INTERVAL_MIN = 15;
  var HEAL_SPAWN_INTERVAL_MAX = 20;
  var HEAL_PICKUP_DURATION = 10;    // 存在 10 秒
  var HEAL_PICKUP_MAX = 3;          // 場上最多 3 個
  var HEAL_AMOUNT = 0.25;           // 回復 25% maxHp
  var HEAL_PICKUP_RADIUS = 20;      // 碰撞半徑

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
    this._legacy = new SG.LegacySystem();
    this.achievements = new SG.AchievementSystem();
    this._dailyChallenge = new SG.DailyChallenge();
    SG._dailyChallenge = this._dailyChallenge;

    // 空間雜湊 + 物件池
    this.spatialHash = new SG.SpatialHash(SPATIAL_HASH_CELL);
    this.projectilePool = new SG.ObjectPool(function() { return new SG.Projectile(); });
    this.particlePool = new SG.ObjectPool(function() { return new SG.Particle(); });
    this.xpGemPool = new SG.ObjectPool(function() { return new SG.XPGem(); });

    // 遊戲狀態
    this.player = null;
    // DH-1: player remains the controlled hero for legacy systems; heroes holds all entities.
    this.heroes = [];
    this.activeHeroIndex = 0;
    this.dualHeroMode = false;
    this._secondaryCharacter = null;
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
    this.hardcoreLevel = 0; // Hardcore 輪數（0=普通）
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
    this._levelUpEffect = new SG.LevelUpEffect();
    this._levelUpPending = false;
    this._hardcoreVFX = new SG.HardcoreVFX();

    // 綁定
    var self = this;
    this.input._onPause = function() { self._togglePause(); };
    this.input._onMute = function() {
      var enabled = self.audio.toggleMute();
      self.ui.updateMute(enabled);
    };
    this.input._onSkipLevel = function() { self._debugSkipLevel(); };
    this.input._onDebugLevelUp = function() { self._debugLevelUp(); };
    this.input._onSwapHero = function() { self._swapHero(); };
    this.input._onUltimate = function() {
      if (!self._ultimateReady || self.gameOver || self.paused) return;
      var killed = self._ultimate.activate(self.enemies, self.bosses);
      for (var i = 0; i < killed.length; i++) self._handleKill(killed[i]);
      self._ultimateCharge = 0;
      self._ultimateReady = false;
      self._ultimateFlash = 0.3;
    };
    this._resize();
    // 絕招：點擊角色施放（集氣滿時）
    var self2 = this;
    this._ultimateCharge = 0;
    this._ultimateReady = false;
    this._ultimateFlash = 0;
    this._ultimateKillsNeeded = 30;
    this._heroSwapCooldown = 0;
    this._levelKills = 0; // 本關擊殺數（用於 Boss 觸發）
    this._bossesSpawnedThisLevel = 0; // 本關已生成 Boss 數
    var doUltimate = function(e) {
      if (!self2._ultimateReady || self2.gameOver || self2.paused) return;
      // 檢查點擊位置是否在角色附近
      var rect = self2.canvas.getBoundingClientRect();
      var cx = (e.clientX - rect.left) * (self2.W / rect.width);
      var cy = (e.clientY - rect.top) * (self2.H / rect.height);
      // 轉為世界座標
      var camX = self2.player.x - self2.W / 2;
      var camY = self2.player.y - self2.H / 2;
      var wx = cx + camX, wy = cy + camY;
      var dist = Math.sqrt((wx - self2.player.x) * (wx - self2.player.x) + (wy - self2.player.y) * (wy - self2.player.y));
      if (dist < 60) {
        // 施放絕招
        var killed = self2._ultimate.activate(self2.enemies, self2.bosses);
        for (var i = 0; i < killed.length; i++) self2._handleKill(killed[i]);
        self2._ultimateCharge = 0;
        self2._ultimateReady = false;
        self2._ultimateFlash = 0.3;
      }
    };
    this.canvas.addEventListener('click', doUltimate);
    this.canvas.addEventListener('touchend', function(e) {
      if (e.changedTouches && e.changedTouches[0]) {
        doUltimate({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY });
      }
    });
    var swapBtn = document.getElementById('swap-hero-btn');
    if (swapBtn) swapBtn.addEventListener('click', function() { self._swapHero(); });
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

    // 設定按鈕
    this._setupSettings();

    this._selectedCharacter = null;
    this.endlessMode = false;
    this._archerAttack = null;
    this._valkyrieAttack = null;
    this._boomerangAttack = null;
    this._ninjaAttack = null;
    this._amazonAttack = null;
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
    // 9:16 直屏比例
    var screenW = window.innerWidth;
    var screenH = window.innerHeight;
    var targetW = Math.min(screenW, Math.floor(screenH * 9 / 16));
    var targetH = Math.floor(targetW * 16 / 9);
    if (targetH > screenH) {
      targetH = screenH;
      targetW = Math.floor(targetH * 9 / 16);
    }
    this.W = this.canvas.width = targetW;
    this.H = this.canvas.height = targetH;
    var left = Math.floor((screenW - targetW) / 2);
    var top = Math.floor((screenH - targetH) / 2);
    // Canvas 居中
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = left + 'px';
    this.canvas.style.top = top + 'px';
    // UI 容器同步
    var container = document.getElementById('game-container');
    if (container) {
      container.style.left = left + 'px';
      container.style.top = top + 'px';
      container.style.width = targetW + 'px';
      container.style.height = targetH + 'px';
    }
    // bg-canvas
    var bgCanvas = document.getElementById('bg-canvas');
    if (bgCanvas) {
      bgCanvas.width = targetW;
      bgCanvas.height = targetH;
      bgCanvas.style.position = 'absolute';
      bgCanvas.style.left = left + 'px';
      bgCanvas.style.top = top + 'px';
    }
    this.renderer.onResize(this.W, this.H);
  };

  Game.prototype._togglePause = function() {
    this.paused = !this.paused;
    this.ui.togglePause(this.paused);
    if (this.paused) this.audio.pauseBGM();
    else this.audio.resumeBGM();
  };

  // 除錯：按 N 跳關
  // Boss 生成：基於擊殺數（20 隻出 Boss1，50 隻出 Boss2）
  Game.prototype._checkBossSpawn = function() {
    if (this.endlessMode) return;
    var indices = this.levelManager.getBossIndices();
    if (this._bossesSpawnedThisLevel >= 2 || indices.length < 2) return;

    var threshold1 = 20, threshold2 = 50;
    if (this._levelKills >= threshold1 && this._bossesSpawnedThisLevel === 0) {
      this._spawnBoss(indices[0]);
      this._bossesSpawnedThisLevel = 1;
      console.log('[Boss] Spawned boss 1 at', this._levelKills, 'kills');
    }
    if (this._levelKills >= threshold2 && this._bossesSpawnedThisLevel === 1) {
      this._spawnBoss(indices[1]);
      this._bossesSpawnedThisLevel = 2;
      console.log('[Boss] Spawned boss 2 at', this._levelKills, 'kills');
    }
  };

  Game.prototype._spawnBoss = function(bossIdx) {
    var boss = SG.Boss.spawn(bossIdx, this.imgConfig, this.player, this.W, this.H);
    if (!boss) return;
    boss.animator = this._buildAnimator('boss_' + boss.cfgIdx, (this.imgConfig.bosses || [])[boss.cfgIdx]);
    this._applyAABB(boss, 'boss_' + boss.cfgIdx);
    this._applySpawnDifficulty(boss);
    this.bosses.push(boss);
    this.ui.showBossWarning();
    this.audio.playBossWarning();
    var self = this;
    setTimeout(function() { self.ui.hideBossWarning(); }, 3000);
  };

  Game.prototype._debugSkipLevel = function() {
    if (this.gameOver || this.levelClearing) return;
    // 清除所有 Boss 並設定擊殺數為 2 觸發過關
    this.bosses = [];
    this.levelManager.bossKills = 2;
    console.log('[DEBUG] Skip level → next');
  };

  // 除錯：按 L 立即升一級
  Game.prototype._debugLevelUp = function() {
    if (this.gameOver || this.levelingUp || this._levelUpPending) return;
    this.player.level++;
    this.player.xpNeeded = 5 + this.player.level * 3;
    console.log('[DEBUG] Level up → Lv.' + this.player.level);
    this._showLevelUp();
  };

  Game.prototype._setupSettings = function() {
    var self = this;
    var btn = document.getElementById('settings-btn');
    var menu = document.getElementById('settings-menu');
    var bgmCheck = document.getElementById('set-bgm');
    var sfxCheck = document.getElementById('set-sfx');
    var resumeBtn = document.getElementById('set-resume');

    // 讀取 localStorage
    var savedBgm = localStorage.getItem('survivor_bgm');
    var savedSfx = localStorage.getItem('survivor_sfx');
    if (savedBgm === 'off') { bgmCheck.checked = false; }
    if (savedSfx === 'off') { sfxCheck.checked = false; this.audio.enabled = false; }

    btn.onclick = function() {
      self.paused = true;
      menu.style.display = 'flex';
    };

    resumeBtn.onclick = function() {
      menu.style.display = 'none';
      self.paused = false;
      self.audio.resumeBGM();
    };

    // 返回選單（重新載入頁面回到角色選擇）
    var backBtn = document.getElementById('set-back-menu');
    if (backBtn) {
      backBtn.onclick = function() {
        window.location.reload();
      };
    }

    bgmCheck.onchange = function() {
      if (bgmCheck.checked) {
        localStorage.setItem('survivor_bgm', 'on');
        self.audio.resumeBGM();
      } else {
        localStorage.setItem('survivor_bgm', 'off');
        self.audio.pauseBGM();
      }
    };

    sfxCheck.onchange = function() {
      if (sfxCheck.checked) {
        localStorage.setItem('survivor_sfx', 'on');
        self.audio.enabled = true;
      } else {
        localStorage.setItem('survivor_sfx', 'off');
        self.audio.enabled = false;
      }
    };

    // Hitbox 開關
    var hitboxCheck = document.getElementById('set-hitbox');
    var savedHitbox = localStorage.getItem('survivor_hitbox');
    window.DEBUG_SHOW_HITBOX = savedHitbox === 'on';
    if (hitboxCheck) {
      hitboxCheck.checked = window.DEBUG_SHOW_HITBOX;
      hitboxCheck.onchange = function() {
        window.DEBUG_SHOW_HITBOX = hitboxCheck.checked;
        localStorage.setItem('survivor_hitbox', hitboxCheck.checked ? 'on' : 'off');
      };
    }

    // Auto-Play 開關（設定頁 checkbox + 快捷按鈕）
    var autoCheck = document.getElementById('set-autoplay');
    var autoBtn = document.getElementById('autoplay-btn');
    var autoIcon = document.getElementById('autoplay-icon');
    var savedAuto = localStorage.getItem('sg_autoplay') === 'true';
    if (autoCheck) autoCheck.checked = savedAuto;
    if (savedAuto) localStorage.setItem('survivor_autoplay', 'on');
    function updateLegacyUI() {
      var d = self._legacy.data;
      document.getElementById('legacy-hp').textContent = 'HP 加成: +' + d.hpPercent.toFixed(1) + '%';
      document.getElementById('legacy-atk').textContent = 'ATK 加成: +' + d.atkPercent.toFixed(1) + '%';
      document.getElementById('legacy-deaths').textContent = '死亡次數: ' + d.totalDeaths;
      document.getElementById('legacy-stage').textContent = '最高關卡: 第 ' + d.highestStage + ' 關';
    }
    updateLegacyUI();
    document.getElementById('legacy-reset').onclick = function() {
      if (confirm('確定要重置所有永久成長嗎？此操作不可恢復。')) {
        self._legacy.reset();
        updateLegacyUI();
      }
    };
    var achievementsBtn = document.getElementById('achievements-btn');
    if (achievementsBtn) achievementsBtn.onclick = function() { self.ui.renderAchievements(self.achievements); };
    // The shortcut is intentionally hidden in the markup until the game has
    // initialized its settings handlers. Make it visible once the icon and
    // click handler are ready so a valid image cannot be hidden by display:none.
    if (autoBtn) autoBtn.style.display = 'block';

    function updateAutoIcon(enabled) {
      if (autoIcon) {
        if (enabled) {
          autoIcon.style.filter = 'invert(1) sepia(1) saturate(5) hue-rotate(15deg)';
          autoIcon.style.animation = 'autoSpin 2.5s linear infinite';
        } else {
          autoIcon.style.filter = 'invert(1)';
          autoIcon.style.animation = 'none';
        }
      }
      if (autoBtn) autoBtn.style.borderColor = enabled ? '#ffcc00' : '#666';
    }

    updateAutoIcon(savedAuto);

    if (autoCheck) {
      autoCheck.onchange = function() {
        if (self._autoPlay) self._autoPlay.setEnabled(autoCheck.checked);
        updateAutoIcon(autoCheck.checked);
      };
    }
    if (autoBtn) {
      autoBtn.onclick = function() {
        if (self._autoPlay) {
          var val = self._autoPlay.toggle();
          updateAutoIcon(val);
          if (autoCheck) autoCheck.checked = val;
        }
      };
    }
    // 存 game instance 引用供 UI 層查詢
    SG._gameInstance = this;
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
    load('melee_sprite_idle', 'assets/strips/dark_knight_idle_5f.png');
    load('melee_sprite_run', 'assets/strips/dark_knight_walk_8f.png');
    load('archer_sprite_idle', 'assets/strips/archer_idle_4f.png');
    load('archer_sprite_run', 'assets/strips/archer_run_8f.png');
    load('knight_sprite_idle', 'assets/strips/golden_knight_idle_4f.png');
    load('knight_sprite_run', 'assets/strips/golden_knight_run_8f.png');
    load('valkyrie_sprite_idle', 'assets/strips/valkyrie_idle_6f.png');
    load('valkyrie_sprite_run', 'assets/strips/valkyrie_run_6f.png');
    load('boomerang_sprite_idle', 'assets/strips/boomerang_idle_8f.png');
    load('boomerang_sprite_run', 'assets/strips/boomerang_run_8f.png');
    load('shuriken', 'assets/strips/shuriken.png');
    load('ninja_sprite_idle', 'assets/strips/ninja_idle_8f.png');
    load('ninja_sprite_run', 'assets/strips/ninja_run_8f.png');
    load('amazon_sprite_idle', 'assets/strips/amazon_idle_8f.png');
    load('amazon_sprite_run', 'assets/strips/amazon_run_8f.png');
    load('spear_attack', 'assets/strips/spear_attack.png');
    load('fire_zone', 'assets/strips/fire_zone_8f.png');
    load('chest_img', 'assets/chest.png');
    load('magnet_img', 'assets/magnet.png');
    load('shield_icon', 'assets/shield_orbit.png');
    load('slash_effect', 'assets/strips/slash_effect_4f.png');
    load('wings_lv10', 'assets/accessories/wings_lv10.png');
    // 載入各關卡背景圖
    (cfg.levels || []).forEach(function(lv, i) {
      if (lv.bgImage) load('level_bg_' + i, lv.bgImage);
    });
    // Tilemap tile 列表（第一關草地用）
    this._tileFiles = [];
    for (var ti = 0; ti < 82; ti++) {
      var num = String(ti).padStart(3, '0');
      this._tileFiles.push('assets/tiles/grass/tile_' + num + '.png');
    }
    Promise.all(promises).then(function() { self._start(); });
  };

  Game.prototype._start = function() {
    this.renderer.init(this.images, this.imgConfig);
    var self = this;
    // 顯示商店 → 角色選擇
    self._showMetaShop(function() {
      new SG.CharacterSelect(function(selection) {
        self.dualHeroMode = !!(selection && selection.dualHero);
        self._selectedCharacter = self.dualHeroMode ? selection.primary : selection;
        self._secondaryCharacter = self.dualHeroMode ? selection.secondary : null;
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
    if (localStorage.getItem('survivor_autoplay') === 'on') {
      setTimeout(function() {
        var startBtn = document.getElementById('meta-start');
        if (startBtn) startBtn.click();
      }, 1000);
    }
  };

  Game.prototype._initGame = function() {
    var self = this;
    this.player = new SG.Player();
    this.heroes = [];
    this.activeHeroIndex = 0;
    this.dualHeroMode = !!(window.DUAL_HERO_ENABLED && this.dualHeroMode && this._secondaryCharacter);
    this._relics = [];
    this._relicChoosing = false;
    this._relicOfferQueued = false;
    this.endlessMode = localStorage.getItem('survivor_gameMode') === 'endless';
    this._endlessRamp = 0;
    this._endlessTimer = 0;
    this._endlessBossTimer = 90 + Math.random() * 30;
    this._randomEvents = new SG.RandomEvents(this);
    this.player.attackType = this._selectedCharacter.attackType;
    this.player.scale = this._selectedCharacter.scale || 1.0;
    this.player.hitboxRadius = this._selectedCharacter.hitboxRadius || PLAYER_HITBOX;
    this.player.critChance = this._selectedCharacter.baseCritRate || 0;
    if (this._dailyChallenge.active) {
      for (var dci = 0; dci < this._dailyChallenge.conditions.length; dci++) {
        var dc = this._dailyChallenge.conditions[dci];
        if (dc.id === 'glass_cannon') this.player.maxHp = this.player.hp = Math.round(this.player.maxHp * 0.5);
        if (dc.id === 'no_levelup') this._eventBlockLevelUp = true;
        if (dc.id === 'swarm') TARGET_ENEMY_COUNT = Math.min(240, TARGET_ENEMY_COUNT * 2);
      }
    }
    this.meta.applyToPlayer(this.player);
    this._eliteSpawner = new SG.EliteSpawner(this.player);
    this._combo = new SG.ComboSystem();
    this._bomb = new SG.BombSystem();
    this._bossProjectiles = new SG.BossProjectileSystem();
    this._autoPlay = new SG.AutoPlay(this.spatialHash, this.player);
    this._subHeroAI = null;

    // 根據角色類型設定動畫
    if (this._selectedCharacter.id === 'melee') {
      var meleeCfg = { sprites: { idle: { file: 'assets/strips/dark_knight_idle_5f.png', fps: 8 }, run: { file: 'assets/strips/dark_knight_walk_8f.png', fps: 10 } } };
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
    } else if (this._selectedCharacter.id === 'knight') {
      var knightCfg = { sprites: { idle: { file: 'assets/strips/golden_knight_idle_4f.png', fps: 6 }, run: { file: 'assets/strips/golden_knight_run_8f.png', fps: 10 } } };
      this.player.animator = this._buildAnimator('knight', knightCfg);
      this.player.spriteDefaultRight = true;
      this.player.maxHp = 150; this.player.hp = 150; // 坦克高血量
      this.player.speed *= 0.85; // 移速稍慢
      this._meleeAttack = new SG.MeleeAttack(this.player);
      this._meleeAttack.damage = Math.round(this._meleeAttack.damage * 2.5); // 騎士攻擊力 ×2.5
      this._archerAttack = null;
    } else if (this._selectedCharacter.id === 'valkyrie') {
      var valkCfg = { sprites: { idle: { file: 'assets/strips/valkyrie_idle_6f.png', fps: 8 }, run: { file: 'assets/strips/valkyrie_run_6f.png', fps: 10 } } };
      this.player.animator = this._buildAnimator('valkyrie', valkCfg);
      this.player.spriteDefaultRight = true;
      this._valkyrieAttack = new SG.ValkyrieAttack(this.player);
      this._meleeAttack = null;
      this._archerAttack = null;
    } else if (this._selectedCharacter.id === 'archer') {
      var archerCfg = { sprites: { idle: { file: 'assets/strips/archer_idle_4f.png', fps: 6 }, run: { file: 'assets/strips/archer_run_8f.png', fps: 10 } } };
      this.player.animator = this._buildAnimator('archer', archerCfg);
      this.player.spriteDefaultRight = true;
      this._archerAttack = new SG.ArcherAttack(this.player);
      this._meleeAttack = null;
    } else if (this._selectedCharacter.id === 'ninja') {
      var ninjaCfg = { sprites: { idle: { file: 'assets/strips/ninja_idle_8f.png', fps: 6 }, run: { file: 'assets/strips/ninja_run_8f.png', fps: 10 } } };
      this.player.animator = this._buildAnimator('ninja', ninjaCfg);
      this.player.spriteDefaultRight = true;
      this._boomerangAttack = new SG.BoomerangAttack(this.player);
      this._meleeAttack = null;
      this._archerAttack = null;
    } else if (this._selectedCharacter.id === 'amazon') {
      var amazonCfg = { sprites: { idle: { file: 'assets/strips/amazon_idle_8f.png', fps: 6 }, run: { file: 'assets/strips/amazon_run_8f.png', fps: 10 } } };
      this.player.animator = this._buildAnimator('amazon', amazonCfg);
      this.player.spriteDefaultRight = true;
      this.player.spriteWidthRatio = 0.667; // 160:240 原始比例
      this._amazonAttack = new SG.AmazonAttack(this.player);
      this._meleeAttack = null;
      this._archerAttack = null;
    } else {
      this.player.animator = this._buildAnimator('player', this.imgConfig.player);
      this.player.spriteDefaultRight = true; // 法師面向右
      this._meleeAttack = null;
      this._archerAttack = null;
    this._passiveItems = new SG.PassiveItems();
    this._rushWave = new SG.RushWave();
    this._eliteSpawner = new SG.EliteSpawner(null);
    this._combo = new SG.ComboSystem();
    this._bomb = new SG.BombSystem();
    this.meta = new SG.MetaProgression();
    }

    this._trait = SG.getTrait(this._selectedCharacter.id);
    this.player._trait = this._trait;
    if (this._trait && this._trait.init) this._trait.init(this.player);

    var legacyMult = this._legacy.getMultipliers();
    this.player.maxHp = Math.round(this.player.maxHp * legacyMult.hp);
    this.player.hp = this.player.maxHp;
    this.player.damage = Math.round(this.player.damage * legacyMult.atk);

    // 角色專屬大招
    this.player._ultimate = new SG.UltimateSystem(this.player);
    var ultTypes = { ranged: 'mage_explosion', archer: 'archer_arrowrain', melee: 'knight_dash', valkyrie: 'valkyrie_radial', boomerang: 'ninja_spiral', amazon: 'amazon_arc' };
    this.player._ultimate.type = ultTypes[this.player.attackType] || 'mage_explosion';
    this._ultimate = this.player._ultimate;

    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.xpGems = [];
    this.bosses = [];
    this._healPickups = [];
    this._healSpawnTimer = HEAL_SPAWN_INTERVAL_MIN + Math.random() * (HEAL_SPAWN_INTERVAL_MAX - HEAL_SPAWN_INTERVAL_MIN);
    this.waveManager = new SG.WaveManager(this.imgConfig);
    this.weaponManager = new SG.WeaponManager(this.player);
    this.skillTree = new SG.SkillTree();
    this.player.skillTree = this.skillTree;
    this.player.passiveItems = this._passiveItems;
    this.player.weaponManager = this.weaponManager;
    this.player._attacks = {
      melee: this._meleeAttack,
      valkyrie: this._valkyrieAttack,
      archer: this._archerAttack,
      boomerang: this._boomerangAttack,
      amazon: this._amazonAttack
    };
    this._registerHero(this.player, this._selectedCharacter, 0, 'main');
    if (this.dualHeroMode) {
      var subHero = this._createSubHero(this._secondaryCharacter);
      subHero.invincible = true;
      this._subHeroAI = new SG.SubHeroAI(subHero, this.spatialHash);
      this._applyHeroSynergy();
    }
    this._setActiveHero(0);
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

    // 初始化 tilemap 生成器
    this._tilemap = new SG.TilemapGenerator();

    // 設定初始關卡背景
    this._applyLevelBg();
    this.ui.updateLevelName(this._getLevelDisplayName());
    this.audio.playAmbient(this.levelManager.getCurrent().name);
    // 切換到關卡 BGM（從角色選擇 BGM 切出）
    var startBgm = this.levelManager.getCurrent().bgm || 'assets/audio/bgm.mp3';
    this.audio.switchBGM(startBgm);

    // 預計算所有敵人/Boss sprite 的 AABB
    this._precomputeAABB();

    // 初始填充怪物到目標數量
    this._fillEnemies();

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

  // DH-1 hero records keep per-hero progression objects independent.  Existing code
  // continues to use this.player, which is always the currently controlled hero.
  Game.prototype._registerHero = function(hero, character, slot, role) {
    hero.characterId = character.id;
    hero.heroSlot = slot;
    hero.role = role;
    hero.isActive = slot === this.activeHeroIndex;
    hero.invincible = false;
    hero.character = character;
    hero._attacks = hero._attacks || {};
    this.heroes[slot] = hero;
    return hero;
  };

  // DH-1 keeps the legacy this.player facade in sync for later DH-3 hero switching.
  Game.prototype._setActiveHero = function(index) {
    if (!this.heroes[index]) return false;
    for (var i = 0; i < this.heroes.length; i++) this.heroes[i].isActive = i === index;
    this.activeHeroIndex = index;
    this.player = this.heroes[index];
    this._ultimate = this.player._ultimate || null;
    return true;
  };

  Game.prototype._swapHero = function() {
    if (!this.dualHeroMode || this.heroes.length !== 2 || this._heroSwapCooldown > 0 || this.gameOver) return false;
    var outgoing = this.player;
    var incomingIndex = 1 - this.activeHeroIndex;
    var incoming = this.heroes[incomingIndex];
    // Update both flags before exposing the new active facade.
    outgoing.invincible = true;
    incoming.invincible = false;
    outgoing.role = 'sub';
    incoming.role = 'main';
    this._setActiveHero(incomingIndex);
    this._selectedCharacter = incoming.character;
    this._trait = incoming._trait;
    this.weaponManager = incoming.weaponManager;
    this.skillTree = incoming.skillTree;
    this._passiveItems = incoming.passiveItems;
    this._meleeAttack = incoming._attacks.melee || null;
    this._valkyrieAttack = incoming._attacks.valkyrie || null;
    this._archerAttack = incoming._attacks.archer || null;
    this._boomerangAttack = incoming._attacks.boomerang || null;
    this._amazonAttack = incoming._attacks.amazon || null;
    // Player-caching systems must follow the active hero too.
    if (this._autoPlay) this._autoPlay.player = incoming;
    if (this._eliteSpawner) this._eliteSpawner.player = incoming;
    this._subHeroAI = new SG.SubHeroAI(outgoing, this.spatialHash);
    this._heroSwapCooldown = 0.3;
    if (this.audio && this.audio.playPickup) this.audio.playPickup();
    if (this.ui) this.ui.showHeroSwap();
    return true;
  };

  Game.prototype._applyHeroSynergy = function() {
    if (!this.dualHeroMode || this.heroes.length !== 2 || !SG.getSynergy) return null;
    var synergy = SG.getSynergy(this.heroes[0].characterId, this.heroes[1].characterId);
    for (var i = 0; i < this.heroes.length; i++) {
      if (!this.heroes[i]._synergyApplied) {
        synergy.apply(this.heroes[i]);
        this.heroes[i]._synergyApplied = true;
      }
    }
    this._heroSynergy = synergy;
    if (this.ui) this.ui.showHeroSynergy(synergy);
    return synergy;
  };

  Game.prototype._createSubHero = function(character) {
    var hero = new SG.Player();
    hero.attackType = character.attackType;
    hero.scale = character.scale || 1;
    hero.hitboxRadius = character.hitboxRadius || PLAYER_HITBOX;
    hero.critChance = character.baseCritRate || 0;
    hero.x = this.player.x - 44;
    hero.y = this.player.y + 32;
    hero._attacks = {};
    this.meta.applyToPlayer(hero);

    if (character.id === 'knight') {
      hero.maxHp = hero.hp = 150;
      hero.speed *= 0.85;
      hero.animator = this._buildAnimator('knight', { sprites: { idle: { file: 'assets/strips/golden_knight_idle_4f.png', fps: 6 }, run: { file: 'assets/strips/golden_knight_run_8f.png', fps: 10 } } });
      hero.spriteDefaultRight = true;
      hero._attacks.melee = new SG.MeleeAttack(hero);
      hero._attacks.melee.damage = Math.round(hero._attacks.melee.damage * 2.5);
    } else if (character.id === 'valkyrie') {
      hero.animator = this._buildAnimator('valkyrie', { sprites: { idle: { file: 'assets/strips/valkyrie_idle_6f.png', fps: 8 }, run: { file: 'assets/strips/valkyrie_run_6f.png', fps: 10 } } });
      hero.spriteDefaultRight = true;
      hero._attacks.valkyrie = new SG.ValkyrieAttack(hero);
    } else if (character.id === 'archer') {
      hero.animator = this._buildAnimator('archer', { sprites: { idle: { file: 'assets/strips/archer_idle_4f.png', fps: 6 }, run: { file: 'assets/strips/archer_run_8f.png', fps: 10 } } });
      hero.spriteDefaultRight = true;
      hero._attacks.archer = new SG.ArcherAttack(hero);
    } else if (character.id === 'ninja') {
      hero.animator = this._buildAnimator('ninja', { sprites: { idle: { file: 'assets/strips/ninja_idle_8f.png', fps: 6 }, run: { file: 'assets/strips/ninja_run_8f.png', fps: 10 } } });
      hero.spriteDefaultRight = true;
      hero._attacks.boomerang = new SG.BoomerangAttack(hero);
    } else if (character.id === 'amazon') {
      hero.animator = this._buildAnimator('amazon', { sprites: { idle: { file: 'assets/strips/amazon_idle_8f.png', fps: 6 }, run: { file: 'assets/strips/amazon_run_8f.png', fps: 10 } } });
      hero.spriteDefaultRight = true;
      hero.spriteWidthRatio = 0.667;
      hero._attacks.amazon = new SG.AmazonAttack(hero);
    } else if (character.id === 'melee') {
      hero.animator = this._buildAnimator('melee', { sprites: { idle: { file: 'assets/strips/dark_knight_idle_5f.png', fps: 8 }, run: { file: 'assets/strips/dark_knight_walk_8f.png', fps: 10 } } });
      hero.spriteDefaultRight = true;
      hero._attacks.melee = new SG.MeleeAttack(hero);
    } else {
      hero.animator = this._buildAnimator('player', this.imgConfig.player);
      hero.spriteDefaultRight = true;
    }
    hero._trait = SG.getTrait(character.id);
    if (hero._trait && hero._trait.init) hero._trait.init(hero);
    var legacyMult = this._legacy.getMultipliers();
    hero.maxHp = Math.round(hero.maxHp * legacyMult.hp);
    hero.hp = hero.maxHp;
    hero.damage = Math.round(hero.damage * legacyMult.atk);
    hero.skillTree = new SG.SkillTree();
    hero.passiveItems = new SG.PassiveItems();
    hero.weaponManager = new SG.WeaponManager(hero);
    hero._ultimate = new SG.UltimateSystem(hero);
    var ultTypes = { ranged: 'mage_explosion', archer: 'archer_arrowrain', melee: 'knight_dash', valkyrie: 'valkyrie_radial', boomerang: 'ninja_spiral', amazon: 'amazon_arc' };
    hero._ultimate.type = ultTypes[hero.attackType] || 'mage_explosion';
    return this._registerHero(hero, character, 1, 'sub');
  };

  Game.prototype._updateSubHeroAttacks = function(dt) {
    if (!this.dualHeroMode || this.heroes.length < 2) return;
    var hero = this.heroes[1 - this.activeHeroIndex];
    if (!hero || hero.hp <= 0) return;
    // DH-2: companions have their own movement/attacks, but never an ultimate activation.
    if (this._subHeroAI) hero.move(this._subHeroAI.update(dt, this.player, this.enemies, this.bosses), dt);
    if (hero._trait && hero._trait.onUpdate) hero._trait.onUpdate(dt, this, hero);
    hero.updateAnimation(dt);
    var attacks = hero._attacks;
    var hits = [];
    var speedMult = SG.getAttackSpeedMult(hero);
    if (attacks.valkyrie) hits = attacks.valkyrie.update(dt, this.enemies, this.bosses, speedMult);
    else if (attacks.melee) hits = attacks.melee.update(dt, this.enemies, this.bosses, speedMult);
    else if (attacks.archer) {
      hits = attacks.archer.update(dt, this.enemies, this.bosses, speedMult);
      if (attacks.archer.didFire()) hero.triggerAttack();
      var explosiveHits = attacks.archer.getExplosiveArrow().update(dt, this.enemies, this.bosses, speedMult);
      var piercingHits = attacks.archer.getPiercingArrow().update(dt, this.enemies, this.bosses, speedMult);
      hits = hits.concat(explosiveHits, piercingHits);
    } else if (attacks.boomerang) hits = attacks.boomerang.update(dt, this.enemies, this.bosses, speedMult);
    else if (attacks.amazon) hits = attacks.amazon.update(dt, this.enemies, this.bosses, speedMult);
    else {
      hero.fireTimer -= dt * speedMult;
      if (hero.fireTimer <= 0) {
        var targets = this.enemies.concat(this.bosses).sort(function(a, b) { return SG.dist(hero, a) - SG.dist(hero, b); });
        var bullets = SG.Projectile.fireAtTargets(hero, targets, this.projectilePool);
        for (var b = 0; b < bullets.length; b++) this.projectiles.push(bullets[b]);
        if (bullets.length) hero.triggerAttack();
      }
    }
    for (var i = 0; i < hits.length; i++) this._handleKill(hits[i], hero);
  };

  // Attack modules own their visual state. In dual mode, find the hero which
  // owns a module instead of reading only the active hero legacy references.
  Game.prototype._getHeroAttack = function(key) {
    for (var i = 0; i < this.heroes.length; i++) {
      var hero = this.heroes[i];
      if (hero && hero._attacks && hero._attacks[key]) return { hero: hero, attack: hero._attacks[key] };
    }
    return null;
  };

  // 預計算所有敵人/Boss sprite 的 AABB（基於輝度掃描）
  Game.prototype._precomputeAABB = function() {
    var enemies = this.imgConfig.enemies || [];
    for (var i = 0; i < enemies.length; i++) {
      var eCfg = enemies[i];
      var key = 'enemy_' + i;
      if (eCfg.sprites) {
        // 用第一個有圖片的動作做 strip AABB
        for (var action in eCfg.sprites) {
          var img = this.images[key + '_sprite_' + action];
          if (img && img.complete) {
            var info = SG.parseSpriteInfo(eCfg.sprites[action].file);
            SG.computeStripAABB(key, img, info.frames, info.cols, info.rows);
            break;
          }
        }
      } else if (this.images[key]) {
        SG.computeSpriteAABB(key, this.images[key]);
      }
    }
    var bosses = this.imgConfig.bosses || [];
    for (var i = 0; i < bosses.length; i++) {
      var bCfg = bosses[i];
      var key = 'boss_' + i;
      if (bCfg.sprites) {
        for (var action in bCfg.sprites) {
          var img = this.images[key + '_sprite_' + action];
          if (img && img.complete) {
            var info = SG.parseSpriteInfo(bCfg.sprites[action].file);
            SG.computeStripAABB(key, img, info.frames, info.cols, info.rows);
            break;
          }
        }
      } else if (this.images[key]) {
        SG.computeSpriteAABB(key, this.images[key]);
      }
    }
  };

  // 套用已預計算的 AABB 到實體
  Game.prototype._applyAABB = function(entity, key) {
    var extent = SG.getAABBHalfExtent(key, entity.size);
    entity._aabbHalfW = extent.halfW;
    entity._aabbHalfH = extent.halfH;
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

    if (!this.paused && !this.levelingUp && !this.levelClearing && !this._relicChoosing) {
      try { this._update(dt); } catch(err) { console.error('[Game] _update error:', err); }
    }
    // 聖光效果不受遊戲暫停影響，獨立更新
    this._levelUpEffect.update(dt);
    this._hardcoreVFX.update(dt);
    this.input.pollGamepad();
    if (this._ultimateFlash > 0) this._ultimateFlash = Math.max(0, this._ultimateFlash - dt);
    // 火球爆炸特效更新
    if (this._fireExplosions) {
      for (var fe = this._fireExplosions.length - 1; fe >= 0; fe--) {
        this._fireExplosions[fe].progress += dt / 0.35;
        if (this._fireExplosions[fe].progress >= 1) this._fireExplosions.splice(fe, 1);
      }
    }
    var renderMelee = this._getHeroAttack('melee');
    var renderValkyrie = this._getHeroAttack('valkyrie');
    var renderArcher = this._getHeroAttack('archer');
    var renderBoomerang = this._getHeroAttack('boomerang');
    var renderAmazon = this._getHeroAttack('amazon');
    this.renderer.render({
      player: this.player,
      heroes: this.heroes,
      enemies: this.enemies,
      bosses: this.bosses,
      projectiles: this.projectiles,
      particles: this.particles,
      xpGems: this.xpGems,
      healPickups: this._healPickups,
      tilemapCanvas: (this._tilemap && this._tilemap.ready) ? this._tilemap.getMapCanvas() : null,
      weaponVisuals: this.weaponManager.getVisuals(),
      meleeVisual: renderMelee ? renderMelee.attack.getVisual() : null,
      valkyrieVisual: renderValkyrie ? renderValkyrie.attack.getVisual() : null,
      meleeIsKnight: renderMelee && renderMelee.hero.characterId === 'knight',
      archerVisual: renderArcher ? renderArcher.attack.getVisual() : null,
      archerFireZones: renderArcher ? renderArcher.attack.getFireZones() : [],
      explosiveVisual: renderArcher ? renderArcher.attack.getExplosiveArrow().getVisual() : null,
      boomerangVisual: renderBoomerang ? renderBoomerang.attack.getVisual() : null,
      boomerangChainVisual: renderBoomerang ? renderBoomerang.attack.getChainVisual() : null,
      amazonVisual: renderAmazon ? renderAmazon.attack.getVisual() : null,
      eliteVisuals: this._eliteSpawner.getVisuals(),
      piercingVisual: renderArcher ? renderArcher.attack.getPiercingArrow().getVisual() : null,
      damageNumbers: this._damageNumbers,
      lowQuality: this._lowQuality,
      fps: this._currentFps,
      comboVisual: this._combo.getVisual(),
      bombFlash: this._bomb.isFlashing(),
      ultimateCharge: this._ultimateCharge,
      ultimateReady: this._ultimateReady,
      ultimateFlash: this._ultimateFlash,
      ultimateVisual: this._ultimate ? this._ultimate.getVisual() : null,
      fireExplosions: this._fireExplosions || [],
      activeBoss: this.bosses.length > 0 ? this.bosses[0] : null,
      bombProgress: this._bomb.getProgress(),
      bombReady: this._bomb.ready,
      levelUpEffect: this._levelUpEffect,
      hardcoreVFX: this._hardcoreVFX,
      hardcoreLevel: this.hardcoreLevel,
      bossProjectiles: this._bossProjectiles ? this._bossProjectiles.getVisual() : null,
      debugHitbox: window.DEBUG_SHOW_HITBOX,
      playerHitboxRadius: this.player.hitboxRadius,
      autoPlayActive: this._autoPlay && this._autoPlay.isActive(),
      randomEventVisual: this._randomEvents ? this._randomEvents.getVisual() : null,
      dt: dt
    });

    var self = this;
    requestAnimationFrame(function(ts2) { self._loop(ts2); });
  };

  Game.prototype._update = function(dt) {
    var self = this;
    this.gameTime += dt;
    if (this._heroSwapCooldown > 0) this._heroSwapCooldown = Math.max(0, this._heroSwapCooldown - dt);
    if (this._randomEvents) this._randomEvents.update(dt);
    if (this._trait && this._trait.onUpdate) this._trait.onUpdate(dt, this, this.player);
    if (this._relicOfferQueued && !this.levelingUp && !this._levelUpPending && !this.levelClearing) {
      this._relicOfferQueued = false;
      this._offerRelicChoice();
    }

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

    // 玩家移動（即時切換：有輸入=手動，無輸入=自動）
    var inputDir = this.input.getDirection();
    var hasInput = (inputDir.x !== 0 || inputDir.y !== 0);
    var moveDir = inputDir;
    if (this._autoPlay && this._autoPlay.isEnabled()) {
      var autoDir = this._autoPlay.update(dt, this.enemies, this.xpGems, this._healPickups, this.bosses, hasInput);
      if (!hasInput && autoDir) moveDir = autoDir;
    }
      if (this._eventSpeedMult) { moveDir = { x: moveDir.x * this._eventSpeedMult, y: moveDir.y * this._eventSpeedMult }; }
      this.player.move(moveDir, dt);
    // Auto-Play 智慧大招：150px 內 5+ 隻才放，10s fallback 降至 3 隻
    if (this._autoPlay && this._autoPlay.isActive() && this._ultimateReady && this._ultimate) {
      if (!this._autoUltTimer) this._autoUltTimer = 0;
      this._autoUltTimer += dt;
      var ultThreshold = this._autoUltTimer > 10 ? 3 : 5;
      var ultNearby = this.spatialHash.query(this.player.x, this.player.y, 150);
      var ultNearCount = 0;
      for (var ui = 0; ui < ultNearby.length; ui++) { if (ultNearby[ui].hp > 0) ultNearCount++; }
      if (ultNearCount >= ultThreshold) {
        var killed = this._ultimate.activate(this.enemies, this.bosses);
        for (var uk = 0; uk < killed.length; uk++) this._handleKill(killed[uk]);
        this._ultimateCharge = 0;
        this._ultimateReady = false;
        this._ultimateFlash = 0.3;
        this._autoUltTimer = 0;
      }
    }
    this.player.updateAnimation(dt);

    // 空間雜湊
    this.spatialHash.clear();
    for (var i = 0; i < this.enemies.length; i++) this.spatialHash.insert(this.enemies[i]);
    for (var i = 0; i < this.bosses.length; i++) this.spatialHash.insert(this.bosses[i]);

    // 自動射擊（遠程角色）/ 近戰斬擊（近戰角色）/ 女武神貫通
    if (this.player.attackType === 'valkyrie' && this._valkyrieAttack) {
      var valkHits = this._valkyrieAttack.update(dt, this.enemies, this.bosses, SG.getAttackSpeedMult(this.player));
      for (var i = 0; i < valkHits.length; i++) this._handleKill(valkHits[i]);
      var vhits = this._valkyrieAttack.getLastHits();
      for (var i = 0; i < vhits.length; i++) {
        if (!this._lowQuality) {
          var vc = !!vhits[i].isCrit;
          if (vc) this.renderer.shake(0.12, 4);
          this._damageNumbers.add(vhits[i].x, vhits[i].y, vhits[i].dmg, vc);
        }
      }
    } else if (this.player.attackType === 'melee' && this._meleeAttack) {
      var meleeHits = this._meleeAttack.update(dt, this.enemies, this.bosses, SG.getAttackSpeedMult(this.player));
      for (var i = 0; i < meleeHits.length; i++) this._handleKill(meleeHits[i]);
      var mhits = this._meleeAttack.getLastHits();
      for (var i = 0; i < mhits.length; i++) {
        if (!this._lowQuality) {
          var mc = !!mhits[i].isCrit;
          if (mc) this.renderer.shake(0.12, 4);
          this._damageNumbers.add(mhits[i].x, mhits[i].y, mhits[i].dmg, mc);
        }
      }
    } else if (this.player.attackType === 'archer' && this._archerAttack) {
      var archerHits = this._archerAttack.update(dt, this.enemies, this.bosses, SG.getAttackSpeedMult(this.player));
      if (this._archerAttack.didFire()) { this.audio.playArrowShoot(); this.player.triggerAttack(); }
      for (var i = 0; i < archerHits.length; i++) this._handleKill(archerHits[i]);
      var ahits = this._archerAttack.getLastHits();
      // 爆炸箭
      var ea = this._archerAttack.getExplosiveArrow();
      var eaHits = ea.update(dt, this.enemies, this.bosses, SG.getAttackSpeedMult(this.player));
      // 貫通箭
      var pa = this._archerAttack.getPiercingArrow();
      var paHits = pa.update(dt, this.enemies, this.bosses, SG.getAttackSpeedMult(this.player));
      for (var i = 0; i < paHits.length; i++) this._handleKill(paHits[i]);
      for (var i = 0; i < eaHits.length; i++) this._handleKill(eaHits[i]);
      for (var i = 0; i < ahits.length; i++) {
        if (!this._lowQuality) {
          var ac = !!ahits[i].isCrit;
          if (ac) this.renderer.shake(0.12, 4);
          this._damageNumbers.add(ahits[i].x, ahits[i].y, ahits[i].dmg, ac);
        }
      }
    } else if (this.player.attackType === 'boomerang' && this._boomerangAttack) {
      var boomHits = this._boomerangAttack.update(dt, this.enemies, this.bosses, SG.getAttackSpeedMult(this.player));
      for (var i = 0; i < boomHits.length; i++) this._handleKill(boomHits[i]);
      var bhits = this._boomerangAttack.getLastHits();
      for (var i = 0; i < bhits.length; i++) {
        if (!this._lowQuality) {
          var bc = !!bhits[i].isCrit;
          if (bc) this.renderer.shake(0.12, 4);
          this._damageNumbers.add(bhits[i].x, bhits[i].y, bhits[i].dmg, bc);
        }
      }
    } else if (this.player.attackType === 'amazon' && this._amazonAttack) {
      var amazonHits = this._amazonAttack.update(dt, this.enemies, this.bosses, SG.getAttackSpeedMult(this.player));
      for (var i = 0; i < amazonHits.length; i++) this._handleKill(amazonHits[i]);
      var amhits = this._amazonAttack.getLastHits();
      for (var i = 0; i < amhits.length; i++) {
        if (!this._lowQuality) {
          var amc = !!amhits[i].isCrit;
          if (amc) this.renderer.shake(0.12, 4);
          this._damageNumbers.add(amhits[i].x, amhits[i].y, amhits[i].dmg, amc);
        }
      }
    } else {
      this.player.fireTimer -= dt * SG.getAttackSpeedMult(this.player);
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

    // DH-1 secondary hero attacks are owner-bound and run alongside the active hero.
    this._updateSubHeroAttacks(dt);

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
        if (SG.aabbHit(p, pSize / 2, e, e.hitboxRadius)) {
          // 暴擊判定
          var projectileOwner = p.owner || this.player;
          var dmg = p.damage * (projectileOwner.damageMultiplier || 1) * (this._eventDamageMult || 1);
          dmg *= SG.getTraitDamageMult(projectileOwner, e);
          var isCrit = projectileOwner.critChance && Math.random() < projectileOwner.critChance;
          if (isCrit) { dmg *= 2; this.renderer.shake(0.12, 4); }
          dmg = Math.round(dmg);
          e.hp -= dmg;
          if (!this._lowQuality) this._damageNumbers.add(e.x, e.y, dmg, isCrit);
          hit = true;
          if (e.hp <= 0) this._handleKill(e, projectileOwner);
          // 法師 Lv13+：火球爆炸 AOE（40% 機率）
          if (projectileOwner.attackType === 'ranged' && projectileOwner.level >= 13 && Math.random() < 0.4) {
            var expRadius = 70;
            var expDmg = Math.round(dmg * 0.5);
            // 視覺
            if (!this._fireExplosions) this._fireExplosions = [];
            this._fireExplosions.push({ x: e.x, y: e.y, progress: 0 });
            // AOE 傷害
            var allTargets = this.enemies.concat(this.bosses);
            for (var ae = 0; ae < allTargets.length; ae++) {
              var at = allTargets[ae];
              if (at === e || at.hp <= 0) continue;
              if (SG.aabbHit(e, expRadius, at, at.hitboxRadius)) {
                at.hp -= expDmg;
                if (!this._lowQuality) this._damageNumbers.add(at.x, at.y, expDmg, false);
                if (at.hp <= 0) this._handleKill(at, projectileOwner);
              }
            }
          }
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
    if (this.endlessMode) speedMult *= this._getEndlessMultiplier();
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      // 套用關卡速度倍率
      var origSpeed = e.speed;
      e.speed *= speedMult;
      e.moveToward(this.player, dt);
      e.speed = origSpeed;
      e.updateAnimation(dt);
      if (SG.aabbHit(this.player, this.player.hitboxRadius, e, e.hitboxRadius)) {
        if (this._playerTakeDamage(e.damage, e)) return;
      }
    }

    // Boss 移動 + 碰撞
    for (var i = 0; i < this.bosses.length; i++) {
      var b = this.bosses[i];
      var originalBossSpeed = b.speed;
      if (this.endlessMode) b.speed *= this._getEndlessMultiplier();
      b.moveToward(this.player, dt);
      b.speed = originalBossSpeed;
      b.updateAnimation(dt);
      if (SG.aabbHit(this.player, this.player.hitboxRadius, b, b.hitboxRadius)) {
        if (this._playerTakeDamage(b.damage, b)) return;
      }
    }

    // Hardcore Boss 遠距離攻擊
    if (this.hardcoreLevel > 0 && this._bossProjectiles) {
      this._bossProjectiles.update(dt, this.bosses, this.player, this.hardcoreLevel);
      var bpDmg = this._bossProjectiles.getHits();
      if (bpDmg > 0) {
        if (this._playerTakeDamage(bpDmg, null)) return;
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
        if (leveled && !this.levelingUp && !this._levelUpPending) this._showLevelUp();
      }
    }
    // 全部吸完後關閉磁鐵
    if (this._magnetAllXP && this.xpGems.length === 0) this._magnetAllXP = false;

    // 粒子
    for (var i = this.particles.length - 1; i >= 0; i--) {
      if (!this.particles[i].update(dt)) { this.particlePool.release(this.particles[i]); this.particles.splice(i, 1); }
    }

    // 波次（作為加強波，補充超過 TARGET 的額外怪物）
    if (this.endlessMode) {
      this._endlessTimer += dt;
      while (this._endlessTimer >= 60) {
        this._endlessTimer -= 60;
        this._endlessRamp += 0.1;
      }
      this._endlessBossTimer -= dt;
      if (this._endlessBossTimer <= 0 && this.bosses.length === 0) {
        var endlessBosses = this.imgConfig.bosses || [];
        if (endlessBosses.length) this._spawnBoss(Math.floor(Math.random() * endlessBosses.length));
        this._endlessBossTimer = 90 + Math.random() * 30;
      }
    }

    var spawned = this.waveManager.updateWaves(dt, this.player, this.W, this.H, this.gameTime, this._getSpawnEnemyIndices());
    for (var i = 0; i < spawned.length; i++) {
      spawned[i].animator = this._buildAnimator('enemy_' + spawned[i].cfgIdx, (this.imgConfig.enemies || [])[spawned[i].cfgIdx]);
      this._applyAABB(spawned[i], 'enemy_' + spawned[i].cfgIdx);
      this._applySpawnDifficulty(spawned[i]);
      if (this.enemies.length < MAX_ENEMIES) this.enemies.push(spawned[i]);
    }

    // 安全清除：移除 HP <= 0 但未被正常清除的敵人
    for (var ci = this.enemies.length - 1; ci >= 0; ci--) {
      if (this.enemies[ci].hp <= 0) {
        this._handleKill(this.enemies[ci]);
      }
    }
    // 安全清除：Boss
    for (var cbi = this.bosses.length - 1; cbi >= 0; cbi--) {
      if (this.bosses[cbi].hp <= 0) {
        this._handleKill(this.bosses[cbi]);
      }
    }

    // 漸進補充：每 0.3~0.5 秒生成 2~4 隻
    if (!this._spawnTimer) this._spawnTimer = 0;
    this._spawnTimer -= dt;
    var targetEnemyCount = this._getTargetEnemyCount();
    if (this._spawnTimer <= 0 && this.enemies.length < targetEnemyCount) {
      var spawnCount = 2 + Math.floor(Math.random() * 3); // 2~4 隻
      for (var sp = 0; sp < spawnCount && this.enemies.length < targetEnemyCount; sp++) {
        this._spawnOneEnemy();
      }
      this._spawnTimer = 0.3 + Math.random() * 0.2; // 0.3~0.5 秒間隔
    }

    // 回血道具生成
    this._healSpawnTimer -= dt;
    if (this._healSpawnTimer <= 0 && this._healPickups.length < HEAL_PICKUP_MAX && !(this._dailyChallenge.active && this._dailyChallenge.conditions.some(function(c) { return c.id === 'no_heals'; }))) {
      var hAngle = Math.random() * Math.PI * 2;
      var hDist = 200 + Math.random() * 200;
      this._healPickups.push({
        x: this.player.x + Math.cos(hAngle) * hDist,
        y: this.player.y + Math.sin(hAngle) * hDist,
        life: HEAL_PICKUP_DURATION,
        bobTimer: 0
      });
      this._healSpawnTimer = HEAL_SPAWN_INTERVAL_MIN + Math.random() * (HEAL_SPAWN_INTERVAL_MAX - HEAL_SPAWN_INTERVAL_MIN);
    }

    // 回血道具更新（存活時間 + 碰撞檢測）
    for (var hi = this._healPickups.length - 1; hi >= 0; hi--) {
      var hp = this._healPickups[hi];
      hp.life -= dt;
      hp.bobTimer += dt;
      if (hp.life <= 0) { this._healPickups.splice(hi, 1); continue; }
      if (SG.aabbHit(this.player, this.player.hitboxRadius, hp, HEAL_PICKUP_RADIUS)) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * HEAL_AMOUNT);
        this._healPickups.splice(hi, 1);
        this.audio.playPickup();
      }
    }

    // Boss 排程（擊殺數觸發：20 隻出第一隻 Boss，50 隻出第二隻）
    this._checkBossSpawn();
    // Rush Wave
    var rushEvent = this._rushWave.update(dt);
    if (rushEvent === "rush_start") {
      document.getElementById("rush-warning").style.display = "block";
    } else if (rushEvent === "rush_spawn") {
      var rushSpawned = this.waveManager.spawnRushWave(this._rushWave.getSpawnCount(), this.player, this.W, this.H, this.imgConfig);
      if (rushSpawned) for (var ri = 0; ri < rushSpawned.length; ri++) {
        rushSpawned[ri].animator = this._buildAnimator("enemy_" + rushSpawned[ri].cfgIdx, (this.imgConfig.enemies || [])[rushSpawned[ri].cfgIdx]);
        this._applyAABB(rushSpawned[ri], 'enemy_' + rushSpawned[ri].cfgIdx);
        this._applySpawnDifficulty(rushSpawned[ri]);
        if (this.enemies.length < MAX_ENEMIES) this.enemies.push(rushSpawned[ri]);
      }
    } else if (rushEvent === "rush_end") {
      document.getElementById("rush-warning").style.display = "none";
      // Rush 獎勵：給予經驗但只觸發一次升級（避免多次 _showLevelUp 衝突）
      var rushLeveled = false;
      for (var rx = 0; rx < this._rushWave.getRewardXP(); rx++) {
        if (this.player.addXP(this.player.xpNeeded)) rushLeveled = true;
      }
      if (rushLeveled && !this.levelingUp && !this._levelUpPending) this._showLevelUp();
    } else if (!this._rushWave.active) {
      document.getElementById("rush-warning").style.display = "none";
    }
    // 精英怪 + 磁鐵道具
    var eliteResult = this._eliteSpawner.update(dt, this.W, this.H, this.imgConfig);
    if (eliteResult.elite && this.enemies.length < MAX_ENEMIES) {
      eliteResult.elite.animator = this._buildAnimator("enemy_" + eliteResult.elite.cfgIdx, (this.imgConfig.enemies || [])[eliteResult.elite.cfgIdx]);
      this._applyAABB(eliteResult.elite, 'enemy_' + eliteResult.elite.cfgIdx);
      this._applySpawnDifficulty(eliteResult.elite);
      this.enemies.push(eliteResult.elite);
    }
    if (eliteResult.triggerLevelUp && !this.levelingUp && !this._levelUpPending) this._showLevelUp();
    if (this._eliteSpawner.isMagnetActive()) this._magnetAllXP = true;

    // 關卡系統
    if (!this.endlessMode) {
      var levelEvent = this.levelManager.update(dt, this.bosses.length);
      if (levelEvent === 'level_clear') this._onLevelClear();
    }

    // 無敵 + HUD
    this.player.updateInvuln(dt);
    this._combo.update(dt);
    this._bomb.update(dt);
    // 角色專屬大招更新
    if (this._ultimate && this._ultimate.isActive()) {
      var ultHits = this._ultimate.update(dt, this.enemies, this.bosses);
      for (var ui = 0; ui < ultHits.length; ui++) this._handleKill(ultHits[ui]);
    }
    this._damageNumbers.update(dt);
    this.achievements.flushIfDue();
    this.ui.updateHUD(this.player, this.gameTime, this.kills, this.endlessMode ? { multiplier: this._getEndlessMultiplier() } : null,
      this.dualHeroMode ? { heroes: this.heroes, activeHeroIndex: this.activeHeroIndex } : null);
    this.ui.updateSkillIcons(this.skillTree, this._relics);
  };

  // 更新永久統計並一次性發放新解鎖的成就獎勵。
  Game.prototype._recordAchievementStats = function(mutator, options) {
    try {
      this.achievements.record(mutator);
      var checkNow = !options || !options.kill;
      if (options && options.kill) {
        this._achievementKillChecks = (this._achievementKillChecks || 0) + 1;
        checkNow = !!options.immediate || this._achievementKillChecks >= 25;
        if (checkNow) this._achievementKillChecks = 0;
      }
      var gained = checkNow ? this.achievements.checkUnlocks() : [];
      for (var i = 0; i < gained.length; i++) {
        this.meta.coins += gained[i].reward;
        this.meta._save();
        this.ui.showAchievementToast(gained[i], i * 3600);
      }
      if (checkNow) this.achievements.flush();
    } catch(e) {}
  };

  // Boss 擊敗後提供一次遺物三選一；升級流程中則排隊至選單關閉。
  Game.prototype._offerRelicChoice = function() {
    if (this._relicChoosing || !this._relics || this._relics.length >= 3) return;
    if (this.levelingUp || this._levelUpPending || this.levelClearing) {
      this._relicOfferQueued = true;
      return;
    }
    var choices = SG.getRelicChoices(this._relics, 3);
    if (!choices.length) return;
    var self = this;
    this._relicChoosing = true;
    this.ui.showRelicChoice(choices, function(relic) {
      if (relic) {
        relic.apply(self.player, self);
        self._relics.push(relic.id);
        self._recordAchievementStats(function(stats) { stats.relicsCollected = (stats.relicsCollected || 0) + 1; });
      }
      self._relicChoosing = false;
    });
  };

  // 處理敵人/Boss 被殺死
  Game.prototype._handleKill = function(e, owner) {
    owner = owner || this.player;
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
      this.levelManager.onBossKill(); // 追蹤 Boss 擊殺數
      // Boss 擊敗特效：畫面震動 + 吸取所有經驗
      this.renderer.shake(0.5, 12);
      this._magnetDelay = 0.5;
      this._offerRelicChoice();
    } else {
      var gem = this.xpGemPool.get();
      gem.init(e.x, e.y, 1);
      this.xpGems.push(gem);
      this._removeFrom(this.enemies, e);
      // 精英怪掉落寶箱
      if (e.isElite) this._eliteSpawner.onEliteKill(e.x, e.y);
    }
    this.kills++;
    if (owner._trait && owner._trait.onKill) owner._trait.onKill(owner);
    var characterId = owner.characterId || (this._selectedCharacter && this._selectedCharacter.id);
    this._recordAchievementStats(function(stats) {
      stats.totalKills = (stats.totalKills || 0) + 1;
      if (isBoss) stats.totalBossKills = (stats.totalBossKills || 0) + 1;
      if (characterId) { stats.charKills = stats.charKills || {}; stats.charKills[characterId] = (stats.charKills[characterId] || 0) + 1; }
    }, { kill: true, immediate: isBoss });
    if (owner._relicLifesteal) owner.hp = Math.min(owner.maxHp, owner.hp + owner.maxHp * owner._relicLifesteal);
    if (!isBoss) this._levelKills++;
    this._combo.addKill();
    this.audio.playEnemyDeath();
    // 絕招集氣
    if (this._ultimateCharge < 1) {
      this._ultimateCharge = Math.min(1, this._ultimateCharge + 1 / this._ultimateKillsNeeded);
      if (this._ultimateCharge >= 1) { this._ultimateReady = true; this._autoUltTimer = 0; }
    }
  };

  // 玩家受傷（含護甲、閃避、反射）
  Game.prototype._playerTakeDamage = function(damage, attacker, targetHero) {
    // All existing collision callers omit targetHero and therefore resolve to the active hero.
    // Keep this guard for future DH collision paths: the companion is invulnerable in DH-2.
    targetHero = targetHero || this.player;
    if (targetHero !== this.player || targetHero.invincible) return false;
    if (this.player.dodgeChance && Math.random() < this.player.dodgeChance) return false;
    var finalDmg = Math.max(1, (damage - (this.player.armor || 0)) * (this._eventDamageTakenMult || 1) * (this.player._relicDamageTakenMult || 1));
    var hpBefore = this.player.hp;
    var dead = this.player.takeDamage(finalDmg);
    if (dead) { this._endGame(); return true; }
    if (this.player.hp < hpBefore && this._trait && this._trait.onHit) this._trait.onHit(this.player);
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
    var self = this;
    var idx = this.levelManager.currentLevel;
    /* Tilemap 暫時停用（保留程式碼，未來可用於其他關卡）
    if (idx === 0 && this._tilemap && this._tileFiles && this._tileFiles.length > 0) {
      if (!this._tilemap.ready) {
        this._tilemap.loadTiles(this._tileFiles, function() {
          self.renderer.setTilemapCanvas(self._tilemap.getMapCanvas());
        });
      } else {
        this.renderer.setTilemapCanvas(this._tilemap.getMapCanvas());
      }
      return;
    }
    */
    // 使用原有背景
    this.renderer.setTilemapCanvas(null);
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
    // 通關回血
    var healAmount = this.player.maxHp * (window.LEVEL_CLEAR_HEAL_PERCENT || 0.5);
    this.player.hp = Math.min(this.player.hp + healAmount, this.player.maxHp);
    var levelName = this.levelManager.getCurrent().name;
    this._recordAchievementStats(function(stats) { stats.levelsCleared = (stats.levelsCleared || 0) + 1; });

    if (!this.levelManager.nextLevel()) {
      // 全通關 — 提供 Hardcore 選項
      var self = this;
      this.gameOver = true;
      var clearCharId = this._selectedCharacter && this._selectedCharacter.id;
      var clearTime = this.gameTime;
      var clearLevel = this.player.level;
      this._recordAchievementStats(function(stats) {
        stats.gamesCleared = (stats.gamesCleared || 0) + 1;
        stats.totalGames = (stats.totalGames || 0) + 1;
        stats.totalPlayTime = (stats.totalPlayTime || 0) + clearTime;
        stats.maxLevel = Math.max(stats.maxLevel || 0, clearLevel);
        if (clearCharId) { stats.charClears = stats.charClears || {}; stats.charClears[clearCharId] = (stats.charClears[clearCharId] || 0) + 1; }
      });
      this.leaderboard.addEntry(this.kills, this.player.level, this.gameTime);
      this.ui.showAllClear(this.gameTime, this.player.level, this.kills, this.hardcoreLevel, function() {
        self._startHardcore();
      });
      return;
    }

    this.ui.showLevelClear(levelName, function() {
      self.levelClearing = false;
      self._applyLevelBg();
      self.ui.updateLevelName(self._getLevelDisplayName());
      self.audio.playAmbient(self.levelManager.getCurrent().name);
      // 關卡專用 BGM（無指定時回到預設）
      var lvBgm = self.levelManager.getCurrent().bgm;
      self.audio.switchBGM(lvBgm || 'assets/audio/bgm.mp3');
      // 清場
      self.enemies = [];
      self.bosses = [];
      self._levelKills = 0;
      self._bossesSpawnedThisLevel = 0;
      if (self._bossProjectiles) self._bossProjectiles.reset();
      self.waveManager = new SG.WaveManager(self.imgConfig);
      // 新關卡填充怪物
      self._fillEnemies();
    });
  };

  // Hardcore 模式：保留角色進度，敵人 HP 累乘，從第一關重新開始
  Game.prototype._startHardcore = function() {
    this.hardcoreLevel++;
    var reachedHardcore = this.hardcoreLevel;
    this._recordAchievementStats(function(stats) { stats.hardcoreReached = Math.max(stats.hardcoreReached || 0, reachedHardcore); });
    this._hardcoreVFX.setActive(this.hardcoreLevel);
    this.gameOver = false;
    this.gameTime = 0;
    this.levelClearing = false;

    // 重置關卡（從第一關開始）
    this.levelManager = new SG.LevelManager(this.imgConfig);
    this.waveManager = new SG.WaveManager(this.imgConfig);
    this.enemies = [];
    this.bosses = [];
    this._levelKills = 0;
    this._bossesSpawnedThisLevel = 0;
    if (this._bossProjectiles) this._bossProjectiles.reset();

    // 套用背景
    this._applyLevelBg();
    this.ui.updateLevelName(this._getLevelDisplayName());
    this.audio.playAmbient(this.levelManager.getCurrent().name);
    var lvBgm = this.levelManager.getCurrent().bgm;
    this.audio.switchBGM(lvBgm || 'assets/audio/bgm.mp3');

    // 隱藏結算畫面
    if (this.ui.els.levelClear) this.ui.els.levelClear.style.display = 'none';

    // 填充怪物
    this._fillEnemies();

    // 繼續遊戲循環
    var self = this;
    requestAnimationFrame(function(ts) { self.lastTime = ts; self._loop(ts); });
  };

  // 取得當前 Hardcore HP 倍率
  Game.prototype.getHardcoreHPMult = function() {
    if (this.hardcoreLevel <= 0) return 1;
    return Math.pow(window.HARDCORE_HP_MULTIPLIER || 3.0, this.hardcoreLevel);
  };

  Game.prototype._getLevelDisplayName = function() {
    if (this.endlessMode) return '♾️ 無盡模式 — ' + this.levelManager.getCurrent().name;
    var name = this.levelManager.getCurrent().name;
    if (this.hardcoreLevel > 0) name += ' (Hardcore Lv.' + this.hardcoreLevel + ')';
    return name;
  };

  Game.prototype._removeFrom = function(arr, obj) {
    var idx = arr.indexOf(obj);
    if (idx !== -1) arr.splice(idx, 1);
  };

  // 在螢幕外生成一隻敵人（擊殺即補充用）
  Game.prototype._spawnOneEnemy = function() {
    if (this.enemies.length >= MAX_ENEMIES) return;
    var enemyIndices = this._getSpawnEnemyIndices();
    var pick = SG.Enemy.pickConfig(this.imgConfig, this.gameTime, enemyIndices);
    // 隨機在螢幕外 60~120px 處生成
    var angle = Math.random() * Math.PI * 2;
    var dist = Math.max(this.W, this.H) * 0.5 + 50 + Math.random() * 150;
    var x = this.player.x + Math.cos(angle) * dist;
    var y = this.player.y + Math.sin(angle) * dist;
    var enemy = new SG.Enemy(x, y, pick.cfg, pick.idx);
    if (this._dailyChallenge && this._dailyChallenge.active) {
      for (var fdi = 0; fdi < this._dailyChallenge.conditions.length; fdi++) {
        if (this._dailyChallenge.conditions[fdi].id === 'fast_enemies') enemy.speed *= 1.5;
      }
    }
    enemy.animator = this._buildAnimator('enemy_' + pick.idx, (this.imgConfig.enemies || [])[pick.idx]);
    this._applyAABB(enemy, 'enemy_' + pick.idx);
    this._applySpawnDifficulty(enemy);
    this.enemies.push(enemy);
  };

  Game.prototype._getEndlessMultiplier = function() {
    return 1 + (this._endlessRamp || 0);
  };

  Game.prototype._getSpawnEnemyIndices = function() {
    if (!this.endlessMode) return this.levelManager.getCurrent().enemyIndices;
    var count = Math.min((this.imgConfig.enemies || []).length, 3 + Math.floor(this.gameTime / 60));
    var indices = [];
    for (var i = 0; i < count; i++) indices.push(i);
    return indices;
  };

  Game.prototype._applySpawnDifficulty = function(entity) {
    var hpMult = this.getHardcoreHPMult();
    if (this.endlessMode) hpMult *= this._getEndlessMultiplier();
    if (this.dualHeroMode && entity.type === 'boss') hpMult *= (window.DUAL_HERO_BOSS_HP_MULT || 1.5);
    if (hpMult > 1) {
      entity.hp = Math.round(entity.hp * hpMult);
      entity.maxHp = entity.hp;
    }
  };

  // 填充到目標數量（開場/關卡切換用）
  Game.prototype._fillEnemies = function() {
    var targetEnemyCount = this._getTargetEnemyCount();
    while (this.enemies.length < targetEnemyCount) {
      this._spawnOneEnemy();
    }
  };

  Game.prototype._getTargetEnemyCount = function() {
    var multiplier = this.dualHeroMode ? (window.DUAL_HERO_ENEMY_MULT || 1.4) : 1;
    return Math.min(MAX_ENEMIES, Math.round(TARGET_ENEMY_COUNT * multiplier));
  };

  Game.prototype._showLevelUp = function() {
    if (this._levelUpPending) return;
    if (this._eventBlockLevelUp) return;
    var reachedLevel = this.player.level;
    this._recordAchievementStats(function(stats) { stats.maxLevel = Math.max(stats.maxLevel || 0, reachedLevel); });
    // Lv10 翅膀：以獨立倍率套用，與忍者疾風及局內移速升級可安全疊加。
    if (this.player.level >= 10 && !this.player._wingsApplied) {
      this.player._wingsApplied = true;
      this.player._wingBonusMult = 1.08;
    }
    this._levelUpPending = true;
    // 每升一級攻擊力 ×1.01
    this.player.damage *= 1.01;
    if (this._meleeAttack) this._meleeAttack.damage *= 1.01;
    if (this._valkyrieAttack) this._valkyrieAttack.damage *= 1.01;
    if (this._boomerangAttack) this._boomerangAttack.damage *= 1.01;

    if (this._amazonAttack) this._amazonAttack.damage *= 1.01;
    this.audio.playLevelUp();
    // 觸發聖光特效（遊戲不暫停，繼續跑）
    if (this._levelUpEffect) this._levelUpEffect.trigger(this.player.x, this.player.y, this.player);
    var self = this;
    // 聖光 1.3s + 間隔 0.2s 後才暫停並跳選單
    setTimeout(function() {
      self.levelingUp = true; // 此時才暫停遊戲
      self._levelUpPending = false;
      self.ui.showLevelUp(self.player, self.weaponManager, self.skillTree, function() {
        self.levelingUp = false;
      }, self._meleeAttack, self._archerAttack, self._passiveItems, self._valkyrieAttack, self._boomerangAttack, self._amazonAttack);
    }, 1500); // 1.3s + 0.2s
  };

  Game.prototype._endGame = function() {
    this.gameOver = true;
    this.audio.stopBGM();
    this._lastLegacyGain = this._legacy.onDeath(this.player.level, this.levelManager.currentLevel);
    if (this._dailyChallenge.active) {
      var dailyScore = this._dailyChallenge.getScore(this.gameTime, this.kills);
      this._dailyChallenge.saveScore(dailyScore, this._selectedCharacter.id, this.gameTime);
      this._dailyReward = Math.max(10, Math.round(dailyScore / 100));
    }
    var finalLevel = this.player.level;
    var finalTime = this.gameTime;
    var wasEndless = this.endlessMode;
    var finalRamp = this._endlessRamp || 0;
    var dailyActive = this._dailyChallenge.active;
    this._recordAchievementStats(function(stats) {
      stats.totalDeaths = (stats.totalDeaths || 0) + 1;
      stats.totalGames = (stats.totalGames || 0) + 1;
      stats.totalPlayTime = (stats.totalPlayTime || 0) + finalTime;
      stats.maxLevel = Math.max(stats.maxLevel || 0, finalLevel);
      if (wasEndless) { stats.maxSurvivalTime = Math.max(stats.maxSurvivalTime || 0, finalTime); stats.endlessMaxRamp = Math.max(stats.endlessMaxRamp || 0, finalRamp); }
      if (dailyActive) stats.dailyCompleted = (stats.dailyCompleted || 0) + 1;
    });
    var earned = this.meta.earnCoins(this.kills, this.gameTime);
    var endlessResult = null;
    if (this.endlessMode) {
      var rampLevel = Math.round((this._endlessRamp || 0) * 10);
      endlessResult = {
        rank: this.leaderboard.addEndlessEntry(this.gameTime, this.kills, rampLevel, this._selectedCharacter.id),
        multiplier: this._getEndlessMultiplier(),
        character: this._selectedCharacter.name
      };
    }
    this.ui.showGameOver(this.gameTime, this.player.level, this.kills, this.leaderboard, earned, this.meta.getCoins(), endlessResult);
  };

  SG.Game = Game;
})();
