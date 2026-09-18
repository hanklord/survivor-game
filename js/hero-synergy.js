// hero-synergy.js — DH-4 pair bonuses, applied once when a dual-hero run starts.
(function() {
  window.SG = window.SG || {};

  function key(a, b) { return [a, b].sort().join('|'); }

  var HERO_SYNERGIES = {
    'archer|ranged': { name: '魔箭合擊', desc: '雙方傷害 +15%', apply: function(hero) { hero.damageMultiplier = (hero.damageMultiplier || 1) * 1.15; } },
    'knight|valkyrie': { name: '鋼鐵陣線', desc: '雙方最大HP +20%', apply: function(hero) { hero.maxHp = Math.round(hero.maxHp * 1.2); hero.hp = hero.maxHp; } },
    'amazon|ninja': { name: '狩獵默契', desc: '雙方攻速 +15%', apply: function(hero) { hero._synergyAtkSpeedMult = (hero._synergyAtkSpeedMult || 1) * 1.15; } },
    'knight|ranged': { name: '攻守兼備', desc: '雙方 HP+10%、傷害+10%', apply: function(hero) { hero.maxHp = Math.round(hero.maxHp * 1.1); hero.hp = hero.maxHp; hero.damageMultiplier = (hero.damageMultiplier || 1) * 1.1; } },
    'archer|ninja': { name: '疾影連射', desc: '雙方攻速 +12%', apply: function(hero) { hero._synergyAtkSpeedMult = (hero._synergyAtkSpeedMult || 1) * 1.12; } },
    'amazon|valkyrie': { name: '長矛姊妹', desc: '雙方傷害 +12%', apply: function(hero) { hero.damageMultiplier = (hero.damageMultiplier || 1) * 1.12; } }
  };
  var DEFAULT_SYNERGY = { name: '並肩作戰', desc: '雙方傷害 +5%', apply: function(hero) { hero.damageMultiplier = (hero.damageMultiplier || 1) * 1.05; } };

  SG.HERO_SYNERGIES = HERO_SYNERGIES;
  SG.getHeroSynergyKey = key;
  SG.getSynergy = function(idA, idB) { return HERO_SYNERGIES[key(idA, idB)] || DEFAULT_SYNERGY; };
})();
