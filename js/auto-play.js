// auto-play.js — 自動遊玩 AI（三層優先級：避敵 + 撿道具 + 保持射程）
(function() {
  window.SG = window.SG || {};

  var QUERY_RADIUS = 250;         // 偵測範圍 px
  var QUERY_INTERVAL = 4;         // 每 N 幀查詢一次
  var MANUAL_OVERRIDE_TIME = 2;   // 手動操作後幾秒恢復自動
  var STORAGE_KEY = 'sg_autoplay';

  function AutoPlay(spatialHash, player) {
    this._spatialHash = spatialHash;
    this.player = player;
    this._enabled = this._loadState();
    this._frameCount = 0;
    this._cachedDir = { x: 0, y: 0 };
    this._manualTimer = 0;
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

  // 主更新：每 N 幀重新計算方向
  AutoPlay.prototype.update = function(dt, enemies, xpGems, healPickups) {
    if (this._manualTimer > 0) this._manualTimer -= dt;

    this._frameCount++;
    if (this._frameCount % QUERY_INTERVAL !== 0) return this._cachedDir;

    this._cachedDir = this._computeDirection(dt, enemies, xpGems, healPickups);
    return this._cachedDir;
  };

  // 三層加權向量合成
  AutoPlay.prototype._computeDirection = function(dt, enemies, xpGems, healPickups) {
    var px = this.player.x, py = this.player.y;

    // === 層 1：生存避敵 ===
    var survX = 0, survY = 0, survWeight = 3.0;
    var nearby = this._spatialHash.query(px, py, 250);
    var closeCount = 0; // 150px 內敵人數
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
    // 緊急：150px 內 3+ 隻，權重翻倍
    if (closeCount >= 3) survWeight = 6.0;
    var survMag = Math.sqrt(survX * survX + survY * survY) || 1;
    survX /= survMag;
    survY /= survMag;

    // === 層 2：撿道具 ===
    var pickX = 0, pickY = 0, pickWeight = 0;
    var bestPickup = null, bestDist = 200;
    // 先找回血道具（HP < 50% 時優先）
    var hpRatio = this.player.hp / this.player.maxHp;
    if (healPickups) {
      for (var i = 0; i < healPickups.length; i++) {
        var hp = healPickups[i];
        var d = Math.sqrt((hp.x - px) * (hp.x - px) + (hp.y - py) * (hp.y - py));
        if (d < bestDist) { bestDist = d; bestPickup = hp; pickWeight = hpRatio < 0.5 ? 2.5 : 1.5; }
      }
    }
    // 再找 XP gem
    if (!bestPickup && xpGems) {
      for (var i = 0; i < xpGems.length; i++) {
        var g = xpGems[i];
        var d = Math.sqrt((g.x - px) * (g.x - px) + (g.y - py) * (g.y - py));
        if (d < bestDist) { bestDist = d; bestPickup = g; pickWeight = 1.5; }
      }
    }
    if (bestPickup) {
      // 安全性檢查：道具方向 120 度扇形內敵人 < 3
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
        if (dot > 0.5) dangerCount++; // cos(60)=0.5 → 120 度扇形
      }
      if (dangerCount < 3) {
        pickX = toDx; pickY = toDy;
      } else {
        pickWeight = 0; // 不安全，忽略
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
    if (nearestEnemy && closeCount < 3) { // 非緊急時才考慮射程
      var attackType = this.player.attackType;
      var idealDist = 200;
      if (attackType === 'ranged') idealDist = 250;
      else if (attackType === 'archer') idealDist = 280;
      else if (attackType === 'amazon') idealDist = 245;
      else if (attackType === 'boomerang') idealDist = 170;
      else if (attackType === 'melee') idealDist = 100;
      else if (attackType === 'valkyrie') idealDist = 100;

      if (nearestDist > idealDist * 1.2) {
        // 太遠，靠近
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
      // 互相抵消：往場地中心漫遊
      var cx = 1280, cy = 1920;
      fx = cx - px; fy = cy - py;
      fMag = Math.sqrt(fx * fx + fy * fy) || 1;
    }
    return { x: fx / fMag, y: fy / fMag };
  };

  SG.AutoPlay = AutoPlay;
})();
