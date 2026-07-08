# game_manager.gd — 核心遊戲循環管理
extends Node2D

signal game_over
signal level_up(level: int)
signal level_clear(level_name: String)

@onready var player: Node2D = $Player
@onready var camera: Camera2D = $Player/Camera2D
@onready var hud: CanvasLayer = $HUD
@onready var enemy_container: Node2D = $Enemies
@onready var projectile_container: Node2D = $Projectiles
@onready var xp_container: Node2D = $XPGems
@onready var bg_layer: Node2D = $Background

var game_time: float = 0.0
var kills: int = 0
var current_level: int = 0
var wave_timer: float = 0.0
var wave_interval: float = 3.0
var boss_spawned: Array = []
var paused: bool = false
var is_game_over: bool = false

const MAX_ENEMIES = 30
const PLAYER_HITBOX = 20.0
const WAVE_BASE_COUNT = 3
const XP_GEM_SCENE = preload("res://scenes/xp_gem.tscn")
const ENEMY_SCENE = preload("res://scenes/enemy.tscn")
const PROJECTILE_SCENE = preload("res://scenes/projectile.tscn")

var selected_character: Dictionary = {}
var level_config: Dictionary = {}

func _ready():
	level_config = GameConfig.LEVELS[current_level]
	_apply_level_bg()
	wave_timer = 1.0  # 第一波延遲

func setup(character_id: String):
	selected_character = GameConfig.CHARACTERS[character_id]
	player.setup(selected_character)

func _process(delta: float):
	if is_game_over or paused:
		return
	
	game_time += delta
	_update_waves(delta)
	_update_enemies(delta)
	_update_projectiles(delta)
	_check_level_progress()
	hud.update_hud(player, game_time, kills)

func _update_waves(delta: float):
	wave_timer -= delta
	if wave_timer <= 0:
		wave_timer = wave_interval
		_spawn_wave()
	
	# Boss 排程
	for i in level_config.get("boss_indices", []):
		if i >= GameConfig.BOSSES.size():
			continue
		var boss_cfg = GameConfig.BOSSES[i]
		if game_time >= boss_cfg.spawn_time and not boss_spawned.has(i):
			_spawn_boss(i)
			boss_spawned.append(i)

func _spawn_wave():
	var count = mini(WAVE_BASE_COUNT + int(game_time / 10), MAX_ENEMIES - enemy_container.get_child_count())
	if count <= 0:
		return
	
	var max_enemy_level = mini(int(game_time / 30) + 1, GameConfig.ENEMIES.size())
	var speed_mult = level_config.get("enemy_speed_mult", 1.0)
	
	for i in range(count):
		var idx = randi() % max_enemy_level
		var cfg = GameConfig.ENEMIES[idx]
		var enemy = ENEMY_SCENE.instantiate()
		var angle = randf() * TAU
		var dist = maxf(get_viewport_rect().size.x, get_viewport_rect().size.y) * 0.6
		var spawn_pos = player.global_position + Vector2(cos(angle), sin(angle)) * dist
		enemy.global_position = spawn_pos
		enemy.setup(cfg, speed_mult)
		enemy.killed.connect(_on_enemy_killed)
		enemy_container.add_child(enemy)

func _spawn_boss(boss_idx: int):
	var cfg = GameConfig.BOSSES[boss_idx]
	var enemy = ENEMY_SCENE.instantiate()
	var angle = randf() * TAU
	var dist = maxf(get_viewport_rect().size.x, get_viewport_rect().size.y) * 0.6
	enemy.global_position = player.global_position + Vector2(cos(angle), sin(angle)) * dist
	enemy.setup_boss(cfg)
	enemy.killed.connect(_on_enemy_killed)
	enemy_container.add_child(enemy)

func _update_enemies(delta: float):
	for enemy in enemy_container.get_children():
		enemy.move_toward(player.global_position, delta)
		# 碰撞檢測
		var dist = enemy.global_position.distance_to(player.global_position)
		if dist < (PLAYER_HITBOX + enemy.hit_size / 2.0):
			if player.take_damage(enemy.attack_damage):
				_on_game_over()
				return

func _update_projectiles(delta: float):
	for proj in projectile_container.get_children():
		if not proj.update_movement(delta):
			proj.queue_free()
			continue
		# 碰撞
		for enemy in enemy_container.get_children():
			var dist = proj.global_position.distance_to(enemy.global_position)
			if dist < (enemy.hit_size / 2.0 + 6.0):
				if enemy.take_hit(proj.damage):
					_on_enemy_killed(enemy)
				proj.queue_free()
				break

func _on_enemy_killed(enemy: Node2D):
	kills += 1
	# 掉落 XP
	var gem = XP_GEM_SCENE.instantiate()
	gem.global_position = enemy.global_position
	gem.value = 1 + int(game_time / 30)
	xp_container.add_child(gem)
	enemy.queue_free()

func _check_level_progress():
	if game_time >= level_config.get("duration", 90):
		# 確認 boss 全滅
		var bosses_alive = 0
		for enemy in enemy_container.get_children():
			if enemy.is_boss:
				bosses_alive += 1
		if bosses_alive == 0:
			_on_level_clear()

func _on_level_clear():
	current_level += 1
	if current_level >= GameConfig.LEVELS.size():
		# 全部通關
		is_game_over = true
		emit_signal("game_over")
		return
	level_config = GameConfig.LEVELS[current_level]
	boss_spawned.clear()
	game_time = 0.0
	# 清場
	for enemy in enemy_container.get_children():
		enemy.queue_free()
	_apply_level_bg()
	emit_signal("level_clear", level_config.name)

func _on_game_over():
	is_game_over = true
	emit_signal("game_over")

func _apply_level_bg():
	# 背景 tile 由 Background node 處理
	if bg_layer.has_method("set_bg"):
		bg_layer.set_bg(level_config.get("bg_image", ""), level_config.get("bg_color", Color.BLACK))

func fire_projectile(target_pos: Vector2):
	var proj = PROJECTILE_SCENE.instantiate()
	var angle = player.global_position.angle_to_point(target_pos)
	proj.global_position = player.global_position
	proj.setup(angle, player.get_damage())
	projectile_container.add_child(proj)
