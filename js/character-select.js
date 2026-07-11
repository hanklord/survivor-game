// character-select.js — 角色選擇畫面
(function() {
  window.SG = window.SG || {};

  var CHARACTERS = [
    { id: 'ranged', name: '法師', desc: '火球魔法攻擊', color: '#ff6600', attackType: 'ranged', scale: 1.0, idleSprite: 'assets/strips/mage_idle_4f.png', idleFrames: 4 },
    // { id: 'melee', name: '近戰劍士', desc: '劍氣斬擊周圍敵人', color: '#ff4466', attackType: 'melee', scale: 1.0, idleSprite: 'assets/strips/zero_idle_8f.png', idleFrames: 8 },
    { id: 'archer', name: '弓手', desc: '弓箭擴散射擊', color: '#44cc44', attackType: 'archer', scale: 1.0, idleSprite: 'assets/strips/archer_idle_4f.png', idleFrames: 4 },
    { id: 'knight', name: '黃金騎士', desc: '高防禦近戰攻擊', color: '#ffcc00', attackType: 'melee', scale: 1.5, idleSprite: 'assets/strips/golden_knight_idle_4f.png', idleFrames: 4 }
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
    wrapper.style.cssText = 'display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; padding:20px 10px;';
    
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
        
        // Sprite 容器（固定大小，居中，裁切溢出）
        var spriteBox = document.createElement('div');
        spriteBox.style.cssText = 'width:64px; height:64px; overflow:hidden; margin-bottom:8px; flex-shrink:0;';
        
        var spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = 64;
        spriteCanvas.height = 64;
        spriteCanvas.style.cssText = 'width:64px; height:64px; image-rendering:pixelated; display:block;';
        spriteBox.appendChild(spriteCanvas);
        card.appendChild(spriteBox);

        // 載入 sprite 並播放動畫
        if (ch.idleSprite) {
          var img = new Image();
          img.src = ch.idleSprite;
          var frameIdx = 0;
          var frames = ch.idleFrames || 4;
          img.onload = function() {
            var fw = img.width / frames;
            var fh = img.height;
            var sCtx = spriteCanvas.getContext('2d');
            sCtx.imageSmoothingEnabled = false;
            function drawFrame() {
              sCtx.clearRect(0, 0, 64, 64);
              sCtx.drawImage(img, frameIdx * fw, 0, fw, fh, 0, 0, 64, 64);
              frameIdx = (frameIdx + 1) % frames;
            }
            drawFrame();
            setInterval(drawFrame, 150);
          };
        }

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
    this._el.style.display = 'flex';
  };

  SG.CharacterSelect = CharacterSelect;
  SG.CHARACTERS = CHARACTERS;
})();
