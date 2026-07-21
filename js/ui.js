// ui.js — UI/HUD 更新 + 升級選單 + 技能圖標 + 排行榜
(function() {
  window.SG = window.SG || {};

  var UPGRADE_CHOICES = 3;

  // 原有升級選項
  var UPGRADES = [
    { name: '⚔️ Damage +25%', apply: function(p) { p.damage *= 1.25; } },
    { name: '💨 Speed +15%', apply: function(p) { p.speed *= 1.15; } },
    { name: '🧲 Pickup Range +30%', apply: function(p) { p.pickupRange *= 1.3; } },
    { name: '❤️ Max HP +25', apply: function(p) { p.maxHp += 25; p.hp = Math.min(p.hp + 25, p.maxHp); } }
  ];

  var RANGED_UPGRADES = [
    { name: '🔥 火球+1', apply: function(p) { p.projectileCount++; p.fireRate = Math.max(0.2, p.fireRate * 0.95); } }
  ];

  // 武器升級選項
  var WEAPON_UPGRADES = [
    { name: '🔵 旋轉護盾', type: 'shield' },
    { name: '💫 範圍爆炸', type: 'nova' },
    { name: '🚀 追蹤飛彈', type: 'missile' },
    { name: '⚡ 落雷', type: 'thunder' },
    { name: '🔗 連鎖閃電', type: 'chainLightning' }
  ];

  var MELEE_UPGRADES = [
    { name: '⚔️ 攻擊頻率提升', type: 'meleeRate' },
    { name: '🗡️ 攻擊範圍提升', type: 'meleeRange' }
  ];

  var ARCHER_UPGRADES = [
    { name: '🏹 弓箭數量+1', type: 'archerCount' },
    { name: '💨 射擊頻率提升', type: 'archerRate' }
  ];

  function UI() {
    this.els = {
      hpFill: document.getElementById('hp-fill'),
      hpText: document.getElementById('hp-text'),
      xpFill: document.getElementById('xp-fill'),
      timer: document.getElementById('timer'),
      level: document.getElementById('level'),
      kills: document.getElementById('kills'),
      levelUp: document.getElementById('level-up'),
      choices: document.getElementById('choices'),
      gameOverEl: document.getElementById('game-over'),
      finalStats: document.getElementById('final-stats'),
      pauseOverlay: document.getElementById('pause-overlay'),
      bossWarning: document.getElementById('boss-warning'),
      skillIcons: document.getElementById('skill-icons'),
      levelName: document.getElementById('level-name'),
      levelClear: document.getElementById('level-clear'),
      leaderboardEl: document.getElementById('leaderboard'),
      muteBtn: document.getElementById('mute-indicator')
    };
  }

  // 更新 HUD
  UI.prototype.updateHUD = function(player, gameTime, kills) {
    var statsEl = document.getElementById('hud-stats');
    if (statsEl) {
      statsEl.innerHTML = 'Lv.' + player.level + '<br>💀 ' + kills + '<br>⚔️ ' + Math.round(player.damage) + '<br>🛡️ ' + (player.armor || 0) + '<br>👟 ' + Math.round(player.speed);
    }
    // XP bar
    var xpFill = document.getElementById('xp-fill');
    if (xpFill) xpFill.style.width = (player.xp / player.xpNeeded * 100) + '%';
    // Timer
    var timerEl = document.getElementById('game-timer');
    if (timerEl) timerEl.textContent = SG.formatTime(gameTime);
  };

  // 更新技能圖標顯示
  UI.prototype.updateSkillIcons = function(skillTree) {
    if (!this.els.skillIcons) return;
    var acquired = skillTree.getAcquired();
    var html = '';
    for (var i = 0; i < acquired.length; i++) {
      html += '<span class="skill-icon" title="Lv.' + acquired[i].level + '">' + acquired[i].icon + '<sub>' + acquired[i].level + '</sub></span>';
    }
    this.els.skillIcons.innerHTML = html;
  };

  // 更新關卡名稱
  UI.prototype.updateLevelName = function(name) {
    if (this.els.levelName) this.els.levelName.textContent = name;
  };

  // 顯示通關畫面
  UI.prototype.showLevelClear = function(levelName, callback) {
    if (!this.els.levelClear) { callback(); return; }
    this.els.levelClear.innerHTML = '<h2>🎉 ' + levelName + ' 通關！</h2><button class="upgrade-btn" id="next-level-btn">下一關</button>';
    this.els.levelClear.style.display = 'block';
    document.getElementById('next-level-btn').onclick = function() {
      document.getElementById('level-clear').style.display = 'none';
      callback();
    };
  };

  // 顯示全通關
  UI.prototype.showAllClear = function(gameTime, level, kills, hardcoreLevel, hardcoreCallback) {
    if (!this.els.levelClear) return;
    var hcLabel = hardcoreLevel > 0 ? ' (Hardcore Lv.' + hardcoreLevel + ')' : '';
    var nextHcLv = hardcoreLevel + 1;
    this.els.levelClear.innerHTML = '<h2>🏆 全部通關！' + hcLabel + '</h2>' +
      '<p>Time: ' + SG.formatTime(gameTime) + ' | Level: ' + level + ' | Kills: ' + kills + '</p>' +
      '<button class="upgrade-btn" id="btn-hardcore" style="background:#660000;border-color:#ff4400;margin-bottom:8px;">🔥 Hardcore Lv.' + nextHcLv + '（敵人 HP ×' + Math.pow(window.HARDCORE_HP_MULTIPLIER || 1.2, nextHcLv).toFixed(2) + '）</button>' +
      '<button class="upgrade-btn" onclick="location.reload()">再玩一次（重置）</button>';
    this.els.levelClear.style.display = 'block';
    // 綁定 Hardcore 按鈕
    var hcBtn = document.getElementById('btn-hardcore');
    if (hcBtn && hardcoreCallback) {
      hcBtn.onclick = function() { hardcoreCallback(); };
    }
  };

  // 顯示升級選單（含武器 + 被動技能選項）
  UI.prototype.showLevelUp = function(player, weaponManager, skillTree, callback, meleeAttack, archerAttack, passiveItems, valkyrieAttack, boomerangAttack) {
    var self = this;
    this.els.choices.innerHTML = '';

    // 建立所有可選技能池（未滿級的）
    var pool = [];

    // 基礎升級（共通，所有角色可選）
    for (var i = 0; i < UPGRADES.length; i++) {
      (function(idx) { pool.push({ name: UPGRADES[idx].name, action: function() { UPGRADES[idx].apply(player); } }); })(i);
    }

    // 遠程角色（法師）專屬：火球升級必定出現（未滿 9 顆時）
    var fireballUpgrade = null;
    if (player.attackType === 'ranged' && player.projectileCount < 9) {
      fireballUpgrade = { name: '🔥 火球+1 (Lv' + (player.projectileCount + 1) + ')', action: function() { RANGED_UPGRADES[0].apply(player); } };
    }

    // 通用武器技能
    var cl = weaponManager.chainLightning;
    if (!cl || cl.chains < 15) pool.push({ name: '🔗 連鎖閃電' + (cl ? ' Lv' + cl.chains : ''), action: function() { weaponManager.unlockChainLightning(); } });
    if (!weaponManager.shield || (weaponManager.shield.count < 6 || weaponManager.shield.ballSize < 40)) pool.push({ name: '🔵 旋轉護盾', action: function() { weaponManager.unlockShield(); } });
    if (!weaponManager.nova || (weaponManager.nova._level || 1) < 15) pool.push({ name: '💫 範圍爆炸', action: function() { weaponManager.unlockNova(); } });
    if (!weaponManager.launcher || weaponManager.launcher.missileCount < 15) pool.push({ name: '🚀 追蹤飛彈', action: function() { weaponManager.unlockMissile(); } });
    if (!weaponManager.thunder || (weaponManager.thunder.level || 1) < 15) pool.push({ name: '⚡ 落雷', action: function() { weaponManager.unlockThunder(); } });

    // 被動技能樹
    var skillChoices = skillTree.getRandomChoices ? skillTree.getRandomChoices() : [];
    for (var s = 0; s < skillChoices.length; s++) {
      (function(sc) { pool.push({ name: sc.name, action: function() { skillTree.applySkill(sc.skillId, player); } }); })(skillChoices[s]);
    }

    // 近戰專屬
    if (meleeAttack) {
      if (meleeAttack.cd > 0.3) pool.push({ name: '⚔️ 攻擊頻率提升', action: function() { meleeAttack.upgradeRate(); } });
      if (meleeAttack.range < 350) pool.push({ name: '🗡️ 劍氣距離提升', action: function() { meleeAttack.upgradeRange(); } });
    }

    // 弓手專屬
    if (archerAttack) {
      if (archerAttack.level < 15) pool.push({ name: '🏹 弓術精進 Lv' + archerAttack.level, action: function() { archerAttack.upgrade(); } });
      var ea = archerAttack.getExplosiveArrow();
      if (ea.level < 15) pool.push({ name: '💥 爆炸箭 Lv' + ea.level, action: function() { archerAttack.getExplosiveArrow().upgrade(); } });
      var pa = archerAttack.getPiercingArrow();
      if (pa.level < 15) pool.push({ name: '🔱 貫通箭 Lv' + pa.level, action: function() { archerAttack.getPiercingArrow().upgrade(); } });
    }

    // 女武神專屬
    if (valkyrieAttack && valkyrieAttack.level < 20) {
      var nextType = valkyrieAttack.getNextUpgradeType();
      var desc = nextType === 'range' ? '距離延長' : '頻率提升';
      pool.push({ name: '🔱 長槍強化 Lv.' + (valkyrieAttack.level + 1) + ' (' + desc + ')', action: function() { valkyrieAttack.upgrade(); } });
    }

    // 迴力鏢手專屬
    if (boomerangAttack && boomerangAttack.level < 20) {
      var bDesc = (boomerangAttack.level % 2 === 0) ? '數量+1' : '頻率提升';
      pool.push({ name: '🪃 迴力鏢強化 Lv.' + (boomerangAttack.level + 1) + ' (' + bDesc + ')', action: function() { boomerangAttack.upgrade(); } });
    }

    // 被動道具
    if (passiveItems) {
      var pc = passiveItems.getChoices(3);
      for (var pi = 0; pi < pc.length; pi++) {
        (function(p) { pool.push({ name: p.name, action: function() { passiveItems.apply(p.id, player); } }); })(pc[pi]);
      }
    }

    // 角色基礎技能必定佔第一位（未滿級時）
    var baseSkill = null;
    if (player.attackType === 'ranged') {
      // 法師：火球升級必定第一位
      if (fireballUpgrade) {
        baseSkill = fireballUpgrade;
      }
    } else if (player.attackType === 'melee') {
      for (var bi = 0; bi < pool.length; bi++) {
        if (pool[bi].name.indexOf('攻擊頻率') >= 0) {
          baseSkill = pool.splice(bi, 1)[0]; break;
        }
      }
    } else if (player.attackType === 'archer') {
      for (var bi = 0; bi < pool.length; bi++) {
        if (pool[bi].name.indexOf('弓術精進') >= 0) {
          baseSkill = pool.splice(bi, 1)[0]; break;
        }
      }
    } else if (player.attackType === 'valkyrie') {
      for (var bi = 0; bi < pool.length; bi++) {
        if (pool[bi].name.indexOf('長槍強化') >= 0) {
          baseSkill = pool.splice(bi, 1)[0]; break;
        }
      }
    } else if (player.attackType === 'boomerang') {
      for (var bi = 0; bi < pool.length; bi++) {
        if (pool[bi].name.indexOf('迴力鏢強化') >= 0) {
          baseSkill = pool.splice(bi, 1)[0]; break;
        }
      }
    }

    // 組合選項：基礎技能(1) + 隨機(2)
    var allOptions = [];
    if (baseSkill) allOptions.push(baseSkill);
    var remaining = 3 - allOptions.length;
    while (allOptions.length < 3 && pool.length > 0) {
      var idx = Math.floor(Math.random() * pool.length);
      allOptions.push(pool.splice(idx, 1)[0]);
    }
    if (allOptions.length === 0) { callback(); return; }

    // 建立按鈕（支援觸控）
    for (var o = 0; o < allOptions.length; o++) {
      (function(opt) {
        var btn = document.createElement('button');
        btn.className = 'upgrade-btn';
        btn.textContent = opt.name;
        var handled = false;
        var doAction = function(e) {
          if (handled) return;
          handled = true;
          if (e) e.preventDefault();
          clearTimeout(failsafe);
          opt.action();
          self.els.levelUp.style.display = 'none';
          callback();
        };
        btn.onclick = doAction;
        btn.addEventListener('touchend', doAction);
        self.els.choices.appendChild(btn);
      })(allOptions[o]);
    }

    // Failsafe 15秒自動關閉
    var failsafe = setTimeout(function() {
      if (self.els.levelUp.style.display !== 'none') {
        self.els.levelUp.style.display = 'none';
        callback();
      }
    }, 15000);
    this.els.levelUp.style.display = 'block';
  };

  // Game Over（含排行榜）
  UI.prototype.showGameOver = function(gameTime, level, kills, leaderboard) {
    var rank = leaderboard.addEntry(kills, level, gameTime);
    var top5 = leaderboard.getTop(5);

    var html = 'Time: ' + SG.formatTime(gameTime) + ' | Level: ' + level + ' | Kills: ' + kills;
    if (rank > 0) html += '<br>🏅 排名 #' + rank;
    this.els.finalStats.innerHTML = html;

    // 排行榜
    if (this.els.leaderboardEl) {
      var lbHtml = '<h3>🏆 排行榜</h3><ol>';
      for (var i = 0; i < top5.length; i++) {
        var e = top5[i];
        lbHtml += '<li>' + e.score + '分 (Lv.' + e.level + ' K:' + e.kills + ' ' + e.date + ')</li>';
      }
      lbHtml += '</ol><button id="clear-lb-btn" class="upgrade-btn" style="width:auto;padding:8px 16px;font-size:12px;">清除記錄</button>';
      this.els.leaderboardEl.innerHTML = lbHtml;
      this.els.leaderboardEl.style.display = 'block';
      document.getElementById('clear-lb-btn').onclick = function() {
        leaderboard.clear();
        document.getElementById('leaderboard').innerHTML = '<p>記錄已清除</p>';
      };
    }

    this.els.gameOverEl.style.display = 'block';
  };

  // 暫停切換
  UI.prototype.togglePause = function(paused) {
    this.els.pauseOverlay.style.display = paused ? 'block' : 'none';
  };

  // Boss 預警
  UI.prototype.showBossWarning = function() {
    this.els.bossWarning.style.display = 'block';
  };
  UI.prototype.hideBossWarning = function() {
    this.els.bossWarning.style.display = 'none';
  };
  UI.prototype.updateBossWarningOpacity = function(gameTime) {
    this.els.bossWarning.style.opacity = 0.5 + Math.sin(gameTime * 8) * 0.5;
  };

  // 靜音指示
  UI.prototype.updateMute = function(enabled) {
    if (this.els.muteBtn) this.els.muteBtn.textContent = enabled ? '🔊' : '🔇';
  };

  SG.UI = UI;
})();
