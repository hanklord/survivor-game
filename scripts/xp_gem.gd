# xp_gem.gd — 經驗值寶石
extends Node2D

var value: int = 1
var attract_speed: float = 300.0
var pickup_radius: float = 15.0

func _process(delta: float):
	var game = get_parent().get_parent()
	if not game or not game.has_node("Player"):
		return
	var player = game.get_node("Player")
	var dist = global_position.distance_to(player.global_position)
	
	# 吸引
	if dist < player.pickup_range:
		var dir = (player.global_position - global_position).normalized()
		global_position += dir * attract_speed * delta
	
	# 撿取
	if dist < pickup_radius:
		if player.add_xp(value):
			game.emit_signal("level_up", player.level)
		queue_free()

func _draw():
	draw_circle(Vector2.ZERO, 5, Color(0, 1, 0.53))
