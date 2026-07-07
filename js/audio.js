// audio.js — 音效系統（Web Audio API 程式化生成）
(function() {
  window.SG = window.SG || {};

  function AudioManager(config) {
    var audioCfg = (config && config.audio) || {};
    this.enabled = audioCfg.enabled !== false;
    this.volume = audioCfg.volume || 0.5;
    this.ctx = null;
    this._bgm = null;       // 背景音樂 Audio 元素
    this._bgmPlaying = false;
    this._initContext();
    this._initBGM();
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
    if (this._bgm) this._bgm.muted = !this.enabled;
    return this.enabled;
  };

  // 初始化背景音樂
  AudioManager.prototype._initBGM = function() {
    this._bgm = new Audio('assets/audio/bgm.mp3');
    this._bgm.loop = true;
    this._bgm.volume = this.volume * 0.4; // BGM 音量較低
  };

  // 開始播放背景音樂（需用戶互動後呼叫）
  AudioManager.prototype.playBGM = function() {
    if (!this._bgm || this._bgmPlaying) return;
    this._bgm.play().then(function() {}).catch(function() {});
    this._bgmPlaying = true;
  };

  // 暫停背景音樂
  AudioManager.prototype.pauseBGM = function() {
    if (this._bgm) this._bgm.pause();
  };

  // 恢復背景音樂
  AudioManager.prototype.resumeBGM = function() {
    if (this._bgm && this._bgmPlaying) this._bgm.play().catch(function() {});
  };

  // 停止背景音樂
  AudioManager.prototype.stopBGM = function() {
    if (this._bgm) { this._bgm.pause(); this._bgm.currentTime = 0; }
    this._bgmPlaying = false;
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

  // 弓箭手射箭（咻～ swoosh：高頻→低頻快速下滑）
  AudioManager.prototype.playArrowShoot = function() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    var ctx = this.ctx;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    var filter = ctx.createBiquadFilter();
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.12);
    gain.gain.setValueAtTime(0.15 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.12);
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

  // === 場景環境音系統 ===

  AudioManager.prototype._stopAmbient = function() {
    if (this._ambientNodes) {
      this._ambientNodes.forEach(function(n) { try { n.stop(); } catch(e) {} });
    }
    this._ambientNodes = [];
    if (this._ambientGain) {
      this._ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this._ambientGain = null;
    }
    if (this._ambientInterval) {
      clearInterval(this._ambientInterval);
      this._ambientInterval = null;
    }
  };

  AudioManager.prototype.playAmbient = function(levelName) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    this._stopAmbient();

    var ctx = this.ctx;
    this._ambientGain = ctx.createGain();
    this._ambientGain.gain.value = 0.12 * this.volume;
    this._ambientGain.connect(ctx.destination);
    this._ambientNodes = [];

    var self = this;
    if (levelName === '草地') this._ambientGrass();
    else if (levelName === '洞窟') this._ambientCave();
    else if (levelName === '沼澤') this._ambientSwamp();
    else if (levelName === '火山') this._ambientVolcano();
    else if (levelName === '地獄') this._ambientHell();
  };

  // 草地：輕快的旋律 loop
  AudioManager.prototype._ambientGrass = function() {
    var ctx = this.ctx;
    var gain = this._ambientGain;
    var self = this;
    var notes = [392, 440, 494, 523, 494, 440]; // G4 A4 B4 C5 B4 A4
    var idx = 0;
    function playNote() {
      if (!self._ambientGain) return;
      var osc = ctx.createOscillator();
      var ng = ctx.createGain();
      osc.connect(ng);
      ng.connect(gain);
      osc.type = 'sine';
      osc.frequency.value = notes[idx % notes.length];
      ng.gain.setValueAtTime(0.5, ctx.currentTime);
      ng.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
      self._ambientNodes.push(osc);
      idx++;
    }
    playNote();
    this._ambientInterval = setInterval(playNote, 500);
  };

  // 洞窟：回音滴水
  AudioManager.prototype._ambientCave = function() {
    var ctx = this.ctx;
    var gain = this._ambientGain;
    var self = this;
    function drip() {
      if (!self._ambientGain) return;
      var osc = ctx.createOscillator();
      var ng = ctx.createGain();
      osc.connect(ng);
      ng.connect(gain);
      osc.type = 'sine';
      osc.frequency.value = 2000 + Math.random() * 1000;
      ng.gain.setValueAtTime(0.6, ctx.currentTime);
      ng.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
      self._ambientNodes.push(osc);
    }
    drip();
    this._ambientInterval = setInterval(drip, 800 + Math.random() * 1200);
  };

  // 沼澤：低沉嗡嗡
  AudioManager.prototype._ambientSwamp = function() {
    var ctx = this.ctx;
    var gain = this._ambientGain;
    var osc1 = ctx.createOscillator();
    var osc2 = ctx.createOscillator();
    osc1.connect(gain);
    osc2.connect(gain);
    osc1.type = 'sawtooth';
    osc1.frequency.value = 55;
    osc2.type = 'sine';
    osc2.frequency.value = 60;
    gain.gain.value = 0.08 * this.volume;
    osc1.start();
    osc2.start();
    this._ambientNodes.push(osc1, osc2);
  };

  // 火山：隆隆聲
  AudioManager.prototype._ambientVolcano = function() {
    var ctx = this.ctx;
    var gain = this._ambientGain;
    var self = this;
    // 低頻持續隆隆
    var osc = ctx.createOscillator();
    osc.connect(gain);
    osc.type = 'sawtooth';
    osc.frequency.value = 40;
    gain.gain.value = 0.10 * this.volume;
    osc.start();
    this._ambientNodes.push(osc);
    // 間歇性轟鳴
    function rumble() {
      if (!self._ambientGain) return;
      var r = ctx.createOscillator();
      var rg = ctx.createGain();
      r.connect(rg);
      rg.connect(gain);
      r.type = 'square';
      r.frequency.value = 30 + Math.random() * 20;
      rg.gain.setValueAtTime(0.4, ctx.currentTime);
      rg.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      r.start(ctx.currentTime);
      r.stop(ctx.currentTime + 0.8);
      self._ambientNodes.push(r);
    }
    this._ambientInterval = setInterval(rumble, 2000 + Math.random() * 2000);
  };

  // 地獄：陰森風
  AudioManager.prototype._ambientHell = function() {
    var ctx = this.ctx;
    var gain = this._ambientGain;
    var self = this;
    // 持續不和諧低音
    var osc1 = ctx.createOscillator();
    var osc2 = ctx.createOscillator();
    osc1.connect(gain);
    osc2.connect(gain);
    osc1.type = 'sine';
    osc1.frequency.value = 73.4; // D2
    osc2.type = 'sawtooth';
    osc2.frequency.value = 77.8; // slightly detuned = eerie
    gain.gain.value = 0.08 * this.volume;
    osc1.start();
    osc2.start();
    this._ambientNodes.push(osc1, osc2);
    // 陰森尖叫
    function wail() {
      if (!self._ambientGain) return;
      var w = ctx.createOscillator();
      var wg = ctx.createGain();
      w.connect(wg);
      wg.connect(gain);
      w.type = 'sine';
      w.frequency.setValueAtTime(300, ctx.currentTime);
      w.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 1.5);
      wg.gain.setValueAtTime(0.2, ctx.currentTime);
      wg.gain.setValueAtTime(0.2, ctx.currentTime + 0.8);
      wg.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
      w.start(ctx.currentTime);
      w.stop(ctx.currentTime + 1.5);
      self._ambientNodes.push(w);
    }
    this._ambientInterval = setInterval(wail, 3000 + Math.random() * 3000);
  };

  SG.AudioManager = AudioManager;
})();
