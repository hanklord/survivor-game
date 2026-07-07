// enemy.js — 敵人類別與生成邏輯
(function() {
  window.SG = window.SG || {};

  var LEVEL_UNLOCK_START = 30;    // 開始解鎖更高等級敵人的秒數門檻
  var LEVEL_UNLOCK_INTERVAL = 30; // 每隔幾秒解鎖下一等級

  function Enemy(x, y, cfg, cfgIdx) {
    this.x = x;
    this.y = y;
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.speed = cfg.speed;
    this.damage = cfg.damage;
    this.size = cfg.size || 36;
    this.color = cfg.color || '#ff4444';
    this.cfgIdx = cfgIdx;
    this.type = 'enemy';
    this.id = SG.nextEntityId++;
    // 動畫相關
    this.animator = null;
    this.facingLeft = false;
  }

  // 朝目標移動
  Enemy.prototype.moveToward = function(target, dt) {
    var a = Math.atan2(target.y - this.y, target.x - this.x);
    this.x += Math.cos(a) * this.speed * dt;
    this.y += Math.sin(a) * this.speed * dt;
    this.facingLeft = target.x < this.x;
  };

  // 更新動畫
  Enemy.prototype.updateAnimation = function(dt) {
    if (!this.animator) return;
    this.animator.setState('run');
    this.animator.update(dt);
  };

  // 根據遊戲時間選擇敵人設定
  Enemy.pickConfig = function(imgConfig, gameTime) {
    var elist = imgConfig.enemies || [{ level: 1, size: 36, color: '#ff4444', hp: 3, speed: 90, damage: 5 }];
    var maxLevel = 1;
    if (gameTime > LEVEL_UNLOCK_START) maxLevel = Math.min(elist.length, 1 + Math.floor((gameTime - LEVEL_UNLOCK_START) / LEVEL_UNLOCK_INTERVAL));
    var idx = Math.floor(Math.random() * maxLevel);
    return { cfg: elist[idx], idx: idx };
  };

  // 生成一波敵人
  Enemy.spawnWave = function(wave, player, W, H, imgConfig, gameTime) {
    var count = Math.min(3 + wave * 2, 30);
    var spawned = [];
    for (var i = 0; i < count; i++) {
      var pick = Enemy.pickConfig(imgConfig, gameTime);
      var angle = Math.random() * Math.PI * 2;
      var d = Math.max(W, H) * 0.6;
      var x = player.x + Math.cos(angle) * d;
      var y = player.y + Math.sin(angle) * d;
      spawned.push(new Enemy(x, y, pick.cfg, pick.idx));
    }
    return spawned;
  };

  SG.Enemy = Enemy;
})();
