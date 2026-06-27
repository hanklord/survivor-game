// object-pool.js — 物件池，減少 GC 壓力
(function() {
  window.SG = window.SG || {};

  /**
   * ObjectPool — 物件重用池。
   * 物件死亡時 release 回池，下次需要時從池中取出重用，
   * 避免頻繁 new/GC 造成的效能抖動。
   */
  function ObjectPool(factory) {
    this._factory = factory; // 建構函式
    this._pool = [];
  }

  // 從池中取出物件，池為空則建立新的
  ObjectPool.prototype.get = function() {
    return this._pool.length > 0 ? this._pool.pop() : this._factory();
  };

  // 將物件歸還池中
  ObjectPool.prototype.release = function(obj) {
    this._pool.push(obj);
  };

  SG.ObjectPool = ObjectPool;
})();
