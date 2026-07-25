// amazon-attack.js — 亞馬遜標槍投射攻擊系統
(function() {
  window.SG = window.SG || {};

  var BASE_CD = 0.8;
  var BASE_DAMAGE = 15;
  var JAVELIN_SPEED = 400;
  var MAX_RANGE = 350;
  var JAVELIN_SIZE = 12;
  var CHAIN_DAMAGE_RATIO = 0.3;
  var CHAIN_RANGE = 120;

  function AmazonAttack(player) {
    this.player = player;
    this.cd = BASE_CD;
    this.damage = BASE_DAMAGE;
    this.timer = 0;
    this.level = 0;
    this.penetrate = 0;      // 貫通數量（可穿透幾個敵人）
    this.chainLevel = 0;     // 連鎖閃電等級（Lv10 起跳 3，之後每級 +1）
    this.javelins = [];
    this._lastHits = [];
    this._chainVisuals = []; // { segments: [{x1,y1,x2,y2}], timer }
  }

  AmazonAttack.prototype.update = function(dt, enemies, bosses) {
    var hits = [];
    this._lastHits = [];

    // Update chain visuals
    for (var ci = this._chainVisuals.length - 1; ci >= 0; ci--) {
      this._chainVisuals[ci].timer -= dt;
      if (this._chainVisuals[ci].timer <= 0) this._chainVisuals.splice(ci, 1);
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

          // Lv10+ 連鎖閃電
          if (this.chainLevel > 0) {
            this._doChainLightning(t, targets, hits);
          }

          // Remove javelin if exceeded penetration
          if (j.hitCount > this.penetrate) {
            this.javelins.splice(i, 1);
            break;
          }
        }
      }
    }

    // Fire (always 1 javelin)
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

    var angle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);
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
    this.player.triggerAttack();
  };

  AmazonAttack.prototype._doChainLightning = function(source, targets, hits) {
    var chainCount = this.chainLevel;
    var chainDmg = Math.round(this.damage * CHAIN_DAMAGE_RATIO);
    var segments = [];
    var current = source;
    var chained = {};
    chained[source.id] = true;

    for (var c = 0; c < chainCount; c++) {
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

  // Upgrade: odd = CD 減少, even = 貫通 +1; Lv10 起連鎖閃電
  AmazonAttack.prototype.upgrade = function() {
    this.level++;
    if (this.level % 2 === 1) {
      // 奇數級：攻擊頻率提升
      this.cd = Math.max(0.3, this.cd - 0.05);
    } else {
      // 偶數級：貫通 +1
      this.penetrate++;
    }
    // Lv10：解鎖連鎖閃電（起跳 3 次）
    if (this.level === 10) this.chainLevel = 3;
    // Lv11+ 每級連鎖 +1
    if (this.level > 10) this.chainLevel++;
  };

  AmazonAttack.prototype.getVisual = function() {
    return {
      javelins: this.javelins,
      chains: this._chainVisuals
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
