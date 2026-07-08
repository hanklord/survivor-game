# hud.gd — 遊戲 HUD 顯示
extends CanvasLayer

var hp_label: Label
var xp_label: Label
var time_label: Label
var kills_label: Label
var level_label: Label

func _ready():
	var panel = Control.new()
	panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(panel)
	
	# HP Bar
	hp_label = Label.new()
	hp_label.position = Vector2(10, 10)
	hp_label.add_theme_font_size_override("font_size", 16)
	panel.add_child(hp_label)
	
	# XP
	xp_label = Label.new()
	xp_label.position = Vector2(10, 35)
	xp_label.add_theme_font_size_override("font_size", 14)
	panel.add_child(xp_label)
	
	# Time
	time_label = Label.new()
	time_label.position = Vector2(10, 55)
	time_label.add_theme_font_size_override("font_size", 14)
	panel.add_child(time_label)
	
	# Kills
	kills_label = Label.new()
	kills_label.position = Vector2(10, 75)
	kills_label.add_theme_font_size_override("font_size", 14)
	panel.add_child(kills_label)
	
	# Level name
	level_label = Label.new()
	level_label.set_anchors_preset(Control.PRESET_CENTER_TOP)
	level_label.position = Vector2(-50, 10)
	level_label.add_theme_font_size_override("font_size", 18)
	panel.add_child(level_label)

func update_hud(player, game_time: float, kills: int):
	if not player:
		return
	hp_label.text = "❤️ %d / %d" % [int(player.hp), int(player.max_hp)]
	xp_label.text = "⭐ Lv.%d  XP: %d/%d" % [player.level, player.xp, player.xp_needed]
	time_label.text = "⏱️ %d:%02d" % [int(game_time) / 60, int(game_time) % 60]
	kills_label.text = "💀 %d" % kills

func update_level_name(name: String):
	if level_label:
		level_label.text = name
