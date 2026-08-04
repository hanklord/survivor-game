// auto-play.js — 自動遊玩 AI（閃避移動 + 手動覆蓋）
(function() {
  window.SG = window.SG || {};

  var QUERY_RADIUS = 250;         // 偵測範圍 px
  var QUERY_INTERVAL = 4;         // 每 N 幀查詢一次
  var MANUAL_OVERRIDE_TIME = 2;   // 手動操作後幾秒恢復自動
  var WANDER_SPEED = 0.3;         // 無敵人時漫遊強度
  var STORAGE_KEY = 'sg_autoplay';

  function AutoPlay(spatialHash) {
    this._spatialHash = spatialHash;
    this._enabled = this._loadState();
    this._frameCount = 0;
    this._cachedDir = { x: 0, y: 0 };
    this._manualTimer = 0;
    this._wanderAngle = Math.random() * Math.PI * 2;
    this._wanderTimer = 0;
  }

  // localStorage 持久化
  AutoPlay.prototype._loadState = function() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch(e) { return false; }
  };

  AutoPlay.prototype._saveState = function() {
    try { localStorage.setItem(STORAGE_KEY, this._enabled ? 'true' : 'false'); } catch(e) {}
  };

  // 啟用/停用
  AutoPlay.prototype.setEnabled = function(val) {
    this._enabled = !!val;
    this._saveState();
  };

  AutoPlay.prototype.isEnabled = function() {
    return this._enabled;
  };

  AutoPlay.prototype.toggle = function() {
    this.setEnabled(!this._enabled);
    return this._enabled;
  };

  // 手動覆蓋通知
  AutoPlay.prototype.onManualInput = function() {
    this._manualTimer = MANUAL_OVERRIDE_TIME;
  };

  // 是否目前由自動控制（啟用且非手動覆蓋中）
  AutoPlay.prototype.isActive = function() {
    return this._enabled && this._manualTimer <= 0;
  };

  // 計算自動移動方向
  AutoPlay.prototype.update = function(dt, playerX, playerY) {
    if (this._manualTimer > 0) this._manualTimer -= dt;

    this._frameCount++;
    if (this._frameCount % QUERY_INTERVAL !== 0) return this._cachedDir;

    // 查詢附近敵人
    var nearby = this._spatialHash.query(playerX, playerY, QUERY_RADIUS);
    if (nearby.length === 0) {
      // 無敵人：往場地中心漫遊
      this._wanderTimer += dt;
      if (this._wanderTimer > 2) {
        this._wanderAngle += (Math.random() - 0.5) * 1.5;
        this._wanderTimer = 0;
      }
      // 混合漫遊方向 + 往原點的微小拉力
      var toCenterX = -playerX;
      var toCenterY = -playerY;
      var centerDist = Math.hypot(toCenterX, toCenterY);
      var cx = centerDist > 100 ? toCenterX / centerDist * 0.2 : 0;
      var cy = centerDist > 100 ? toCenterY / centerDist * 0.2 : 0;
      var wx = Math.cos(this._wanderAngle) * WANDER_SPEED + cx;
      var wy = Math.sin(this._wanderAngle) * WANDER_SPEED + cy;
      var wm = Math.hypot(wx, wy);
      this._cachedDir = wm > 0.01 ? { x: wx / wm, y: wy / wm } : { x: 0, y: 0 };
      return this._cachedDir;
    }

    // 計算反方向加權向量（weight = 1/dist²）
    var repelX = 0, repelY = 0;
    for (var i = 0; i < nearby.length; i++) {
      var e = nearby[i];
      var dx = playerX - e.x;
      var dy = playerY - e.y;
      var dist = Math.hypot(dx, dy);
      if (dist < 1) dist = 1; // 避免除以零
      var weight = 1 / (dist * dist);
      repelX += (dx / dist) * weight;
      repelY += (dy / dist) * weight;
    }

    var mag = Math.hypot(repelX, repelY);
    if (mag > 0.001) {
      this._cachedDir = { x: repelX / mag, y: repelY / mag };
    } else {
      this._cachedDir = { x: 0, y: 0 };
    }
    return this._cachedDir;
  };

  SG.AutoPlay = AutoPlay;
})();
