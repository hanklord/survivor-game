# game_config.gd — 遊戲設定資料
extends Resource
class_name GameConfig

# 角色設定
const CHARACTERS = {
	"x4": {
		"name": "X4 Fourth Armor",
		"attack_type": "ranged",
		"sprites": {
			"idle": "res://assets/strips/x4_idle_4f.png",
			"run": "res://assets/strips/x4_walk_8f.png"
		},
		"idle_frames": 4,
		"run_frames": 8,
		"size": 66,
		"speed": 180.0,
		"damage": 10,
		"fire_rate": 0.5,
		"sprite_width_ratio": 0.75
	},
	"melee": {
		"name": "Zero (Melee)",
		"attack_type": "melee",
		"sprites": {
			"idle": "res://assets/strips/zero_idle_4f.png",
			"run": "res://assets/strips/zero_run_8f.png"
		},
		"idle_frames": 4,
		"run_frames": 8,
		"size": 66,
		"speed": 180.0,
		"damage": 15,
		"fire_rate": 0.4
	},
	"archer": {
		"name": "Archer",
		"attack_type": "archer",
		"sprites": {
			"idle": "res://assets/strips/archer_idle_4f.png",
			"run": "res://assets/strips/archer_run_8f.png"
		},
		"idle_frames": 4,
		"run_frames": 8,
		"size": 66,
		"speed": 180.0,
		"damage": 12,
		"fire_rate": 0.6
	}
}

# 敵人設定
const ENEMIES = [
	{"name": "Dragon", "sprite": "res://assets/strips/dragon_8f.png", "frames": 8, "size": 54, "hp": 12, "speed": 90.0, "damage": 5},
	{"name": "Monster", "sprite": "res://assets/strips/monster2_idle_6f.png", "frames": 6, "size": 38, "hp": 16, "speed": 108.0, "damage": 6},
	{"name": "Beetle", "sprite": "res://assets/strips/enemy_beetle_idle_8f.png", "frames": 8, "size": 46, "hp": 10, "speed": 84.0, "damage": 8},
	{"name": "Spearman", "sprite": "res://assets/strips/enemy_spearman_idle_8f.png", "frames": 8, "size": 48, "hp": 20, "speed": 102.0, "damage": 9},
	{"name": "Imp", "sprite": "res://assets/strips/enemy_imp_idle_4f.png", "frames": 4, "size": 42, "hp": 8, "speed": 78.0, "damage": 10},
	{"name": "Skeleton", "sprite": "res://assets/strips/enemy_skeleton_idle_8f.png", "frames": 8, "size": 44, "hp": 14, "speed": 120.0, "damage": 9},
	{"name": "Zombie", "sprite": "res://assets/strips/enemy_zombie_idle_8f.png", "frames": 8, "size": 66, "hp": 10, "speed": 66.0, "damage": 12},
	{"name": "Witch", "sprite": "res://assets/strips/enemy_witch_idle_8f.png", "frames": 8, "size": 44, "hp": 18, "speed": 114.0, "damage": 14},
	{"name": "Spider", "sprite": "res://assets/strips/enemy_spider_idle_12f.png", "frames": 12, "size": 52, "hp": 30, "speed": 60.0, "damage": 16},
	{"name": "Minion", "sprite": "res://assets/strips/enemy_minion_idle_3f.png", "frames": 3, "size": 56, "hp": 20, "speed": 54.0, "damage": 20},
]

# Boss 設定
const BOSSES = [
	{"name": "Demon", "sprite": "res://assets/strips/boss_demon_idle_8f.png", "frames": 8, "size": 80, "hp": 300, "speed": 30.0, "damage": 15, "spawn_time": 60},
	{"name": "Centaur", "sprite": "res://assets/strips/boss_centaur_idle_7f.png", "frames": 7, "size": 85, "hp": 600, "speed": 30.0, "damage": 20, "spawn_time": 90},
	{"name": "Mage2", "sprite": "res://assets/strips/boss_mage2_idle_4f.png", "frames": 4, "size": 100, "hp": 1000, "speed": 24.0, "damage": 25, "spawn_time": 120},
	{"name": "Mage1", "sprite": "res://assets/strips/boss_mage1_idle_4f.png", "frames": 4, "size": 90, "hp": 1200, "speed": 27.0, "damage": 28, "spawn_time": 150},
	{"name": "Mage3", "sprite": "res://assets/strips/boss_mage3_idle_4f.png", "frames": 4, "size": 95, "hp": 1500, "speed": 33.0, "damage": 30, "spawn_time": 180},
	{"name": "Gnu", "sprite": "res://assets/strips/boss_gnu_idle_5f.png", "frames": 5, "size": 110, "hp": 2000, "speed": 18.0, "damage": 35, "spawn_time": 210},
	{"name": "Golem", "sprite": "res://assets/strips/boss_golem_idle_5f.png", "frames": 5, "size": 120, "hp": 2500, "speed": 21.0, "damage": 40, "spawn_time": 240},
	{"name": "Shadow", "sprite": "res://assets/strips/boss_shadow_idle_4f.png", "frames": 4, "size": 90, "hp": 2000, "speed": 30.0, "damage": 45, "spawn_time": 270},
	{"name": "KingSlime", "sprite": "res://assets/strips/boss_kingslime_idle_4f.png", "frames": 4, "size": 100, "hp": 3000, "speed": 27.0, "damage": 50, "spawn_time": 300},
	{"name": "EvilEye", "sprite": "res://assets/strips/boss_evileye_idle_4f.png", "frames": 4, "size": 120, "hp": 5000, "speed": 24.0, "damage": 60, "spawn_time": 360},
]

# 關卡設定
const LEVELS = [
	{"name": "草地", "bg_image": "res://assets/backgrounds/grass.png", "bg_color": Color(0.1, 0.18, 0.1), "duration": 90, "enemy_speed_mult": 1.0, "boss_indices": [0, 1]},
	{"name": "洞窟", "bg_image": "res://assets/backgrounds/cave.png", "bg_color": Color(0.1, 0.1, 0.18), "duration": 120, "enemy_speed_mult": 1.2, "boss_indices": [2, 3]},
	{"name": "沼澤", "bg_image": "res://assets/backgrounds/swamp.png", "bg_color": Color(0.1, 0.18, 0.16), "duration": 150, "enemy_speed_mult": 1.3, "boss_indices": [4, 5]},
	{"name": "火山", "bg_image": "res://assets/backgrounds/volcano.png", "bg_color": Color(0.18, 0.1, 0.1), "duration": 180, "enemy_speed_mult": 1.5, "boss_indices": [6, 7]},
	{"name": "地獄", "bg_image": "res://assets/backgrounds/hell.png", "bg_color": Color(0.1, 0.04, 0.04), "duration": 240, "enemy_speed_mult": 1.8, "boss_indices": [8, 9]},
]

# 技能選項
const SKILLS = [
	{"id": "damage", "name": "⚔️ 攻擊力+20%", "apply": "damage"},
	{"id": "speed", "name": "🏃 移速+15%", "apply": "speed"},
	{"id": "fire_rate", "name": "🔥 攻速+15%", "apply": "fire_rate"},
	{"id": "hp", "name": "❤️ 生命+25", "apply": "hp"},
	{"id": "projectile", "name": "🎯 多一發子彈", "apply": "projectile"},
	{"id": "pickup", "name": "🧲 拾取範圍+30%", "apply": "pickup"},
	{"id": "regen", "name": "💚 每秒回血+1", "apply": "regen"},
	{"id": "crit", "name": "💥 暴擊率+10%", "apply": "crit"},
]
