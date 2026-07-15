window.GAME_VERSION = "V224";
window.HARDCORE_HP_MULTIPLIER = 3.0;
window.LEVEL_CLEAR_HEAL_PERCENT = 0.5;
window.DEBUG_SHOW_HITBOX = false;
window.GAME_FONT = "Cinzel, 'Noto Sans TC', serif";
window.GAME_CONFIG = {
  "player": { "image": null, "sprites": { "idle": { "file": "assets/strips/mage_idle_4f.png", "fps": 6 }, "run": { "file": "assets/strips/mage_run_4f.png", "fps": 10 } }, "size": 66 },
  "enemies": [
    { "level": 1, "image": null, "sprites": { "idle": { "file": "assets/strips/enemy_slime2_idle_4f.png", "fps": 8 } }, "size": 97, "hitboxRadius": 49, "color": "#44ff44", "hp": 12, "speed": 90, "damage": 5 },
    { "level": 2, "image": null, "sprites": { "idle": { "file": "assets/strips/monster4_idle_4f.png", "fps": 8 } }, "size": 68, "hitboxRadius": 34, "color": "#8844aa", "hp": 16, "speed": 108, "damage": 6 },
    { "level": 3, "image": null, "sprites": { "idle": { "file": "assets/strips/enemy_beetle_idle_8f_4c2r.png", "fps": 8 } }, "size": 83, "hitboxRadius": 42, "color": "#2244aa", "hp": 10, "speed": 84, "damage": 8 },
    { "level": 4, "image": null, "sprites": { "idle": { "file": "assets/strips/dark_knight_walk_8f.png", "fps": 8 } }, "size": 86, "hitboxRadius": 43, "color": "#336633", "hp": 20, "speed": 102, "damage": 9 },
    { "level": 5, "image": null, "sprites": { "idle": { "file": "assets/strips/dragon_8f.png", "fps": 8 } }, "size": 76, "hitboxRadius": 38, "color": "#448844", "hp": 8, "speed": 78, "damage": 10 },
    { "level": 6, "image": null, "sprites": { "idle": { "file": "assets/strips/monster1_idle_3f.png", "fps": 8 } }, "size": 79, "hitboxRadius": 40, "color": "#666666", "hp": 14, "speed": 120, "damage": 9 },
    { "level": 7, "image": null, "sprites": { "idle": { "file": "assets/strips/monster4_idle_4f.png", "fps": 8 } }, "size": 119, "hitboxRadius": 60, "color": "#442200", "hp": 10, "speed": 66, "damage": 12 },
    { "level": 8, "image": null, "sprites": { "idle": { "file": "assets/strips/dark_knight_walk_8f.png", "fps": 8 } }, "size": 79, "hitboxRadius": 40, "color": "#220044", "hp": 18, "speed": 114, "damage": 14 },
    { "level": 9, "image": null, "sprites": { "idle": { "file": "assets/strips/dragon_8f.png", "fps": 8 } }, "size": 94, "hitboxRadius": 47, "color": "#ff4400", "hp": 30, "speed": 60, "damage": 16 },
    { "level": 10, "image": null, "sprites": { "idle": { "file": "assets/strips/enemy_beetle_idle_8f_4c2r.png", "fps": 6 } }, "size": 101, "hitboxRadius": 51, "color": "#440044", "hp": 20, "speed": 54, "damage": 20 }
  ],
  "bosses": [
    { "level": 1, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_demon_idle_8f.png", "fps": 8 } }, "size": 144, "hitboxRadius": 72, "color": "#44ff44", "hp": 300, "speed": 30, "damage": 15, "spawnTime": 30 },
    { "level": 2, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_gorilla_idle_8f.png", "fps": 7 } }, "size": 234, "hitboxRadius": 117, "color": "#553311", "hp": 800, "speed": 24, "damage": 22, "spawnTime": 60 },
    { "level": 3, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_beetle_knight_idle_3f.png", "fps": 8 } }, "size": 180, "hitboxRadius": 90, "color": "#1a3366", "hp": 1200, "speed": 27, "damage": 28, "spawnTime": 30 },
    { "level": 4, "image": null, "sprites": { "idle": { "file": "assets/strips/big_dragon_8f_4c2r.png", "fps": 6 } }, "size": 216, "hitboxRadius": 108, "color": "#ff0066", "hp": 1200, "speed": 27, "damage": 28, "spawnTime": 60 },
    { "level": 5, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_skeletonking_9f.png", "fps": 6 } }, "size": 171, "hitboxRadius": 86, "color": "#ff4400", "hp": 1500, "speed": 33, "damage": 30, "spawnTime": 30 },
    { "level": 6, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_gnu_idle_5f.png", "fps": 7 } }, "size": 198, "hitboxRadius": 99, "color": "#44ccff", "hp": 2000, "speed": 18, "damage": 35, "spawnTime": 60 },
    { "level": 7, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_mage3_idle_4f.png", "fps": 6 } }, "size": 216, "hitboxRadius": 108, "color": "#008844", "hp": 2500, "speed": 21, "damage": 40, "spawnTime": 30 },
    { "level": 8, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_machine_dragon_idle_4f.png", "fps": 6 } }, "size": 162, "hitboxRadius": 81, "color": "#4400ff", "hp": 2000, "speed": 30, "damage": 45, "spawnTime": 60 },
    { "level": 9, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_kingslime_idle_4f.png", "fps": 6 } }, "size": 180, "hitboxRadius": 90, "color": "#ffcc00", "hp": 3000, "speed": 27, "damage": 50, "spawnTime": 30 },
    { "level": 10, "image": null, "sprites": { "idle": { "file": "assets/strips/big_dark_dragon_8f_4c2r.png", "fps": 6 } }, "size": 432, "hitboxRadius": 216, "color": "#000000", "hp": 8000, "speed": 24, "damage": 60, "spawnTime": 60 }
  ],
  "projectile": { "image": null, "color": "#ff6600", "size": 24 },
  "xpGem": { "image": "assets/xp_gem.png", "color": "#00ff88" },
  "background": { "color": "#1a1a2e", "image": null },
  "audio": { "enabled": true, "volume": 0.5 },
  "levels": [
    { "name": "草地", "bgColor": "#1a2e1a", "bgImage": "assets/backgrounds/grass.png", "duration": 90, "enemySpeedMult": 1.0, "bossIndices": [0, 1] },
    { "name": "洞窟", "bgColor": "#1a1a2e", "bgImage": "assets/backgrounds/cave.png", "bgm": "assets/audio/bgm_level2.mp3", "duration": 120, "enemySpeedMult": 1.5, "bossIndices": [2, 3] },
    { "name": "沼澤", "bgColor": "#1a2e2a", "bgImage": "assets/backgrounds/swamp.png", "bgm": "assets/audio/bgm_level3.mp3", "duration": 150, "enemySpeedMult": 2.0, "bossIndices": [4, 5] },
    { "name": "火山", "bgColor": "#2e1a1a", "bgImage": "assets/backgrounds/volcano.png", "bgm": "assets/audio/bgm_level4.mp3", "duration": 180, "enemySpeedMult": 2.5, "bossIndices": [6, 7] },
    { "name": "地獄", "bgColor": "#1a0a0a", "bgImage": "assets/backgrounds/hell.png", "bgm": "assets/audio/bgm_level5.mp3", "duration": 240, "enemySpeedMult": 3.0, "bossIndices": [8, 9] }
  ]
};
