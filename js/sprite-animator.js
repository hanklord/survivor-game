// sprite-animator.js — Sprite Strip 動畫模組（支援 N×M grid）
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
   * SpriteAnimator — 管理一個實體的多動作 sprite 動畫
   * 支援單排（1×N）和多排（rows×cols）grid 排列。
   *
   * @param {Object} config - { idle: { image, fps, frames, cols?, rows? }, run: { ... }, ... }
   *   - frames: 總幀數
   *   - cols: 每排幾格（可選，預設 = frames，即單排）
   *   - rows: 幾排（可選，預設 = 1）
   *   - 如果只提供 cols，rows 自動計算為 ceil(frames / cols)
   *   - 如果只提供 rows，cols 自動計算為 ceil(frames / rows)
   *   - 幀播放順序：左到右、上到下（row-major）
   */
  function SpriteAnimator(config) {
    this._anims = {};
    this._state = null;
    this._frameIndex = 0;
    this._timer = 0;

    for (var action in config) {
      var entry = config[action];
      var frames = entry.frames || 1;
      var cols = entry.cols || 0;
      var rows = entry.rows || 0;

      // 自動推算 cols/rows
      if (cols && !rows) {
        rows = Math.ceil(frames / cols);
      } else if (rows && !cols) {
        cols = Math.ceil(frames / rows);
      } else if (!cols && !rows) {
        // 預設：單排（向後相容）
        cols = frames;
        rows = 1;
      }

      this._anims[action] = {
        image: entry.image,
        fps: entry.fps || 8,
        frames: frames,
        cols: cols,
        rows: rows,
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

  /** 繪製當前幀，支援翻轉（boolean）或旋轉（number），可選 widthRatio */
  SpriteAnimator.prototype.draw = function(ctx, x, y, size, angleOrFlip, widthRatio) {
    var anim = this._anims[this._state];
    if (!anim || !anim.image || !anim.image.complete) return;

    // 動態計算格子尺寸（只算一次）
    if (!anim.frameWidth) {
      anim.frameWidth = Math.floor(anim.image.width / anim.cols);
      anim.frameHeight = Math.floor(anim.image.height / anim.rows);
    }

    var fw = anim.frameWidth;
    var fh = anim.frameHeight;

    // Row-major: 左到右、上到下
    var col = this._frameIndex % anim.cols;
    var row = Math.floor(this._frameIndex / anim.cols);
    var sx = col * fw;
    var sy = row * fh;

    var drawW = size * (widthRatio || 1);
    var drawH = size;

    if (typeof angleOrFlip === 'number') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angleOrFlip);
      ctx.drawImage(anim.image, sx, sy, fw, fh, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    } else if (angleOrFlip) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      ctx.drawImage(anim.image, sx, sy, fw, fh, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    } else {
      ctx.drawImage(anim.image, sx, sy, fw, fh, x - drawW / 2, y - drawH / 2, drawW, drawH);
    }
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
