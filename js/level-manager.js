// level-manager.js — 關卡/地圖系統
(function() {
  window.SG = window.SG || {};

  // 預設關卡配置（config.js 可覆蓋）
  var DEFAULT_LEVELS = [
    { name: '草地', bgColor: '#1a2e1a', duration: 90, enemySpeedMult: 1, bossIndices: [0] },
    { name: '洞窟', bgColor: '#1a1a2e', duration: 120, enemySpeedMult: 1.2, bossIndices: [1] },
    { name: '火山', bgColor: '#2e1a1a', duration: 180, enemySpeedMult: 1.5, bossIndices: [2] }
  ];

  function LevelManager(config) {
    this.levels = (config && config.levels) || DEFAULT_LEVELS;
    this.currentLevel = 0;
    this.levelTime = 0;
    this.completed = false;
    this.levelCleared = false;
    this.showingClear = false;
    this.clearTimer = 0;
    this.bossKills = 0; // 本關擊殺 Boss 數
  }

  // 取得目前關卡設定
  LevelManager.prototype.getCurrent = function() {
    return this.levels[this.currentLevel] || this.levels[0];
  };

  LevelManager.prototype.update = function(dt, bossesAlive) {
    if (this.completed || this.levelCleared) return null;
    this.levelTime += dt;

    // 通關條件：擊殺 2 隻 Boss
    if (this.bossKills >= 2) {
      this.levelCleared = true;
      return 'level_clear';
    }
    return null;
  };

  // Boss 被擊殺時呼叫
  LevelManager.prototype.onBossKill = function() {
    this.bossKills++;
  };

  // 進入下一關，回傳 false 表示已無下一關（全通關）
  LevelManager.prototype.nextLevel = function() {
    this.currentLevel++;
    this.levelTime = 0;
    this.levelCleared = false;
    this.bossKills = 0;
    if (this.currentLevel >= this.levels.length) {
      this.completed = true;
      return false;
    }
    return true;
  };

  // 取得目前背景色
  LevelManager.prototype.getBgColor = function() {
    return this.getCurrent().bgColor || '#1a1a2e';
  };

  // 取得敵人速度倍率
  LevelManager.prototype.getEnemySpeedMult = function() {
    return this.getCurrent().enemySpeedMult || 1;
  };

  // 取得本關 Boss 索引列表
  LevelManager.prototype.getBossIndices = function() {
    return this.getCurrent().bossIndices || [];
  };

  SG.LevelManager = LevelManager;
})();
