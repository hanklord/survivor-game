// player.js — 玩家類別
(function() {
  window.SG = window.SG || {};

  // 玩家初始數值常數
  var DEFAULTS = {
    HP: 100,
    SPEED: 180,
    DAMAGE: 10,
    FIRE_RATE: 1.0,
    PROJECTILE_COUNT: 1,
    PICKUP_RANGE: 60,
    INVULN_DURATION: 0.5,
    BASE_XP_NEEDED: 8,
    XP_PER_LEVEL: 3,
    XP_BASE: 5
  };

  function Player() {
    this.x = 0;
    this.y = 0;
    this.hp = DEFAULTS.HP;
    this.maxHp = DEFAULTS.HP;
    this.speed = DEFAULTS.SPEED;
    this.damage = DEFAULTS.DAMAGE;
    this.fireRate = DEFAULTS.FIRE_RATE;
    this.fireTimer = 0;
    this.level = 1;
    this.xp = 0;
    this.xpNeeded = DEFAULTS.BASE_XP_NEEDED;
    this.projectileCount = DEFAULTS.PROJECTILE_COUNT;
    this.pickupRange = DEFAULTS.PICKUP_RANGE;
    this.invuln = 0;
    // 動畫相關
    this.animator = null;
    this.facingLeft = false;
    this.spriteDefaultRight = false; // true 表示 sprite 預設面右
    this._attackTimer = 0;
  }

  // 移動玩家
  Player.prototype.move = function(dir, dt) {
    if (dir.x || dir.y) {
      this.x += dir.x * this.speed * dt;
      this.y += dir.y * this.speed * dt;
      if (dir.x !== 0) this.facingLeft = this.spriteDefaultRight ? dir.x < 0 : dir.x > 0;
      this._moving = true;
    } else {
      this._moving = false;
    }
  };

  // 更新動畫狀態
  Player.prototype.updateAnimation = function(dt) {
    if (!this.animator) return;
    // 攻擊計時器倒數
    if (this._attackTimer > 0) {
      this._attackTimer -= dt;
      if (this._attackTimer <= 0) this._attackTimer = 0;
    }
    // 狀態判斷
    if (this._attackTimer > 0) {
      this.animator.setState('attack');
    } else if (this._moving) {
      this.animator.setState('run');
    } else {
      this.animator.setState('idle');
    }
    this.animator.update(dt);
  };

  // 觸發攻擊動畫
  Player.prototype.triggerAttack = function() {
    if (this.animator) this._attackTimer = 0.3;
  };

  // 受傷
  Player.prototype.takeDamage = function(damage) {
    if (this.invuln > 0) return false;
    this.hp -= damage;
    this.invuln = DEFAULTS.INVULN_DURATION;
    return this.hp <= 0;
  };

  // 更新無敵時間
  Player.prototype.updateInvuln = function(dt) {
    this.invuln -= dt;
  };

  // 加經驗，回傳是否升級
  Player.prototype.addXP = function(value) {
    this.xp += value;
    if (this.xp >= this.xpNeeded) {
      this.xp -= this.xpNeeded;
      this.level++;
      this.xpNeeded = DEFAULTS.XP_BASE + this.level * DEFAULTS.XP_PER_LEVEL;
      return true;
    }
    return false;
  };

  SG.Player = Player;
})();
