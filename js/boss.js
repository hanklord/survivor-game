// boss.js — Boss 類別與生成邏輯
(function() {
  window.SG = window.SG || {};

  function Boss(x, y, cfg, cfgIdx) {
    this.x = x;
    this.y = y;
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.speed = cfg.speed;
    this.damage = cfg.damage;
    this.size = cfg.size || 80;
    this.color = cfg.color || '#ff0000';
    this.cfgIdx = cfgIdx;
    this.type = 'boss';
    this.id = SG.nextEntityId++;
    // 動畫相關
    this.animator = null;
    this.facingLeft = false;
  }

  // 朝目標移動
  Boss.prototype.moveToward = function(target, dt) {
    var a = Math.atan2(target.y - this.y, target.x - this.x);
    this.x += Math.cos(a) * this.speed * dt;
    this.y += Math.sin(a) * this.speed * dt;
    this.facingLeft = target.x < this.x;
  };

  // 更新動畫
  Boss.prototype.updateAnimation = function(dt) {
    if (!this.animator) return;
    this.animator.setState('run');
    this.animator.update(dt);
  };

  // 生成 Boss
  Boss.spawn = function(idx, imgConfig, player, W, H) {
    var bc = (imgConfig.bosses || [])[idx];
    if (!bc) return null;
    var angle = Math.random() * Math.PI * 2;
    var d = Math.max(W, H) * 0.6;
    return new Boss(player.x + Math.cos(angle) * d, player.y + Math.sin(angle) * d, bc, idx);
  };

  SG.Boss = Boss;
})();
