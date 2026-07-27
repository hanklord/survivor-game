// ultimate-system.js — 角色專屬充能攻擊（大招）
(function() {
  window.SG = window.SG || {};

  var ULTIMATE_RADIUS = 250;
  var ARROW_COUNT = 24;
  var ARROW_SPEED = 400;
  var ARROW_RANGE = 350;
  var DASH_SPEED = 800;
  var DASH_DURATION = 0.3;
  var THRUST_DIRECTIONS = 12;
  var SPIRAL_SPEED = 150;
  var SPIRAL_DURATION = 2.0;
  var ARC_DURATION = 0.6;

  function UltimateSystem(player) {
    this.player = player;
    this.type = null; // set by character
    this._active = false;
    this._timer = 0;
    this._visuals = null;
    // Character-specific state
    this._arrows = [];
    this._dashDir = { x: 0, y: 0 };
    this._dashStart = { x: 0, y: 0 };
    this._thrusts = [];
    this._spiral = null;
    this._arc = null;
  }

  UltimateSystem.prototype.activate = function(enemies, bosses) {
    var hits = [];
    this._active = true;
    this._timer = 0;

    var targets = enemies.concat(bosses);

    switch (this.type) {
      case 'mage_explosion':
        hits = this._activateMageExplosion(targets);
        break;
      case 'archer_arrowrain':
        this._activateArcherArrowRain();
        break;
      case 'knight_dash':
        this._activateKnightDash();
        break;
      case 'valkyrie_radial':
        this._activateValkyrieRadial(targets);
        break;
      case 'ninja_spiral':
        this._activateNinjaSpiral();
        break;
      case 'amazon_arc':
        this._activateAmazonArc(targets);
        break;
      default:
        // Fallback: kill all (original behavior)
        for (var i = 0; i < enemies.length; i++) {
          enemies[i].hp = 0;
          hits.push(enemies[i]);
        }
        break;
    }
    return hits;
  };

  UltimateSystem.prototype.update = function(dt, enemies, bosses) {
    if (!this._active) return [];
    this._timer += dt;
    var hits = [];
    var targets = enemies.concat(bosses);

    switch (this.type) {
      case 'mage_explosion':
        if (this._timer > 0.5) this._active = false;
        break;
      case 'archer_arrowrain':
        hits = this._updateArrows(dt, targets);
        if (this._arrows.length === 0 && this._timer > 0.1) this._active = false;
        break;
      case 'knight_dash':
        hits = this._updateDash(dt, targets);
        if (this._timer >= DASH_DURATION) this._active = false;
        break;
      case 'valkyrie_radial':
        if (this._timer > 0.3) this._active = false;
        break;
      case 'ninja_spiral':
        hits = this._updateSpiral(dt, targets);
        if (this._timer >= SPIRAL_DURATION) this._active = false;
        break;
      case 'amazon_arc':
        if (this._timer > ARC_DURATION) this._active = false;
        break;
    }
    return hits;
  };

  // === Mage: Center Explosion ===
  UltimateSystem.prototype._activateMageExplosion = function(targets) {
    var hits = [];
    var dmg = Math.round(this.player.damage * 5);
    for (var i = 0; i < targets.length; i++) {
      var t = targets[i];
      if (t.hp <= 0) continue;
      if (SG.dist(this.player, t) <= ULTIMATE_RADIUS) {
        t.hp -= dmg;
        if (t.hp <= 0) hits.push(t);
      }
    }
    this._visuals = { type: 'explosion', x: this.player.x, y: this.player.y, radius: ULTIMATE_RADIUS, timer: 0 };
    return hits;
  };

  // === Archer: 360 Arrow Rain ===
  UltimateSystem.prototype._activateArcherArrowRain = function() {
    this._arrows = [];
    for (var i = 0; i < ARROW_COUNT; i++) {
      var angle = (i / ARROW_COUNT) * Math.PI * 2;
      this._arrows.push({
        x: this.player.x, y: this.player.y,
        vx: Math.cos(angle) * ARROW_SPEED,
        vy: Math.sin(angle) * ARROW_SPEED,
        angle: angle, traveled: 0, hitIds: {}
      });
    }
  };

  UltimateSystem.prototype._updateArrows = function(dt, targets) {
    var hits = [];
    var dmg = Math.round(this.player.damage * 3);
    for (var i = this._arrows.length - 1; i >= 0; i--) {
      var a = this._arrows[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.traveled += ARROW_SPEED * dt;
      if (a.traveled >= ARROW_RANGE) { this._arrows.splice(i, 1); continue; }
      for (var j = 0; j < targets.length; j++) {
        var t = targets[j];
        if (t.hp <= 0 || a.hitIds[t.id]) continue;
        if (SG.dist(a, t) < t.hitboxRadius + 10) {
          t.hp -= dmg;
          a.hitIds[t.id] = true;
          if (t.hp <= 0) hits.push(t);
        }
      }
    }
    return hits;
  };

  // === Knight: Golden Dash ===
  UltimateSystem.prototype._activateKnightDash = function() {
    var dir = this.player.facingLeft ? -1 : 1;
    this._dashDir = { x: dir, y: 0 };
    this._dashStart = { x: this.player.x, y: this.player.y };
    this._dashHitIds = {};
  };

  UltimateSystem.prototype._updateDash = function(dt, targets) {
    var hits = [];
    var dmg = Math.round(this.player.damage * 4);
    // Move player
    this.player.x += this._dashDir.x * DASH_SPEED * dt;
    this.player.y += this._dashDir.y * DASH_SPEED * dt;
    // Hit enemies along path
    for (var i = 0; i < targets.length; i++) {
      var t = targets[i];
      if (t.hp <= 0 || this._dashHitIds[t.id]) continue;
      if (SG.dist(this.player, t) < this.player.hitboxRadius + t.hitboxRadius + 30) {
        t.hp -= dmg;
        this._dashHitIds[t.id] = true;
        if (t.hp <= 0) hits.push(t);
      }
    }
    return hits;
  };

  // === Valkyrie: Radial Thrusts ===
  UltimateSystem.prototype._activateValkyrieRadial = function(targets) {
    var hits = [];
    var dmg = Math.round(this.player.damage * 3);
    this._thrusts = [];
    for (var i = 0; i < THRUST_DIRECTIONS; i++) {
      var angle = (i / THRUST_DIRECTIONS) * Math.PI * 2;
      this._thrusts.push({ angle: angle, progress: 0 });
      // Damage in thrust direction
      for (var j = 0; j < targets.length; j++) {
        var t = targets[j];
        if (t.hp <= 0) continue;
        var dx = t.x - this.player.x, dy = t.y - this.player.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 180) continue;
        var tAngle = Math.atan2(dy, dx);
        var diff = tAngle - angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) < 0.3) { // narrow cone
          t.hp -= dmg;
          if (t.hp <= 0) hits.push(t);
        }
      }
    }
    return hits;
  };

  // === Ninja: Spiral Shuriken ===
  UltimateSystem.prototype._activateNinjaSpiral = function() {
    this._spiral = { x: this.player.x, y: this.player.y, angle: 0, radius: 20, hitIds: {} };
  };

  UltimateSystem.prototype._updateSpiral = function(dt, targets) {
    var hits = [];
    if (!this._spiral) return hits;
    var s = this._spiral;
    var dmg = Math.round(this.player.damage * 2);
    s.angle += 8 * dt;
    s.radius += SPIRAL_SPEED * dt;
    s.x = this.player.x + Math.cos(s.angle) * s.radius;
    s.y = this.player.y + Math.sin(s.angle) * s.radius;
    // Hit enemies
    for (var i = 0; i < targets.length; i++) {
      var t = targets[i];
      if (t.hp <= 0 || s.hitIds[t.id]) continue;
      if (SG.dist(s, t) < t.hitboxRadius + 40) {
        t.hp -= dmg;
        s.hitIds[t.id] = true;
        if (t.hp <= 0) hits.push(t);
      }
    }
    if (s.radius > 350) this._spiral = null;
    return hits;
  };

  // === Amazon: Electric Arc Expansion ===
  UltimateSystem.prototype._activateAmazonArc = function(targets) {
    var hits = [];
    var dmg = Math.round(this.player.damage * 4);
    for (var i = 0; i < targets.length; i++) {
      var t = targets[i];
      if (t.hp <= 0) continue;
      if (SG.dist(this.player, t) <= ULTIMATE_RADIUS + 50) {
        t.hp -= dmg;
        if (t.hp <= 0) hits.push(t);
      }
    }
    this._arc = { x: this.player.x, y: this.player.y, timer: 0 };
    return hits;
  };

  // === Visual Data ===
  UltimateSystem.prototype.getVisual = function() {
    if (!this._active) return null;
    switch (this.type) {
      case 'mage_explosion':
        return { type: 'explosion', x: this.player.x, y: this.player.y, progress: this._timer / 0.5, radius: ULTIMATE_RADIUS };
      case 'archer_arrowrain':
        return { type: 'arrowrain', arrows: this._arrows };
      case 'knight_dash':
        return { type: 'dash', x: this.player.x, y: this.player.y, start: this._dashStart, progress: this._timer / DASH_DURATION };
      case 'valkyrie_radial':
        return { type: 'radial', x: this.player.x, y: this.player.y, thrusts: this._thrusts, progress: this._timer / 0.3 };
      case 'ninja_spiral':
        return { type: 'spiral', spiral: this._spiral, cx: this.player.x, cy: this.player.y };
      case 'amazon_arc':
        return { type: 'arc', x: this.player.x, y: this.player.y, progress: this._timer / ARC_DURATION };
      default:
        return null;
    }
  };

  UltimateSystem.prototype.isActive = function() { return this._active; };

  SG.UltimateSystem = UltimateSystem;
})();
