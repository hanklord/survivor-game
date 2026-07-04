// bomb-system.js — 全屏清場技（炸彈）
(function() {
  window.SG = window.SG || {};

  var BOMB_CD = 120; // 120秒充能
  var FLASH_DURATION = 0.4;

  function BombSystem() {
    this.timer = BOMB_CD;
    this.ready = false;
    this.flash = 0; // 爆炸閃爍倒數
  }

  BombSystem.prototype.update = function(dt) {
    if (!this.ready) {
      this.timer -= dt;
      if (this.timer <= 0) { this.ready = true; this.timer = 0; }
    }
    if (this.flash > 0) this.flash -= dt;
  };

  BombSystem.prototype.activate = function(enemies) {
    if (!this.ready) return [];
    this.ready = false;
    this.timer = BOMB_CD;
    this.flash = FLASH_DURATION;
    // 清除所有敵人
    var killed = [];
    for (var i = enemies.length - 1; i >= 0; i--) {
      killed.push(enemies[i]);
    }
    return killed;
  };

  BombSystem.prototype.getProgress = function() {
    if (this.ready) return 1;
    return 1 - (this.timer / BOMB_CD);
  };

  BombSystem.prototype.isFlashing = function() {
    return this.flash > 0;
  };

  SG.BombSystem = BombSystem;
})();
