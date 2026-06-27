// audio.js — 音效系統（Web Audio API 程式化生成）
(function() {
  window.SG = window.SG || {};

  function AudioManager(config) {
    var audioCfg = (config && config.audio) || {};
    this.enabled = audioCfg.enabled !== false;
    this.volume = audioCfg.volume || 0.5;
    this.ctx = null;
    this._initContext();
  }

  AudioManager.prototype._initContext = function() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {
      this.enabled = false;
    }
  };

  // 確保 AudioContext 啟動（需要用戶互動後）
  AudioManager.prototype.resume = function() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  };

  // 切換靜音
  AudioManager.prototype.toggleMute = function() {
    this.enabled = !this.enabled;
    return this.enabled;
  };

  // 播放音效的基礎方法
  AudioManager.prototype._play = function(freq, type, duration, vol, ramp) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    var v = (vol || 1) * this.volume;
    gain.gain.setValueAtTime(v, this.ctx.currentTime);
    if (ramp) gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  };

  // 噪音播放
  AudioManager.prototype._playNoise = function(duration, vol) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    var bufferSize = this.ctx.sampleRate * duration;
    var buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    var src = this.ctx.createBufferSource();
    var gain = this.ctx.createGain();
    src.buffer = buffer;
    src.connect(gain);
    gain.connect(this.ctx.destination);
    gain.gain.setValueAtTime((vol || 0.3) * this.volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    src.start();
  };

  // === 各種音效 ===

  // 射擊（短促高頻 beep）
  AudioManager.prototype.playShoot = function() {
    this._play(880, 'square', 0.05, 0.2, true);
  };

  // 敵人死亡（低頻 thud）
  AudioManager.prototype.playEnemyDeath = function() {
    this._play(120, 'sine', 0.15, 0.4, true);
  };

  // 升級（上升音階 jingle）
  AudioManager.prototype.playLevelUp = function() {
    if (!this.enabled || !this.ctx) return;
    var self = this;
    var notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach(function(f, i) {
      setTimeout(function() { self._play(f, 'sine', 0.15, 0.3, true); }, i * 100);
    });
  };

  // Boss 出現（警告低音）
  AudioManager.prototype.playBossWarning = function() {
    this._play(80, 'sawtooth', 0.5, 0.5, true);
  };

  // 玩家受傷（噪音 burst）
  AudioManager.prototype.playHurt = function() {
    this._playNoise(0.1, 0.4);
  };

  // 撿取 XP（清脆 ping）
  AudioManager.prototype.playPickup = function() {
    this._play(1200, 'sine', 0.06, 0.15, true);
  };

  SG.AudioManager = AudioManager;
})();
