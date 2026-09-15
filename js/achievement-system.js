// achievement-system.js — 跨局累積成就與統計
(function() {
  window.SG = window.SG || {};
  var ACH_KEY = 'survivor_achievements';
  var STAT_KEY = 'survivor_stats';
  var CHARACTERS = [
    ['ranged', '法師', '🔮'], ['archer', '弓手', '🏹'], ['knight', '黃金騎士', '🛡️'],
    ['valkyrie', '女武神', '🔱'], ['ninja', '忍者', '🥷'], ['amazon', '亞馬遜', '🏹']
  ];

  function metric(id, name, desc, icon, key, target, reward) {
    return { id: id, name: name, desc: desc, icon: icon, reward: reward,
      check: function(s) { return (s[key] || 0) >= target; },
      progress: function(s) { return (s[key] || 0) + '/' + target; } };
  }
  function characterMetric(id, name, desc, icon, bucket, character, target, reward) {
    return { id: id, name: name, desc: desc, icon: icon, reward: reward,
      check: function(s) { return ((s[bucket] || {})[character] || 0) >= target; },
      progress: function(s) { return (((s[bucket] || {})[character] || 0) + '/' + target); } };
  }

  var ACHIEVEMENTS = [];
  [['kill_100','初試身手',100,20],['kill_500','百戰老兵',500,35],['kill_1000','百人斬',1000,50],['kill_5000','千軍萬馬',5000,100],['kill_10000','萬人敵',10000,200],['kill_25000','不滅戰魂',25000,300],['kill_50000','傳說收割者',50000,500]].forEach(function(a) { ACHIEVEMENTS.push(metric(a[0],a[1],'累積擊殺 '+a[2],'⚔️','totalKills',a[2],a[3])); });
  [['boss_1','首領初見',1,20],['boss_10','屠龍者',10,50],['boss_50','Boss 獵人',50,150],['boss_100','傳奇屠王',100,300]].forEach(function(a) { ACHIEVEMENTS.push(metric(a[0],a[1],'擊殺 '+a[2]+' 個 Boss','🐉','totalBossKills',a[2],a[3])); });
  [['first_clear','首次通關',1,100],['clear_5','熟練冒險者',5,80],['clear_20','戰場常客',20,200],['clear_50','永恆英雄',50,400]].forEach(function(a) { ACHIEVEMENTS.push(metric(a[0],a[1],'完成 '+a[2]+' 次全通關','🏆','gamesCleared',a[2],a[3])); });
  CHARACTERS.forEach(function(c) { ACHIEVEMENTS.push(characterMetric('clear_'+c[0], c[1]+'大師', '用'+c[1]+'完成一次全通關', c[2], 'charClears', c[0], 1, 50)); });
  [['level_10','成長之路',10,20],['level_20','實力證明',20,40],['level_30','力量覺醒',30,75],['level_50','半神之境',50,150],['level_75','超越極限',75,250],['level_100','百級傳說',100,500]].forEach(function(a) { ACHIEVEMENTS.push(metric(a[0],a[1],'單局達到 Lv'+a[2],'⭐','maxLevel',a[2],a[3])); });
  [[60,'endless_1min','踏入無盡',20],[300,'endless_5min','堅持不懈',40],[600,'endless_10min','無盡鬥士',80],[1800,'endless_30min','不倒之人',200],[3600,'endless_60min','無盡傳說',500]].forEach(function(a) { ACHIEVEMENTS.push(metric(a[1],a[2],'無盡模式存活 '+Math.floor(a[0]/60)+' 分鐘','♾️','maxSurvivalTime',a[0],a[3])); });
  [[1,'relic_first','尋寶者',20],[5,'relic_5','遺物收藏',50],[20,'relic_20','古物鑑賞家',100],[50,'relic_50','遺物大師',200],[100,'relic_100','秘寶傳說',400]].forEach(function(a) { ACHIEVEMENTS.push(metric(a[1],a[2],'累積獲得 '+a[0]+' 個遺物','💎','relicsCollected',a[0],a[3])); });
  [[1,'hardcore_1','Hardcore 啟程',40],[3,'hardcore_3','Hardcore 老手',100],[5,'hardcore_5','Hardcore 強者',200],[10,'hardcore_10','Hardcore 傳奇',500]].forEach(function(a) { ACHIEVEMENTS.push(metric(a[1],a[2],'到達 Hardcore Lv.'+a[0],'🔥','hardcoreReached',a[0],a[3])); });
  [[1,'daily_1','每日首勝',30],[7,'daily_7','每週勇士',100],[30,'daily_30','每日傳奇',300]].forEach(function(a) { ACHIEVEMENTS.push(metric(a[1],a[2],'完成 '+a[0]+' 次每日挑戰','📅','dailyCompleted',a[0],a[3])); });
  [[1,'game_1','首次出征',10],[10,'game_10','十戰不屈',30],[50,'game_50','百戰準備',100],[100,'game_100','戰場老將',200],[500,'game_500','永不止步',500]].forEach(function(a) { ACHIEVEMENTS.push(metric(a[1],a[2],'完成 '+a[0]+' 局遊戲','🎮','totalGames',a[0],a[3])); });
  [[3600,'time_1h','冒險一小時',30],[18000,'time_5h','戰意不息',100],[86400,'time_24h','歲月戰場',400]].forEach(function(a) { ACHIEVEMENTS.push(metric(a[1],a[2],'累積遊玩 '+Math.floor(a[0]/3600)+' 小時','⏱️','totalPlayTime',a[0],a[3])); });
  CHARACTERS.forEach(function(c) { ACHIEVEMENTS.push(characterMetric('kills_'+c[0], c[1]+'征戰', '用'+c[1]+'擊殺 1000 個敵人', c[2], 'charKills', c[0], 1000, 80)); });

  function defaults() {
    return { totalKills:0, totalBossKills:0, totalDeaths:0, totalGames:0, totalPlayTime:0, maxLevel:0,
      maxSurvivalTime:0, gamesCleared:0, levelsCleared:0, charKills:{}, charClears:{}, relicsCollected:0,
      dailyCompleted:0, hardcoreReached:0, endlessMaxRamp:0 };
  }
  function AchievementSystem() {
    this.stats = this._load(STAT_KEY, defaults()); this.unlocked = this._load(ACH_KEY, {}); this._dirty = false; this._lastFlush = Date.now();
    var self = this;
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', function() { if (document.hidden) self.flush(); });
  }
  AchievementSystem.prototype._load = function(key, fallback) { try { var value = JSON.parse(localStorage.getItem(key)); return value || fallback; } catch(e) { return fallback; } };
  AchievementSystem.prototype._save = function() { try { localStorage.setItem(STAT_KEY, JSON.stringify(this.stats)); localStorage.setItem(ACH_KEY, JSON.stringify(this.unlocked)); } catch(e) {} };
  AchievementSystem.prototype.record = function(mutator) { try { mutator(this.stats); this._dirty = true; } catch(e) {} return this.stats; };
  AchievementSystem.prototype.flush = function() { if (!this._dirty) return; this._save(); this._dirty = false; this._lastFlush = Date.now(); };
  AchievementSystem.prototype.flushIfDue = function() { if (this._dirty && Date.now() - this._lastFlush >= 5000) this.flush(); };
  AchievementSystem.prototype.checkUnlocks = function() {
    var gained = [];
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
      var achievement = ACHIEVEMENTS[i];
      if (!this.unlocked[achievement.id] && achievement.check(this.stats)) { this.unlocked[achievement.id] = Date.now(); gained.push(achievement); }
    }
    if (gained.length) this._dirty = true;
    return gained;
  };
  AchievementSystem.prototype.getAchievements = function() { return ACHIEVEMENTS.slice(); };
  AchievementSystem.prototype.getUnlockedCount = function() { return Object.keys(this.unlocked).length; };
  SG.AchievementSystem = AchievementSystem;
  SG.ACHIEVEMENTS = ACHIEVEMENTS;
})();
