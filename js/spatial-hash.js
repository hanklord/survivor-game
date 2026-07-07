// spatial-hash.js — 空間雜湊碰撞偵測加速
(function() {
  window.SG = window.SG || {};

  var DEFAULT_CELL_SIZE = 120;

  /**
   * SpatialHash — 將實體依據空間位置分桶，
   * 碰撞查詢只需檢查相鄰 cell，複雜度從 O(n²) 降為 O(n)。
   */
  function SpatialHash(cellSize) {
    this.cellSize = cellSize || DEFAULT_CELL_SIZE;
    this.cells = {};
  }

  // 清空所有 cell
  SpatialHash.prototype.clear = function() {
    this.cells = {};
  };

  // 取得實體所在的 cell key
  SpatialHash.prototype._key = function(x, y) {
    var cx = Math.floor(x / this.cellSize);
    var cy = Math.floor(y / this.cellSize);
    return cx + ',' + cy;
  };

  // 插入一個實體（需有 x, y 屬性）
  SpatialHash.prototype.insert = function(entity) {
    var key = this._key(entity.x, entity.y);
    if (!this.cells[key]) this.cells[key] = [];
    this.cells[key].push(entity);
  };

  // 查詢指定位置 + 半徑範圍內可能碰撞的實體
  SpatialHash.prototype.query = function(x, y, radius) {
    var results = [];
    var minCx = Math.floor((x - radius) / this.cellSize);
    var maxCx = Math.floor((x + radius) / this.cellSize);
    var minCy = Math.floor((y - radius) / this.cellSize);
    var maxCy = Math.floor((y + radius) / this.cellSize);

    for (var cx = minCx; cx <= maxCx; cx++) {
      for (var cy = minCy; cy <= maxCy; cy++) {
        var cell = this.cells[cx + ',' + cy];
        if (cell) {
          for (var i = 0; i < cell.length; i++) {
            results.push(cell[i]);
          }
        }
      }
    }
    return results;
  };

  SG.SpatialHash = SpatialHash;
})();
