// skill-tree.js — 被動技能樹系統
(function() {
  window.SG = window.SG || {};

  // 被動技能定義（每級效果遞增）
  var PASSIVE_SKILLS = [
    { id: 'speed', name: '🏃 移速+', icon: '🏃', apply: function(p) { p.speed *= 1.1; } },
    { id: 'pickup', name: '🧲 拾取+', icon: '🧲', apply: function(p) { p.pickupRange *= 1.2; } },
    { id: 'armor', name: '🛡️ 護甲', icon: '🛡️', apply: function(p) { p.armor = (p.armor || 0) + 2; } },
    { id: 'xpBonus', name: '📚 經驗+', icon: '📚', apply: function(p) { p.xpMultiplier = (p.xpMultiplier || 1) * 1.15; } },
    { id: 'crit', name: '💥 暴擊率', icon: '💥', apply: function(p) { p.critChance = Math.min((p.critChance || 0) + 0.1, 0.5); } },
    { id: 'regen', name: '💚 生命回復', icon: '💚', apply: function(p) { p.regen = (p.regen || 0) + 0.5; } },
    { id: 'reflect', name: '🔥 傷害反射', icon: '🔥', apply: function(p) { p.reflect = (p.reflect || 0) + 3; } },
    { id: 'dodge', name: '💨 閃避', icon: '💨', apply: function(p) { p.dodgeChance = Math.min((p.dodgeChance || 0) + 0.08, 0.4); } },
    { id: 'maxHpUp', name: '❤️‍🔥 最大HP+', icon: '❤️‍🔥', apply: function(p) { p.maxHp += 20; p.hp = Math.min(p.hp + 20, p.maxHp); } },
    { id: 'damageAll', name: '⚔️ 全傷害+', icon: '⚔️', apply: function(p) { p.damageMultiplier = (p.damageMultiplier || 1) * 1.1; } }
  ];

  function SkillTree() {
    this.levels = {}; // { skillId: level }
  }

  // 取得隨機 1~2 個被動技能選項（供升級選單用）
  SkillTree.prototype.getRandomChoices = function(count) {
    count = count || (Math.random() < 0.5 ? 1 : 2);
    var indices = [];
    while (indices.length < count && indices.length < PASSIVE_SKILLS.length) {
      var i = Math.floor(Math.random() * PASSIVE_SKILLS.length);
      if (indices.indexOf(i) === -1) indices.push(i);
    }
    var self = this;
    return indices.map(function(i) {
      var skill = PASSIVE_SKILLS[i];
      var lv = (self.levels[skill.id] || 0) + 1;
      return {
        name: skill.name + ' Lv.' + lv,
        icon: skill.icon,
        skillId: skill.id,
        apply: skill.apply
      };
    });
  };

  // 套用技能並記錄等級
  SkillTree.prototype.applySkill = function(skillId, player) {
    this.levels[skillId] = (this.levels[skillId] || 0) + 1;
    for (var i = 0; i < PASSIVE_SKILLS.length; i++) {
      if (PASSIVE_SKILLS[i].id === skillId) {
        PASSIVE_SKILLS[i].apply(player);
        break;
      }
    }
  };

  // 取得已獲得的技能清單（供 HUD 顯示）
  SkillTree.prototype.getAcquired = function() {
    var result = [];
    for (var i = 0; i < PASSIVE_SKILLS.length; i++) {
      var s = PASSIVE_SKILLS[i];
      if (this.levels[s.id]) {
        result.push({ icon: s.icon, level: this.levels[s.id] });
      }
    }
    return result;
  };

  SG.SkillTree = SkillTree;
})();
