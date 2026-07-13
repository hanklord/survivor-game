// input.js — 輸入管理（鍵盤 + 手機搖桿）
(function() {
  window.SG = window.SG || {};

  function InputManager() {
    this.keys = {};
    this.joystickDir = { x: 0, y: 0 };
    this.isMobile = 'ontouchstart' in window;
    this._joyCenter = null;
    this._joyId = null;
    this._onPause = null; // 外部設定的暫停回呼
    this._onMute = null;  // 靜音切換回呼
    this._init();
  }

  InputManager.prototype._init = function() {
    var self = this;

    document.addEventListener('keydown', function(e) {
      self.keys[e.code] = true;
      if (e.code === 'Escape' && self._onPause) self._onPause();
      if (e.code === 'KeyM' && self._onMute) self._onMute();
      if (e.code === 'KeyN' && self._onSkipLevel) self._onSkipLevel(); // 除錯：跳關
      if (e.code === 'KeyL' && self._onDebugLevelUp) self._onDebugLevelUp(); // 除錯：升級
    });
    document.addEventListener('keyup', function(e) {
      self.keys[e.code] = false;
    });

    if (this.isMobile) {
      var joy = document.getElementById('joystick');
      var knob = document.getElementById('joystick-knob');
      joy.style.display = 'block';

      joy.addEventListener('touchstart', function(e) {
        var t = e.touches[0];
        var r = joy.getBoundingClientRect();
        self._joyCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        self._joyId = t.identifier;
      });

      document.addEventListener('touchmove', function(e) {
        if (!self._joyCenter) return;
        for (var i = 0; i < e.touches.length; i++) {
          var t = e.touches[i];
          if (t.identifier === self._joyId) {
            var dx = t.clientX - self._joyCenter.x;
            var dy = t.clientY - self._joyCenter.y;
            var m = Math.hypot(dx, dy);
            var maxR = 50;
            if (m > maxR) { dx = dx / m * maxR; dy = dy / m * maxR; }
            knob.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
            self.joystickDir = { x: dx / maxR, y: dy / maxR };
          }
        }
      });

      document.addEventListener('touchend', function(e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
          var t = e.changedTouches[i];
          if (t.identifier === self._joyId) {
            self.joystickDir = { x: 0, y: 0 };
            knob.style.transform = '';
            self._joyId = null;
          }
        }
      });
    }
  };

  // 取得目前移動方向（已正規化）
  InputManager.prototype.getDirection = function() {
    var dx = 0, dy = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) dy--;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) dy++;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx--;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) dx++;
    if (this.joystickDir.x || this.joystickDir.y) {
      dx = this.joystickDir.x;
      dy = this.joystickDir.y;
    }
    if (dx || dy) {
      var m = Math.hypot(dx, dy);
      return { x: dx / m, y: dy / m };
    }
    return { x: 0, y: 0 };
  };

  SG.InputManager = InputManager;
})();
