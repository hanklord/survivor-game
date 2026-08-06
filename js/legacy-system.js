// legacy-system.js — Roguelite permanent growth persisted across runs
(function() {
  window.SG = window.SG || {};
  var STORAGE_KEY = 'legacyBonus';
  var MAX_HP_PERCENT = 200, MAX_ATK_PERCENT = 150;
  var HP_PER_LEVEL = 0.5, ATK_PER_LEVEL = 0.3;

  function LegacySystem() { this.data = this._load(); }
  LegacySystem.prototype._load = function() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved) return {
        hpPercent: Number(saved.hpPercent) || 0, atkPercent: Number(saved.atkPercent) || 0,
        totalDeaths: Number(saved.totalDeaths) || 0, totalLevels: Number(saved.totalLevels) || 0,
        highestStage: Number(saved.highestStage) || 0
      };
    } catch(e) {}
    return { hpPercent: 0, atkPercent: 0, totalDeaths: 0, totalLevels: 0, highestStage: 0 };
  };
  LegacySystem.prototype._save = function() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch(e) {}
  };
  LegacySystem.prototype.onDeath = function(playerLevel, currentStage) {
    var hpGain = playerLevel * HP_PER_LEVEL, atkGain = playerLevel * ATK_PER_LEVEL;
    this.data.hpPercent = Math.min(MAX_HP_PERCENT, this.data.hpPercent + hpGain);
    this.data.atkPercent = Math.min(MAX_ATK_PERCENT, this.data.atkPercent + atkGain);
    this.data.totalDeaths++; this.data.totalLevels += playerLevel;
    if (currentStage + 1 > this.data.highestStage) this.data.highestStage = currentStage + 1;
    this._save();
    return { hpGain: hpGain, atkGain: atkGain };
  };
  LegacySystem.prototype.getMultipliers = function() {
    return { hp: 1 + this.data.hpPercent / 100, atk: 1 + this.data.atkPercent / 100 };
  };
  LegacySystem.prototype.reset = function() {
    this.data = { hpPercent: 0, atkPercent: 0, totalDeaths: 0, totalLevels: 0, highestStage: 0 };
    this._save();
  };
  SG.LegacySystem = LegacySystem;
})();
