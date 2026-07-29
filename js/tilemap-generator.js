(function() {
  window.SG = window.SG || {};

  var TILE_SIZE = 64;
  var MAP_TILES_W = 40; // 40×64 = 2560px 寬
  var MAP_TILES_H = 60; // 60×64 = 3840px 高

  function TilemapGenerator() {
    this.tileImages = [];
    this.mapCanvas = null;
    this.ready = false;
  }

  // 載入所有 tile 圖片
  TilemapGenerator.prototype.loadTiles = function(tileFiles, callback) {
    var self = this;
    var loaded = 0;
    for (var i = 0; i < tileFiles.length; i++) {
      (function(idx) {
        var img = new Image();
        img.onload = function() {
          self.tileImages[idx] = img;
          loaded++;
          if (loaded >= tileFiles.length) self._generate(callback);
        };
        img.onerror = function() { loaded++; if (loaded >= tileFiles.length) self._generate(callback); };
        img.src = tileFiles[idx];
      })(i);
    }
  };

  // 隨機生成地圖到 offscreen canvas
  TilemapGenerator.prototype._generate = function(callback) {
    this.mapCanvas = document.createElement('canvas');
    this.mapCanvas.width = MAP_TILES_W * TILE_SIZE;
    this.mapCanvas.height = MAP_TILES_H * TILE_SIZE;
    var ctx = this.mapCanvas.getContext('2d');

    // 隨機拼接
    for (var y = 0; y < MAP_TILES_H; y++) {
      for (var x = 0; x < MAP_TILES_W; x++) {
        var idx = Math.floor(Math.random() * this.tileImages.length);
        var tile = this.tileImages[idx];
        if (tile) ctx.drawImage(tile, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
    this.ready = true;
    if (callback) callback();
  };

  // 取得地圖 canvas
  TilemapGenerator.prototype.getMapCanvas = function() {
    return this.mapCanvas;
  };

  TilemapGenerator.prototype.getMapSize = function() {
    return { width: MAP_TILES_W * TILE_SIZE, height: MAP_TILES_H * TILE_SIZE };
  };

  SG.TilemapGenerator = TilemapGenerator;
  SG.TILE_SIZE = TILE_SIZE;
})();
