window.GAME_CONFIG = {
  "player": { "image": null, "sprites": { "idle": { "file": "assets/strips/hero_idle_2f.png", "fps": 4 }, "run": { "file": "assets/strips/hero_walk_4f.png", "fps": 8 } }, "size": 144 },
  "enemies": [
    { "level": 1, "image": null, "sprites": { "idle": { "file": "assets/strips/enemy_ghost_idle_8f.png", "fps": 8 } }, "size": 36, "color": "#44ff44", "hp": 3, "speed": 1.5, "damage": 5 },
    { "level": 2, "image": null, "sprites": { "idle": { "file": "assets/strips/enemy_bat_idle_5f.png", "fps": 8 } }, "size": 38, "color": "#8844aa", "hp": 4, "speed": 1.8, "damage": 6 },
    { "level": 3, "image": null, "sprites": { "idle": { "file": "assets/strips/enemy_goblin_idle_5f.png", "fps": 8 } }, "size": 44, "color": "#cccccc", "hp": 6, "speed": 1.2, "damage": 8 },
    { "level": 4, "image": null, "sprites": { "idle": { "file": "assets/strips/enemy_wolf_idle_6f.png", "fps": 8 } }, "size": 40, "color": "#88ccff", "hp": 5, "speed": 1.6, "damage": 7 },
    { "level": 5, "image": null, "sprites": { "idle": { "file": "assets/strips/enemy_imp_idle_4f.png", "fps": 8 } }, "size": 42, "color": "#448844", "hp": 8, "speed": 1.3, "damage": 10 },
    { "level": 6, "image": null, "sprites": { "idle": { "file": "assets/strips/enemy_skeleton_idle_8f.png", "fps": 8 } }, "size": 44, "color": "#666666", "hp": 7, "speed": 2.0, "damage": 9 },
    { "level": 7, "image": null, "sprites": { "idle": { "file": "assets/strips/enemy_zombie_idle_8f.png", "fps": 8 } }, "size": 144, "color": "#442200", "hp": 10, "speed": 1.1, "damage": 12 },
    { "level": 8, "image": null, "sprites": { "idle": { "file": "assets/strips/enemy_witch_idle_8f.png", "fps": 8 } }, "size": 44, "color": "#220044", "hp": 9, "speed": 1.9, "damage": 14 },
    { "level": 9, "image": null, "sprites": { "idle": { "file": "assets/strips/enemy_spider_idle_4f.png", "fps": 8 } }, "size": 52, "color": "#ff4400", "hp": 15, "speed": 1.0, "damage": 16 },
    { "level": 10, "image": null, "sprites": { "idle": { "file": "assets/strips/enemy_minion_idle_3f.png", "fps": 6 } }, "size": 56, "color": "#440044", "hp": 20, "speed": 0.9, "damage": 20 }
  ],
  "bosses": [
    { "level": 1, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_demon_idle_8f.png", "fps": 8 } }, "size": 80, "color": "#44ff44", "hp": 300, "speed": 0.5, "damage": 15, "spawnTime": 60 },
    { "level": 2, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_centaur_idle_7f.png", "fps": 7 } }, "size": 85, "color": "#6600cc", "hp": 600, "speed": 0.5, "damage": 20, "spawnTime": 90 },
    { "level": 3, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_mage2_idle_4f.png", "fps": 6 } }, "size": 100, "color": "#ccccaa", "hp": 1000, "speed": 0.4, "damage": 25, "spawnTime": 120 },
    { "level": 4, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_mage1_idle_4f.png", "fps": 6 } }, "size": 90, "color": "#ff0066", "hp": 1200, "speed": 0.45, "damage": 28, "spawnTime": 150 },
    { "level": 5, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_mage3_idle_4f.png", "fps": 6 } }, "size": 95, "color": "#ff4400", "hp": 1500, "speed": 0.55, "damage": 30, "spawnTime": 180 },
    { "level": 6, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_gnu_idle_5f.png", "fps": 7 } }, "size": 110, "color": "#44ccff", "hp": 2000, "speed": 0.3, "damage": 35, "spawnTime": 210 },
    { "level": 7, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_golem_idle_5f.png", "fps": 6 } }, "size": 120, "color": "#008844", "hp": 2500, "speed": 0.35, "damage": 40, "spawnTime": 240 },
    { "level": 8, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_shadow_idle_4f.png", "fps": 6 } }, "size": 90, "color": "#4400ff", "hp": 2000, "speed": 0.5, "damage": 45, "spawnTime": 270 },
    { "level": 9, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_kingslime_idle_4f.png", "fps": 6 } }, "size": 100, "color": "#ffcc00", "hp": 3000, "speed": 0.45, "damage": 50, "spawnTime": 300 },
    { "level": 10, "image": null, "sprites": { "idle": { "file": "assets/strips/boss_evileye_idle_4f.png", "fps": 6 } }, "size": 120, "color": "#000000", "hp": 5000, "speed": 0.4, "damage": 60, "spawnTime": 360 }
  ],
  "projectile": { "image": null, "color": "#ffff00", "size": 12 },
  "xpGem": { "image": null, "color": "#00ff88" },
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
