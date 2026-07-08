# projectile.gd — 投射物
extends Node2D

var velocity: Vector2 = Vector2.ZERO
var damage: float = 10.0
var life: float = 2.0
var speed: float = 360.0

func setup(angle: float, dmg: float):
	damage = dmg
	velocity = Vector2(cos(angle), sin(angle)) * speed
	rotation = angle

func update_movement(delta: float) -> bool:
	global_position += velocity * delta
	life -= delta
	return life > 0

func _draw():
	draw_circle(Vector2.ZERO, 4, Color.YELLOW)
