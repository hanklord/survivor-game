// auto-play.js — 自動遊玩 AI（三層優先級 + 方向平滑化）
(function() {
  window.SG = window.SG || {};

  var QUERY_RADIUS = 250;         // 偵測範圍 px
  var QUERY_INTERVAL = 4;         // 每 N 幀查詢一次
  var MANUAL_OVERRIDE_TIME = 2;   // 手動操作後幾秒恢復自動
  var STORAGE_KEY = 'sg_autoplay';
  var DEAD_ZONE = 0.15;           // 合成向量低於此值視為無效
  var MIN_ANGLE_DOT = 0.966;      // cos(15°) — 夾角小於 15° 不更新
  var LERP_NORMAL = 0.2;          // 正常平滑因子
  var LERP_EMERGENCY = 0.5;       // 緊急模式平滑因子

  function AutoPlay(spatialHash, player) {
    this._spatialHash = spatialHash;
    this.player = player;
    this._enabled = this._loadState();
    this._frameCount = 0;
    this._cachedDir = { x: 0, y: 0 };
    this._smoothDir = { x: 0, y: 1 }; // 當前平滑方向
    this._manualTimer = 0;
    this._emergency = false;
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

  AutoPlay.prototype.onManualInput = function() {
    this._manualTimer = MANUAL_OVERRIDE_TIME;
  };

  AutoPlay.prototype.isActive = function() {
    return this._enabled && this._manualTimer <= 0;
  };

  // 主更新：每 N 幀重新計算方向（含平滑）
  AutoPlay.prototype.update = function(dt, enemies, xpGems, healPickups) {
    if (this._manualTimer > 0) this._manualTimer -= dt;

    this._frameCount++;
    if (this._frameCount % QUERY_INTERVAL !== 0) return this._cachedDir;

    var rawDir = this._computeDirection(dt, enemies, xpGems, healPickups);

    // 死區：合成向量太小，維持舊方向
    var rawMag = Math.sqrt(rawDir.x * rawDir.x + rawDir.y * rawDir.y);
    if (rawMag < DEAD_ZONE) {
      this._cachedDir = this._smoothDir;
      return this._cachedDir;
    }

    // 最小轉角：新舊方向夾角 < 15° 不更新
    var dot = this._smoothDir.x * rawDir.x + this._smoothDir.y * rawDir.y;
    if (dot > MIN_ANGLE_DOT) {
      this._cachedDir = this._smoothDir;
      return this._cachedDir;
    }

    // Lerp 平滑
    var lerpFactor = this._emergency ? LERP_EMERGENCY : LERP_NORMAL;
    this._smoothDir.x += (rawDir.x - this._smoothDir.x) * lerpFactor;
    this._smoothDir.y += (rawDir.y - this._smoothDir.y) * lerpFactor;
    // 正規化
    var sMag = Math.sqrt(this._smoothDir.x * this._smoothDir.x + this._smoothDir.y * this._smoothDir.y) || 1;
    this._smoothDir.x /= sMag;
    this._smoothDir.y /= sMag;

    this._cachedDir = this._smoothDir;
    return this._cachedDir;
  };

  // 三層加權向量合成
  AutoPlay.prototype._computeDirection = function(dt, enemies, xpGems, healPickups) {
    var px = this.player.x, py = this.player.y;

    // === 層 1：生存避敵 ===
    var survX = 0, survY = 0, survWeight = 3.0;
    var nearby = this._spatialHash.query(px, py, 250);
    var closeCount = 0;
    for (var i = 0; i < nearby.length; i++) {
      var e = nearby[i];
      if (e.hp <= 0) continue;
      var dx = px - e.x, dy = py - e.y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist < 150) closeCount++;
      var w = 1 / (dist * dist);
      survX += (dx / dist) * w;
      survY += (dy / dist) * w;
    }
    // 緊急狀態
    this._emergency = (closeCount >= 3);
    if (this._emergency) survWeight = 6.0;
    var survMag = Math.sqrt(survX * survX + survY * survY) || 1;
    survX /= survMag;
    survY /= survMag;

    // === 層 2：撿道具 ===
    var pickX = 0, pickY = 0, pickWeight = 0;
    var bestPickup = null, bestDist = 200;
    var hpRatio = this.player.hp / this.player.maxHp;
    if (healPickups) {
      for (var i = 0; i < healPickups.length; i++) {
        var hp = healPickups[i];
        var d = Math.sqrt((hp.x - px) * (hp.x - px) + (hp.y - py) * (hp.y - py));
        if (d < bestDist) { bestDist = d; bestPickup = hp; pickWeight = hpRatio < 0.5 ? 2.5 : 1.5; }
      }
    }
    if (!bestPickup && xpGems) {
      for (var i = 0; i < xpGems.length; i++) {
        var g = xpGems[i];
        var d = Math.sqrt((g.x - px) * (g.x - px) + (g.y - py) * (g.y - py));
        if (d < bestDist) { bestDist = d; bestPickup = g; pickWeight = 1.5; }
      }
    }
    if (bestPickup) {
      var toDx = bestPickup.x - px, toDy = bestPickup.y - py;
      var toD = Math.sqrt(toDx * toDx + toDy * toDy) || 1;
      toDx /= toD; toDy /= toD;
      var dangerCount = 0;
      for (var i = 0; i < nearby.length; i++) {
        var e = nearby[i];
        if (e.hp <= 0) continue;
        var ex = e.x - px, ey = e.y - py;
        var eMag = Math.sqrt(ex * ex + ey * ey) || 1;
        var dot = (ex / eMag) * toDx + (ey / eMag) * toDy;
        if (dot > 0.5) dangerCount++;
      }
      if (dangerCount < 3) {
        pickX = toDx; pickY = toDy;
      } else {
        pickWeight = 0;
      }
    }

    // === 層 3：保持攻擊射程 ===
    var rangeX = 0, rangeY = 0, rangeWeight = 0;
    var nearestEnemy = null, nearestDist = Infinity;
    for (var i = 0; i < nearby.length; i++) {
      var e = nearby[i];
      if (e.hp <= 0) continue;
      var d = Math.sqrt((e.x - px) * (e.x - px) + (e.y - py) * (e.y - py));
      if (d < nearestDist) { nearestDist = d; nearestEnemy = e; }
    }
    if (nearestEnemy && closeCount < 3) {
      var attackType = this.player.attackType;
      var idealDist = 200;
      if (attackType === 'ranged') idealDist = 250;
      else if (attackType === 'archer') idealDist = 280;
      else if (attackType === 'amazon') idealDist = 245;
      else if (attackType === 'boomerang') idealDist = 170;
      else if (attackType === 'melee') idealDist = 100;
      else if (attackType === 'valkyrie') idealDist = 100;

      if (nearestDist > idealDist * 1.2) {
        var dx = nearestEnemy.x - px, dy = nearestEnemy.y - py;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        rangeX = dx / d; rangeY = dy / d;
        rangeWeight = (attackType === 'melee' || attackType === 'valkyrie') ? 1.2 : 0.5;
      }
    }

    // === 合成 ===
    var fx = survX * survWeight + pickX * pickWeight + rangeX * rangeWeight;
    var fy = survY * survWeight + pickY * pickWeight + rangeY * rangeWeight;
    var fMag = Math.sqrt(fx * fx + fy * fy);
    if (fMag < 0.1) {
      var cx = 1280, cy = 1920;
      fx = cx - px; fy = cy - py;
      fMag = Math.sqrt(fx * fx + fy * fy) || 1;
    }
    return { x: fx / fMag, y: fy / fMag };
  };

  SG.AutoPlay = AutoPlay;
})();
