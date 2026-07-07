// meta-progression.js — 永久升級系統（localStorage）
(function() {
  window.SG = window.SG || {};

  var STORAGE_KEY = 'survivor_meta';

  var UPGRADES = [
    { id: 'atk', name: '⚔️ 基礎攻擊+2%', cost: 10, maxLevel: 20 },
    { id: 'hp', name: '❤️ 基礎HP+5', cost: 8, maxLevel: 20 },
    { id: 'spd', name: '💨 基礎移速+1%', cost: 12, maxLevel: 20 },
    { id: 'startLv', name: '⭐ 起始等級+1', cost: 50, maxLevel: 5 }
  ];

  function MetaProgression() {
    this.coins = 0;
    this.upgrades = {}; // { id: level }
    this._load();
  }

  MetaProgression.prototype._load = function() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (data) { this.coins = data.coins || 0; this.upgrades = data.upgrades || {}; }
    } catch(e) {}
  };

  MetaProgression.prototype._save = function() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ coins: this.coins, upgrades: this.upgrades }));
    } catch(e) {}
  };

  // 結算金幣（每局結束時呼叫）
  MetaProgression.prototype.earnCoins = function(kills, survivalTime) {
    var earned = Math.floor(kills * 0.5 + survivalTime * 0.1);
    this.coins += earned;
    this._save();
    return earned;
  };

  // 取得升級列表（含當前等級和費用）
  MetaProgression.prototype.getUpgradeList = function() {
    var list = [];
    for (var i = 0; i < UPGRADES.length; i++) {
      var u = UPGRADES[i];
      var lv = this.upgrades[u.id] || 0;
      list.push({ id: u.id, name: u.name, cost: u.cost * (lv + 1), level: lv, maxLevel: u.maxLevel, maxed: lv >= u.maxLevel });
    }
    return list;
  };

  // 購買升級
  MetaProgression.prototype.buyUpgrade = function(id) {
    var u = null;
    for (var i = 0; i < UPGRADES.length; i++) { if (UPGRADES[i].id === id) { u = UPGRADES[i]; break; } }
    if (!u) return false;
    var lv = this.upgrades[u.id] || 0;
    var cost = u.cost * (lv + 1);
    if (lv >= u.maxLevel || this.coins < cost) return false;
    this.coins -= cost;
    this.upgrades[u.id] = lv + 1;
    this._save();
    return true;
  };

  // 套用永久升級到玩家
  MetaProgression.prototype.applyToPlayer = function(player) {
    var atkLv = this.upgrades.atk || 0;
    var hpLv = this.upgrades.hp || 0;
    var spdLv = this.upgrades.spd || 0;
    var startLv = this.upgrades.startLv || 0;
    player.damage *= (1 + atkLv * 0.02);
    player.maxHp += hpLv * 5;
    player.hp = player.maxHp;
    player.speed *= (1 + spdLv * 0.01);
    // 起始等級
    for (var i = 0; i < startLv; i++) { player.level++; player.xpNeeded += 3; }
  };

  MetaProgression.prototype.getCoins = function() { return this.coins; };

  SG.MetaProgression = MetaProgression;
  SG.META_UPGRADES = UPGRADES;
})();
