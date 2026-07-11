// character-select.js — 角色選擇畫面
(function() {
  window.SG = window.SG || {};

  var CHARACTERS = [
    { id: 'ranged', name: '法師', desc: '火球魔法攻擊', color: '#ff6600', attackType: 'ranged', scale: 1.0 },
    // { id: 'melee', name: '近戰劍士', desc: '劍氣斬擊周圍敵人', color: '#ff4466', attackType: 'melee', scale: 1.0 },
    { id: 'archer', name: '弓手', desc: '弓箭擴散射擊', color: '#44cc44', attackType: 'archer', scale: 1.0 },
    { id: 'knight', name: '黃金騎士', desc: '高防禦近戰攻擊', color: '#ffcc00', attackType: 'melee', scale: 1.5 }
  ];

  function CharacterSelect(onSelect) {
    this._onSelect = onSelect;
    this._el = document.getElementById('character-select');
    this._render();
  }

  CharacterSelect.prototype._render = function() {
    var self = this;
    this._el.innerHTML = '<div style="text-align:center;margin-bottom:10px;"><img src="assets/ui/title.png" style="max-width:400px;width:80%;height:auto;" alt="無盡的英雄"></div><h3 style="margin:0 0 10px 0;color:#aaa;">選擇角色</h3>';
    var container = document.createElement('div');
    container.style.cssText = 'display:flex; gap:30px; justify-content:center; margin-top:20px;';

    for (var i = 0; i < CHARACTERS.length; i++) {
      (function(ch) {
        var card = document.createElement('div');
        card.style.cssText = 'background:rgba(30,30,60,0.95); border:2px solid ' + ch.color + '; border-radius:12px; padding:20px 30px; cursor:pointer; text-align:center; transition:all 0.2s;';
        card.innerHTML = '<div style="font-size:48px; margin-bottom:10px;">' + (ch.id === 'ranged' ? '🔥' : ch.id === 'archer' ? '🏹' : ch.id === 'knight' ? '🛡️' : '⚔️') + '</div>' +
          '<div style="font-size:18px; color:' + ch.color + '; font-weight:bold;">' + ch.name + '</div>' +
          '<div style="font-size:13px; color:#aaa; margin-top:6px;">' + ch.desc + '</div>';
        card.onmouseover = function() { card.style.transform = 'scale(1.08)'; card.style.borderColor = '#fff'; };
        card.onmouseout = function() { card.style.transform = ''; card.style.borderColor = ch.color; };
        card.onclick = function() { self._el.style.display = 'none'; self._onSelect(ch); };
        container.appendChild(card);
      })(CHARACTERS[i]);
    }
    this._el.appendChild(container);
    // 版本號顯示
    var ver = document.createElement('div');
    ver.style.cssText = 'position:absolute; bottom:16px; left:0; right:0; text-align:center; font-size:12px; color:rgba(255,255,255,0.4);';
    ver.textContent = window.GAME_VERSION || '';
    this._el.appendChild(ver);
    this._el.style.display = 'block';
  };

  SG.CharacterSelect = CharacterSelect;
  SG.CHARACTERS = CHARACTERS;
})();
