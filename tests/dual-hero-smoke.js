#!/usr/bin/env node
/*
 * Zero-dependency dual-hero smoke test.
 * Run: node tests/dual-hero-smoke.js
 *
 * This intentionally stubs Canvas/DOM/audio and executes the same IIFE modules
 * as index.html. It verifies game-state and combat ownership paths; browser
 * rendering is covered by the normal Canvas renderer, not this headless test.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var ROOT = path.resolve(__dirname, '..');
var passes = 0;
var failures = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeContext() {
  var elements = {};
  function element(id) {
    if (elements[id]) return elements[id];
    var el = {
      id: id || '', style: {}, children: [], innerHTML: '', textContent: '',
      width: 360, height: 640, clientWidth: 360, clientHeight: 640,
      checked: true, value: '', className: '', disabled: false,
      appendChild: function(child) { this.children.push(child); child.parentNode = this; return child; },
      removeChild: function(child) { var i = this.children.indexOf(child); if (i >= 0) this.children.splice(i, 1); },
      addEventListener: function() {}, removeEventListener: function() {},
      setAttribute: function(name, value) { this[name] = value; },
      querySelectorAll: function() { return []; },
      getBoundingClientRect: function() { return { left: 0, top: 0, width: this.width || 360, height: this.height || 640 }; },
      click: function() { if (typeof this.onclick === 'function') this.onclick(); }
    };
    if (id === 'game' || id === 'bg-canvas') {
      var gradient = { addColorStop: function() {} };
      el.getContext = function() {
        return {
          canvas: el, globalAlpha: 1,
          createPattern: function() { return {}; }, createLinearGradient: function() { return gradient; },
          fillRect: function() {}, strokeRect: function() {}, clearRect: function() {}, drawImage: function() {},
          beginPath: function() {}, closePath: function() {}, moveTo: function() {}, lineTo: function() {},
          arc: function() {}, ellipse: function() {}, fill: function() {}, stroke: function() {}, save: function() {},
          restore: function() {}, translate: function() {}, rotate: function() {}, scale: function() {},
          fillText: function() {}, strokeText: function() {}, measureText: function(text) { return { width: String(text).length * 8 }; }
        };
      };
    }
    elements[id] = el;
    return el;
  }
  [
    'game', 'bg-canvas', 'game-container', 'character-select', 'swap-hero-btn', 'meta-shop',
    'settings-btn', 'settings-menu', 'set-bgm', 'set-sfx', 'set-hitbox', 'set-autoplay',
    'set-resume', 'set-back-menu', 'legacy-hp', 'legacy-atk', 'legacy-deaths', 'legacy-stage',
    'legacy-reset', 'achievements-btn', 'achievement-list', 'level-up', 'choices', 'game-over',
    'final-stats', 'leaderboard', 'pause-overlay', 'boss-warning', 'skill-icons', 'level-name',
    'mute-indicator', 'hud-stats', 'xp-fill', 'game-timer', 'dual-hero-hud', 'hero-swap-flash'
  ].forEach(element);
  var store = Object.create(null);
  var document = {
    getElementById: element,
    createElement: function() { return element('node-' + Object.keys(elements).length); },
    addEventListener: function() {}, removeEventListener: function() {}
  };
  var context = {
    console: console, Math: Math, JSON: JSON, Date: Date, Object: Object, Array: Array,
    setTimeout: function() { return 1; }, clearTimeout: function() {},
    requestAnimationFrame: function() { return 1; }, cancelAnimationFrame: function() {},
    document: document, innerWidth: 360, innerHeight: 640,
    addEventListener: function() {}, removeEventListener: function() {},
    confirm: function() { return true; }, location: { reload: function() {} },
    localStorage: {
      getItem: function(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
      setItem: function(key, value) { store[key] = String(value); }, removeItem: function(key) { delete store[key]; },
      key: function(index) { return Object.keys(store)[index] || null; }, get length() { return Object.keys(store).length; }
    },
    Image: function() { this.complete = false; this.width = 1; this.height = 1; },
    Audio: function() { this.play = function() { return { catch: function() {} }; }; this.pause = function() {}; },
    AudioContext: function() {}, webkitAudioContext: function() {}
  };
  context.window = context;
  context.global = context;
  context.AudioContext.prototype.createOscillator = function() { return { connect: function() {}, start: function() {}, stop: function() {}, frequency: {}, type: 'sine' }; };
  context.AudioContext.prototype.createGain = function() { return { connect: function() {}, gain: { setValueAtTime: function() {}, exponentialRampToValueAtTime: function() {} } }; };
  context.AudioContext.prototype.resume = function() {};
  context.AudioContext.prototype.destination = {};
  context.AudioContext.prototype.currentTime = 0;
  return vm.createContext(context);
}

function loadModules(context) {
  var html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  var sources = [];
  var match;
  var script = /<script src="([^"]+)"><\/script>/g;
  while ((match = script.exec(html))) sources.push(match[1]);
  sources.forEach(function(source) {
    var filename = path.join(ROOT, source);
    try {
      vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename: source });
    } catch (error) {
      // Keep executing the remaining dual-hero suite so a pre-existing load error
      // is reported separately from the eight target paths.
      if (source === 'js/wave-manager.js' && /WaveManager is not defined/.test(error.message) && context.SG.WaveManager) {
        failures.push('1. Headless module load: js/wave-manager.js leaks WaveManager.prototype outside its IIFE');
        context.WaveManager = context.SG.WaveManager;
        return;
      }
      throw error;
    }
  });
}

var context = makeContext();
loadModules(context);
var SG = context.SG;
var results = [];
function run(number, name, test) {
  try { test(); passes++; results.push(number + '. PASS — ' + name); }
  catch (error) { results.push(number + '. FAIL — ' + name + ': ' + error.message); }
}

// Avoid image loading/RAF in the constructor; _initGame itself is exercised below.
SG.Game.prototype._loadImages = function() {};
function character(id) { return SG.CHARACTERS.filter(function(ch) { return ch.id === id; })[0]; }
function makeGame(primaryId, secondaryId) {
  var game = new SG.Game();
  game._selectedCharacter = character(primaryId);
  game.dualHeroMode = !!secondaryId;
  game._secondaryCharacter = secondaryId ? character(secondaryId) : null;
  game._initGame();
  return game;
}
var dual;
var single;

run(1, 'all core modules load and expose Game/Player/SubHeroAI/getSynergy', function() {
  assert(failures.length === 0, failures.join('; '));
  assert(SG.Game && SG.Player && SG.SubHeroAI && SG.getSynergy, 'core modules did not load');
});
run(2, 'dual selection initializes two distinct heroes', function() {
  dual = makeGame('archer', 'ranged');
  assert(dual.dualHeroMode && dual.heroes.length === 2 && dual.activeHeroIndex === 0, 'dual run did not initialize two heroes');
  assert(dual.heroes[0].characterId !== dual.heroes[1].characterId, 'dual heroes must differ');
});
run(3, 'companion is invulnerable and only active hero ends the run', function() {
  var companionHp = dual.heroes[1].hp;
  assert(dual._playerTakeDamage(9999, null, dual.heroes[1]) === false && dual.heroes[1].hp === companionHp, 'companion took damage');
  var deathRun = makeGame('archer', 'ranged');
  deathRun.player.hp = 1;
  deathRun._playerTakeDamage(9999, null, deathRun.player);
  assert(deathRun.gameOver === true, 'active hero death did not end the run');
});
run(4, 'swap transfers active player, invulnerability, and cooldown', function() {
  var swapRun = makeGame('archer', 'ranged');
  var formerMain = swapRun.player;
  assert(swapRun._swapHero() === true && swapRun.activeHeroIndex === 1 && swapRun.player === swapRun.heroes[1], 'hero swap failed');
  assert(formerMain.invincible === true && swapRun.player.invincible === false && swapRun._heroSwapCooldown > 0, 'swap did not transfer invulnerability');
  assert(swapRun._swapHero() === false && swapRun.activeHeroIndex === 1, 'swap cooldown was bypassed');
  swapRun._heroSwapCooldown = 0;
  assert(swapRun._swapHero() === true && swapRun.activeHeroIndex === 0, 'swap did not resume after cooldown');
});
run(5, 'named/default synergies apply to both heroes and sort IDs', function() {
  assert(dual._heroSynergy.name === '魔箭合擊' && dual.heroes[0].damageMultiplier === 1.15 && dual.heroes[1].damageMultiplier === 1.15, 'named synergy was not applied to both heroes');
  assert(SG.getSynergy('ranged', 'archer').name === '魔箭合擊', 'synergy key is order dependent');
  var fallbackRun = makeGame('ranged', 'ninja');
  assert(fallbackRun._heroSynergy.name === '並肩作戰' && fallbackRun.heroes[0].damageMultiplier === 1.05 && fallbackRun.heroes[1].damageMultiplier === 1.05, 'default synergy was not applied');
});
run(6, 'companion has no ultimate activation but its kills charge the shared meter', function() {
  var ultRun = makeGame('archer', 'ranged');
  var companion = ultRun.heroes[1];
  var companionUltimateUsed = false;
  companion._ultimate.activate = function() { companionUltimateUsed = true; throw new Error('companion ultimate used'); };
  ultRun._updateSubHeroAttacks(0.1);
  assert(companionUltimateUsed === false, 'companion ultimate was updated');
  var chargeBefore = ultRun._ultimateCharge;
  ultRun._handleKill({ type: 'enemy', x: 0, y: 0, color: '#fff', hp: 0 }, companion);
  assert(ultRun._ultimateCharge > chargeBefore, 'companion kill did not charge the shared ultimate');
  assert(ultRun._ultimate && ultRun.player._ultimate && ultRun._ultimate.player === ultRun.player, 'active hero has no owner-bound ultimate instance');
});
run(7, 'dual target count and boss HP compensation apply', function() {
  single = makeGame('archer');
  assert(dual._getTargetEnemyCount() > single._getTargetEnemyCount(), 'dual enemy target count did not increase');
  var singleBoss = { type: 'boss', hp: 100, maxHp: 100 };
  var dualBoss = { type: 'boss', hp: 100, maxHp: 100 };
  single._applySpawnDifficulty(singleBoss);
  dual._applySpawnDifficulty(dualBoss);
  assert(singleBoss.hp === 100 && dualBoss.hp === 150 && dualBoss.maxHp === 150, 'dual boss HP multiplier is incorrect');
});
run(8, 'single-hero mode has no companion or swap behavior', function() {
  assert(single.dualHeroMode === false && single.heroes.length === 1 && single._getTargetEnemyCount() === 60, 'single-hero mode regressed');
  assert(single._subHeroAI === null && single._swapHero() === false && single.activeHeroIndex === 0, 'single-hero mode incorrectly enabled companion behavior');
});

results.forEach(function(result) { console.log(result); });
if (passes !== 8) process.exitCode = 1;
