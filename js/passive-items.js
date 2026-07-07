// passive-items.js — 被動道具系統
(function() {
  window.SG = window.SG || {};

  var MAX_STACK = 5;

  var PASSIVES = [
    { id: 'speed', name: '👟 移速+10%', icon: '👟', effect: function(p) { p.speed *= 1.1; } },
    { id: 'pickup', name: '🧲 拾取範圍+30%', icon: '🧲', effect: function(p) { p.pickupRange *= 1.3; } },
    { id: 'xpBonus', name: '⭐ 經驗+20%', icon: '⭐', effect: function(p) { p.xpMultiplier = (p.xpMultiplier || 1) * 1.2; } },
    { id: 'armor', name: '🛡️ 護甲+2', icon: '🛡️', effect: function(p) { p.armor = (p.armor || 0) + 2; } },
    { id: 'maxHp', name: '❤️ 最大HP+20', icon: '❤️', effect: function(p) { p.maxHp += 20; p.hp = Math.min(p.hp + 20, p.maxHp); } }
  ];

  function PassiveItems() {
    this.levels = {}; // { id: level }
  }

  // 取得可用的被動選項（未滿級的）
  PassiveItems.prototype.getChoices = function(count) {
    var available = [];
    for (var i = 0; i < PASSIVES.length; i++) {
      var p = PASSIVES[i];
      var lv = this.levels[p.id] || 0;
      if (lv < MAX_STACK) {
        available.push({ id: p.id, name: p.name + ' Lv' + (lv + 1), icon: p.icon });
      }
    }
    // Shuffle and take count
    var result = [];
    while (result.length < count && available.length > 0) {
      var idx = Math.floor(Math.random() * available.length);
      result.push(available.splice(idx, 1)[0]);
    }
    return result;
  };

  // 套用被動
  PassiveItems.prototype.apply = function(id, player) {
    var lv = this.levels[id] || 0;
    if (lv >= MAX_STACK) return;
    this.levels[id] = lv + 1;
    for (var i = 0; i < PASSIVES.length; i++) {
      if (PASSIVES[i].id === id) { PASSIVES[i].effect(player); break; }
    }
  };

  // 取得已擁有的被動列表（供 HUD 顯示）
  PassiveItems.prototype.getOwned = function() {
    var owned = [];
    for (var i = 0; i < PASSIVES.length; i++) {
      var lv = this.levels[PASSIVES[i].id] || 0;
      if (lv > 0) owned.push({ icon: PASSIVES[i].icon, level: lv });
    }
    return owned;
  };

  SG.PassiveItems = PassiveItems;
})();
