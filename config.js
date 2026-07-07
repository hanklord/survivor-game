window.GAME_CONFIG = {
  "player": { "image": null, "sprites": { "idle": { "file": "assets/strips/x4_idle_4f.png", "fps": 6 }, "run": { "file": "assets/strips/x4_walk_8f.png", "fps": 12 } }, "size": 66 },
  "enemies": [
    { "level": 1, "image": null, "sprites": { "idle": { "file": "assets/strips/monster4_idle_4f.png", "fps": 8 } }, "size": 54, "color": "#44ff44", "hp": 12, "speed": 90, "damage": 5 },
    { "level": 2, "image": null, "sprites": { "idle": { "file": "assets/strips/monster2_idle_6f.png", "fps": 8 } }, "size": 38, "color": "#8844aa", "hp": 16, "speed": 108, "damage": 6 },
    { "level": 3, "image": null, "sprites": { "idle": { "file": "assets/strips/enemy_machine_dragon_idle_4f.png", "fps": 8 } }, "size": 44, "color": "#cccccc", "hp": 6, "speed": 72, "damage": 8 },
    { "level": 4, "image": null, "sprites": { "idle": { "file": "assets/strips/monster4_idle_4f.png", "fps": 8 } }, "size": 40, "color": "#88ccff", "hp": 40, "speed": 96, "damage": 7 },
    { "level": 5, "image": null, "sprites": { "idle": { "file": "assets/strips/enemy_imp_idle_4f.png", "fps": 8 } }, "size": 42, "color": "#448844", "hp": 8, "speed": 78, "damage": 10 },
    { "level": 6, "image": null, "sprites": { "idle": { "file": "assets/strips/enemy_skeleton_idle_8f.png", "fps": 8 } }, "size": 44, "color": "#666666", "hp": 14, "speed": 120, "damage": 9 },
    { "level": 7, "image": null, "sprites": { "idle": { "file": "assets/strips/enemy_zombie_idle_8f.png", "fps": 8 } }, "size": 66, "color": "#442200", "hp": 10, "speed": 66, "damage": 12 },
    { "level": 8, "image": null, "sprites": { "idle": { "file": "assets/strips/enemy_witch_idle_8f.png", "fps": 8 } }, "size": 44, "color": "#220044", "hp": 18, "speed": 114, "damage": 14 },
    { "level": 9, "image": null, "sprites": { "idle": { "file": "assets/strips/enemy_spider_idle_4f.png", "fps": 8 } }, "size": 52, "color": "#ff4400", "hp": 30, "speed": 60, "damage": 16 },
    { "level": 10, "image": null, "sprites": { "idle": { "file": "assets/strips/enemy_minion_idle_3f.png", "fps": 6 } }, "size": 56, "color": "#440044", "hp": 20, "speed": 54, "damage": 20 }
  ],
  "bosses": [
    { "level": 1, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_demon_idle_8f.png", "fps": 8 } }, "size": 80, "color": "#44ff44", "hp": 300, "speed": 30, "damage": 15, "spawnTime": 60 },
    { "level": 2, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_centaur_idle_7f.png", "fps": 7 } }, "size": 85, "color": "#6600cc", "hp": 600, "speed": 30, "damage": 20, "spawnTime": 90 },
    { "level": 3, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_mage2_idle_4f.png", "fps": 6 } }, "size": 100, "color": "#ccccaa", "hp": 1000, "speed": 24, "damage": 25, "spawnTime": 120 },
    { "level": 4, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_mage1_idle_4f.png", "fps": 6 } }, "size": 90, "color": "#ff0066", "hp": 1200, "speed": 27, "damage": 28, "spawnTime": 150 },
    { "level": 5, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_mage3_idle_4f.png", "fps": 6 } }, "size": 95, "color": "#ff4400", "hp": 1500, "speed": 33, "damage": 30, "spawnTime": 180 },
    { "level": 6, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_gnu_idle_5f.png", "fps": 7 } }, "size": 110, "color": "#44ccff", "hp": 2000, "speed": 18, "damage": 35, "spawnTime": 210 },
    { "level": 7, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_golem_idle_5f.png", "fps": 6 } }, "size": 120, "color": "#008844", "hp": 2500, "speed": 21, "damage": 40, "spawnTime": 240 },
    { "level": 8, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_shadow_idle_4f.png", "fps": 6 } }, "size": 90, "color": "#4400ff", "hp": 2000, "speed": 30, "damage": 45, "spawnTime": 270 },
    { "level": 9, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_kingslime_idle_4f.png", "fps": 6 } }, "size": 100, "color": "#ffcc00", "hp": 3000, "speed": 27, "damage": 50, "spawnTime": 300 },
    { "level": 10, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_evileye_idle_4f.png", "fps": 6 } }, "size": 120, "color": "#000000", "hp": 5000, "speed": 24, "damage": 60, "spawnTime": 360 }
  ],
  "projectile": { "image": "assets/projectile.png", "color": "#ffff00", "size": 72, "frames": 4 },
  "xpGem": { "image": "assets/xp_gem.png", "color": "#00ff88" },
  "background": { "color": "#1a1a2e", "image": null },
  "audio": { "enabled": true, "volume": 0.5 },
  "levels": [
    { "name": "草地", "bgColor": "#1a2e1a", "bgImage": "assets/backgrounds/grass.png", "duration": 90, "enemySpeedMult": 1, "bossIndices": [0, 1] },
    { "name": "洞窟", "bgColor": "#1a1a2e", "bgImage": "assets/backgrounds/cave.png", "duration": 120, "enemySpeedMult": 1.2, "bossIndices": [2, 3] },
    { "name": "沼澤", "bgColor": "#1a2e2a", "bgImage": "assets/backgrounds/swamp.png", "duration": 150, "enemySpeedMult": 1.3, "bossIndices": [4, 5] },
    { "name": "火山", "bgColor": "#2e1a1a", "bgImage": "assets/backgrounds/volcano.png", "duration": 180, "enemySpeedMult": 1.5, "bossIndices": [6, 7] },
    { "name": "地獄", "bgColor": "#1a0a0a", "bgImage": "assets/backgrounds/hell.png", "duration": 240, "enemySpeedMult": 1.8, "bossIndices": [8, 9] }
  ]
};
