// character-traits.js — character-specific innate passive traits
(function() {
  window.SG = window.SG || {};

  var TRAITS = {
    ranged: {
      name: '魔力累積',
      desc: '每擊殺 +0.5% 傷害（上限 +50%）',
      init: function(player) { player._traitKillDmg = 0; },
      onKill: function(player) { player._traitKillDmg = Math.min(0.5, player._traitKillDmg + 0.005); },
      getDamageMult: function(player) { return 1 + (player._traitKillDmg || 0); }
    },
    archer: {
      name: '精準射擊',
      desc: '暴擊傷害 +50%',
      init: function(player) { player._traitCritDmgBonus = 0.5; }
    },
    knight: {
      name: '憤怒',
      desc: '受傷後 3 秒傷害 +50%',
      init: function(player) { player._traitRageTimer = 0; },
      onHit: function(player) { player._traitRageTimer = 3; },
      onUpdate: function(dt, game, player) { player._traitRageTimer = Math.max(0, player._traitRageTimer - dt); },
      getDamageMult: function(player) { return player._traitRageTimer > 0 ? 1.5 : 1; }
    },
    valkyrie: {
      name: '戰意高昂',
      desc: '每 10 秒攻速 +10%（上限 +30%）',
      init: function(player) { player._traitAtkSpeed = 0; player._traitAtkTimer = 0; },
      onUpdate: function(dt, game, player) {
        player._traitAtkTimer += dt;
        while (player._traitAtkTimer >= 10 && player._traitAtkSpeed < 0.3) {
          player._traitAtkTimer -= 10;
          player._traitAtkSpeed = Math.min(0.3, player._traitAtkSpeed + 0.1);
        }
      },
      getAttackSpeedMult: function(player) { return 1 + (player._traitAtkSpeed || 0); }
    },
    ninja: {
      name: '疾風',
      desc: '不受傷 5 秒後移速 +30%（受傷重置）',
      init: function(player) { player._traitNoHitTimer = 0; player._traitSpeedBonus = false; player._traitSpeedMult = 1; },
      onHit: function(player) {
        player._traitNoHitTimer = 0;
        player._traitSpeedMult = 1;
        player._traitSpeedBonus = false;
      },
      onUpdate: function(dt, game, player) {
        player._traitNoHitTimer += dt;
        if (player._traitNoHitTimer >= 5 && !player._traitSpeedBonus) {
          player._traitSpeedMult = 1.3;
          player._traitSpeedBonus = true;
        }
      }
    },
    amazon: {
      name: '狩獵者',
      desc: '對血量 >50% 的敵人傷害 +25%',
      init: function(player) { player._traitHunter = true; },
      getDamageMultVsEnemy: function(player, enemy) {
        return enemy && enemy.maxHp > 0 && enemy.hp > enemy.maxHp * 0.5 ? 1.25 : 1;
      }
    }
  };

  function getTrait(player) { return player && player._trait; }

  SG.CHARACTER_TRAITS = TRAITS;
  SG.getTrait = function(id) { return TRAITS[id] || null; };
  SG.getTraitDamageMult = function(player, enemy) {
    var trait = getTrait(player);
    if (!trait) return 1;
    var mult = trait.getDamageMult ? trait.getDamageMult(player) : 1;
    if (trait.getDamageMultVsEnemy) mult *= trait.getDamageMultVsEnemy(player, enemy);
    return mult;
  };
  SG.getTraitAttackSpeedMult = function(player) {
    var trait = getTrait(player);
    return trait && trait.getAttackSpeedMult ? trait.getAttackSpeedMult(player) : 1;
  };
  SG.applyTraitDamage = function(player, enemy, baseDamage, options) {
    var damage = baseDamage * SG.getTraitDamageMult(player, enemy);
    var isCrit = false;
    if (options && options.canCrit && player.critChance && Math.random() < player.critChance) {
      isCrit = true;
      damage *= 2 + (player._traitCritDmgBonus || 0);
    }
    damage = Math.round(damage);
    enemy.hp -= damage;
    return { damage: damage, isCrit: isCrit };
  };
})();
