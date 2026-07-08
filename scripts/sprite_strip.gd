# sprite_strip.gd — Sprite Strip 動畫播放器（支援 NxM grid）
extends Node2D

var animations: Dictionary = {}  # { "idle": {texture, frames, cols, rows, fps}, ... }
var current_state: String = "idle"
var frame_index: int = 0
var timer: float = 0.0
var flip_h: bool = false

func load_animations(sprites_cfg: Dictionary, char_config: Dictionary):
	for action in sprites_cfg:
		var path = sprites_cfg[action]
		if path is String:
			var tex = load(path)
			if tex:
				var info = _parse_filename(path)
				animations[action] = {
					"texture": tex,
					"frames": info.frames,
					"cols": info.cols,
					"rows": info.rows,
					"fps": 8
				}
	if animations.has("idle"):
		current_state = "idle"
	queue_redraw()

func load_single(path: String, frames: int, cols: int = 0, rows: int = 0):
	var tex = load(path)
	if tex:
		if cols <= 0 and rows <= 0:
			cols = frames
			rows = 1
		elif cols > 0 and rows <= 0:
			rows = ceili(float(frames) / cols)
		elif rows > 0 and cols <= 0:
			cols = ceili(float(frames) / rows)
		animations["idle"] = {
			"texture": tex,
			"frames": frames,
			"cols": cols,
			"rows": rows,
			"fps": 8
		}
		current_state = "idle"
		queue_redraw()

func set_state(new_state: String):
	if new_state == current_state:
		return
	if animations.has(new_state):
		current_state = new_state
		frame_index = 0
		timer = 0.0

func _parse_filename(path: String) -> Dictionary:
	var result = {"frames": 1, "cols": 1, "rows": 1}
	var filename = path.get_file()
	
	var regex_f = RegEx.new()
	regex_f.compile("(\\d+)f")
	var regex_c = RegEx.new()
	regex_c.compile("(\\d+)c")
	var regex_r = RegEx.new()
	regex_r.compile("(\\d+)r")
	
	var mf = regex_f.search(filename)
	var mc = regex_c.search(filename)
	var mr = regex_r.search(filename)
	
	if mf:
		result.frames = maxi(1, mf.get_string(1).to_int())
	if mc:
		result.cols = maxi(1, mc.get_string(1).to_int())
	if mr:
		result.rows = maxi(1, mr.get_string(1).to_int())
	
	# 自動推算
	if mc and mr:
		if not mf:
			result.frames = result.cols * result.rows
	elif mc and not mr:
		result.rows = ceili(float(result.frames) / result.cols)
	elif mr and not mc:
		result.cols = ceili(float(result.frames) / result.rows)
	else:
		result.cols = result.frames
		result.rows = 1
	
	return result

func _process(delta: float):
	if not animations.has(current_state):
		return
	var anim = animations[current_state]
	if anim.frames <= 1:
		return
	
	timer += delta
	var interval = 1.0 / anim.fps
	if timer >= interval:
		timer = 0.0
		frame_index = (frame_index + 1) % anim.frames
		queue_redraw()

func _draw():
	if not animations.has(current_state):
		return
	var anim = animations[current_state]
	var tex: Texture2D = anim.texture
	if not tex:
		return
	
	var fw = tex.get_width() / anim.cols
	var fh = tex.get_height() / anim.rows
	var col = frame_index % anim.cols
	var row = frame_index / anim.cols
	var src_rect = Rect2(col * fw, row * fh, fw, fh)
	
	var draw_size = Vector2(fw, fh)
	var dest_rect = Rect2(-draw_size / 2.0, draw_size)
	
	if flip_h:
		dest_rect.position.x = draw_size.x / 2.0
		dest_rect.size.x = -draw_size.x
	
	draw_texture_rect_region(tex, dest_rect, src_rect)
