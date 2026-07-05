// melee-attack.js — 近戰揮砍系統（攻擊判定綁定角色位置）
(function() {
  window.SG = window.SG || {};

  var BASE_RANGE = 80;
  var BASE_DAMAGE = 15;
  var BASE_CD = 0.6;
  var HITBOX_DURATION = 0.25;
  var ARC_ANGLE = 1.2; // ±60° 扇形

  function MeleeAttack(player) {
    this.player = player;
    this.range = BASE_RANGE;
    this.damage = BASE_DAMAGE;
    this.cd = BASE_CD;
    this.timer = 0;
    this._activeHitbox = null; // { timer, angle, hitIds }
    this._lastHits = [];
  }

  MeleeAttack.prototype.update = function(dt, enemies, bosses) {
    var hits = [];
    this._lastHits = [];

    // 更新活躍的攻擊判定
    if (this._activeHitbox) {
      this._activeHitbox.timer -= dt;
      // 持續判定範圍內敵人（跟隨角色位置）
      var targets = enemies.concat(bosses);
      var angle = this.player.facingLeft ? Math.PI : 0;
      for (var i = 0; i < targets.length; i++) {
        var t = targets[i];
        if (t.hp <= 0 || this._activeHitbox.hitIds[t.id]) continue;
        var d = SG.dist(this.player, t);
        if (d > this.range + t.size / 2) continue;
        // 扇形角度檢查
        var a = Math.atan2(t.y - this.player.y, t.x - this.player.x);
        var diff = a - angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) <= ARC_ANGLE) {
          t.hp -= this.damage;
          this._activeHitbox.hitIds[t.id] = true;
          this._lastHits.push({ x: t.x, y: t.y, dmg: this.damage });
          if (t.hp <= 0) hits.push(t);
        }
      }
      if (this._activeHitbox.timer <= 0) this._activeHitbox = null;
    }

    // 攻擊冷卻
    this.timer -= dt;
    if (this.timer <= 0 && !this._activeHitbox) {
      var targets = enemies.concat(bosses);
      if (targets.length > 0) {
        this.timer = this.cd;
        this._activeHitbox = { timer: HITBOX_DURATION, hitIds: {} };
      }
    }

    return hits;
  };

  MeleeAttack.prototype.upgradeRate = function() {
    this.cd = Math.max(0.2, this.cd - 0.05);
  };

  MeleeAttack.prototype.upgradeRange = function() {
    this.range += 20;
  };

  MeleeAttack.prototype.getVisual = function() {
    if (!this._activeHitbox) return null;
    var angle = this.player.facingLeft ? Math.PI : 0;
    return {
      x: this.player.x,
      y: this.player.y,
      angle: angle,
      range: this.range,
      progress: 1 - (this._activeHitbox.timer / HITBOX_DURATION)
    };
  };

  MeleeAttack.prototype.getLastHits = function() {
    var h = this._lastHits;
    this._lastHits = [];
    return h;
  };

  SG.MeleeAttack = MeleeAttack;
})();
