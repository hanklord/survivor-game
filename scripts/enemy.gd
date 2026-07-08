# enemy.gd — 敵人類別
extends Node2D

signal killed(enemy: Node2D)

var hp: float = 3.0
var max_hp: float = 3.0
var speed: float = 90.0
var attack_damage: float = 5.0
var hit_size: float = 36.0
var is_boss: bool = false
var speed_mult: float = 1.0

@onready var sprite_strip: Node2D = $SpriteStrip

func setup(config: Dictionary, level_speed_mult: float = 1.0):
	hp = config.get("hp", 3.0)
	max_hp = hp
	speed = config.get("speed", 90.0)
	attack_damage = config.get("damage", 5.0)
	hit_size = config.get("size", 36.0)
	speed_mult = level_speed_mult
	is_boss = false
	
	if sprite_strip and config.has("sprite"):
		sprite_strip.load_single(config.sprite, config.get("frames", 1), config.get("cols", 0), config.get("rows", 0))

func setup_boss(config: Dictionary):
	setup(config, 1.0)
	is_boss = true
	# Boss 視覺放大
	scale = Vector2(1.5, 1.5)

func move_toward(target: Vector2, delta: float):
	var dir = (target - global_position).normalized()
	global_position += dir * speed * speed_mult * delta
	# 面朝方向
	if sprite_strip:
		sprite_strip.flip_h = dir.x < 0

func take_hit(damage: float) -> bool:
	hp -= damage
	# 受擊閃爍
	modulate = Color(1, 0.5, 0.5)
	var tween = create_tween()
	tween.tween_property(self, "modulate", Color.WHITE, 0.1)
	
	if hp <= 0:
		emit_signal("killed", self)
		return true
	return false
