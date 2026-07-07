// rush-wave.js — Rush 波次事件
(function() {
  window.SG = window.SG || {};

  var RUSH_INTERVAL = 60; // 每60秒一次
  var RUSH_DURATION = 8;  // rush 持續秒數
  var RUSH_SPAWN_RATE = 0.5; // 每0.3秒生一批
  var RUSH_SPAWN_COUNT = 4;  // 每批數量
  var RUSH_REWARD_XP = 5;   // 存活獎勵（直接升級次數）

  function RushWave() {
    this.timer = RUSH_INTERVAL;
    this.active = false;
    this.rushTimer = 0;
    this.spawnTimer = 0;
    this.survived = false;
  }

  RushWave.prototype.update = function(dt) {
    if (this.active) {
      this.rushTimer -= dt;
      this.spawnTimer -= dt;
      if (this.rushTimer <= 0) {
        this.active = false;
        this.timer = RUSH_INTERVAL;
        this.survived = true;
        return 'rush_end';
      }
      if (this.spawnTimer <= 0) {
        this.spawnTimer = RUSH_SPAWN_RATE;
        return 'rush_spawn';
      }
      return 'rushing';
    } else {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.active = true;
        this.rushTimer = RUSH_DURATION;
        this.spawnTimer = 0;
        return 'rush_start';
      }
    }
    return null;
  };

  RushWave.prototype.getSpawnCount = function() { return RUSH_SPAWN_COUNT; };
  RushWave.prototype.getRewardXP = function() { return RUSH_REWARD_XP; };

  SG.RushWave = RushWave;
})();
