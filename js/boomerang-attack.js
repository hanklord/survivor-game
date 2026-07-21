// boomerang-attack.js — 迴力鏢手攻擊系統
(function() {
  window.SG = window.SG || {};

  var BASE_CD = 1.2;
  var BASE_DAMAGE = 12;
  var SPEED = 250;           // px/s
  var MAX_RANGE = 200;       // 去程距離
  var MAX_BOOMERANGS = 5;
  var CHAIN_DAMAGE_RATIO = 0.3;
  var CHAIN_RANGE = 120;     // 閃電連鎖搜索範圍

  function BoomerangAttack(player) {
    this.player = player;
    this.cd = BASE_CD;
    this.damage = BASE_DAMAGE;
    this.speed = SPEED;
    this.hitboxSize = 12;     // 碰撞半徑
    this.timer = 0;
    this.level = 0;
    this.count = 1;           // 同時飛行數量
    this.boomerangs = [];     // active boomerangs
    this._lastHits = [];
    this._chainVisuals = [];  // { segments: [{x1,y1,x2,y2}], timer }
  }

  BoomerangAttack.prototype.update = function(dt, enemies, bosses) {
    var hits = [];
    this._lastHits = [];

    // Update chain visuals
    for (var ci = this._chainVisuals.length - 1; ci >= 0; ci--) {
      this._chainVisuals[ci].timer -= dt;
      if (this._chainVisuals[ci].timer <= 0) this._chainVisuals.splice(ci, 1);
    }

    // Update active boomerangs
    for (var i = this.boomerangs.length - 1; i >= 0; i--) {
      var b = this.boomerangs[i];
      b.time += dt;
      b.angle += 8 * dt; // spin

      if (b.phase === 'out') {
        // Going out
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.traveled += b.speed * dt;
        if (b.traveled >= MAX_RANGE) {
          b.phase = 'return';
        }
      } else {
        // Returning to player (curved arc)
        var dx = this.player.x - b.x;
        var dy = this.player.y - b.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 20) {
          // Returned
          this.boomerangs.splice(i, 1);
          continue;
        }
        var returnSpeed = b.speed * 1.2;
        b.x += (dx / dist) * returnSpeed * dt;
        b.y += (dy / dist) * returnSpeed * dt;
      }

      // Hit detection (penetrates all enemies)
      var targets = enemies.concat(bosses);
      for (var j = 0; j < targets.length; j++) {
        var t = targets[j];
        if (t.hp <= 0) continue;
        if (b.hitIds[t.id]) continue;
        if (SG.dist(b, t) < (t.hitboxRadius + this.hitboxSize)) {
          t.hp -= this.damage;
          b.hitIds[t.id] = true;
          this._lastHits.push({ x: t.x, y: t.y, dmg: this.damage });
          if (t.hp <= 0) hits.push(t);

          // Lv15+: Chain lightning on hit
          if (this.player.level >= 15) {
            this._doChainLightning(t, targets, hits);
          }
        }
      }

      // Reset hit tracking on phase change (can hit again on return trip)
      if (b.phase === 'return' && !b.returnHitReset) {
        b.hitIds = {};
        b.returnHitReset = true;
      }
    }

    // Fire new boomerangs
    this.timer -= dt;
    if (this.timer <= 0) {
      var targets = enemies.concat(bosses);
      if (targets.length > 0 && this.boomerangs.length < this.count) {
        this.timer = this.cd;
        this._fire(targets);
      }
    }

    return hits;
  };

  BoomerangAttack.prototype._fire = function(targets) {
    // Find nearest enemy
    var nearest = null, minD = Infinity;
    for (var i = 0; i < targets.length; i++) {
      if (targets[i].hp <= 0) continue;
      var d = SG.dist(this.player, targets[i]);
      if (d < minD) { minD = d; nearest = targets[i]; }
    }
    if (!nearest) return;

    var angle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);
    // Spread multiple boomerangs
    var toFire = Math.min(this.count - this.boomerangs.length, this.count);
    for (var i = 0; i < toFire; i++) {
      var spreadAngle = angle + (i - (toFire - 1) / 2) * 0.3;
      this.boomerangs.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(spreadAngle) * this.speed,
        vy: Math.sin(spreadAngle) * this.speed,
        speed: this.speed,
        size: this.hitboxSize,
        angle: 0,
        time: 0,
        traveled: 0,
        phase: 'out',
        hitIds: {},
        returnHitReset: false
      });
    }
    this.player.triggerAttack();
  };

  BoomerangAttack.prototype._doChainLightning = function(source, targets, hits) {
    var chainCount = Math.min(6, this.player.level - 14); // Lv15=1, Lv16=2, ..., Lv20=6
    var chainDmg = Math.round(this.damage * CHAIN_DAMAGE_RATIO);
    var segments = [];
    var current = source;
    var chained = {};
    chained[source.id] = true;

    for (var c = 0; c < chainCount; c++) {
      // Find nearest unchained enemy
      var next = null, nextD = Infinity;
      for (var i = 0; i < targets.length; i++) {
        var t = targets[i];
        if (t.hp <= 0 || chained[t.id]) continue;
        var d = SG.dist(current, t);
        if (d < CHAIN_RANGE && d < nextD) { nextD = d; next = t; }
      }
      if (!next) break;
      chained[next.id] = true;
      segments.push({ x1: current.x, y1: current.y, x2: next.x, y2: next.y });
      next.hp -= chainDmg;
      this._lastHits.push({ x: next.x, y: next.y, dmg: chainDmg });
      if (next.hp <= 0) hits.push(next);
      current = next;
    }

    if (segments.length > 0) {
      this._chainVisuals.push({ segments: segments, timer: 0.2 });
    }
  };

  // Upgrade: odd levels = +count, even levels = +rate
  BoomerangAttack.prototype.upgrade = function() {
    this.level++;
    if (this.level % 2 === 1) {
      // Odd: +1 boomerang
      this.count = Math.min(MAX_BOOMERANGS, this.count + 1);
    } else {
      // Even: faster fire rate
      this.cd = Math.max(0.4, this.cd - 0.1);
    }
    // 每級飛行速度 ×1.05
    this.speed *= 1.05;
    // 10 級攻擊範圍 2 倍，20 級 3 倍
    if (this.level === 10) this.hitboxSize = 24;
    if (this.level === 20) this.hitboxSize = 36;
  };

  BoomerangAttack.prototype.getVisual = function() {
    return this.boomerangs.length > 0 ? this.boomerangs : null;
  };

  BoomerangAttack.prototype.getChainVisual = function() {
    return this._chainVisuals.length > 0 ? this._chainVisuals : null;
  };

  BoomerangAttack.prototype.getLastHits = function() {
    var h = this._lastHits;
    this._lastHits = [];
    return h;
  };

  BoomerangAttack.prototype.didFire = function() {
    return this.timer === this.cd;
  };

  SG.BoomerangAttack = BoomerangAttack;
})();
