// archer-attack.js — 弓手弓箭系統（支援擴散）
(function() {
  window.SG = window.SG || {};

  var BASE_CD = 0.6;
  var BASE_DAMAGE = 12;
  var ARROW_SPEED = 500;
  var ARROW_RANGE = 400;
  var SPREAD_ANGLE = 0.15; // 每支額外箭的角度偏移（rad）

  function ArcherAttack(player) {
    this.player = player;
    this.cd = BASE_CD;
    this.damage = BASE_DAMAGE;
    this.arrowCount = 1;
    this.timer = 0;
    this.arrows = [];
    this._lastHits = [];
    this.level = 1;
  }

  ArcherAttack.prototype.upgrade = function() {
    this.level++;
    // 奇數等級加數量，偶數等級加頻率
    if (this.level % 2 === 0) {
      this.cd = Math.max(0.2, this.cd - 0.08);
    } else {
      this.arrowCount = Math.min(this.arrowCount + 1, 9);
    }
  };

  ArcherAttack.prototype.update = function(dt, enemies, bosses) {
    var hits = [];
    this._lastHits = [];

    // 發射箭矢
    this.timer -= dt;
    if (this.timer <= 0) {
      var targets = enemies.concat(bosses);
      if (targets.length > 0) {
        this.timer = this.cd;
        // 瞄準最近敵人
        var nearest = null, minD = Infinity;
        for (var k = 0; k < targets.length; k++) {
          var dd = SG.dist(this.player, targets[k]);
          if (dd < minD) { minD = dd; nearest = targets[k]; }
        }
        var baseAngle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);
        
        // 扇形發射
        for (var a = 0; a < this.arrowCount; a++) {
          var offset = (a - (this.arrowCount - 1) / 2) * SPREAD_ANGLE;
          var angle = baseAngle + offset;
          this.arrows.push({
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(angle) * ARROW_SPEED,
            vy: Math.sin(angle) * ARROW_SPEED,
            angle: angle,
            dist: 0,
            damage: this.damage
          });
        }
      }
    }

    // 更新箭矢
    for (var i = this.arrows.length - 1; i >= 0; i--) {
      var ar = this.arrows[i];
      var dx = ar.vx * dt, dy = ar.vy * dt;
      ar.x += dx;
      ar.y += dy;
      ar.dist += Math.sqrt(dx * dx + dy * dy);

      if (ar.dist >= ARROW_RANGE) {
        this.arrows.splice(i, 1);
        continue;
      }

      // 碰撞（不穿透，命中即消失）
      var targets = enemies.concat(bosses);
      var hit = false;
      for (var j = 0; j < targets.length; j++) {
        var t = targets[j];
        if (t.hp <= 0) continue;
        if (SG.dist(ar, t) < 20 + t.size / 2) {
          t.hp -= ar.damage;
          this._lastHits.push({ x: t.x, y: t.y, dmg: ar.damage });
          if (t.hp <= 0) hits.push(t);
          hit = true;
          break;
        }
      }
      if (hit) this.arrows.splice(i, 1);
    }
    return hits;
  };

  ArcherAttack.prototype.getVisual = function() {
    return this.arrows.length > 0 ? this.arrows : null;
  };

  ArcherAttack.prototype.getLastHits = function() {
    var h = this._lastHits;
    this._lastHits = [];
    return h;
  };

  SG.ArcherAttack = ArcherAttack;
})();
