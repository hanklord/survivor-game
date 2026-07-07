// character-select.js — 角色選擇畫面
(function() {
  window.SG = window.SG || {};

  var CHARACTERS = [
    { id: 'ranged', name: '遠程勇者', desc: '自動射擊最近敵人', color: '#4488ff', attackType: 'ranged' },
    { id: 'melee', name: '近戰劍士', desc: '劍氣斬擊周圍敵人', color: '#ff4466', attackType: 'melee' },
    { id: 'archer', name: '弓手', desc: '弓箭擴散射擊', color: '#44cc44', attackType: 'archer' }
  ];

  function CharacterSelect(onSelect) {
    this._onSelect = onSelect;
    this._el = document.getElementById('character-select');
    this._render();
  }

  CharacterSelect.prototype._render = function() {
    var self = this;
    this._el.innerHTML = '<h2>選擇角色</h2>';
    var container = document.createElement('div');
    container.style.cssText = 'display:flex; gap:30px; justify-content:center; margin-top:20px;';

    for (var i = 0; i < CHARACTERS.length; i++) {
      (function(ch) {
        var card = document.createElement('div');
        card.style.cssText = 'background:rgba(30,30,60,0.95); border:2px solid ' + ch.color + '; border-radius:12px; padding:20px 30px; cursor:pointer; text-align:center; transition:all 0.2s;';
        card.innerHTML = '<div style="font-size:48px; margin-bottom:10px;">' + (ch.id === 'ranged' ? '🔫' : ch.id === 'archer' ? '🏹' : '⚔️') + '</div>' +
          '<div style="font-size:18px; color:' + ch.color + '; font-weight:bold;">' + ch.name + '</div>' +
          '<div style="font-size:13px; color:#aaa; margin-top:6px;">' + ch.desc + '</div>';
        card.onmouseover = function() { card.style.transform = 'scale(1.08)'; card.style.borderColor = '#fff'; };
        card.onmouseout = function() { card.style.transform = ''; card.style.borderColor = ch.color; };
        card.onclick = function() { self._el.style.display = 'none'; self._onSelect(ch); };
        container.appendChild(card);
      })(CHARACTERS[i]);
    }
    this._el.appendChild(container);
    this._el.style.display = 'block';
  };

  SG.CharacterSelect = CharacterSelect;
  SG.CHARACTERS = CHARACTERS;
})();
