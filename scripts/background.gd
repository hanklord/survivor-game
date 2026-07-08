# background.gd — 背景 Tile 渲染
extends Node2D

var bg_texture: Texture2D = null
var bg_color: Color = Color(0.1, 0.1, 0.18)
var tile_size: Vector2 = Vector2(256, 256)

func set_bg(image_path: String, color: Color):
	bg_color = color
	if image_path != "":
		bg_texture = load(image_path)
		if bg_texture:
			tile_size = Vector2(bg_texture.get_width(), bg_texture.get_height())
	else:
		bg_texture = null
	queue_redraw()

func _draw():
	var viewport_size = get_viewport_rect().size
	var camera = get_viewport().get_camera_2d()
	var cam_pos = camera.global_position if camera else Vector2.ZERO
	
	# 繪製範圍：以相機為中心的可見區域 + padding
	var start_x = cam_pos.x - viewport_size.x
	var start_y = cam_pos.y - viewport_size.y
	var end_x = cam_pos.x + viewport_size.x
	var end_y = cam_pos.y + viewport_size.y
	
	if bg_texture:
		# Tile 填充
		var tx = tile_size.x
		var ty = tile_size.y
		var sx = floorf(start_x / tx) * tx
		var sy = floorf(start_y / ty) * ty
		var x = sx
		while x < end_x:
			var y = sy
			while y < end_y:
				draw_texture(bg_texture, Vector2(x, y))
				y += ty
			x += tx
	else:
		# 純色填充
		draw_rect(Rect2(start_x, start_y, end_x - start_x, end_y - start_y), bg_color)

func _process(_delta: float):
	queue_redraw()  # 每幀重繪（相機移動時）
