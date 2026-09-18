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
  UI.prototype.updateHUD = function(player, gameTime, kills, endlessInfo, dualInfo) {
    var statsEl = document.getElementById('hud-stats');
    if (statsEl) {
      statsEl.style.display = dualInfo ? 'none' : '';
      statsEl.innerHTML = 'Lv.' + player.level + '<br>💀 ' + kills + '<br>⚔️ ' + Math.round(player.damage) + '<br>🛡️ ' + (player.armor || 0) + '<br>👟 ' + Math.round(player.speed);
    }
    this.updateDualHeroHUD(dualInfo);
    // XP bar
    var xpFill = document.getElementById('xp-fill');
    if (xpFill) xpFill.style.width = (player.xp / player.xpNeeded * 100) + '%';
    // Timer
    var timerEl = document.getElementById('game-timer');
    if (timerEl) {
      timerEl.textContent = endlessInfo ? '♾️ ' + SG.formatTime(gameTime) + ' | 難度 ×' + endlessInfo.multiplier.toFixed(1) : SG.formatTime(gameTime);
    }
  };

  // 更新技能圖標顯示
  UI.prototype.updateSkillIcons = function(skillTree, relicIds) {
    if (!this.els.skillIcons) return;
    var acquired = skillTree.getAcquired();
    var html = '';
    for (var i = 0; i < acquired.length; i++) {
      html += '<span class="skill-icon" title="Lv.' + acquired[i].level + '">' + acquired[i].icon + '<sub>' + acquired[i].level + '</sub></span>';
    }
    for (var r = 0; relicIds && r < relicIds.length; r++) {
      for (var ri = 0; window.SG.RELICS && ri < window.SG.RELICS.length; ri++) {
        if (window.SG.RELICS[ri].id === relicIds[r]) {
          html += '<span class="skill-icon" title="遺物：' + window.SG.RELICS[ri].name + '">' + window.SG.RELICS[ri].icon + '</span>';
          break;
        }
      }
    }
    this.els.skillIcons.innerHTML = html;
  };

  UI.prototype.updateDualHeroHUD = function(dualInfo) {
    var hud = document.getElementById('dual-hero-hud');
    var swapBtn = document.getElementById('swap-hero-btn');
    if (!hud) return;
    if (!dualInfo || !dualInfo.heroes || dualInfo.heroes.length < 2) {
      hud.style.display = 'none';
      if (swapBtn) swapBtn.style.display = 'none';
      return;
    }
    var icons = { ranged: 'mage.png', archer: 'archer.png', knight: 'knight.png', valkyrie: 'valkyrie.png', ninja: 'ninja.png', amazon: 'amazon.png', melee: 'melee.png' };
    var active = dualInfo.activeHeroIndex;
    var html = '';
    for (var i = 0; i < dualInfo.heroes.length; i++) {
      var hero = dualInfo.heroes[i];
      var isActive = i === active;
      var ratio = Math.max(0, Math.min(1, hero.hp / hero.maxHp));
      html += '<div class="dual-hero-card ' + (isActive ? 'active' : '') + '">' +
        '<img src="assets/ui/chars/' + (icons[hero.characterId] || 'mage.png') + '" alt="">' +
        '<div>' + (isActive ? '<b>主控</b>' : '<small>AI</small>') + '<br><span style="font-size:11px;">' + (hero.character && hero.character.name || hero.characterId) + '</span>' +
        (isActive ? '<div class="dual-hero-hp"><i style="width:' + (ratio * 100) + '%"></i></div><small>' + Math.ceil(hero.hp) + '/' + hero.maxHp + '</small>' : '') +
        '</div></div>';
    }
    hud.innerHTML = html;
    hud.style.display = 'block';
    if (swapBtn) swapBtn.style.display = 'block';
  };

  UI.prototype.showHeroSwap = function() {
    var flash = document.getElementById('hero-swap-flash');
    if (!flash) return;
    flash.style.display = 'block';
    clearTimeout(this._heroSwapFlashTimer);
    this._heroSwapFlashTimer = setTimeout(function() { flash.style.display = 'none'; }, 320);
  };

  UI.prototype.showHeroSynergy = function(synergy) {
    if (!synergy) return;
    var old = document.getElementById('hero-synergy-toast');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var toast = document.createElement('div');
    toast.id = 'hero-synergy-toast';
    toast.style.cssText = 'position:absolute;top:72px;left:50%;transform:translateX(-50%);z-index:12;padding:8px 14px;border:1px solid #ffdd55;border-radius:8px;background:rgba(22,22,55,.9);color:#ffef99;font-size:13px;text-align:center;pointer-events:none;box-shadow:0 0 12px rgba(255,221,85,.45);';
    toast.innerHTML = '🤝 羈絆：<b>' + synergy.name + '</b><br><small>' + synergy.desc + '</small>';
    document.getElementById('game-container').appendChild(toast);
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3200);
  };

  // 更新關卡名稱
  UI.prototype.updateLevelName = function(name) {
    if (this.els.levelName) this.els.levelName.textContent = name;
  };

  // 顯示通關畫面
  UI.prototype.showLevelClear = function(levelName, callback) {
    if (!this.els.levelClear) { callback(); return; }
    var self = this;
    this.els.levelClear.innerHTML = '<h2>🎉 ' + levelName + ' 通關！</h2><span id="auto-countdown" style="display:none;font-size:48px;color:#ffcc00;font-weight:bold;"></span><button class="upgrade-btn" id="next-level-btn">下一關</button>';
    this.els.levelClear.style.display = 'block';
    this._autoClearTimer = null;

    var nextBtn = document.getElementById('next-level-btn');
    nextBtn.onclick = function() {
      if (self._autoClearTimer) clearInterval(self._autoClearTimer);
      document.getElementById('level-clear').style.display = 'none';
      callback();
    };

    // Auto-Play：3-2-1 倒數後自動接關
    if (window.SG && window.SG._gameInstance && window.SG._gameInstance._autoPlay && window.SG._gameInstance._autoPlay.isEnabled()) {
      var countEl = document.getElementById('auto-countdown');
      countEl.style.display = 'block';
      var count = 3;
      countEl.textContent = count;
      self._autoClearTimer = setInterval(function() {
        count--;
        if (count > 0) {
          countEl.textContent = count;
        } else {
          clearInterval(self._autoClearTimer);
          self._autoClearTimer = null;
          if (self.els.levelClear.style.display !== 'none') {
            nextBtn.click();
          }
        }
      }, 1000);
    }
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
  UI.prototype.showLevelUp = function(player, weaponManager, skillTree, callback, meleeAttack, archerAttack, passiveItems, valkyrieAttack, boomerangAttack, amazonAttack) {
    var self = this;
    var heading = this.els.levelUp.querySelector('h2');
    if (heading) heading.textContent = 'LEVEL UP!';
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

    // 亞馬遜專屬
    if (amazonAttack && amazonAttack.level < 20) {
      var amDesc = (amazonAttack.level % 2 === 0) ? '頻率提升' : '貫通+1';
      if (amazonAttack.level === 9) amDesc = '連鎖閃電解鎖!';
      pool.push({ name: '🏹 標槍強化 Lv.' + (amazonAttack.level + 1) + ' (' + amDesc + ')', action: function() { amazonAttack.upgrade(); } });
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
    } else if (player.attackType === 'amazon') {
      for (var bi = 0; bi < pool.length; bi++) {
        if (pool[bi].name.indexOf('標槍強化') >= 0) {
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

    // Auto-Play：輪播選擇動畫
    this._autoSkillTimer = null;
    if (window.SG && window.SG._gameInstance && window.SG._gameInstance._autoPlay && window.SG._gameInstance._autoPlay.isEnabled()) {
      var btns = self.els.choices.querySelectorAll('.upgrade-btn');
      if (btns.length > 0) {
        var step = 0;
        var finalIdx = Math.floor(Math.random() * btns.length);
        var totalSteps = 9;
        while ((totalSteps - 1) % btns.length !== finalIdx) totalSteps++;
        var baseDelay = 100;
        var autoTimer = null;
        var cancelled = false;

        // 音效合成
        function playTick() {
          if (!window.SG._gameInstance || !window.SG._gameInstance.audio || !window.SG._gameInstance.audio.enabled) return;
          try {
            var ctx = window.SG._audioCtx || (window.SG._audioCtx = new (window.AudioContext || window.webkitAudioContext)());
            var osc = ctx.createOscillator(); var gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 800; gain.gain.value = 0.1;
            osc.start(); osc.stop(ctx.currentTime + 0.03);
          } catch(e) {}
        }
        function playDing() {
          if (!window.SG._gameInstance || !window.SG._gameInstance.audio || !window.SG._gameInstance.audio.enabled) return;
          try {
            var ctx = window.SG._audioCtx || (window.SG._audioCtx = new (window.AudioContext || window.webkitAudioContext)());
            var osc = ctx.createOscillator(); var gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 1200; osc.type = 'sine'; gain.gain.value = 0.2;
            osc.start(); osc.stop(ctx.currentTime + 0.12);
          } catch(e) {}
        }

        function doStep() {
          if (cancelled) return;
          for (var i = 0; i < btns.length; i++) {
            btns[i].style.borderColor = '';
            btns[i].style.transform = '';
          }
          var currentIdx = step % btns.length;
          btns[currentIdx].style.borderColor = '#ffffff';
          btns[currentIdx].style.transform = 'scale(1.03)';
          playTick();
          step++;

          if (step >= totalSteps) {
            for (var i = 0; i < btns.length; i++) {
              btns[i].style.borderColor = '';
              btns[i].style.transform = '';
            }
            btns[finalIdx].style.borderColor = '#ffd700';
            btns[finalIdx].style.transform = 'scale(1.05)';
            playDing();
            autoTimer = setTimeout(function() {
              if (!cancelled && self.els.levelUp.style.display !== 'none') {
                btns[finalIdx].click();
              }
            }, 300);
          } else {
            var delay = baseDelay + step * 25;
            autoTimer = setTimeout(doStep, delay);
          }
        }

        autoTimer = setTimeout(doStep, 500);

        self.els.choices.addEventListener('click', function() {
          cancelled = true;
          if (autoTimer) clearTimeout(autoTimer);
        }, { once: true });
      }
    }
  };

  // 顯示 Boss 掉落的風險／報酬遺物三選一。
  UI.prototype.showRelicChoice = function(relics, onPick) {
    var self = this;
    if (!relics || !relics.length) { onPick(null); return; }
    var heading = this.els.levelUp.querySelector('h2');
    if (heading) heading.textContent = '✨ 選擇遺物';
    this.els.choices.innerHTML = '';
    var handled = false;
    function pick(relic) {
      if (handled) return;
      handled = true;
      self.els.levelUp.style.display = 'none';
      onPick(relic);
    }
    for (var i = 0; i < relics.length; i++) {
      (function(relic) {
        var button = document.createElement('button');
        button.className = 'upgrade-btn';
        button.innerHTML = '<div style="font-size:20px;margin-bottom:4px;">' + relic.icon + ' ' + relic.name + '</div>' +
          '<div style="font-size:12px;color:#66dd88;">＋ ' + relic.positive + '</div>' +
          '<div style="font-size:12px;color:#ff8888;margin-top:3px;">－ ' + relic.negative + '</div>';
        button.onclick = function() { pick(relic); };
        button.addEventListener('touchend', function(e) { e.preventDefault(); pick(relic); });
        self.els.choices.appendChild(button);
      })(relics[i]);
    }
    this.els.levelUp.style.display = 'block';
    if (window.SG && window.SG._gameInstance && window.SG._gameInstance._autoPlay && window.SG._gameInstance._autoPlay.isEnabled()) {
      setTimeout(function() {
        if (!handled && self.els.levelUp.style.display !== 'none') pick(relics[Math.floor(Math.random() * relics.length)]);
      }, 600);
    }
  };

  UI.prototype.showAchievementToast = function(achievement, delay) {
    setTimeout(function() {
      var old = document.getElementById('achievement-toast');
      if (old && old.parentNode) old.parentNode.removeChild(old);
      var toast = document.createElement('div');
      toast.id = 'achievement-toast';
      toast.style.cssText = 'position:absolute;top:18%;left:50%;transform:translateX(-50%);z-index:30;padding:12px 18px;background:rgba(32,25,8,0.94);border:2px solid #ffcc33;border-radius:10px;color:#fff;font-size:16px;text-align:center;text-shadow:0 1px 2px #000;pointer-events:none;';
      toast.textContent = '🏆 成就解鎖：' + achievement.name + ' (+' + achievement.reward + ' 金幣)';
      document.getElementById('game-container').appendChild(toast);
      setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3500);
    }, delay || 0);
  };

  UI.prototype.renderAchievements = function(system) {
    var el = document.getElementById('achievement-list');
    if (!el || !system) return;
    var all = system.getAchievements();
    var html = '<div style="color:#ffdd55;margin-bottom:8px;">🏆 成就：' + system.getUnlockedCount() + ' / ' + all.length + '</div>';
    for (var i = 0; i < all.length; i++) {
      var a = all[i], unlockedAt = system.unlocked[a.id];
      var color = unlockedAt ? '#fff' : '#777';
      var date = unlockedAt ? ' — ' + new Date(unlockedAt).toLocaleDateString() : ' (' + (a.progress ? a.progress(system.stats) : '') + ')';
      html += '<div style="padding:6px 2px;border-bottom:1px solid #333;color:' + color + ';">' + a.icon + ' <b>' + a.name + '</b> +' + a.reward + ' 💰<br><span style="font-size:11px;color:' + (unlockedAt ? '#aadd88' : '#888') + ';">' + a.desc + date + '</span></div>';
    }
    el.innerHTML = html;
    el.style.display = 'block';
  };

  // Game Over（含排行榜）
  UI.prototype.showGameOver = function(gameTime, level, kills, leaderboard, earned, totalCoins, endlessResult) {
    var rank, top5, html;
    if (endlessResult) {
      rank = endlessResult.rank;
      top5 = leaderboard.getEndlessTop(5);
      html = '♾️ 無盡模式<br>存活: ' + SG.formatTime(gameTime) + ' | 擊殺: ' + kills + ' | 難度 ×' + endlessResult.multiplier.toFixed(1) + '<br>角色: ' + endlessResult.character;
      if (rank > 0) html += '<br>🏅 無盡排名 #' + rank;
    } else {
      rank = leaderboard.addEntry(kills, level, gameTime);
      top5 = leaderboard.getTop(5);
      html = 'Time: ' + SG.formatTime(gameTime) + ' | Level: ' + level + ' | Kills: ' + kills;
      if (rank > 0) html += '<br>🏅 排名 #' + rank;
    }
    this.els.finalStats.innerHTML = html;

    // 排行榜
    if (this.els.leaderboardEl) {
      var lbHtml = '<h3>🏆 ' + (endlessResult ? '無盡排行榜' : '排行榜') + '</h3><ol>';
      for (var i = 0; i < top5.length; i++) {
        var e = top5[i];
        lbHtml += endlessResult ? '<li>' + SG.formatTime(e.time) + ' (K:' + e.kills + ' 難度 ×' + (1 + e.rampLevel * 0.1).toFixed(1) + ' ' + e.character + ')</li>' : '<li>' + e.score + '分 (Lv.' + e.level + ' K:' + e.kills + ' ' + e.date + ')</li>';
      }
      lbHtml += '</ol><button id="clear-lb-btn" class="upgrade-btn" style="width:auto;padding:8px 16px;font-size:12px;">清除記錄</button>';
      this.els.leaderboardEl.innerHTML = lbHtml;
      this.els.leaderboardEl.style.display = 'block';
      document.getElementById('clear-lb-btn').onclick = function() {
        if (endlessResult) leaderboard.clearEndless(); else leaderboard.clear();
        document.getElementById('leaderboard').innerHTML = '<p>記錄已清除</p>';
      };
    }

    this.els.gameOverEl.style.display = 'block';

    var legacy = window.SG._gameInstance && window.SG._gameInstance._legacy;
    var gain = window.SG._gameInstance && window.SG._gameInstance._lastLegacyGain;
    if (legacy && gain) {
      var legacyDiv = document.createElement('div');
      legacyDiv.style.cssText = 'margin-top:12px; font-size:14px; color:#ffcc00;';
      legacyDiv.innerHTML = '📈 永久成長: +' + gain.hpGain.toFixed(1) + '% HP, +' + gain.atkGain.toFixed(1) + '% ATK<br>' +
        '<span style="color:#aaa;font-size:12px;">累計: HP +' + legacy.data.hpPercent.toFixed(1) + '%, ATK +' + legacy.data.atkPercent.toFixed(1) + '%</span>';
      this.els.gameOverEl.appendChild(legacyDiv);
    }

    // AFK mode: automatically retry after a visible three-second countdown.
    if (localStorage.getItem('survivor_autoplay') === 'on') {
      var countdown = 3;
      var countEl = document.createElement('div');
      countEl.style.cssText = 'font-size:48px; color:#ffd700; text-shadow:-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000,2px 2px 0 #000; margin-top:15px; font-family:' + (window.GAME_FONT || 'Cinzel, serif') + ';';
      countEl.textContent = countdown;
      this.els.gameOverEl.appendChild(countEl);
      var cdInterval = setInterval(function() {
        countdown--;
        if (countdown <= 0) {
          clearInterval(cdInterval);
          // The leaderboard may add a "clear" button before Retry; target
          // the original inline Retry action explicitly.
          var retryBtn = document.querySelector('#game-over button[onclick]');
          if (retryBtn) retryBtn.click();
        } else {
          countEl.textContent = countdown;
        }
      }, 1000);
      var allBtns = this.els.gameOverEl.querySelectorAll('button');
      for (var bi = 0; bi < allBtns.length; bi++) {
        allBtns[bi].addEventListener('click', function() {
          clearInterval(cdInterval);
          if (countEl.parentNode) countEl.parentNode.removeChild(countEl);
        }, { once: true });
      }
    }
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
