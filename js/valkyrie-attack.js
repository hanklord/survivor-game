// valkyrie-attack.js — 女武神長槍貫通攻擊
(function() {
  window.SG = window.SG || {};

  var BASE_CD = 0.8;
  var BASE_RANGE = 120;
  var BASE_DAMAGE = 20;
  var THRUST_WIDTH = 33; // 判定寬度
  var VISUAL_DURATION = 0.2; // 特效持續時間

  function ValkyrieAttack(player) {
    this.player = player;
    this.cd = BASE_CD;
    this.range = BASE_RANGE;
    this.damage = BASE_DAMAGE;
    this.timer = 0;
    this._visual = null;
    this._visual2 = null;
    this._visual3 = null;
    this._shockwaves = [];
    this._lastHits = [];
    this.level = 0;
    this._rangeUps = 0;
  }

  // 取得下一次升級類型
  ValkyrieAttack.prototype.getNextUpgradeType = function() {
    var nextLv = this.level + 1;
    // Lv2, Lv4, Lv6 為距離（且距離未滿 3 次）
    if ((nextLv === 2 || nextLv === 4 || nextLv === 6) && this._rangeUps < 3) return 'range';
    return 'rate';
  };

  ValkyrieAttack.prototype.upgrade = function() {
    if (this.level >= 20) return;
    var type = this.getNextUpgradeType();
    if (type === 'rate') {
      this.cd = Math.max(0.2, this.cd - 0.03);
    } else {
      this.range += 50;
      this._rangeUps++;
    }
    this.level++;
  };

  var KNOCKBACK_RADIUS = 80;
  var KNOCKBACK_DAMAGE_MULT = 0.25;
  var KNOCKBACK_FORCE = 15; // px 推開距離

  ValkyrieAttack.prototype.update = function(dt, enemies, bosses) {
    var hits = [];
    this._lastHits = [];

    // 更新視覺效果
    if (this._visual) {
      this._visual.progress += dt / VISUAL_DURATION;
      if (this._visual.progress >= 1) this._visual = null;
    }
    // 更新震退波視覺
    if (this._shockwaves) {
      for (var si = this._shockwaves.length - 1; si >= 0; si--) {
        this._shockwaves[si].progress += dt / 0.4;
        if (this._shockwaves[si].progress >= 1) this._shockwaves.splice(si, 1);
      }
    }

    // 攻擊冷卻
    this.timer -= dt;
    if (this.timer <= 0) {
      var targets = enemies.concat(bosses);
      if (targets.length > 0) {
        this.timer = this.cd;

        // 找最近敵人
        var nearest = null, minD = Infinity;
        for (var i = 0; i < targets.length; i++) {
          var d = SG.dist(this.player, targets[i]);
          if (d < minD) { minD = d; nearest = targets[i]; }
        }

        var angle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);

        // 執行刺擊
        this._doThrust(angle, targets, hits);
        var firstVisual = this._visual; // 保存第一支視覺

        // Lv15+：雙刺（第二支隨機方向）
        if (this.level >= 15) {
          var randomAngle = Math.random() * Math.PI * 2;
          this._doThrust(randomAngle, targets, hits);
          this._visual2 = this._visual; // 第二支視覺
          this._visual = firstVisual;   // 恢復第一支
        }

        // Lv20+（player.level >= 20）：三刺（第三支隨機方向）
        if (this.player.level >= 20) {
          var randomAngle3 = Math.random() * Math.PI * 2;
          this._doThrust(randomAngle3, targets, hits);
          this._visual3 = this._visual; // 第三支視覺
          this._visual = firstVisual;   // 恢復第一支
        }

        // 觸發攻擊動畫
        this.player.triggerAttack();
      }
    }

    // 更新第二支視覺
    if (this._visual2) {
      this._visual2.progress += dt / VISUAL_DURATION;
      if (this._visual2.progress >= 1) this._visual2 = null;
    }

    // 更新第三支視覺
    if (this._visual3) {
      this._visual3.progress += dt / VISUAL_DURATION;
      if (this._visual3.progress >= 1) this._visual3 = null;
    }

    return hits;
  };

  // 單次刺擊判定（貫通 + 震退）
  ValkyrieAttack.prototype._doThrust = function(angle, targets, hits) {
    // 視覺
    this._visual = { angle: angle, progress: 0, range: this.range };

    var hitAny = false;
    var farthestHit = { x: this.player.x, y: this.player.y };

    for (var i = 0; i < targets.length; i++) {
      var t = targets[i];
      if (t.hp <= 0) continue;
      var dx = t.x - this.player.x;
      var dy = t.y - this.player.y;
      var along = dx * Math.cos(angle) + dy * Math.sin(angle);
      var perp = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle));

      if (along > 0 && along <= this.range + t.hitboxRadius && perp <= THRUST_WIDTH + t.hitboxRadius) {
        t.hp -= this.damage;
        this._lastHits.push({ x: t.x, y: t.y, dmg: this.damage });
        if (t.hp <= 0) hits.push(t);
        hitAny = true;
        if (along > SG.dist(this.player, farthestHit)) {
          farthestHit = { x: t.x, y: t.y };
        }
      }
    }

    // Lv5+：震退效果（從玩家位置產生 AOE）
    if (this.level >= 5 && hitAny) {
      var shockX = this.player.x;
      var shockY = this.player.y;
      console.log('[Valkyrie] Shockwave at player', shockX.toFixed(0), shockY.toFixed(0));
      this._shockwaves.push({ x: shockX, y: shockY, progress: 0 });
      // 震退判定（玩家周圍 80px）
      var knockDmg = Math.round(this.damage * KNOCKBACK_DAMAGE_MULT);
      for (var i = 0; i < targets.length; i++) {
        var t = targets[i];
        if (t.hp <= 0) continue;
        var dist = Math.sqrt((t.x - shockX) * (t.x - shockX) + (t.y - shockY) * (t.y - shockY));
        if (dist <= KNOCKBACK_RADIUS + t.hitboxRadius) {
          t.hp -= knockDmg;
          this._lastHits.push({ x: t.x, y: t.y, dmg: knockDmg });
          if (t.hp <= 0) { hits.push(t); continue; }
          // Knockback 推開（方向：從玩家指向敵人，向外推）
          var ka = Math.atan2(t.y - shockY, t.x - shockX);
          t.x += Math.cos(ka) * KNOCKBACK_FORCE;
          t.y += Math.sin(ka) * KNOCKBACK_FORCE;
        }
      }
    }
  };

  ValkyrieAttack.prototype.getVisual = function() {
    return {
      thrust: this._visual,
      thrust2: this._visual2 || null,
      thrust3: this._visual3 || null,
      shockwaves: this._shockwaves || []
    };
  };

  ValkyrieAttack.prototype.getLastHits = function() {
    var h = this._lastHits;
    this._lastHits = [];
    return h;
  };

  SG.ValkyrieAttack = ValkyrieAttack;
})();
