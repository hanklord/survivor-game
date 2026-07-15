// weapons.js — 新武器系統（旋轉護盾、範圍爆炸、追蹤飛彈）
(function() {
  window.SG = window.SG || {};

  // === 旋轉護盾 (Orbiting Shield) ===
  var SHIELD_ORBIT_RADIUS = 80;
  var SHIELD_BALL_SIZE = 14;
  var SHIELD_SPEED = 3; // rad/s
  var SHIELD_DAMAGE = 8;
  var SHIELD_KNOCKBACK = 5;
  var SHIELD_HIT_CD = 0.3; // 對同一敵人的打擊間隔

  function OrbitingShield(player) {
    this.player = player;
    this.count = 1;       // 球體數量
    this.damage = SHIELD_DAMAGE;
    this.angle = 0;
    this.hitTimers = {};  // 避免連續傷害
    this.ballSize = SHIELD_BALL_SIZE;
    this.active = true;
  }

  OrbitingShield.prototype.update = function(dt, enemies, bosses) {
    this.angle += SHIELD_SPEED * dt;
    var hits = [];
    for (var i = 0; i < this.count; i++) {
      var a = this.angle + (Math.PI * 2 / this.count) * i;
      var sx = this.player.x + Math.cos(a) * SHIELD_ORBIT_RADIUS;
      var sy = this.player.y + Math.sin(a) * SHIELD_ORBIT_RADIUS;
      // 碰撞偵測
      var targets = enemies.concat(bosses);
      for (var j = 0; j < targets.length; j++) {
        var e = targets[j];
        var key = e.id + '_' + i;
        if (this.hitTimers[key] && this.hitTimers[key] > 0) continue;
        if (SG.dist({x:sx,y:sy}, e) < (SHIELD_BALL_SIZE / 2 + e.hitboxRadius)) {
          e.hp -= this.damage;
          // 擊退
          var ka = Math.atan2(e.y - this.player.y, e.x - this.player.x);
          e.x += Math.cos(ka) * SHIELD_KNOCKBACK;
          e.y += Math.sin(ka) * SHIELD_KNOCKBACK;
          this.hitTimers[key] = SHIELD_HIT_CD;
          if (e.hp <= 0) hits.push(e);
        }
      }
    }
    // 更新 CD
    for (var k in this.hitTimers) {
      this.hitTimers[k] -= dt;
      if (this.hitTimers[k] <= 0) delete this.hitTimers[k];
    }
    return hits; // 回傳被殺死的敵人
  };

  OrbitingShield.prototype.getPositions = function() {
    var positions = [];
    for (var i = 0; i < this.count; i++) {
      var a = this.angle + (Math.PI * 2 / this.count) * i;
      positions.push({
        x: this.player.x + Math.cos(a) * SHIELD_ORBIT_RADIUS,
        y: this.player.y + Math.sin(a) * SHIELD_ORBIT_RADIUS,
        size: this.ballSize
      });
    }
    return positions;
  };

  // === 範圍爆炸 (Nova) ===
  var NOVA_BASE_CD = 4;
  var NOVA_RADIUS = 150;
  var NOVA_DAMAGE = 15;
  var NOVA_EXPAND_SPEED = 300; // px/s
  var NOVA_DURATION = 0.4;

  function Nova(player) {
    this.player = player;
    this.cd = NOVA_BASE_CD;
    this.timer = NOVA_BASE_CD;
    this.damage = NOVA_DAMAGE;
    this.radius = NOVA_RADIUS;
    this.ballSize = SHIELD_BALL_SIZE;
    this.active = true;
    // 視覺狀態
    this.expanding = false;
    this.expandRadius = 0;
    this.expandLife = 0;
  }

  Nova.prototype.update = function(dt, enemies, bosses) {
    var hits = [];
    this.timer -= dt;

    // 視覺擴散更新
    if (this.expanding) {
      this.expandRadius += NOVA_EXPAND_SPEED * dt;
      this.expandLife -= dt;
      if (this.expandLife <= 0) this.expanding = false;
    }

    if (this.timer <= 0) {
      this.timer = this.cd;
      this.expanding = true;
      this.expandRadius = 0;
      this.expandLife = NOVA_DURATION;
      // 對範圍內敵人造成傷害
      var targets = enemies.concat(bosses);
      for (var i = 0; i < targets.length; i++) {
        var e = targets[i];
        if (SG.dist(this.player, e) < this.radius) {
          e.hp -= this.damage;
          if (e.hp <= 0) hits.push(e);
        }
      }
    }
    return hits;
  };

  Nova.prototype.getVisual = function() {
    if (!this.expanding) return null;
    return {
      x: this.player.x,
      y: this.player.y,
      radius: this.expandRadius,
      alpha: this.expandLife / NOVA_DURATION
    };
  };

  // === 追蹤飛彈 (Homing Missile) ===
  var MISSILE_SPEED = 240;
  var MISSILE_TURN_RATE = 3; // rad/s
  var MISSILE_DAMAGE = 20;
  var MISSILE_AOE_RADIUS = 50;
  var MISSILE_AOE_DAMAGE = 10;
  var MISSILE_CD = 2;
  var MISSILE_LIFE = 4;

  function HomingMissile() {
    this.x = 0; this.y = 0;
    this.angle = 0;
    this.speed = MISSILE_SPEED;
    this.damage = MISSILE_DAMAGE;
    this.life = 0;
    this.target = null;
    this.active = false;
    this.trail = []; // 拖尾座標
  }

  HomingMissile.prototype.init = function(x, y, target) {
    this.x = x; this.y = y;
    this.angle = Math.atan2(target.y - y, target.x - x);
    this.target = target;
    this.life = MISSILE_LIFE;
    this.ballSize = SHIELD_BALL_SIZE;
    this.active = true;
    this.trail = [];
  };

  HomingMissile.prototype.update = function(dt, enemies, bosses) {
    if (!this.active) return null;
    this.life -= dt;
    if (this.life <= 0) { this.active = false; return null; }

    // 追蹤轉向（有轉向速率限制）
    if (this.target && this.target.hp > 0) {
      var desired = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      var diff = desired - this.angle;
      // 正規化角度差
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      var maxTurn = MISSILE_TURN_RATE * dt;
      if (Math.abs(diff) < maxTurn) this.angle = desired;
      else this.angle += (diff > 0 ? maxTurn : -maxTurn);
    }

    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;

    // 拖尾
    this.trail.push({x: this.x, y: this.y});
    if (this.trail.length > 8) this.trail.shift();

    // 碰撞
    var targets = enemies.concat(bosses);
    for (var i = 0; i < targets.length; i++) {
      var e = targets[i];
      if (SG.dist(this, e) < (e.hitboxRadius + 8)) {
        e.hp -= this.damage;
        this.active = false;
        // AoE 爆炸
        var aoeHits = [];
        for (var j = 0; j < targets.length; j++) {
          if (j === i) continue;
          if (SG.dist(this, targets[j]) < MISSILE_AOE_RADIUS) {
            targets[j].hp -= MISSILE_AOE_DAMAGE;
            if (targets[j].hp <= 0) aoeHits.push(targets[j]);
          }
        }
        if (e.hp <= 0) aoeHits.push(e);
        return { hit: true, aoeHits: aoeHits, x: this.x, y: this.y };
      }
    }
    return null;
  };

  // 飛彈發射器
  function MissileLauncher(player) {
    this.player = player;
    this.cd = MISSILE_CD;
    this.timer = 0;
    this.missiles = [];
    this.ballSize = SHIELD_BALL_SIZE;
    this.active = true;
    this.missileCount = 1;
    this.pool = new SG.ObjectPool(function() { return new HomingMissile(); });
  }

  MissileLauncher.prototype.update = function(dt, enemies, bosses) {
    var allHits = [];
    this.timer -= dt;

    // 發射新飛彈（瞄準最遠敵人）
    if (this.timer <= 0 && (enemies.length || bosses.length)) {
      this.timer = this.cd;
      var targets = enemies.concat(bosses);
      var farthest = targets[0];
      var maxD = 0;
      for (var i = 0; i < targets.length; i++) {
        var d = SG.dist(this.player, targets[i]);
        if (d > maxD) { maxD = d; farthest = targets[i]; }
      }
      // 發射 missileCount 顆飛彈
      for (var mc = 0; mc < this.missileCount; mc++) {
        var tgt = targets[mc % targets.length];
        var m = this.pool.get();
        m.init(this.player.x, this.player.y, tgt);
        this.missiles.push(m);
      }
    }

    // 更新飛彈
    for (var i = this.missiles.length - 1; i >= 0; i--) {
      var result = this.missiles[i].update(dt, enemies, bosses);
      if (result && result.aoeHits) {
        for (var j = 0; j < result.aoeHits.length; j++) allHits.push(result.aoeHits[j]);
      }
      if (!this.missiles[i].active) {
        this.pool.release(this.missiles[i]);
        this.missiles.splice(i, 1);
      }
    }
    return allHits;
  };

  // 武器管理器

  // === 落雷 (Thunder/Lightning) ===
  var THUNDER_BASE_CD = 3;       // 基礎間隔秒
  var THUNDER_CD_REDUCE = 0.4;   // 每級減少秒數
  var THUNDER_MIN_CD = 0.8;      // 最短間隔
  var THUNDER_BASE_DAMAGE = 25;
  var THUNDER_DMG_PER_LVL = 10;
  var THUNDER_VISUAL_DURATION = 0.2; // 閃電視覺持續時間

  function Thunder(player) {
    this.player = player;
    this.level = 1;
    this.cd = THUNDER_BASE_CD;
    this.damage = THUNDER_BASE_DAMAGE;
    this.timer = this.cd;
    this.visual = null; // { x, y, timer } 閃電視覺效果
  }

  Thunder.prototype.upgrade = function() {
    if (this.level >= 15) return;
    this.level++;
    this.cd = Math.max(THUNDER_MIN_CD, THUNDER_BASE_CD - (this.level - 1) * THUNDER_CD_REDUCE);
    this.damage = THUNDER_BASE_DAMAGE + (this.level - 1) * THUNDER_DMG_PER_LVL;
  };

  Thunder.prototype.update = function(dt, enemies, bosses) {
    var hits = [];
    // 更新視覺效果計時
    if (this.visual) {
      this.visual.timer -= dt;
      if (this.visual.timer <= 0) this.visual = null;
    }
    // 落雷計時
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = this.cd;
      // 隨機選一個敵人
      var targets = enemies.concat(bosses);
      if (targets.length > 0) {
        var idx = Math.floor(Math.random() * targets.length);
        var target = targets[idx];
        target.hp -= this.damage;
        if (target.hp <= 0) hits.push(target);
        // 觸發視覺效果
        this.visual = { x: target.x, y: target.y, timer: THUNDER_VISUAL_DURATION };
      }
    }
    return hits;
  };

  Thunder.prototype.getVisual = function() {
    return this.visual;
  };

  // === 連鎖閃電 (Chain Lightning) ===
  var CHAIN_DAMAGE = 20;
  var CHAIN_CD = 2.5;
  var CHAIN_RANGE = 150;
  var CHAIN_MAX = 8;
  var CHAIN_VISUAL_DURATION = 0.25;

  function ChainLightning(player) {
    this.player = player;
    this.damage = CHAIN_DAMAGE;
    this.cd = CHAIN_CD;
    this.timer = this.cd;
    this.chains = 1; // 連鎖次數（Lv1=1, Lv2=2...）
    this.visual = null; // { segments: [{x1,y1,x2,y2},...], timer }
  }

  ChainLightning.prototype.upgrade = function() {
    if (this.chains >= 15) return;
    this.chains = Math.min(this.chains + 1, 15);
  };

  ChainLightning.prototype.update = function(dt, enemies, bosses) {
    var hits = [];
    if (this.visual) {
      this.visual.timer -= dt;
      if (this.visual.timer <= 0) this.visual = null;
    }
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = this.cd;
      var targets = enemies.concat(bosses);
      if (targets.length === 0) return hits;

      // 找最近敵人作為第一個目標
      var current = { x: this.player.x, y: this.player.y };
      var hitIds = {};
      var segments = [];

      for (var c = 0; c < this.chains; c++) {
        var nearest = null, minD = Infinity;
        for (var i = 0; i < targets.length; i++) {
          if (targets[i].hp <= 0 || hitIds[targets[i].id]) continue;
          var d = SG.dist(current, targets[i]);
          if (d < minD && d <= CHAIN_RANGE) { minD = d; nearest = targets[i]; }
        }
        if (!nearest) break;

        segments.push({ x1: current.x, y1: current.y, x2: nearest.x, y2: nearest.y });
        nearest.hp -= this.damage;
        hitIds[nearest.id] = true;
        if (nearest.hp <= 0) hits.push(nearest);
        current = { x: nearest.x, y: nearest.y };
      }

      if (segments.length > 0) {
        this.visual = { segments: segments, timer: CHAIN_VISUAL_DURATION };
      }
    }
    return hits;
  };

  ChainLightning.prototype.getVisual = function() {
    return this.visual;
  };

  function WeaponManager(player) {
    this.player = player;
    this.shield = null;
    this.nova = null;
    this.launcher = null;
    this.thunder = null;
    this.chainLightning = null;
  }

  WeaponManager.prototype.unlockShield = function() {
    var totalLvl = this.shield ? this.shield.count + (this.shield.ballSize > 14 ? Math.floor((this.shield.ballSize - 14) / 4) : 0) : 0;
    if (totalLvl >= 15) return;
    if (!this.shield) this.shield = new OrbitingShield(this.player);
    else if (this.shield.count < 6) this.shield.count++;
    else this.shield.ballSize = Math.min(this.shield.ballSize + 4, 40);
  };

  WeaponManager.prototype.unlockNova = function() {
    if (this.nova && this.nova._level >= 15) return;
    if (!this.nova) this.nova = new Nova(this.player);
    else { this.nova.cd *= 0.8; this.nova.damage *= 1.2; this.nova._level = (this.nova._level || 1) + 1; }
  };

  WeaponManager.prototype.unlockMissile = function() {
    if (!this.launcher) this.launcher = new MissileLauncher(this.player);
    else { this.launcher.missileCount = Math.min(this.launcher.missileCount + 1, 15); }
  };

  WeaponManager.prototype.unlockThunder = function() {
    if (!this.thunder) this.thunder = new Thunder(this.player);
    else this.thunder.upgrade();
  };

  WeaponManager.prototype.unlockChainLightning = function() {
    if (!this.chainLightning) this.chainLightning = new ChainLightning(this.player);
    else this.chainLightning.upgrade();
  };

  WeaponManager.prototype.update = function(dt, enemies, bosses) {
    var allHits = [];
    if (this.shield) {
      var h = this.shield.update(dt, enemies, bosses);
      for (var i = 0; i < h.length; i++) allHits.push(h[i]);
    }
    if (this.nova) {
      var h = this.nova.update(dt, enemies, bosses);
      for (var i = 0; i < h.length; i++) allHits.push(h[i]);
    }
    if (this.chainLightning) {
      var h = this.chainLightning.update(dt, enemies, bosses);
      for (var i = 0; i < h.length; i++) allHits.push(h[i]);
    }
    if (this.thunder) {
      var h = this.thunder.update(dt, enemies, bosses);
      for (var i = 0; i < h.length; i++) allHits.push(h[i]);
    }
    if (this.launcher) {
      var h = this.launcher.update(dt, enemies, bosses);
      for (var i = 0; i < h.length; i++) allHits.push(h[i]);
    }
    return allHits; // 被武器殺死的敵人
  };

  // 取得視覺資料供 renderer 繪製
  WeaponManager.prototype.getVisuals = function() {
    return {
      shieldPositions: this.shield ? this.shield.getPositions() : [],
      novaVisual: this.nova ? this.nova.getVisual() : null,
      missiles: this.launcher ? this.launcher.missiles : [],
      thunderVisual: this.thunder ? this.thunder.getVisual() : null,
      chainVisual: this.chainLightning ? this.chainLightning.getVisual() : null
    };
  };

  SG.WeaponManager = WeaponManager;
})();
