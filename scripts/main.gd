# main.gd — 入口場景控制（角色選擇 → 遊戲）
extends Node2D

@onready var game_scene = preload("res://scenes/game.tscn")
@onready var player_scene = preload("res://scenes/player.tscn")

var game_instance: Node2D = null
var selected_character: String = "x4"

func _ready():
	_show_character_select()

func _show_character_select():
	# 簡易角色選擇 UI
	var panel = Control.new()
	panel.name = "CharSelect"
	panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	
	var bg = ColorRect.new()
	bg.color = Color(0.05, 0.05, 0.12, 0.95)
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	panel.add_child(bg)
	
	var vbox = VBoxContainer.new()
	vbox.set_anchors_preset(Control.PRESET_CENTER)
	vbox.position = Vector2(-150, -120)
	panel.add_child(vbox)
	
	var title = Label.new()
	title.text = "選擇角色"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 32)
	vbox.add_child(title)
	
	var spacer = Control.new()
	spacer.custom_minimum_size = Vector2(0, 20)
	vbox.add_child(spacer)
	
	for char_id in GameConfig.CHARACTERS:
		var cfg = GameConfig.CHARACTERS[char_id]
		var btn = Button.new()
		btn.text = cfg.name + " (" + cfg.attack_type + ")"
		btn.custom_minimum_size = Vector2(300, 50)
		btn.pressed.connect(_on_character_selected.bind(char_id))
		vbox.add_child(btn)
	
	add_child(panel)

func _on_character_selected(char_id: String):
	selected_character = char_id
	# 移除選單
	if has_node("CharSelect"):
		$CharSelect.queue_free()
	# 開始遊戲
	_start_game()

func _start_game():
	game_instance = game_scene.instantiate()
	add_child(game_instance)
	
	# 加入玩家
	var player = player_scene.instantiate()
	player.name = "Player"
	game_instance.add_child(player)
	game_instance.player = player
	game_instance.setup(selected_character)
	
	game_instance.game_over.connect(_on_game_over)
	game_instance.level_up.connect(_on_level_up)

func _on_game_over():
	# 簡單 Game Over 畫面
	var label = Label.new()
	label.text = "GAME OVER\n擊殺: %d\n按 R 重新開始" % game_instance.kills
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.set_anchors_preset(Control.PRESET_CENTER)
	label.add_theme_font_size_override("font_size", 28)
	var layer = CanvasLayer.new()
	layer.name = "GameOverLayer"
	layer.add_child(label)
	add_child(layer)

func _on_level_up(level: int):
	# 技能選擇（3 選 1）
	game_instance.paused = true
	var skills = GameConfig.SKILLS.duplicate()
	skills.shuffle()
	var choices = skills.slice(0, 3)
	
	var panel = Control.new()
	panel.name = "SkillSelect"
	panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	
	var bg = ColorRect.new()
	bg.color = Color(0, 0, 0, 0.7)
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	panel.add_child(bg)
	
	var vbox = VBoxContainer.new()
	vbox.set_anchors_preset(Control.PRESET_CENTER)
	vbox.position = Vector2(-150, -80)
	panel.add_child(vbox)
	
	var title = Label.new()
	title.text = "升級！選擇技能"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 24)
	vbox.add_child(title)
	
	for skill in choices:
		var btn = Button.new()
		btn.text = skill.name
		btn.custom_minimum_size = Vector2(300, 45)
		btn.pressed.connect(_on_skill_chosen.bind(skill.id))
		vbox.add_child(btn)
	
	add_child(panel)

func _on_skill_chosen(skill_id: String):
	game_instance.player.apply_skill(skill_id)
	game_instance.paused = false
	if has_node("SkillSelect"):
		$SkillSelect.queue_free()

func _input(event):
	if event is InputEventKey and event.pressed and event.keycode == KEY_R:
		get_tree().reload_current_scene()
