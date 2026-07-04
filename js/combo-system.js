// combo-system.js — Combo 連殺系統
(function() {
  window.SG = window.SG || {};

  var COMBO_TIMEOUT = 2; // 2秒內未殺敵則歸零
  var COMBO_XP_10 = 1.5;
  var COMBO_XP_20 = 2.0;

  function ComboSystem() {
    this.count = 0;
    this.timer = 0;
    this.best = 0;
    this._flash = 0;
  }

  ComboSystem.prototype.addKill = function() {
    this.count++;
    this.timer = COMBO_TIMEOUT;
    if (this.count > this.best) this.best = this.count;
    if (this.count === 10 || this.count === 20 || this.count === 50) this._flash = 0.5;
  };

  ComboSystem.prototype.update = function(dt) {
    if (this.timer > 0) {
      this.timer -= dt;
      if (this.timer <= 0) this.count = 0;
    }
    if (this._flash > 0) this._flash -= dt;
  };

  ComboSystem.prototype.getXPMultiplier = function() {
    if (this.count >= 20) return COMBO_XP_20;
    if (this.count >= 10) return COMBO_XP_10;
    return 1;
  };

  ComboSystem.prototype.getVisual = function() {
    if (this.count < 2) return null;
    return { count: this.count, flash: this._flash > 0 };
  };

  SG.ComboSystem = ComboSystem;
})();
