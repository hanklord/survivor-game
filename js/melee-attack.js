// melee-attack.js — 近戰斬擊系統
(function() {
  window.SG = window.SG || {};

  var BASE_RANGE = 80;
  var BASE_DAMAGE = 15;
  var BASE_CD = 0.8;
  var SLASH_DURATION = 0.35; // 延長以播放 4 幀動畫
  var SLASH_FRAMES = 6;

  function MeleeAttack(player) {
    this.player = player;
    this.range = BASE_RANGE;
    this.damage = BASE_DAMAGE;
    this.cd = BASE_CD;
    this.timer = 0;
    this.slashVisual = null;
    this._lastHits = []; // { x, y, angle, timer, range }
  }

  MeleeAttack.prototype.update = function(dt, enemies, bosses) {
    var hits = [];
    // 更新斬擊視覺
    if (this.slashVisual) {
      this.slashVisual.timer -= dt;
      if (this.slashVisual.timer <= 0) this.slashVisual = null;
    this._lastHits = [];
    }
    // 攻擊計時
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = this.cd;
      var targets = enemies.concat(bosses);
      if (targets.length === 0) return hits;

      // 先決定斬擊方向（朝最近敵人）
      var slashAngle = this.player.facingLeft ? Math.PI : 0;
      var nearest = null, minD = Infinity;
      for (var k = 0; k < targets.length; k++) {
        var dd = SG.dist(this.player, targets[k]);
        if (dd < minD) { minD = dd; nearest = targets[k]; }
      }
      if (nearest) slashAngle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);

      // 只傷害在斬擊弧形範圍內的敵人（距離內 + 角度±60°）
      var ARC_HALF = 1.05; // ±60° = 120° 弧
      var hitAny = false;
      for (var i = 0; i < targets.length; i++) {
        var t = targets[i];
        var d = SG.dist(this.player, t);
        if (d > this.range + t.size / 2) continue;
        // 檢查角度是否在弧內
        var a = Math.atan2(t.y - this.player.y, t.x - this.player.x);
        var diff = a - slashAngle;
        // 正規化到 [-PI, PI]
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) <= ARC_HALF) {
          var mDmg = this.damage; t.hp -= mDmg; this._lastHits.push({x: t.x, y: t.y, dmg: mDmg});
          hitAny = true;
          if (t.hp <= 0) hits.push(t);
        }
      }

      // 設定斬擊視覺
      this.slashVisual = { x: this.player.x, y: this.player.y, angle: slashAngle, timer: SLASH_DURATION, range: this.range };
    }
    return hits;
  };

  MeleeAttack.prototype.upgradeRate = function() {
    this.cd = Math.max(0.3, this.cd - 0.1);
  };

  MeleeAttack.prototype.upgradeRange = function() {
    this.range += 15;
  };

  MeleeAttack.prototype.getVisual = function() {
    return this.slashVisual;
  };

  MeleeAttack.prototype.getLastHits = function() { var h = this._lastHits; this._lastHits = []; return h; };

  SG.MeleeAttack = MeleeAttack;
})();
