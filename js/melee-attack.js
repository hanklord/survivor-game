// melee-attack.js — 近戰斬擊系統
(function() {
  window.SG = window.SG || {};

  var BASE_RANGE = 80;
  var BASE_DAMAGE = 15;
  var BASE_CD = 0.8;
  var SLASH_DURATION = 0.15;

  function MeleeAttack(player) {
    this.player = player;
    this.range = BASE_RANGE;
    this.damage = BASE_DAMAGE;
    this.cd = BASE_CD;
    this.timer = 0;
    this.slashVisual = null; // { x, y, angle, timer, range }
  }

  MeleeAttack.prototype.update = function(dt, enemies, bosses) {
    var hits = [];
    // 更新斬擊視覺
    if (this.slashVisual) {
      this.slashVisual.timer -= dt;
      if (this.slashVisual.timer <= 0) this.slashVisual = null;
    }
    // 攻擊計時
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = this.cd;
      var targets = enemies.concat(bosses);
      var hitAny = false;
      for (var i = 0; i < targets.length; i++) {
        var t = targets[i];
        if (SG.dist(this.player, t) <= this.range + t.size / 2) {
          t.hp -= this.damage;
          hitAny = true;
          if (t.hp <= 0) hits.push(t);
        }
      }
      if (hitAny || targets.length > 0) {
        // 斬擊方向：朝面向方向
        var angle = this.player.facingLeft ? Math.PI : 0;
        this.slashVisual = { x: this.player.x, y: this.player.y, angle: angle, timer: SLASH_DURATION, range: this.range };
      }
    }
    return hits;
  };

  MeleeAttack.prototype.upgradeRate = function() {
    this.cd = Math.max(0.3, this.cd - 0.1);
  };

  MeleeAttack.prototype.upgradeRange = function() {
    this.range += 15;
  };

  MeleeAttack.prototype.getVisual = function() {
    return this.slashVisual;
  };

  SG.MeleeAttack = MeleeAttack;
})();
