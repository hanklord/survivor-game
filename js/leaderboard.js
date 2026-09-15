// leaderboard.js — 排行榜系統（localStorage）
(function() {
  window.SG = window.SG || {};

  var STORAGE_KEY = 'sg_leaderboard';
  var ENDLESS_STORAGE_KEY = 'sg_endless_leaderboard';
  var MAX_ENTRIES = 10;

  function Leaderboard() {
    this.entries = this._load();
    this.endlessEntries = this._load(ENDLESS_STORAGE_KEY);
  }

  // 從 localStorage 讀取
  Leaderboard.prototype._load = function(key) {
    try {
      var data = localStorage.getItem(key || STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch(e) { return []; }
  };

  // 存入 localStorage
  Leaderboard.prototype._save = function() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries)); } catch(e) {}
  };

  Leaderboard.prototype._saveEndless = function() {
    try { localStorage.setItem(ENDLESS_STORAGE_KEY, JSON.stringify(this.endlessEntries)); } catch(e) {}
  };

  // 計算分數
  Leaderboard.prototype.calcScore = function(kills, level, survivalTime) {
    return kills * level + Math.floor(survivalTime);
  };

  // 記錄一筆成績，回傳排名（1-based，0 表示未上榜）
  Leaderboard.prototype.addEntry = function(kills, level, survivalTime) {
    var score = this.calcScore(kills, level, survivalTime);
    var entry = {
      score: score,
      kills: kills,
      level: level,
      time: Math.floor(survivalTime),
      date: new Date().toLocaleDateString()
    };
    this.entries.push(entry);
    this.entries.sort(function(a, b) { return b.score - a.score; });
    if (this.entries.length > MAX_ENTRIES) this.entries.length = MAX_ENTRIES;
    this._save();
    // 回傳排名
    for (var i = 0; i < this.entries.length; i++) {
      if (this.entries[i] === entry) return i + 1;
    }
    return 0;
  };

  // 取得 Top N
  Leaderboard.prototype.getTop = function(n) {
    return this.entries.slice(0, n || 5);
  };

  // 無盡模式依存活秒數排序，與一般排行榜完全分離。
  Leaderboard.prototype.addEndlessEntry = function(survivalTime, kills, rampLevel, character) {
    var entry = {
      time: Math.floor(survivalTime),
      kills: kills,
      rampLevel: rampLevel,
      character: character || 'unknown',
      date: new Date().toLocaleDateString()
    };
    this.endlessEntries.push(entry);
    this.endlessEntries.sort(function(a, b) {
      return b.time - a.time || b.kills - a.kills;
    });
    if (this.endlessEntries.length > MAX_ENTRIES) this.endlessEntries.length = MAX_ENTRIES;
    this._saveEndless();
    for (var i = 0; i < this.endlessEntries.length; i++) {
      if (this.endlessEntries[i] === entry) return i + 1;
    }
    return 0;
  };

  Leaderboard.prototype.getEndlessTop = function(n) {
    return this.endlessEntries.slice(0, n || 5);
  };

  // 清除所有記錄
  Leaderboard.prototype.clear = function() {
    this.entries = [];
    this._save();
  };

  Leaderboard.prototype.clearEndless = function() {
    this.endlessEntries = [];
    this._saveEndless();
  };

  SG.Leaderboard = Leaderboard;
})();
