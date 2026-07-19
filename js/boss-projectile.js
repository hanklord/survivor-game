// boss-projectile.js — Hardcore Boss 遠距離攻擊系統
(function() {
  window.SG = window.SG || {};

  var BASE_CD = 3.5;         // 基礎射擊間隔（秒）
  var CD_REDUCTION = 0.3;    // 每 Hardcore 等級減少的 CD
  var MIN_CD = 1.5;          // 最短 CD
  var PROJECTILE_SPEED = 200; // px/s（中速，玩家可閃避）
  var PROJECTILE_SIZE = 14;
  var IMPACT_DURATION = 0.3;
  var TRAIL_LENGTH = 6;

  function BossProjectileSystem() {
    this.projectiles = [];  // { x, y, vx, vy, damage, trail: [{x,y}] }
    this.impacts = [];      // { x, y, progress }
    this._timers = {};      // per-boss fire timers by boss id
  }

  BossProjectileSystem.prototype.update = function(dt, bosses, player, hardcoreLevel) {
    if (hardcoreLevel <= 0) return;

    var cd = Math.max(MIN_CD, BASE_CD - (hardcoreLevel - 1) * CD_REDUCTION);

    // Each boss fires independently
    for (var i = 0; i < bosses.length; i++) {
      var b = bosses[i];
      if (!this._timers[b.id]) this._timers[b.id] = cd * Math.random(); // stagger initial shots
      this._timers[b.id] -= dt;
      if (this._timers[b.id] <= 0) {
        this._timers[b.id] = cd;
        this._fire(b, player);
      }
    }

    // Update projectiles
    for (var i = this.projectiles.length - 1; i >= 0; i--) {
      var p = this.projectiles[i];
      // Save trail
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > TRAIL_LENGTH) p.trail.shift();
      // Move
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      // Remove if expired
      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }
      // Hit detection vs player
      if (SG.dist(p, player) < (player.hitboxRadius + PROJECTILE_SIZE / 2)) {
        this.impacts.push({ x: p.x, y: p.y, progress: 0 });
        this.projectiles.splice(i, 1);
        // Return damage info (caller handles actual damage)
        p._hit = true;
      }
    }

    // Update impacts
    for (var i = this.impacts.length - 1; i >= 0; i--) {
      this.impacts[i].progress += dt / IMPACT_DURATION;
      if (this.impacts[i].progress >= 1) this.impacts.splice(i, 1);
    }
  };

  BossProjectileSystem.prototype._fire = function(boss, player) {
    var angle = Math.atan2(player.y - boss.y, player.x - boss.x);
    this.projectiles.push({
      x: boss.x,
      y: boss.y,
      vx: Math.cos(angle) * PROJECTILE_SPEED,
      vy: Math.sin(angle) * PROJECTILE_SPEED,
      damage: Math.round(boss.damage * 0.5),
      life: 4, // max 4 seconds alive
      trail: [],
      _hit: false
    });
  };

  // Check hits and return total damage to apply
  BossProjectileSystem.prototype.getHits = function() {
    var totalDmg = 0;
    for (var i = this.projectiles.length - 1; i >= 0; i--) {
      if (this.projectiles[i]._hit) {
        totalDmg += this.projectiles[i].damage;
        this.projectiles.splice(i, 1);
      }
    }
    return totalDmg;
  };

  // Visual data for renderer
  BossProjectileSystem.prototype.getVisual = function() {
    return {
      projectiles: this.projectiles,
      impacts: this.impacts,
      size: PROJECTILE_SIZE
    };
  };

  // Reset (for level transitions)
  BossProjectileSystem.prototype.reset = function() {
    this.projectiles = [];
    this.impacts = [];
    this._timers = {};
  };

  SG.BossProjectileSystem = BossProjectileSystem;
})();
