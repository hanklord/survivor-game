// melee-attack.js — 劍氣投射物系統
(function() {
  window.SG = window.SG || {};

  var BASE_RANGE = 200;     // 飛行距離
  var BASE_DAMAGE = 15;
  var BASE_CD = 0.8;
  var SWORD_QI_SPEED = 350; // px/s
  var SWORD_QI_WIDTH = 40;  // 碰撞寬度

  function MeleeAttack(player) {
    this.player = player;
    this.range = BASE_RANGE;
    this.damage = BASE_DAMAGE;
    this.cd = BASE_CD;
    this.timer = 0;
    this.projectiles = []; // 劍氣投射物列表
    this._lastHits = [];
  }

  MeleeAttack.prototype.update = function(dt, enemies, bosses) {
    var hits = [];
    this._lastHits = [];

    // 發射劍氣
    this.timer -= dt;
    if (this.timer <= 0) {
      var targets = enemies.concat(bosses);
      if (targets.length > 0) {
        this.timer = this.cd;
        // 朝最近敵人
        var nearest = null, minD = Infinity;
        for (var k = 0; k < targets.length; k++) {
          var dd = SG.dist(this.player, targets[k]);
          if (dd < minD) { minD = dd; nearest = targets[k]; }
        }
        var angle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);
        this.projectiles.push({
          x: this.player.x,
          y: this.player.y,
          angle: angle,
          vx: Math.cos(angle) * SWORD_QI_SPEED,
          vy: Math.sin(angle) * SWORD_QI_SPEED,
          dist: 0,
          maxDist: this.range,
          damage: this.damage,
          hitSet: {} // 已命中的敵人 id（穿透不重複傷害同一隻）
        });
      }
    }

    // 更新劍氣
    for (var i = this.projectiles.length - 1; i >= 0; i--) {
      var p = this.projectiles[i];
      var dx = p.vx * dt, dy = p.vy * dt;
      p.x += dx;
      p.y += dy;
      p.dist += Math.sqrt(dx * dx + dy * dy);

      // 超出飛行距離則消失
      if (p.dist >= p.maxDist) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // 穿透碰撞
      var targets = enemies.concat(bosses);
      for (var j = 0; j < targets.length; j++) {
        var t = targets[j];
        if (t.hp <= 0) continue;
        if (p.hitSet[t.id]) continue;
        if (SG.dist(p, t) < SWORD_QI_WIDTH / 2 + t.size / 2) {
          t.hp -= p.damage;
          p.hitSet[t.id] = true;
          this._lastHits.push({ x: t.x, y: t.y, dmg: p.damage });
          if (t.hp <= 0) hits.push(t);
        }
      }
    }
    return hits;
  };

  MeleeAttack.prototype.upgradeRate = function() {
    this.cd = Math.max(0.3, this.cd - 0.1);
  };

  MeleeAttack.prototype.upgradeRange = function() {
    this.range += 50;
  };

  MeleeAttack.prototype.getVisual = function() {
    return this.projectiles.length > 0 ? this.projectiles : null;
  };

  MeleeAttack.prototype.getLastHits = function() {
    var h = this._lastHits;
    this._lastHits = [];
    return h;
  };

  SG.MeleeAttack = MeleeAttack;
})();
