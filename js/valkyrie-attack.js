// valkyrie-attack.js — 女武神長槍貫通攻擊
(function() {
  window.SG = window.SG || {};

  var BASE_CD = 0.8;
  var BASE_RANGE = 200;
  var BASE_DAMAGE = 20;
  var THRUST_WIDTH = 30; // 判定寬度
  var VISUAL_DURATION = 0.2; // 特效持續時間

  function ValkyrieAttack(player) {
    this.player = player;
    this.cd = BASE_CD;
    this.range = BASE_RANGE;
    this.damage = BASE_DAMAGE;
    this.timer = 0;
    this._visual = null; // { angle, progress, range }
    this._lastHits = [];
    this.level = 1;
  }

  ValkyrieAttack.prototype.upgrade = function(type) {
    if (type === 'rate') {
      this.cd = Math.max(0.3, this.cd - 0.06);
    } else if (type === 'range') {
      this.range += 40;
    }
    this.level++;
  };

  ValkyrieAttack.prototype.update = function(dt, enemies, bosses) {
    var hits = [];
    this._lastHits = [];

    // 更新視覺效果
    if (this._visual) {
      this._visual.progress += dt / VISUAL_DURATION;
      if (this._visual.progress >= 1) this._visual = null;
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

        // 計算攻擊方向
        var angle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);

        // 觸發視覺
        this._visual = { angle: angle, progress: 0, range: this.range };

        // 貫通判定：沿直線檢查所有敵人
        for (var i = 0; i < targets.length; i++) {
          var t = targets[i];
          if (t.hp <= 0) continue;
          // 投影到攻擊方向上
          var dx = t.x - this.player.x;
          var dy = t.y - this.player.y;
          var along = dx * Math.cos(angle) + dy * Math.sin(angle); // 沿攻擊方向的距離
          var perp = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle)); // 垂直距離

          if (along > 0 && along <= this.range + t.size / 2 && perp <= THRUST_WIDTH + t.size / 2) {
            t.hp -= this.damage;
            this._lastHits.push({ x: t.x, y: t.y, dmg: this.damage });
            if (t.hp <= 0) hits.push(t);
          }
        }

        // 觸發攻擊動畫
        this.player.triggerAttack();
      }
    }

    return hits;
  };

  ValkyrieAttack.prototype.getVisual = function() {
    return this._visual;
  };

  ValkyrieAttack.prototype.getLastHits = function() {
    var h = this._lastHits;
    this._lastHits = [];
    return h;
  };

  SG.ValkyrieAttack = ValkyrieAttack;
})();
