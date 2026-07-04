// elite-spawner.js — 精英怪 + 寶箱 + 磁鐵道具
(function() {
  window.SG = window.SG || {};

  var ELITE_INTERVAL = 60;
  var ELITE_HP_MULT = 5;
  var ELITE_SIZE_MULT = 2;
  var MAGNET_INTERVAL = 45;
  var MAGNET_DURATION = 2;
  var MAGNET_PICKUP_RADIUS = 30;

  function EliteSpawner(player) {
    this.player = player;
    this.eliteTimer = ELITE_INTERVAL;
    this.magnetTimer = MAGNET_INTERVAL;
    this.magnets = []; // { x, y } 地圖上的磁鐵道具
    this.chests = []; // { x, y } 掉落的寶箱
    this.magnetActive = false;
    this.magnetActiveTimer = 0;
  }

  // 生成精英怪（回傳敵人物件，由 main 加入 enemies 陣列）
  EliteSpawner.prototype.update = function(dt, W, H, imgConfig) {
    var result = { elite: null, triggerLevelUp: false };

    // 精英怪計時
    this.eliteTimer -= dt;
    if (this.eliteTimer <= 0) {
      this.eliteTimer = ELITE_INTERVAL;
      var elist = (imgConfig && imgConfig.enemies) || [];
      var ecfg = elist[Math.min(4, elist.length - 1)] || { hp: 10, speed: 1, damage: 10, size: 40, color: '#ff00ff' };
      var angle = Math.random() * Math.PI * 2;
      var d = Math.max(W, H) * 0.5;
      var elite = new SG.Enemy(ecfg, Math.min(4, elist.length - 1));
      elite.x = this.player.x + Math.cos(angle) * d;
      elite.y = this.player.y + Math.sin(angle) * d;
      elite.hp = ecfg.hp * ELITE_HP_MULT;
      elite.maxHp = elite.hp;
      elite.size = (ecfg.size || 40) * ELITE_SIZE_MULT;
      elite.isElite = true;
      result.elite = elite;
    }

    // 磁鐵道具生成
    this.magnetTimer -= dt;
    if (this.magnetTimer <= 0) {
      this.magnetTimer = MAGNET_INTERVAL;
      var mx = this.player.x + (Math.random() - 0.5) * W * 0.8;
      var my = this.player.y + (Math.random() - 0.5) * H * 0.8;
      this.magnets.push({ x: mx, y: my });
    }

    // 磁鐵拾取檢測
    for (var i = this.magnets.length - 1; i >= 0; i--) {
      if (SG.dist(this.player, this.magnets[i]) < MAGNET_PICKUP_RADIUS + 20) {
        this.magnets.splice(i, 1);
        this.magnetActive = true;
        this.magnetActiveTimer = MAGNET_DURATION;
      }
    }

    // 寶箱拾取檢測
    for (var i = this.chests.length - 1; i >= 0; i--) {
      if (SG.dist(this.player, this.chests[i]) < 30) {
        this.chests.splice(i, 1);
        result.triggerLevelUp = true;
      }
    }

    // 磁鐵效果倒數
    if (this.magnetActive) {
      this.magnetActiveTimer -= dt;
      if (this.magnetActiveTimer <= 0) this.magnetActive = false;
    }

    return result;
  };

  // 精英怪被擊殺時呼叫（掉落寶箱）
  EliteSpawner.prototype.onEliteKill = function(x, y) {
    this.chests.push({ x: x, y: y });
  };

  EliteSpawner.prototype.isMagnetActive = function() {
    return this.magnetActive;
  };

  EliteSpawner.prototype.getVisuals = function() {
    return { magnets: this.magnets, chests: this.chests };
  };

  SG.EliteSpawner = EliteSpawner;
})();
