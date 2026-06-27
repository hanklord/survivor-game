// ui.js — UI/HUD 更新 + 升級選單 + 技能圖標 + 排行榜
(function() {
  window.SG = window.SG || {};

  var UPGRADE_CHOICES = 3;

  // 原有升級選項
  var UPGRADES = [
    { name: '⚔️ Damage +25%', apply: function(p) { p.damage *= 1.25; } },
    { name: '💨 Speed +15%', apply: function(p) { p.speed *= 1.15; } },
    { name: '🔫 +1 Projectile', apply: function(p) { p.projectileCount++; } },
    { name: '⚡ Fire Rate +20%', apply: function(p) { p.fireRate *= 0.8; } },
    { name: '🧲 Pickup Range +30%', apply: function(p) { p.pickupRange *= 1.3; } },
    { name: '❤️ Max HP +25', apply: function(p) { p.maxHp += 25; p.hp = Math.min(p.hp + 25, p.maxHp); } }
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
    this.els.hpFill.style.width = (player.hp / player.maxHp * 100) + '%';
    this.els.hpText.textContent = Math.ceil(player.hp) + '/' + player.maxHp;
    this.els.xpFill.style.width = (player.xp / player.xpNeeded * 100) + '%';
    this.els.timer.textContent = SG.formatTime(gameTime);
    this.els.level.textContent = player.level;
    this.els.kills.textContent = kills;
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
  UI.prototype.showAllClear = function(gameTime, level, kills) {
    if (!this.els.levelClear) return;
    this.els.levelClear.innerHTML = '<h2>🏆 全部通關！</h2><p>Time: ' + SG.formatTime(gameTime) + ' | Level: ' + level + ' | Kills: ' + kills + '</p><button class="upgrade-btn" onclick="location.reload()">再玩一次</button>';
    this.els.levelClear.style.display = 'block';
  };

  // 顯示升級選單（含武器 + 被動技能選項）
  UI.prototype.showLevelUp = function(player, weaponManager, skillTree, callback, meleeAttack) {
    var self = this;
    this.els.choices.innerHTML = '';

    // 基礎升級選項（隨機 3 個）
    var picks = [];
    while (picks.length < Math.min(UPGRADE_CHOICES, UPGRADES.length)) {
      var i = Math.floor(Math.random() * UPGRADES.length);
      if (picks.indexOf(i) === -1) picks.push(i);
    }

    var allOptions = [];
    for (var p = 0; p < picks.length; p++) {
      (function(idx) {
        allOptions.push({
          name: UPGRADES[idx].name,
          action: function() { UPGRADES[idx].apply(player); }
        });
      })(picks[p]);
    }

    // 武器選項（隨機 1 個）
    var wi = Math.floor(Math.random() * WEAPON_UPGRADES.length);
    var wup = WEAPON_UPGRADES[wi];
    allOptions.push({
      name: wup.name,
      action: function() {
        if (wup.type === 'shield') weaponManager.unlockShield();
        else if (wup.type === 'nova') weaponManager.unlockNova();
        else if (wup.type === 'missile') weaponManager.unlockMissile();
        else if (wup.type === 'thunder') weaponManager.unlockThunder();
        else if (wup.type === 'chainLightning') weaponManager.unlockChainLightning();
      }
    });

    // 被動技能選項（1~2 個）
    var skillChoices = skillTree.getRandomChoices();
    for (var s = 0; s < skillChoices.length; s++) {
      (function(sc) {
        allOptions.push({
          name: sc.name,
          action: function() { skillTree.applySkill(sc.skillId, player); }
        });
      })(skillChoices[s]);
    }

    // 近戰角色專屬升級（隨機 1 個）
    if (meleeAttack) {
      var mi = Math.floor(Math.random() * MELEE_UPGRADES.length);
      var mup = MELEE_UPGRADES[mi];
      allOptions.push({
        name: mup.name,
        action: function() {
          if (mup.type === 'meleeRate') meleeAttack.upgradeRate();
          else if (mup.type === 'meleeRange') meleeAttack.upgradeRange();
        }
      });
    }

    // 建立按鈕
    for (var o = 0; o < allOptions.length; o++) {
      (function(opt) {
        var btn = document.createElement('button');
        btn.className = 'upgrade-btn';
        btn.textContent = opt.name;
        btn.onclick = function() {
          opt.action();
          self.els.levelUp.style.display = 'none';
          callback();
        };
        self.els.choices.appendChild(btn);
      })(allOptions[o]);
    }
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
