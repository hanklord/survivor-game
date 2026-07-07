// damage-numbers.js — 傷害數字浮動顯示
(function() {
  window.SG = window.SG || {};

  var FLOAT_SPEED = 60; // px/s 向上
  var DURATION = 0.8;
  var CRIT_SCALE = 1.8;
  var CRIT_CHANCE = 0.1;
  var CRIT_MULT = 1.5;

  function DamageNumbers() {
    this.numbers = []; // { x, y, text, timer, crit }
  }

  // 計算傷害（含爆擊判定），回傳 { damage, crit }
  DamageNumbers.prototype.calcDamage = function(baseDmg, critChance) {
    var chance = critChance || CRIT_CHANCE;
    var crit = Math.random() < chance;
    var dmg = crit ? Math.round(baseDmg * CRIT_MULT) : baseDmg;
    return { damage: dmg, crit: crit };
  };

  // 新增傷害數字
  DamageNumbers.prototype.add = function(x, y, damage, crit) {
    if (this.numbers.length >= 20) this.numbers.shift();
    this.numbers.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y - 10,
      text: String(damage),
      timer: DURATION,
      crit: crit || false
    });
  };

  // 更新（向上漂浮）
  DamageNumbers.prototype.update = function(dt) {
    for (var i = this.numbers.length - 1; i >= 0; i--) {
      var n = this.numbers[i];
      n.y -= FLOAT_SPEED * dt;
      n.timer -= dt;
      if (n.timer <= 0) this.numbers.splice(i, 1);
    }
  };

  // 繪製
  DamageNumbers.prototype.draw = function(ctx) {
    for (var i = 0; i < this.numbers.length; i++) {
      var n = this.numbers[i];
      var alpha = Math.min(1, n.timer / 0.3);
      ctx.globalAlpha = alpha;
      ctx.font = (n.crit ? 'bold 20px' : '14px') + ' Segoe UI, sans-serif';
      ctx.fillStyle = n.crit ? '#ffdd00' : '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeText(n.text, n.x, n.y);
      ctx.fillText(n.text, n.x, n.y);
    }
    ctx.globalAlpha = 1;
  };

  SG.DamageNumbers = DamageNumbers;
  SG.CRIT_CHANCE = CRIT_CHANCE;
  SG.CRIT_MULT = CRIT_MULT;
})();
