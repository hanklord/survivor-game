// amazon-attack.js — 亞馬遜標槍投射攻擊系統
(function() {
  window.SG = window.SG || {};

  var BASE_CD = 0.8;
  var BASE_DAMAGE = 15;
  var JAVELIN_SPEED = 400;
  var MAX_RANGE = 350;
  var JAVELIN_SIZE = 12;
  var BURST_RADIUS = 60;
  var BURST_DAMAGE_RATIO = 0.4;

  function AmazonAttack(player) {
    this.player = player;
    this.cd = BASE_CD;
    this.damage = BASE_DAMAGE;
    this.timer = 0;
    this.level = 0;
    this.count = 1;
    this.penetrate = 0;      // extra enemies to penetrate
    this.burst = false;      // Lv15+ AOE on hit
    this.javelins = [];
    this._lastHits = [];
    this._burstVisuals = []; // { x, y, progress }
  }

  AmazonAttack.prototype.update = function(dt, enemies, bosses) {
    var hits = [];
    this._lastHits = [];

    // Update burst visuals
    for (var bi = this._burstVisuals.length - 1; bi >= 0; bi--) {
      this._burstVisuals[bi].progress += dt / 0.3;
      if (this._burstVisuals[bi].progress >= 1) this._burstVisuals.splice(bi, 1);
    }

    // Update javelins
    for (var i = this.javelins.length - 1; i >= 0; i--) {
      var j = this.javelins[i];
      j.x += j.vx * dt;
      j.y += j.vy * dt;
      j.traveled += JAVELIN_SPEED * dt;

      if (j.traveled >= MAX_RANGE) {
        this.javelins.splice(i, 1);
        continue;
      }

      // Hit detection
      var targets = enemies.concat(bosses);
      for (var ti = 0; ti < targets.length; ti++) {
        var t = targets[ti];
        if (t.hp <= 0 || j.hitIds[t.id]) continue;
        if (SG.dist(j, t) < (t.hitboxRadius + JAVELIN_SIZE)) {
          t.hp -= this.damage;
          j.hitIds[t.id] = true;
          j.hitCount++;
          this._lastHits.push({ x: t.x, y: t.y, dmg: this.damage });
          if (t.hp <= 0) hits.push(t);

          // Lv15+ burst AOE on hit
          if (this.burst) {
            this._burstVisuals.push({ x: t.x, y: t.y, progress: 0 });
            var burstDmg = Math.round(this.damage * BURST_DAMAGE_RATIO);
            for (var ai = 0; ai < targets.length; ai++) {
              var at = targets[ai];
              if (at === t || at.hp <= 0) continue;
              if (SG.dist(t, at) <= BURST_RADIUS + at.hitboxRadius) {
                at.hp -= burstDmg;
                this._lastHits.push({ x: at.x, y: at.y, dmg: burstDmg });
                if (at.hp <= 0) hits.push(at);
              }
            }
          }

          // Remove javelin if exceeded penetration
          if (j.hitCount > this.penetrate) {
            this.javelins.splice(i, 1);
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

  AmazonAttack.prototype._fire = function(targets) {
    var nearest = null, minD = Infinity;
    for (var i = 0; i < targets.length; i++) {
      if (targets[i].hp <= 0) continue;
      var d = SG.dist(this.player, targets[i]);
      if (d < minD) { minD = d; nearest = targets[i]; }
    }
    if (!nearest) return;

    var baseAngle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);
    for (var i = 0; i < this.count; i++) {
      var spread = (i - (this.count - 1) / 2) * 0.12;
      var angle = baseAngle + spread;
      this.javelins.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * JAVELIN_SPEED,
        vy: Math.sin(angle) * JAVELIN_SPEED,
        angle: angle,
        traveled: 0,
        hitIds: {},
        hitCount: 0
      });
    }
    this.player.triggerAttack();
  };

  // Upgrade: odd = +count, even = -CD/+damage
  AmazonAttack.prototype.upgrade = function() {
    this.level++;
    if (this.level % 2 === 1) {
      this.count = Math.min(6, this.count + 1);
    } else {
      this.cd = Math.max(0.3, this.cd - 0.06);
      this.damage += 2;
    }
    // Lv10: penetrate +1
    if (this.level === 10) this.penetrate = 1;
    // Lv15: burst AOE on hit
    if (this.level === 15) this.burst = true;
  };

  AmazonAttack.prototype.getVisual = function() {
    return {
      javelins: this.javelins,
      bursts: this._burstVisuals
    };
  };

  AmazonAttack.prototype.getLastHits = function() {
    var h = this._lastHits;
    this._lastHits = [];
    return h;
  };

  AmazonAttack.prototype.didFire = function() {
    return this.timer === this.cd;
  };

  SG.AmazonAttack = AmazonAttack;
})();
