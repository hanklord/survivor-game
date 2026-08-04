// sprite-aabb.js — 基於 Sprite 輝度掃描的 AABB 邊界計算
(function() {
  window.SG = window.SG || {};

  var LUMINANCE_THRESHOLD = 0.2;
  var ALPHA_THRESHOLD = 0;

  // 快取：key → { halfW: 比例值, halfH: 比例值 }
  var _cache = {};

  // 離屏 canvas（重用，避免每次建立新的）
  var _offCanvas = null;
  var _offCtx = null;

  function _getOffscreen(w, h) {
    if (!_offCanvas) {
      _offCanvas = document.createElement('canvas');
      _offCtx = _offCanvas.getContext('2d', { willReadFrequently: true });
    }
    _offCanvas.width = w;
    _offCanvas.height = h;
    return _offCtx;
  }

  /**
   * 判斷像素是否為「有效像素」
   * 條件：alpha > 0 且 luminance > 0.2
   */
  function _isValidPixel(r, g, b, a) {
    if (a <= ALPHA_THRESHOLD) return false;
    var luminance = 0.299 * (r / 255) + 0.587 * (g / 255) + 0.114 * (b / 255);
    return luminance > LUMINANCE_THRESHOLD;
  }

  /**
   * 掃描一個矩形區域的 ImageData，回傳有效像素的 AABB
   * 回傳 { minX, minY, maxX, maxY } 相對於區域左上角，或 null 表示無有效像素
   */
  function _scanRegion(data, regionW, regionH) {
    var minX = regionW, minY = regionH, maxX = 0, maxY = 0;
    var found = false;
    for (var y = 0; y < regionH; y++) {
      for (var x = 0; x < regionW; x++) {
        var idx = (y * regionW + x) * 4;
        if (_isValidPixel(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }
    return found ? { minX: minX, minY: minY, maxX: maxX, maxY: maxY } : null;
  }

  /**
   * 計算單張圖片的 AABB（整張圖掃描）
   * @param {string} key - 快取 key
   * @param {HTMLImageElement} img - 已載入的圖片
   */
  SG.computeSpriteAABB = function(key, img) {
    if (_cache[key]) return _cache[key];
    if (!img || !img.complete || !img.naturalWidth) {
      _cache[key] = { halfW: 0.5, halfH: 0.5 };
      return _cache[key];
    }

    var w = img.naturalWidth;
    var h = img.naturalHeight;
    var ctx = _getOffscreen(w, h);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0);

    var imageData = ctx.getImageData(0, 0, w, h);
    var bounds = _scanRegion(imageData.data, w, h);

    if (!bounds) {
      _cache[key] = { halfW: 0.5, halfH: 0.5 };
    } else {
      // 以中心為基準的半寬/半高比例
      var cx = w / 2;
      var cy = h / 2;
      var halfW = Math.max(Math.abs(bounds.minX - cx), Math.abs(bounds.maxX - cx)) / w;
      var halfH = Math.max(Math.abs(bounds.minY - cy), Math.abs(bounds.maxY - cy)) / h;
      _cache[key] = { halfW: halfW, halfH: halfH };
    }
    return _cache[key];
  };

  /**
   * 計算 sprite strip 所有幀的聯集 AABB
   * @param {string} key - 快取 key
   * @param {HTMLImageElement} img - 已載入的 strip 圖片
   * @param {number} frames - 總幀數
   * @param {number} cols - 列數
   * @param {number} rows - 行數
   */
  SG.computeStripAABB = function(key, img, frames, cols, rows) {
    if (_cache[key]) return _cache[key];
    if (!img || !img.complete || !img.naturalWidth) {
      _cache[key] = { halfW: 0.5, halfH: 0.5 };
      return _cache[key];
    }

    cols = cols || frames;
    rows = rows || 1;
    var fw = Math.floor(img.naturalWidth / cols);
    var fh = Math.floor(img.naturalHeight / rows);
    var ctx = _getOffscreen(fw, fh);

    var unionMinX = fw, unionMinY = fh, unionMaxX = 0, unionMaxY = 0;
    var found = false;

    for (var f = 0; f < frames; f++) {
      var col = f % cols;
      var row = Math.floor(f / cols);
      var sx = col * fw;
      var sy = row * fh;

      ctx.clearRect(0, 0, fw, fh);
      ctx.drawImage(img, sx, sy, fw, fh, 0, 0, fw, fh);
      var imageData = ctx.getImageData(0, 0, fw, fh);
      var bounds = _scanRegion(imageData.data, fw, fh);

      if (bounds) {
        if (bounds.minX < unionMinX) unionMinX = bounds.minX;
        if (bounds.minY < unionMinY) unionMinY = bounds.minY;
        if (bounds.maxX > unionMaxX) unionMaxX = bounds.maxX;
        if (bounds.maxY > unionMaxY) unionMaxY = bounds.maxY;
        found = true;
      }
    }

    if (!found) {
      _cache[key] = { halfW: 0.5, halfH: 0.5 };
    } else {
      var cx = fw / 2;
      var cy = fh / 2;
      var halfW = Math.max(Math.abs(unionMinX - cx), Math.abs(unionMaxX - cx)) / fw;
      var halfH = Math.max(Math.abs(unionMinY - cy), Math.abs(unionMaxY - cy)) / fh;
      _cache[key] = { halfW: halfW, halfH: halfH };
    }
    return _cache[key];
  };

  /**
   * 取得已快取的 AABB 半寬/半高（以實際渲染尺寸換算）
   * @param {string} key - 快取 key
   * @param {number} renderSize - 實際渲染時的尺寸（寬或高，假設正方形）
   * @returns {{ halfW: number, halfH: number }} 實際像素的半寬/半高
   */
  SG.getAABBHalfExtent = function(key, renderSize) {
    var cached = _cache[key];
    if (!cached) return { halfW: renderSize / 2, halfH: renderSize / 2 };
    return {
      halfW: cached.halfW * renderSize,
      halfH: cached.halfH * renderSize
    };
  };

})();
