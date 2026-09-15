// relic-system.js — 每局限定的風險／報酬遺物
(function() {
  window.SG = window.SG || {};

  var RELICS = [
    { id: 'berserker', name: '狂戰之心', icon: '🔥', positive: '傷害 +30%', negative: '最大 HP -20%', apply: function(p) { p.damageMultiplier = (p.damageMultiplier || 1) * 1.3; p.maxHp = Math.round(p.maxHp * 0.8); p.hp = Math.min(p.hp, p.maxHp); } },
    { id: 'glass', name: '玻璃棱鏡', icon: '💎', positive: '暴擊率 +25%', negative: '護甲 -50%', apply: function(p) { p.critChance = Math.min(1, (p.critChance || 0) + 0.25); p.armor = Math.floor((p.armor || 0) * 0.5); } },
    { id: 'swift', name: '疾風之靴', icon: '💨', positive: '移速 +25%', negative: '拾取範圍 -30%', apply: function(p) { p._relicSpeedMult = (p._relicSpeedMult || 1) * 1.25; p.pickupRange *= 0.7; } },
    { id: 'vampiric', name: '吸血獠牙', icon: '🩸', positive: '擊殺回復 2% HP', negative: '最大 HP -10%', apply: function(p) { p._relicLifesteal = (p._relicLifesteal || 0) + 0.02; p.maxHp = Math.round(p.maxHp * 0.9); p.hp = Math.min(p.hp, p.maxHp); } },
    { id: 'giant', name: '巨人護符', icon: '🛡️', positive: '最大 HP +40%', negative: '移速 -15%', apply: function(p) { p.maxHp = Math.round(p.maxHp * 1.4); p.hp = Math.min(p.hp, p.maxHp); p._relicSpeedMult = (p._relicSpeedMult || 1) * 0.85; } },
    { id: 'greed', name: '貪婪之眼', icon: '💰', positive: '經驗 +40%', negative: '受傷 +15%', apply: function(p) { p.xpMultiplier = (p.xpMultiplier || 1) * 1.4; p._relicDamageTakenMult = (p._relicDamageTakenMult || 1) * 1.15; } },
    { id: 'glasscannon', name: '爆裂核心', icon: '💥', positive: '傷害 +50%', negative: '最大 HP -35%', apply: function(p) { p.damageMultiplier = (p.damageMultiplier || 1) * 1.5; p.maxHp = Math.round(p.maxHp * 0.65); p.hp = Math.min(p.hp, p.maxHp); } },
    { id: 'magnet', name: '磁力核心', icon: '🧲', positive: '拾取範圍 +80%', negative: '移速 -10%', apply: function(p) { p.pickupRange *= 1.8; p._relicSpeedMult = (p._relicSpeedMult || 1) * 0.9; } },
    { id: 'thorns', name: '荊棘之甲', icon: '🌵', positive: '傷害反射 +8', negative: '傷害 -10%', apply: function(p) { p.reflect = (p.reflect || 0) + 8; p.damageMultiplier = (p.damageMultiplier || 1) * 0.9; } },
    { id: 'fragile_power', name: '易碎之力', icon: '⚡', positive: '攻速 +30%', negative: '護甲歸零', apply: function(p) { p._relicAtkSpeedMult = (p._relicAtkSpeedMult || 1) * 1.3; p.armor = 0; } }
  ];

  SG.RELICS = RELICS;
  SG.getRelicChoices = function(ownedIds, count) {
    var owned = ownedIds || [];
    var pool = RELICS.filter(function(relic) { return owned.indexOf(relic.id) === -1; });
    var choices = [];
    while (pool.length && choices.length < (count || 3)) {
      choices.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return choices;
  };
})();
