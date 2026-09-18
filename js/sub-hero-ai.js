// sub-hero-ai.js — DH-2 companion follow behaviour
(function() {
  window.SG = window.SG || {};

  var FOLLOW_START = 120;
  var FOLLOW_COMFORT = 60;
  var ENEMY_RADIUS = 190;

  function SubHeroAI(subHero, spatialHash) {
    this.hero = subHero;
    this.spatialHash = spatialHash;
  }

  SubHeroAI.prototype.update = function(dt, mainHero, enemies, bosses) {
    var hero = this.hero;
    var px = hero.x, py = hero.y;
    var followX = mainHero.x - px, followY = mainHero.y - py;
    var followDist = Math.sqrt(followX * followX + followY * followY) || 1;
    followX /= followDist; followY /= followDist;

    // Keep a loose formation: catch up hard outside 120px, do not stack on the lead.
    var fx = 0, fy = 0;
    if (followDist > FOLLOW_START) {
      fx += followX * 4.5; fy += followY * 4.5;
    } else if (followDist < FOLLOW_COMFORT) {
      fx -= followX * 1.1; fy -= followY * 1.1;
    } else {
      fx += followX * 0.45; fy += followY * 0.45;
    }

    var nearby = this.spatialHash ? this.spatialHash.query(px, py, ENEMY_RADIUS) : (enemies || []);
    var nearest = null, nearestDist = Infinity;
    for (var i = 0; i < nearby.length; i++) {
      var enemy = nearby[i];
      if (!enemy || enemy.hp <= 0) continue;
      var dx = px - enemy.x, dy = py - enemy.y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist < nearestDist) { nearest = enemy; nearestDist = dist; }
      if (dist < ENEMY_RADIUS) {
        var repel = (1 - dist / ENEMY_RADIUS) * 2.8;
        fx += (dx / dist) * repel;
        fy += (dy / dist) * repel;
      }
    }

    // Ranged heroes keep a useful firing distance only when the formation is safe.
    if (nearest && followDist <= FOLLOW_START && nearestDist > 150) {
      var ax = nearest.x - px, ay = nearest.y - py;
      var ad = Math.sqrt(ax * ax + ay * ay) || 1;
      fx += (ax / ad) * 0.35;
      fy += (ay / ad) * 0.35;
    }

    var mag = Math.sqrt(fx * fx + fy * fy);
    if (mag < 0.08) {
      if (nearest) hero.facingLeft = hero.spriteDefaultRight ? nearest.x < px : nearest.x > px;
      return { x: 0, y: 0 };
    }
    return { x: fx / mag, y: fy / mag };
  };

  SG.SubHeroAI = SubHeroAI;
})();
