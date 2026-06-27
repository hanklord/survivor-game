// sprite-animator.js — Sprite Strip 動畫模組
(function() {
  window.SG = window.SG || {};

  /**
   * 從檔名解析幀數（格式：{name}_{action}_{N}f.png）
   */
  function parseFrameCount(filename) {
    var m = filename.match(/_(\d+)f\.\w+$/);
    return m ? Math.max(1, parseInt(m[1], 10)) : 1;
  }

  /**
   * SpriteAnimator — 管理一個實體的多動作 sprite strip 動畫
   * @param {Object} config - { idle: { image, fps, frames }, run: { ... }, ... }
   */
  function SpriteAnimator(config) {
    this._anims = {};
    this._state = null;
    this._frameIndex = 0;
    this._timer = 0;

    for (var action in config) {
      var entry = config[action];
      this._anims[action] = {
        image: entry.image,
        fps: entry.fps || 8,
        frames: entry.frames || 1,
        frameWidth: 0,
        frameHeight: 0
      };
    }

    var keys = Object.keys(this._anims);
    if (keys.length) this._state = keys[0];
  }

  /** 切換動畫狀態 */
  SpriteAnimator.prototype.setState = function(action) {
    if (action === this._state || !this._anims[action]) return;
    this._state = action;
    this._frameIndex = 0;
    this._timer = 0;
  };

  /** 更新幀計時器（不追幀，確保穩定播放） */
  SpriteAnimator.prototype.update = function(dt) {
    var anim = this._anims[this._state];
    if (!anim || anim.frames <= 1) return;
    this._timer += dt;
    var interval = 1 / anim.fps;
    if (this._timer >= interval) {
      this._timer = 0;
      this._frameIndex = (this._frameIndex + 1) % anim.frames;
    }
  };

  /** 繪製當前幀，支援翻轉（boolean）或旋轉（number） */
  SpriteAnimator.prototype.draw = function(ctx, x, y, size, angleOrFlip) {
    var anim = this._anims[this._state];
    if (!anim || !anim.image || !anim.image.complete) return;

    // 動態計算格子寬度（只算一次）
    if (!anim.frameWidth) {
      anim.frameWidth = Math.floor(anim.image.width / anim.frames);
      anim.frameHeight = anim.image.height;
    }

    var fw = anim.frameWidth;
    var fh = anim.frameHeight;
    var sx = Math.round(this._frameIndex * fw); // 整數確保不跨格

    // 關閉 smoothing 防止邊緣取樣
    var prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    if (typeof angleOrFlip === 'number') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angleOrFlip);
      ctx.drawImage(anim.image, sx, 0, fw, fh, -size / 2, -size / 2, size, size);
      ctx.restore();
    } else if (angleOrFlip) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      ctx.drawImage(anim.image, sx, 0, fw, fh, -size / 2, -size / 2, size, size);
      ctx.restore();
    } else {
      ctx.drawImage(anim.image, sx, 0, fw, fh, x - size / 2, y - size / 2, size, size);
    }

    ctx.imageSmoothingEnabled = prevSmoothing;
  };

  /** 圖片是否全部載入完成 */
  SpriteAnimator.prototype.isLoaded = function() {
    for (var action in this._anims) {
      var img = this._anims[action].image;
      if (!img || !img.complete) return false;
    }
    return true;
  };

  SG.SpriteAnimator = SpriteAnimator;
  SG.parseFrameCount = parseFrameCount;
})();
