// auto-play.js — 自動遊玩 AI v3（即時手動/自動切換）
(function() {
  window.SG = window.SG || {};

  var QUERY_RADIUS = 250;
  var QUERY_INTERVAL = 4;
  var STORAGE_KEY = 'sg_autoplay';
  var DEAD_ZONE = 0.15;
  var MIN_ANGLE_DOT = 0.966;
  var LERP_NORMAL = 0.2;
  var LERP_EMERGENCY = 0.5;

  function AutoPlay(spatialHash, player) {
    this._spatialHash = spatialHash;
    this.player = player;
    this._enabled = this._loadState();
    this._frameCount = 0;
    this._cachedDir = { x: 0, y: 0 };
    this._smoothDir = { x: 0, y: 1 };
    this._emergency = false;
    this._manualActive = false;
  }

  AutoPlay.prototype._loadState = function() {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch(e) { return false; }
  };

  AutoPlay.prototype._saveState = function() {
    try { localStorage.setItem(STORAGE_KEY, this._enabled ? 'true' : 'false'); } catch(e) {}
  };

  AutoPlay.prototype.setEnabled = function(val) {
    this._enabled = !!val;
    this._saveState();
  };

  AutoPlay.prototype.isEnabled = function() { return this._enabled; };

  AutoPlay.prototype.toggle = function() {
    this.setEnabled(!this._enabled);
    return this._enabled;
  };

  AutoPlay.prototype.isActive = function() { return this._enabled && !this._manualActive; };

  // 主更新：即時切換，有輸入=手動，無輸入=自動
  AutoPlay.prototype.update = function(dt, enemies, xpGems, healPickups, bosses, hasInput) {
    if (!this._enabled) return null;

    // 即時切換：有輸入 = 手動，無輸入 = 自動
    if (hasInput) {
      this._manualActive = true;
      return null;
    }

    // 從手動切回自動：smoothDir 保持，lerp 自然銜接
    this._manualActive = false;

    this._frameCount++;
    if (this._frameCount % QUERY_INTERVAL !== 0) return this._cachedDir;

    var rawDir = this._computeDirection(dt, enemies, xpGems, healPickups, bosses);

    var rawMag = Math.sqrt(rawDir.x * rawDir.x + rawDir.y * rawDir.y);
    if (rawMag < DEAD_ZONE) { this._cachedDir = this._smoothDir; return this._cachedDir; }

    var dot = this._smoothDir.x * rawDir.x + this._smoothDir.y * rawDir.y;
    if (dot > MIN_ANGLE_DOT) { this._cachedDir = this._smoothDir; return this._cachedDir; }

    var lerpFactor = this._emergency ? LERP_EMERGENCY : LERP_NORMAL;
    this._smoothDir.x += (rawDir.x - this._smoothDir.x) * lerpFactor;
    this._smoothDir.y += (rawDir.y - this._smoothDir.y) * lerpFactor;
    var sMag = Math.sqrt(this._smoothDir.x * this._smoothDir.x + this._smoothDir.y * this._smoothDir.y) || 1;
    this._smoothDir.x /= sMag;
    this._smoothDir.y /= sMag;

    this._cachedDir = this._smoothDir;
    return this._cachedDir;
  };

  AutoPlay.prototype._computeDirection = function(dt, enemies, xpGems, healPickups, bosses) {
    var px = this.player.x, py = this.player.y;
    var PREDICT_TIME = 0.4;

    // === 層 1：生存避敵 ===
    var survX = 0, survY = 0, survWeight = 3.0;
    var nearby = this._spatialHash.query(px, py, 250);
    var closeCount = 0;
    for (var i = 0; i < nearby.length; i++) {
      var e = nearby[i];
      if (e.hp <= 0) continue;
      var dist = Math.sqrt((px - e.x) * (px - e.x) + (py - e.y) * (py - e.y)) || 1;
      if (dist < 150) closeCount++;
    }

    // 突圍模式：5+ 隻近距 → 分 8 扇區選最少敵人方向
    var aggressiveMode = false;
    if (closeCount >= 5) {
      var sectors = [0,0,0,0,0,0,0,0];
      for (var i = 0; i < nearby.length; i++) {
        var e = nearby[i];
        if (e.hp <= 0) continue;
        var dx = e.x - px, dy = e.y - py;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 150) continue;
        var angle = Math.atan2(dy, dx);
        var sector = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * 8) % 8;
        sectors[sector]++;
      }
      var minSector = 0, minCount = sectors[0];
      for (var s = 1; s < 8; s++) {
        if (sectors[s] < minCount) { minCount = sectors[s]; minSector = s; }
      }
      var breakAngle = (minSector / 8) * Math.PI * 2 - Math.PI;
      survX = Math.cos(breakAngle);
      survY = Math.sin(breakAngle);
      survWeight = 5.0;
      this._emergency = true;
    } else {
      // 正常生存層（含預判）
      for (var i = 0; i < nearby.length; i++) {
        var e = nearby[i];
        if (e.hp <= 0) continue;
        // 預判敵人位置（0.4 秒後，敵人朝玩家移動）
        var toPlayerAngle = Math.atan2(py - e.y, px - e.x);
        var predX = e.x + (e.speed || 0) * Math.cos(toPlayerAngle) * PREDICT_TIME;
        var predY = e.y + (e.speed || 0) * Math.sin(toPlayerAngle) * PREDICT_TIME;
        var dx = px - predX, dy = py - predY;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var w = 1 / (dist * dist);
        survX += (dx / dist) * w;
        survY += (dy / dist) * w;
      }
      this._emergency = (closeCount >= 3);
      if (this._emergency) survWeight = 6.0;
      aggressiveMode = (closeCount < 3);
      if (aggressiveMode) survWeight = 0.5;
      var survMag = Math.sqrt(survX * survX + survY * survY) || 1;
      survX /= survMag; survY /= survMag;
    }

    // === 碰撞警戒斥力 ===
    var safeMargin = (this.player.hitboxRadius || 20) + 40;
    var repelCloseX = 0, repelCloseY = 0, repelCount = 0;
    for (var i = 0; i < nearby.length && repelCount < 2; i++) {
      var e = nearby[i];
      if (e.hp <= 0) continue;
      var dx = px - e.x, dy = py - e.y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var minSafe = safeMargin + (e.hitboxRadius || 30);
      if (dist < minSafe) {
        repelCloseX += dx / dist;
        repelCloseY += dy / dist;
        repelCount++;
      }
    }
    if (repelCount > 0) {
      var rcMag = Math.sqrt(repelCloseX * repelCloseX + repelCloseY * repelCloseY) || 1;
      repelCloseX /= rcMag; repelCloseY /= rcMag;
    }
    var repelCloseWeight = repelCount > 0 ? 4.0 : 0;

    // === 層 2：撿道具 ===
    var pickX = 0, pickY = 0, pickWeight = 0;
    var bestPickup = null, bestDist = 200;
    var hpRatio = this.player.hp / this.player.maxHp;
    if (healPickups) {
      for (var i = 0; i < healPickups.length; i++) {
        var hp = healPickups[i];
        var d = Math.sqrt((hp.x - px) * (hp.x - px) + (hp.y - py) * (hp.y - py));
        if (d < bestDist) {
          bestDist = d; bestPickup = hp;
          if (hpRatio < 0.3) pickWeight = 4.0;
          else if (hpRatio < 0.5) pickWeight = 2.5;
          else pickWeight = 1.5;
        }
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
      var safeThreshold = (hpRatio < 0.3) ? 5 : 3;
      if (dangerCount < safeThreshold) { pickX = toDx; pickY = toDy; }
      else { pickWeight = 0; }
    }

    // === 層 3：保持攻擊射程（Boss 優先）===
    var rangeX = 0, rangeY = 0, rangeWeight = 0;
    var nearestEnemy = null, nearestDist = Infinity;
    for (var i = 0; i < nearby.length; i++) {
      var e = nearby[i];
      if (e.hp <= 0) continue;
      var d = Math.sqrt((e.x - px) * (e.x - px) + (e.y - py) * (e.y - py));
      if (d < nearestDist) { nearestDist = d; nearestEnemy = e; }
    }
    var rangeTarget = nearestEnemy;
    if (bosses && bosses.length > 0) {
      var nearestBoss = null, nearestBossDist = Infinity;
      for (var i = 0; i < bosses.length; i++) {
        if (bosses[i].hp <= 0) continue;
        var bd = Math.sqrt((bosses[i].x - px) * (bosses[i].x - px) + (bosses[i].y - py) * (bosses[i].y - py));
        if (bd < nearestBossDist) { nearestBossDist = bd; nearestBoss = bosses[i]; }
      }
      if (nearestBoss) { rangeTarget = nearestBoss; nearestDist = nearestBossDist; }
    }

    if (rangeTarget && closeCount < 3) {
      var attackType = this.player.attackType;
      var idealDist = 200;
      if (attackType === 'ranged') idealDist = 306;
      else if (attackType === 'archer') idealDist = 340;
      else if (attackType === 'amazon') idealDist = 298;
      else if (attackType === 'boomerang') idealDist = 170;
      else if (attackType === 'melee') idealDist = 136;
      else if (attackType === 'valkyrie') idealDist = 102;

      var distThreshold = aggressiveMode ? idealDist * 0.5 : idealDist * 1.2;
      if (nearestDist > distThreshold) {
        var dx = rangeTarget.x - px, dy = rangeTarget.y - py;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        rangeX = dx / d; rangeY = dy / d;
        rangeWeight = aggressiveMode ? 2.5 : ((attackType === 'melee' || attackType === 'valkyrie') ? 1.2 : 0.5);
      }
    }

    // === 合成 ===
    var fx = survX * survWeight + pickX * pickWeight + rangeX * rangeWeight + repelCloseX * repelCloseWeight;
    var fy = survY * survWeight + pickY * pickWeight + rangeY * rangeWeight + repelCloseY * repelCloseWeight;
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
