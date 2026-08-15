(function(){
  window.SG=window.SG||{};
  var EVENTS=[
    {id:'treasure_rain',name:'寶箱雨',duration:15,color:'#ffd700'},
    {id:'elite_invasion',name:'精英入侵',duration:0,color:'#ff4444'},
    {id:'blessing',name:'祝福 ×2',duration:20,color:'#ffdd44'},
    {id:'curse',name:'詛咒',duration:15,color:'#8844aa'},
    {id:'heal_spring',name:'回血泉',duration:10,color:'#44ff88'},
    {id:'frenzy',name:'狂暴',duration:12,color:'#ff4400'}
  ];
  function RandomEvents(game){this.game=game;this._timer=30;this._nextInterval=45+Math.random()*45;this._usedEvents=[];this._activeEvent=null;this._eventTimer=0;this._totalTriggered=0;this._maxEvents=2+Math.floor(Math.random()*3);this._announcement=null;this._countdownTimer=0;this._treasureAccum=0}
  RandomEvents.prototype.update=function(dt){if(this._announcement){this._announcement.timer-=dt;if(this._announcement.timer<=0)this._announcement=null}if(this._activeEvent){this._eventTimer-=dt;this._countdownTimer=this._eventTimer;if(this._activeEvent.id==='treasure_rain'){this._treasureAccum+=dt;while(this._treasureAccum>=.2){this._treasureAccum-=.2;this._spawnRandomGem()}}if(this._activeEvent.id==='heal_spring'&&this.game.player)this.game.player.hp=Math.min(this.game.player.maxHp,this.game.player.hp+this.game.player.maxHp*.03*dt);if(this._eventTimer<=0)this._endEvent();return}if(this._totalTriggered>=this._maxEvents)return;this._timer-=dt;if(this._timer<=0){this._triggerRandom();this._timer=45+Math.random()*45}};
  RandomEvents.prototype._triggerRandom=function(){var self=this,available=EVENTS.filter(function(e){return self._usedEvents.indexOf(e.id)<0});if(!available.length)return;var evt=available[Math.floor(Math.random()*available.length)];this._usedEvents.push(evt.id);this._totalTriggered++;this._activeEvent=evt;this._eventTimer=evt.duration;this._announcement={text:evt.name+'！',color:evt.color,timer:1.5};if(evt.id==='elite_invasion'){for(var i=0;i<8;i++)if(this.game._eliteSpawner&&this.game._eliteSpawner._forceSpawnElite)this.game._eliteSpawner._forceSpawnElite();this._activeEvent=null}if(evt.id==='blessing')this.game._eventDamageMult=2;if(evt.id==='curse')this.game._eventBlockLevelUp=true;if(evt.id==='frenzy'){this.game._eventSpeedMult=1.5;this.game._eventAttackSpeedMult=1.5;this.game._eventDamageTakenMult=2}};
  RandomEvents.prototype._endEvent=function(){var id=this._activeEvent&&this._activeEvent.id;if(id==='blessing')this.game._eventDamageMult=1;if(id==='curse')this.game._eventBlockLevelUp=false;if(id==='frenzy'){this.game._eventSpeedMult=1;this.game._eventAttackSpeedMult=1;this.game._eventDamageTakenMult=1}this._activeEvent=null;this._countdownTimer=0};
  RandomEvents.prototype._spawnRandomGem=function(){if(this.game.xpGems.length>=50)return;var g=this.game.xpGemPool.get();g.init(this.game.player.x+(Math.random()-.5)*500,this.game.player.y+(Math.random()-.5)*500,1);this.game.xpGems.push(g)};
  RandomEvents.prototype.getVisual=function(){return{announcement:this._announcement,activeEvent:this._activeEvent,countdown:this._countdownTimer}};SG.RandomEvents=RandomEvents;
})();
