# player.gd — 玩家角色
extends CharacterBody2D

signal died

var speed: float = 180.0
var hp: float = 100.0
var max_hp: float = 100.0
var damage: float = 10.0
var fire_rate: float = 0.5
var fire_timer: float = 0.0
var projectile_count: int = 1
var pickup_range: float = 60.0
var invuln_time: float = 0.0
var level: int = 1
var xp: int = 0
var xp_needed: int = 8
var regen: float = 0.0
var crit_chance: float = 0.0
var attack_type: String = "ranged"
var sprite_width_ratio: float = 1.0

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var fire_audio: AudioStreamPlayer = $FireAudio

var facing_left: bool = false
var character_config: Dictionary = {}

func setup(config: Dictionary):
	character_config = config
	speed = config.get("speed", 180.0)
	damage = config.get("damage", 10.0)
	fire_rate = config.get("fire_rate", 0.5)
	attack_type = config.get("attack_type", "ranged")
	sprite_width_ratio = config.get("sprite_width_ratio", 1.0)
	_load_sprite(config)

func _load_sprite(config: Dictionary):
	var sprites_cfg = config.get("sprites", {})
	# Sprite loading handled by SpriteStrip component
	if has_node("SpriteStrip"):
		var strip = $SpriteStrip
		strip.load_animations(sprites_cfg, config)

func _physics_process(delta: float):
	# 移動
	var input_dir = Vector2.ZERO
	if Input.is_action_pressed("move_up"): input_dir.y -= 1
	if Input.is_action_pressed("move_down"): input_dir.y += 1
	if Input.is_action_pressed("move_left"): input_dir.x -= 1
	if Input.is_action_pressed("move_right"): input_dir.x += 1
	
	if input_dir != Vector2.ZERO:
		input_dir = input_dir.normalized()
		facing_left = input_dir.x < 0
	
	velocity = input_dir * speed
	move_and_slide()
	
	# 無敵
	if invuln_time > 0:
		invuln_time -= delta
	
	# 回血
	if regen > 0:
		hp = minf(hp + regen * delta, max_hp)
	
	# 自動攻擊
	fire_timer -= delta
	if fire_timer <= 0 and input_dir != Vector2.ZERO:
		fire_timer = fire_rate
		_auto_fire()
	
	# 動畫狀態
	_update_animation(input_dir != Vector2.ZERO)

func _auto_fire():
	# 尋找最近敵人
	var game = get_parent()
	if not game.has_node("Enemies"):
		return
	var enemies = game.get_node("Enemies").get_children()
	if enemies.is_empty():
		return
	
	var nearest: Node2D = null
	var min_dist: float = INF
	for e in enemies:
		var d = global_position.distance_to(e.global_position)
		if d < min_dist:
			min_dist = d
			nearest = e
	
	if nearest:
		game.fire_projectile(nearest.global_position)

func _update_animation(moving: bool):
	if has_node("SpriteStrip"):
		var strip = $SpriteStrip
		strip.set_state("run" if moving else "idle")
		strip.flip_h = facing_left

func take_damage(amount: float) -> bool:
	if invuln_time > 0:
		return false
	hp -= amount
	invuln_time = 0.5
	if hp <= 0:
		emit_signal("died")
		return true
	return false

func add_xp(value: int) -> bool:
	xp += value
	if xp >= xp_needed:
		xp -= xp_needed
		level += 1
		xp_needed = 5 + level * 3
		return true
	return false

func get_damage() -> float:
	var d = damage
	if randf() < crit_chance:
		d *= 2.0
	return d

func apply_skill(skill_id: String):
	match skill_id:
		"damage": damage *= 1.2
		"speed": speed *= 1.15
		"fire_rate": fire_rate *= 0.85
		"hp": max_hp += 25; hp += 25
		"projectile": projectile_count += 1
		"pickup": pickup_range *= 1.3
		"regen": regen += 1.0
		"crit": crit_chance += 0.1
