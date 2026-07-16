// wave-manager.js — 波次管理與 Boss 排程
(function() {
  window.SG = window.SG || {};

  var WAVE_INTERVAL = 5; // 每 5 秒一波
  var BOSS_WARNING_TIME = 3; // Boss 預警秒數

  function WaveManager(imgConfig) {
    this.imgConfig = imgConfig;
    this.waveTimer = 0;
    this.wave = 0;
    this.bossWarning = null;
    this.spawnedBosses = {};
  }

  // 更新波次計時，回傳需要生成的敵人陣列
  WaveManager.prototype.updateWaves = function(dt, player, W, H, gameTime, enemyIndices) {
    var spawned = [];
    this.waveTimer += dt;
    if (this.waveTimer >= WAVE_INTERVAL) {
      this.waveTimer = 0;
      this.wave++;
      spawned = SG.Enemy.spawnWave(this.wave, player, W, H, this.imgConfig, gameTime, enemyIndices);
    }
    return spawned;
  };

  // 更新 Boss 排程，回傳 { boss: Boss|null, warning: boolean }
  WaveManager.prototype.updateBoss = function(dt, gameTime, player, W, H, bossIndices) {
    var result = { boss: null, showWarning: false, hideWarning: false };
    var bossConfigs = this.imgConfig.bosses || [];
    // 只生成當前關卡指定的 Boss
    var indices = bossIndices || [];

    // 檢查是否該顯示預警或直接生成
    for (var k = 0; k < indices.length; k++) {
      var i = indices[k];
      if (i >= bossConfigs.length) continue;
      var bc = bossConfigs[i];
      if (this.spawnedBosses[i] || this.bossWarning) continue;
      if (gameTime >= bc.spawnTime - BOSS_WARNING_TIME && gameTime < bc.spawnTime) {
        // 正常預警窗口
        this.bossWarning = { idx: i, time: Math.max(0.1, bc.spawnTime - gameTime) };
        result.showWarning = true;
        console.log('[Boss] Warning for boss', i, 'at time', gameTime.toFixed(1));
      } else if (gameTime >= bc.spawnTime) {
        // 超過生成時間但還沒生成（窗口被跳過）→ 立即生成
        result.boss = SG.Boss.spawn(i, this.imgConfig, player, W, H);
        this.spawnedBosses[i] = true;
        console.log('[Boss] Immediate spawn boss', i, 'at time', gameTime.toFixed(1));
      }
    }

    // 更新預警倒數
    if (this.bossWarning) {
      this.bossWarning.time -= dt;
      if (this.bossWarning.time <= 0) {
        result.hideWarning = true;
        result.boss = SG.Boss.spawn(this.bossWarning.idx, this.imgConfig, player, W, H);
        this.spawnedBosses[this.bossWarning.idx] = true;
        this.bossWarning = null;
      }
    }

    return result;
  };

  // Boss 預警是否正在進行
  WaveManager.prototype.isWarning = function() {
    return !!this.bossWarning;
  };

  SG.WaveManager = WaveManager;
})();

  // Rush Wave 快速生成
  WaveManager.prototype.spawnRushWave = function(count, player, W, H, imgConfig) {
    var spawned = [];
    var elist = (imgConfig && imgConfig.enemies) || [{ hp: 3, speed: 90, damage: 5, size: 36, color: '#ff4444' }];
    for (var i = 0; i < count; i++) {
      var ecfg = elist[Math.floor(Math.random() * Math.min(3, elist.length))];
      var angle = Math.random() * Math.PI * 2;
      var d = Math.max(W, H) * 0.6;
      var idx = Math.floor(Math.random() * elist.length);
      var e = new SG.Enemy(player.x + Math.cos(angle) * d, player.y + Math.sin(angle) * d, ecfg, idx);
      spawned.push(e);
    }
    return spawned;
  };
