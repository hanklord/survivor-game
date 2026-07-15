// archer-attack.js — 弓手弓箭系統（支援擴散）
(function() {
  window.SG = window.SG || {};

  var BASE_CD = 0.67;
  var BASE_DAMAGE = 12;
  var ARROW_SPEED = 500;
  var ARROW_RANGE = 400;
  var SPREAD_ANGLE = 0.15; // 每支額外箭的角度偏移（rad）

  var ARCHER_FIRE_CHANCE = 0.3;
  var ARCHER_FIRE_DURATION = 2.0;
  var ARCHER_FIRE_DAMAGE_RATIO = 0.3;
  var ARCHER_FIRE_TICK = 0.5;
  var ARCHER_FIRE_RADIUS = 45;

  function ArcherAttack(player) {
    this.player = player;
    this.cd = BASE_CD;
    this.damage = BASE_DAMAGE;
    this.arrowCount = 1;
    this.timer = 0;
    this.arrows = [];
    this._lastHits = [];
    this._firedThisFrame = false;
    this._fireZones = []; // 燃燒區域
    this.level = 1;
  }

  ArcherAttack.prototype.upgrade = function() {
    if (this.level >= 15) return;
    this.level++;
    // 奇數等級加數量，偶數等級加頻率
    if (this.level % 2 === 0) {
      this.cd = Math.max(0.4, this.cd - 0.04);
    } else {
      this.arrowCount = Math.min(this.arrowCount + 1, 9);
    if (this.level >= 15) return;
    }
  };

  ArcherAttack.prototype.update = function(dt, enemies, bosses) {
    var hits = [];
    this._lastHits = [];
    this._firedThisFrame = false;

    // 發射箭矢
    this.timer -= dt;
    if (this.timer <= 0) {
      var targets = enemies.concat(bosses);
      if (targets.length > 0) {
        this.timer = this.cd;
        this._firedThisFrame = true;
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
        if (SG.dist(ar, t) < 20 + t.hitboxRadius) {
          t.hp -= ar.damage;
          this._lastHits.push({ x: t.x, y: t.y, dmg: ar.damage });
          if (t.hp <= 0) hits.push(t);
          hit = true;
          // Lv13+：火焰附加（30% 機率）
          if (this.level >= 13 && Math.random() < ARCHER_FIRE_CHANCE) {
            this._fireZones.push({ x: t.x, y: t.y, life: ARCHER_FIRE_DURATION, tickTimer: 0, dmg: Math.round(ar.damage * ARCHER_FIRE_DAMAGE_RATIO) });
          }
          break;
        }
      }
      if (hit) this.arrows.splice(i, 1);
    }

    // 更新燃燒區域 DOT
    for (var fi = this._fireZones.length - 1; fi >= 0; fi--) {
      var fz = this._fireZones[fi];
      fz.life -= dt;
      if (fz.life <= 0) { this._fireZones.splice(fi, 1); continue; }
      fz.tickTimer += dt;
      if (fz.tickTimer >= ARCHER_FIRE_TICK) {
        fz.tickTimer = 0;
        var allT = enemies.concat(bosses);
        for (var fi2 = 0; fi2 < allT.length; fi2++) {
          var ft = allT[fi2];
          if (ft.hp <= 0) continue;
          if (SG.dist(fz, ft) <= ARCHER_FIRE_RADIUS + ft.hitboxRadius) {
            ft.hp -= fz.dmg;
            this._lastHits.push({ x: ft.x, y: ft.y, dmg: fz.dmg });
            if (ft.hp <= 0) hits.push(ft);
          }
        }
      }
    }

    return hits;
  };

  ArcherAttack.prototype.getVisual = function() {
    return this.arrows.length > 0 ? this.arrows : null;
  };

  ArcherAttack.prototype.getFireZones = function() {
    return this._fireZones;
  };

  ArcherAttack.prototype.getLastHits = function() {
    var h = this._lastHits;
    this._lastHits = [];
    return h;
  };

  ArcherAttack.prototype.didFire = function() { return this._firedThisFrame; };

  ArcherAttack.prototype.getPiercingArrow = function() {
    if (!this._piercing) this._piercing = new SG.PiercingArrow(this.player);
    return this._piercing;
  };

  ArcherAttack.prototype.getExplosiveArrow = function() {
    if (!this._explosive) this._explosive = new SG.ExplosiveArrow(this.player);
    return this._explosive;
  };

  SG.ArcherAttack = ArcherAttack;
})();

  // === 爆炸箭 (Explosive Arrow) ===
  var EXPLODE_CD = 3;
  var EXPLODE_DAMAGE = 20;
  var EXPLODE_RADIUS = 50;
  var EXPLODE_RADIUS_PER_LVL = 20;
  var EXPLODE_ARROW_SPEED = 400;
  var EXPLODE_VISUAL_DURATION = 0.3;

  function ExplosiveArrow(player) {
    this.player = player;
    this.cd = EXPLODE_CD;
    this.damage = EXPLODE_DAMAGE;
    this.radius = EXPLODE_RADIUS;
    this.timer = this.cd;
    this.level = 0;
    this.arrow = null; // { x, y, vx, vy, angle }
    this.explosion = null; // { x, y, radius, timer }
  }

  ExplosiveArrow.prototype.upgrade = function() {
    if (this.level >= 15) return;
    this.level++;
    this.radius = EXPLODE_RADIUS + this.level * EXPLODE_RADIUS_PER_LVL;
    if (!this.active) this.active = true;
  };

  ExplosiveArrow.prototype.update = function(dt, enemies, bosses) {
    var hits = [];
    if (!this.level) return hits;

    // 更新爆炸視覺
    if (this.explosion) {
      this.explosion.timer -= dt;
      if (this.explosion.timer <= 0) this.explosion = null;
    }

    // 更新飛行中的爆炸箭
    if (this.arrow) {
      this.arrow.x += this.arrow.vx * dt;
      this.arrow.y += this.arrow.vy * dt;
      this.arrow.dist += EXPLODE_ARROW_SPEED * dt;
      if (this.arrow.dist > 500) { this.arrow = null; return hits; }

      // 碰撞檢測
      var targets = enemies.concat(bosses);
      for (var i = 0; i < targets.length; i++) {
        var t = targets[i];
        if (t.hp <= 0) continue;
        if (SG.dist(this.arrow, t) < 20 + t.hitboxRadius) {
          // 爆炸！
          this.explosion = { x: this.arrow.x, y: this.arrow.y, radius: this.radius, timer: EXPLODE_VISUAL_DURATION };
          // 範圍傷害
          for (var j = 0; j < targets.length; j++) {
            if (targets[j].hp <= 0) continue;
            if (SG.dist(this.arrow, targets[j]) <= this.radius) {
              targets[j].hp -= this.damage;
              if (targets[j].hp <= 0) hits.push(targets[j]);
            }
          }
          this.arrow = null;
          break;
        }
      }
    }

    // 發射新爆炸箭
    if (!this.arrow) {
      this.timer -= dt;
      if (this.timer <= 0) {
        var targets = enemies.concat(bosses);
        if (targets.length > 0) {
          this.timer = this.cd;
          var nearest = null, minD = Infinity;
          for (var k = 0; k < targets.length; k++) {
            var dd = SG.dist(this.player, targets[k]);
            if (dd < minD) { minD = dd; nearest = targets[k]; }
          }
          var angle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);
          this.arrow = {
            x: this.player.x, y: this.player.y,
            vx: Math.cos(angle) * EXPLODE_ARROW_SPEED,
            vy: Math.sin(angle) * EXPLODE_ARROW_SPEED,
            angle: angle, dist: 0
          };
        }
      }
    }
    return hits;
  };

  ExplosiveArrow.prototype.getVisual = function() {
    return { arrow: this.arrow, explosion: this.explosion };
  };

  SG.ExplosiveArrow = ExplosiveArrow;

  // === 貫通箭 (Piercing Arrow) ===
  var PIERCE_CD = 2.5;
  var PIERCE_DAMAGE = 18;
  var PIERCE_SPEED = 600;
  var PIERCE_SPEED_PER_LVL = 50;
  var PIERCE_RANGE = 600;
  var MAX_SKILL_LEVEL = 15;

  function PiercingArrow(player) {
    this.player = player;
    this.cd = PIERCE_CD;
    this.damage = PIERCE_DAMAGE;
    this.speed = PIERCE_SPEED;
    this.timer = this.cd;
    this.level = 0;
    this.arrows = [];
  }

  PiercingArrow.prototype.upgrade = function() {
    if (this.level >= MAX_SKILL_LEVEL) return;
    this.level++;
    this.speed = PIERCE_SPEED + this.level * PIERCE_SPEED_PER_LVL;
    if (!this.active) this.active = true;
  };

  PiercingArrow.prototype.update = function(dt, enemies, bosses) {
    var hits = [];
    if (!this.level) return hits;

    // 發射
    this.timer -= dt;
    if (this.timer <= 0) {
      var targets = enemies.concat(bosses);
      if (targets.length > 0) {
        this.timer = this.cd;
        var nearest = null, minD = Infinity;
        for (var k = 0; k < targets.length; k++) {
          var dd = SG.dist(this.player, targets[k]);
          if (dd < minD) { minD = dd; nearest = targets[k]; }
        }
        var angle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);
        this.arrows.push({
          x: this.player.x, y: this.player.y,
          vx: Math.cos(angle) * this.speed, vy: Math.sin(angle) * this.speed,
          angle: angle, dist: 0, time: 0
        });
      }
    }

    // 更新箭矢（貫穿所有敵人）
    for (var i = this.arrows.length - 1; i >= 0; i--) {
      var ar = this.arrows[i];
      ar.x += ar.vx * dt;
      ar.y += ar.vy * dt;
      ar.dist += this.speed * dt;
      ar.time += dt;
      if (ar.dist > PIERCE_RANGE) { this.arrows.splice(i, 1); continue; }

      // 穿透碰撞（每幀都能命中新敵人）
      var targets = enemies.concat(bosses);
      for (var j = 0; j < targets.length; j++) {
        var t = targets[j];
        if (t.hp <= 0) continue;
        if (SG.dist(ar, t) < 15 + t.hitboxRadius) {
          t.hp -= this.damage;
          if (t.hp <= 0) hits.push(t);
        }
      }
    }
    return hits;
  };

  PiercingArrow.prototype.getVisual = function() {
    return this.arrows.length > 0 ? this.arrows : null;
  };

  SG.PiercingArrow = PiercingArrow;
