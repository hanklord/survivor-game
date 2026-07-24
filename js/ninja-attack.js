// ninja-attack.js — 忍者手裏劍攻擊系統
(function() {
  window.SG = window.SG || {};

  var BASE_CD = 0.5;
  var BASE_DAMAGE = 8;
  var SHURIKEN_SPEED = 350;
  var SHURIKEN_SIZE = 10;
  var MAX_RANGE = 300;
  var SPIN_SPEED = 12; // rad/s

  function NinjaAttack(player) {
    this.player = player;
    this.cd = BASE_CD;
    this.damage = BASE_DAMAGE;
    this.timer = 0;
    this.level = 0;
    this.count = 2;          // 同時發射數（基礎 2 枚）
    this.shurikens = [];     // active shurikens
    this._lastHits = [];
    this.penetrate = false;  // Lv10+ 貫穿
  }

  NinjaAttack.prototype.update = function(dt, enemies, bosses) {
    var hits = [];
    this._lastHits = [];

    // Update shurikens
    for (var i = this.shurikens.length - 1; i >= 0; i--) {
      var s = this.shurikens[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.angle += SPIN_SPEED * dt;
      s.traveled += SHURIKEN_SPEED * dt;

      // Remove if exceeded range
      if (s.traveled >= MAX_RANGE) {
        this.shurikens.splice(i, 1);
        continue;
      }

      // Hit detection
      var targets = enemies.concat(bosses);
      for (var j = 0; j < targets.length; j++) {
        var t = targets[j];
        if (t.hp <= 0 || s.hitIds[t.id]) continue;
        if (SG.dist(s, t) < (t.hitboxRadius + SHURIKEN_SIZE)) {
          t.hp -= this.damage;
          s.hitIds[t.id] = true;
          this._lastHits.push({ x: t.x, y: t.y, dmg: this.damage });
          if (t.hp <= 0) hits.push(t);
          // Non-penetrate: remove on first hit (before Lv10)
          if (!this.penetrate) {
            this.shurikens.splice(i, 1);
            break;
          }
        }
      }
    }

    // Fire
    this.timer -= dt;
    if (this.timer <= 0) {
      var targets = enemies.concat(bosses);
      if (targets.length > 0) {
        this.timer = this.cd;
        this._fire(targets);
      }
    }

    return hits;
  };

  NinjaAttack.prototype._fire = function(targets) {
    // Find nearest enemy
    var nearest = null, minD = Infinity;
    for (var i = 0; i < targets.length; i++) {
      if (targets[i].hp <= 0) continue;
      var d = SG.dist(this.player, targets[i]);
      if (d < minD) { minD = d; nearest = targets[i]; }
    }
    if (!nearest) return;

    var baseAngle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);
    // Spread shurikens
    for (var i = 0; i < this.count; i++) {
      var spread = (i - (this.count - 1) / 2) * 0.15; // small spread
      var angle = baseAngle + spread;
      this.shurikens.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * SHURIKEN_SPEED,
        vy: Math.sin(angle) * SHURIKEN_SPEED,
        angle: 0,
        traveled: 0,
        hitIds: {}
      });
    }
    this.player.triggerAttack();
  };

  // Upgrade: alternates count / rate, Lv10 penetrate
  NinjaAttack.prototype.upgrade = function() {
    this.level++;
    if (this.level % 2 === 1) {
      this.count = Math.min(8, this.count + 1);
    } else {
      this.cd = Math.max(0.2, this.cd - 0.04);
    }
    // Lv10: 貫穿
    if (this.level === 10) this.penetrate = true;
  };

  NinjaAttack.prototype.getVisual = function() {
    return this.shurikens.length > 0 ? this.shurikens : null;
  };

  NinjaAttack.prototype.getLastHits = function() {
    var h = this._lastHits;
    this._lastHits = [];
    return h;
  };

  NinjaAttack.prototype.didFire = function() {
    return this.timer === this.cd;
  };

  SG.NinjaAttack = NinjaAttack;
})();
