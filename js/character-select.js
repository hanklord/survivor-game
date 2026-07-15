// character-select.js — 角色選擇畫面
(function() {
  window.SG = window.SG || {};

  var CHARACTERS = [
    { id: 'ranged', name: '法師', desc: '火球魔法攻擊', color: '#ff6600', attackType: 'ranged', scale: 1.0, hitboxRadius: 20, icon: 'assets/ui/chars/mage.png' },
    // { id: 'melee', name: '近戰劍士', desc: '劍氣斬擊周圍敵人', color: '#ff4466', attackType: 'melee', scale: 1.0, hitboxRadius: 20, icon: 'assets/ui/chars/melee.png' },
    { id: 'archer', name: '弓手', desc: '弓箭擴散射擊', color: '#44cc44', attackType: 'archer', scale: 1.0, hitboxRadius: 20, icon: 'assets/ui/chars/archer.png' },
    { id: 'knight', name: '黃金騎士', desc: '高防禦近戰攻擊', color: '#ffcc00', attackType: 'melee', scale: 1.5, hitboxRadius: 30, icon: 'assets/ui/chars/knight.png' },
    { id: 'valkyrie', name: '女武神', desc: '長槍貫穿攻擊', color: '#ccddff', attackType: 'valkyrie', scale: 1.7, hitboxRadius: 20, icon: 'assets/ui/chars/valkyrie.png' }
  ];

  function CharacterSelect(onSelect) {
    this._onSelect = onSelect;
    this._el = document.getElementById('character-select');
    this._render();
  }

  CharacterSelect.prototype._render = function() {
    var self = this;
    this._el.innerHTML = '';
    
    // 外層垂直容器
    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex; flex-direction:column; align-items:center; width:100%; padding:30px 10px; box-sizing:border-box;';
    
    // 1. 標題圖片
    var titleDiv = document.createElement('div');
    titleDiv.style.cssText = 'text-align:center; margin-bottom:15px;';
    titleDiv.innerHTML = '<img src="assets/ui/title.png" style="max-width:320px;width:70%;height:auto;" alt="無盡的英雄">';
    wrapper.appendChild(titleDiv);
    
    // 2. 副標
    var subtitle = document.createElement('h3');
    subtitle.style.cssText = 'margin:0 0 15px 0; color:#aaa; font-size:16px;';
    subtitle.textContent = '選擇角色';
    wrapper.appendChild(subtitle);
    
    // 3. 角色卡片容器
    var container = document.createElement('div');
    container.style.cssText = 'display:flex; flex-wrap:nowrap; gap:12px; justify-content:center; align-items:stretch;';

    for (var i = 0; i < CHARACTERS.length; i++) {
      (function(ch) {
        var card = document.createElement('div');
        card.style.cssText = 'background:rgba(20,20,50,0.95); border:2px solid ' + ch.color + '; border-radius:12px; padding:12px 10px; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; width:100px; overflow:hidden; transition:transform 0.2s, border-color 0.2s;';
        
        // 靜態角色圖（第一幀）
        var charImg = document.createElement('img');
        charImg.src = ch.icon || '';
        charImg.style.cssText = 'width:64px; height:64px; image-rendering:pixelated; margin-bottom:8px;';
        card.appendChild(charImg);

        // 角色名稱
        var nameDiv = document.createElement('div');
        nameDiv.style.cssText = 'font-size:14px; color:' + ch.color + '; font-weight:bold; white-space:nowrap;';
        nameDiv.textContent = ch.name;
        card.appendChild(nameDiv);

        // 技能描述
        var descDiv = document.createElement('div');
        descDiv.style.cssText = 'font-size:11px; color:#aaa; margin-top:4px; white-space:nowrap;';
        descDiv.textContent = ch.desc;
        card.appendChild(descDiv);

        card.onmouseover = function() { card.style.transform = 'scale(1.08)'; card.style.borderColor = '#fff'; };
        card.onmouseout = function() { card.style.transform = ''; card.style.borderColor = ch.color; };
        card.onclick = function() { self._el.style.display = 'none'; self._onSelect(ch); };
        container.appendChild(card);
      })(CHARACTERS[i]);
    }
    wrapper.appendChild(container);
    this._el.appendChild(wrapper);
    // 版本號顯示
    var ver = document.createElement('div');
    ver.style.cssText = 'position:absolute; bottom:16px; left:0; right:0; text-align:center; font-size:12px; color:rgba(255,255,255,0.4);';
    ver.textContent = window.GAME_VERSION || '';
    this._el.appendChild(ver);
    // 套用 9:16 直屏
    var sw = window.innerWidth;
    var sh = window.innerHeight;
    var tw = Math.min(sw, Math.floor(sh * 9 / 16));
    var th = Math.min(sh, Math.floor(tw * 16 / 9));
    this._el.style.width = tw + 'px';
    this._el.style.height = th + 'px';
    this._el.style.left = Math.floor((sw - tw) / 2) + 'px';
    this._el.style.top = Math.floor((sh - th) / 2) + 'px';
    this._el.style.display = 'block';
  };

  SG.CharacterSelect = CharacterSelect;
  SG.CHARACTERS = CHARACTERS;
})();
