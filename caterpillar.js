import turtle as t
import random
import time

# --- Setup ---
SCREEN_WIDTH, SCREEN_HEIGHT = 600, 600
t.setup(width=SCREEN_WIDTH, height=SCREEN_HEIGHT)

X_MIN, X_MAX = -300, 300
Y_MIN, Y_MAX = -300, 300

MENU, LEVEL_SELECT, SHOP, PLAYING, GAME_OVER = 'MENU', 'LEVEL_SELECT', 'SHOP', 'PLAYING', 'GAME_OVER'
game_state = MENU
selected_menu = 0
selected_level = 0
selected_skin = 0
score = 0
high_score = 0

skins = [
    {'name': 'Classic', 'shape': 'square', 'color': 'black', 'unlock': 0},
    {'name': 'Red', 'shape': 'square', 'color': 'red', 'unlock': 50},
    {'name': 'Turtle', 'shape': 'turtle', 'color': 'green', 'unlock': 100},
    {'name': 'Triangle', 'shape': 'triangle', 'color': 'blue', 'unlock': 200},
    {'name': 'Circle', 'shape': 'circle', 'color': 'orange', 'unlock': 300},
]
equipped_skin = 0
unlocked_skins = {0}

levels = [
    {
        'name': 'Level 1: Meadow',
        'speed': 2,
        'bgcolor': 'skyblue',
        'obstacles': [],
        'moving_obstacles': [],
        'start_pos': (0, 0)
    },
    {
        'name': 'Level 2: Forest',
        'speed': 3,
        'bgcolor': 'wheat',
        'obstacles': [
            (-100, 0, 200, 20),
            (40, -100, 20, 200)
        ],
        'moving_obstacles': [
            {'pos': [-50, 100, 40, 20], 'dir': 1, 'axis': 'x', 'range': [-150, 150], 'speed': 2}
        ],
        'start_pos': (-60, -60)
    },
    {
        'name': 'Level 3: Desert',
        'speed': 4,
        'bgcolor': 'plum',
        'obstacles': [
            (-140, 80, 280, 20),
            (80, -180, 20, 320),
            (-140, -80, 100, 20)
        ],
        'moving_obstacles': [
            {'pos': [0, 0, 30, 30], 'dir': 1, 'axis': 'y', 'range': [-100, 100], 'speed': 3}
        ],
        'start_pos': (0, 0)
    },
    {
        'name': 'Level 4: Night',
        'speed': 5,
        'bgcolor': 'lightpink',
        'obstacles': [
            (-160, 0, 320, 15),
            (40, -200, 15, 320),
            (80, 100, 60, 15),
            (-140, -80, 15, 120)
        ],
        'moving_obstacles': [
            {'pos': [100, -100, 20, 60], 'dir': 1, 'axis': 'y', 'range': [-120, 120], 'speed': 4}
        ],
        'start_pos': (-60, -60)
    },
]
# --- Special Fruits ---
timed_fruit = t.Turtle()
timed_fruit.hideturtle()
timed_fruit.penup()
timed_fruit.speed(0)
timed_fruit_timer = 0

poison_fruit = t.Turtle()
poison_fruit.hideturtle()
poison_fruit.penup()
poison_fruit.speed(0)
poison_fruit_timer = 0

def place_timed_fruit():
    global timed_fruit_timer
    if timed_fruit.isvisible():
        return
    attempts = 0
    while attempts < 50:
        x = random.randint(X_MIN+30, X_MAX-30)
        y = random.randint(Y_MIN+60, Y_MAX-60)
        collision = False
        for ox, oy, w, h in levels[selected_level]['obstacles']:
            if ox <= x <= ox + w and oy <= y <= oy + h:
                collision = True
                break
        if not collision:
            break
        attempts += 1
    timed_fruit.shape('circle')
    timed_fruit.color('purple')
    timed_fruit.shapesize(1.2, 1.2)
    timed_fruit.goto(x, y)
    timed_fruit.showturtle()
    timed_fruit_timer = time.time() + 5  # 5 seconds

def place_poison_fruit():
    global poison_fruit_timer
    if poison_fruit.isvisible():
        return
    attempts = 0
    while attempts < 50:
        x = random.randint(X_MIN+30, X_MAX-30)
        y = random.randint(Y_MIN+60, Y_MAX-60)
        collision = False
        for ox, oy, w, h in levels[selected_level]['obstacles']:
            if ox <= x <= ox + w and oy <= y <= oy + h:
                collision = True
                break
        if not collision:
            break
        attempts += 1
    poison_fruit.shape('circle')
    poison_fruit.color('magenta')
    poison_fruit.shapesize(1.2, 1.2)
    poison_fruit.goto(x, y)
    poison_fruit.showturtle()
    poison_fruit_timer = time.time() + 7  # 7 seconds

def update_special_fruits():
    now = time.time()
    if timed_fruit.isvisible() and now > timed_fruit_timer:
        timed_fruit.hideturtle()
    if poison_fruit.isvisible() and now > poison_fruit_timer:
        poison_fruit.hideturtle()
    t.ontimer(update_special_fruits, 200)

update_special_fruits()

def special_fruit_timer():
    # Hide both fruits before spawning a new one
    timed_fruit.hideturtle()
    poison_fruit.hideturtle()
    # Randomly choose which fruit to spawn
    if random.random() < 0.5:
        place_timed_fruit()
    else:
        place_poison_fruit()
    t.ontimer(special_fruit_timer, 15000)  # 15 seconds

def particle_burst(x, y, color='yellow'):
    global score, caterpillar_segments
    p = t.Turtle()
    p.hideturtle()
    p.penup()
    p.speed(0)
    p.color(color)
    for angle in range(0, 360, 36):
        p.goto(x, y)
        p.setheading(angle)
        p.pendown()
        p.forward(18)
        p.dot(7)
        p.penup()
    p.clear()
    del p

    # Timed fruit collision
    if timed_fruit.isvisible() and caterpillar.distance(timed_fruit) < 20:
        timed_fruit.hideturtle()
        score += 50
        for _ in range(3):
            caterpillar_segments.append(caterpillar_segments[-1])
        show_achievement("Bonus Fruit! +50")
        play_point_sound()
        particle_burst(timed_fruit.xcor(), timed_fruit.ycor(), 'purple')
        display_score(score)
        draw_caterpillar()

    # Poisonous fruit collision
    if poison_fruit.isvisible() and caterpillar.distance(poison_fruit) < 20:
        poison_fruit.hideturtle()
        score = max(0, score - 30)
        if len(caterpillar_segments) > 4:
            caterpillar_segments = caterpillar_segments[:-2]
        show_achievement("Poison! -30")
        particle_burst(poison_fruit.xcor(), poison_fruit.ycor(), 'magenta')
        display_score(score)
        draw_caterpillar()

caterpillar_segments = []
SEGMENT_SIZE = 20

# --- Moving Obstacles ---
moving_obstacles = []
moving_obstacle_directions = []

# --- Combo System ---
last_leaf_time = None
combo_count = 0
combo_timer = 3  # seconds to keep combo alive

# --- Achievements ---
achievement_turtle = t.Turtle()
achievement_turtle.hideturtle()
achievement_turtle.penup()
achievement_time = 0
achievement_text = ""

def show_achievement(text):
    global achievement_time, achievement_text
    achievement_turtle.clear()
    achievement_turtle.goto(0, Y_MAX - 100)
    achievement_turtle.write(text, align='center', font=('Arial', 24, 'bold'))
    achievement_time = time.time()
    achievement_text = text

def update_achievement():
    global achievement_time
    if achievement_time and time.time() - achievement_time > 2:
        achievement_turtle.clear()
        achievement_time = 0
    t.ontimer(update_achievement, 250)
update_achievement()

# --- Detail Turtle for Caterpillar Features ---
detail_turtle = t.Turtle()
detail_turtle.hideturtle()
detail_turtle.penup()
detail_turtle.speed(0)

def draw_face(pos, size):
    x, y = pos
    detail_turtle.goto(x, y + size * 0.25)
    for dx in [-size * 0.18, size * 0.18]:
        detail_turtle.goto(x + dx, y + size * 0.32)
        detail_turtle.dot(size * 0.18, 'white')
        detail_turtle.goto(x + dx, y + size * 0.34)
        detail_turtle.dot(size * 0.08, 'black')
    detail_turtle.goto(x, y + size * 0.16)
    detail_turtle.setheading(-60)
    detail_turtle.pendown()
    detail_turtle.pensize(2)
    detail_turtle.pencolor('black')
    detail_turtle.circle(size * 0.18, 120)
    detail_turtle.penup()
    detail_turtle.pensize(1)
    detail_turtle.pencolor('black')

def draw_antennae(pos, size):
    x, y = pos
    for dx in [-size * 0.18, size * 0.18]:
        detail_turtle.goto(x + dx, y + size * 0.45)
        detail_turtle.setheading(90 + (30 if dx < 0 else -30))
        detail_turtle.pendown()
        detail_turtle.pensize(2)
        detail_turtle.pencolor('black')
        detail_turtle.circle(size * 0.16, 60)
        detail_turtle.penup()
        detail_turtle.goto(detail_turtle.xcor(), detail_turtle.ycor())
        detail_turtle.dot(size * 0.08, 'black')
    detail_turtle.pensize(1)

def draw_patch(pos, size):
    x, y = pos
    detail_turtle.goto(x + size * 0.15, y)
    detail_turtle.setheading(30)
    detail_turtle.pendown()
    detail_turtle.fillcolor('gold')
    detail_turtle.begin_fill()
    for _ in range(2):
        detail_turtle.circle(size * 0.22, 90)
        detail_turtle.circle(size * 0.08, 90)
    detail_turtle.end_fill()
    detail_turtle.penup()

def draw_legs(pos, size, angle):
    x, y = pos
    for dy in [-0.22, 0.22]:
        detail_turtle.goto(x, y + size * dy)
        detail_turtle.setheading(angle)
        detail_turtle.pendown()
        detail_turtle.pensize(3)
        detail_turtle.pencolor('green')
        detail_turtle.forward(size * 0.22)
        detail_turtle.penup()
    detail_turtle.pensize(1)
    detail_turtle.pencolor('black')

# --- Caterpillar Drawing Helper ---
caterpillar = t.Turtle()
caterpillar.shape('circle')
caterpillar.speed(0)
caterpillar.penup()
caterpillar.hideturtle()

def draw_caterpillar():
    caterpillar.clearstamps()
    detail_turtle.clear()
    n = len(caterpillar_segments)
    skin_color = skins[equipped_skin]['color']
    for i, pos in enumerate(caterpillar_segments):
        if i == 0:
            seg_size = SEGMENT_SIZE * 1.2
            color = skin_color
        elif i == n - 1:
            seg_size = SEGMENT_SIZE * 0.8
            color = 'forestgreen'
        else:
            seg_size = SEGMENT_SIZE
            color = skin_color if i % 2 == 0 else 'limegreen'
        caterpillar.shapesize(stretch_wid=seg_size/20, stretch_len=seg_size/20)
        caterpillar.color(color)
        caterpillar.goto(pos)
        caterpillar.stamp()
        if 0 < i < n - 1:
            draw_patch(pos, seg_size)
        if i > 0:
            draw_legs(pos, seg_size, 200)
            draw_legs(pos, seg_size, -20)
    if n > 0:
        draw_face(caterpillar_segments[0], SEGMENT_SIZE * 1.2)
        draw_antennae(caterpillar_segments[0], SEGMENT_SIZE * 1.2)

# --- Shop Preview Turtles ---
shop_preview_turtle = t.Turtle()
shop_preview_turtle.hideturtle()
shop_preview_turtle.penup()
shop_preview_turtle.speed(0)

shop_detail_turtle = t.Turtle()
shop_detail_turtle.hideturtle()
shop_detail_turtle.penup()
shop_detail_turtle.speed(0)

def draw_caterpillar_preview(x, y, skin_color, segment_count=5, size=12):
    shop_preview_turtle.clearstamps()
    shop_detail_turtle.clear()
    for i in range(segment_count):
        seg_x = x + i * size * 0.9
        seg_y = y
        if i == 0:
            seg_size = size * 1.2
            color = skin_color
        elif i == segment_count - 1:
            seg_size = size * 0.8
            color = 'forestgreen'
        else:
            seg_size = size
            color = skin_color if i % 2 == 0 else 'limegreen'
        shop_preview_turtle.shape('circle')
        shop_preview_turtle.shapesize(stretch_wid=seg_size/20, stretch_len=seg_size/20)
        shop_preview_turtle.color(color)
        shop_preview_turtle.goto(seg_x, seg_y)
        shop_preview_turtle.stamp()
        if 0 < i < segment_count - 1:
            shop_detail_turtle.goto(seg_x + seg_size * 0.15, seg_y)
            shop_detail_turtle.setheading(30)
            shop_detail_turtle.pendown()
            shop_detail_turtle.fillcolor('gold')
            shop_detail_turtle.begin_fill()
            for _ in range(2):
                shop_detail_turtle.circle(seg_size * 0.22, 90)
                shop_detail_turtle.circle(seg_size * 0.08, 90)
            shop_detail_turtle.end_fill()
            shop_detail_turtle.penup()
        if i > 0:
            for dy in [-0.22, 0.22]:
                shop_detail_turtle.goto(seg_x, seg_y + seg_size * dy)
                shop_detail_turtle.setheading(200 if dy < 0 else -20)
                shop_detail_turtle.pendown()
                shop_detail_turtle.pensize(2)
                shop_detail_turtle.pencolor('green')
                shop_detail_turtle.forward(seg_size * 0.18)
                shop_detail_turtle.penup()
            shop_detail_turtle.pensize(1)
            shop_detail_turtle.pencolor('black')
    if segment_count > 0:
        head_x = x
        head_y = y
        for dx in [-size * 0.18, size * 0.18]:
            shop_detail_turtle.goto(head_x + dx, head_y + size * 0.32)
            shop_detail_turtle.dot(size * 0.13, 'white')
            shop_detail_turtle.goto(head_x + dx, head_y + size * 0.34)
            shop_detail_turtle.dot(size * 0.05, 'black')
        shop_detail_turtle.goto(head_x, head_y + size * 0.16)
        shop_detail_turtle.setheading(-60)
        shop_detail_turtle.pendown()
        shop_detail_turtle.pensize(1)
        shop_detail_turtle.pencolor('black')
        shop_detail_turtle.circle(size * 0.13, 120)
        shop_detail_turtle.penup()
        for dx in [-size * 0.18, size * 0.18]:
            shop_detail_turtle.goto(head_x + dx, head_y + size * 0.45)
            shop_detail_turtle.setheading(90 + (30 if dx < 0 else -30))
            shop_detail_turtle.pendown()
            shop_detail_turtle.pensize(1)
            shop_detail_turtle.pencolor('black')
            shop_detail_turtle.circle(size * 0.11, 60)
            shop_detail_turtle.penup()
            shop_detail_turtle.goto(shop_detail_turtle.xcor(), shop_detail_turtle.ycor())
            shop_detail_turtle.dot(size * 0.05, 'black')
        shop_detail_turtle.pensize(1)
        shop_detail_turtle.pencolor('black')

# --- Leaf (Animated) ---
leaf = t.Turtle()
leaf_shape = ((0,0),(14,2),(18,6),(20,20),(6,18),(2,14))
t.register_shape('leaf', leaf_shape)
leaf.shape('leaf')
leaf.color('orange')
leaf.penup()
leaf.hideturtle()
leaf.speed(0)

def animate_leaf():
    if not leaf.isvisible():
        return
    current_size = 1.1 + 0.1 * (time.time() % 1)
    leaf.shapesize(stretch_wid=current_size, stretch_len=current_size)
    leaf.settiltangle((leaf.tiltangle() + 5) % 360)
    t.ontimer(animate_leaf, 50)

# --- Power-Up ---
powerup_active = False
powerup_end_time = 0
powerup_turtle = t.Turtle()
powerup_turtle.hideturtle()
powerup_turtle.penup()
powerup_turtle.speed(0)

def place_powerup():
    if powerup_active or random.random() > 0.12:  # 12% chance after eating leaf
        return
    x = random.randint(X_MIN+30, X_MAX-30)
    y = random.randint(Y_MIN+60, Y_MAX-60)
    powerup_turtle.shape('circle')
    powerup_turtle.color('gold')
    powerup_turtle.shapesize(1.5, 1.5)
    powerup_turtle.goto(x, y)
    powerup_turtle.showturtle()

def check_powerup_collision():
    global powerup_active, powerup_end_time
    if powerup_turtle.isvisible() and caterpillar.distance(powerup_turtle) < 20:
        powerup_turtle.hideturtle()
        powerup_active = True
        powerup_end_time = time.time() + 10  # 10 seconds of double points
        show_achievement("Double Points!")
        # Optional: flash or sound

def update_powerup():
    global powerup_active
    if powerup_active and time.time() > powerup_end_time:
        powerup_active = False
    t.ontimer(update_powerup, 100)
update_powerup()

# --- Pause ---
pause_state = False
def toggle_pause():
    global pause_state
    pause_state = not pause_state
    if not pause_state and game_state == PLAYING:
        game_loop()
t.onkey(toggle_pause, 'p')

# --- Other Turtles ---
obstacle_turtle = t.Turtle()
obstacle_turtle.hideturtle()
obstacle_turtle.penup()

text_turtle = t.Turtle()
text_turtle.hideturtle()
text_turtle.penup()

score_turtle = t.Turtle()
score_turtle.hideturtle()
score_turtle.speed(0)
score_turtle.penup()

arrow_turtle = t.Turtle()
arrow_turtle.hideturtle()
arrow_turtle.penup()
arrow_turtle.speed(0)

# --- Drawing Functions ---

def draw_menu():
    t.bgcolor('blue')
    text_turtle.clear()
    arrow_turtle.clear()
    menu_options = ['Start Game', 'Select Level', 'Shop', 'Quit']
    item_height = 60
    total_height = item_height * len(menu_options)
    top_y = total_height // 2 - item_height // 2
    text_turtle.penup()
    for i, option in enumerate(menu_options):
        y = top_y - i * item_height
        text_turtle.goto(0, y)
        style = ('Arial', 22, 'bold') if i == selected_menu else ('Arial', 18, 'normal')
        text_turtle.write(option + ' ' * 15, align='center', font=style)
    text_turtle.goto(0, Y_MIN + 50)
    text_turtle.write(f'High Score: {high_score}          ', align='center', font=('Arial', 16, 'normal'))

def draw_level_select():
    t.bgcolor('blue')
    text_turtle.clear()
    arrow_turtle.clear()
    text_turtle.penup()
    level_options = [level['name'] for level in levels]
    item_height = 60
    total_height = item_height * len(level_options)
    header_y = Y_MAX - 40
    text_turtle.goto(0, header_y)
    text_turtle.write('Select Level', align='center', font=('Arial', 24, 'bold'))
    top_y = header_y - 40
    for i, level in enumerate(level_options):
        y = top_y - i * item_height
        text_turtle.goto(0, y)
        style = ('Arial', 18, 'bold') if i == selected_level else ('Arial', 16, 'normal')
        text_turtle.write(level + ' ' * 15, align='center', font=style)
    text_turtle.goto(0, Y_MIN + 50)
    text_turtle.write('Press Enter to start, Esc to return', align='center', font=('Arial', 12, 'normal'))

def draw_obstacles(obstacles):
    obstacle_turtle.clear()
    for ox, oy, w, h in obstacles:
        obstacle_turtle.goto(ox, oy)
        obstacle_turtle.pendown()
        obstacle_turtle.fillcolor('gray')
        obstacle_turtle.begin_fill()
        for _ in range(2):
            obstacle_turtle.forward(w)
            obstacle_turtle.left(90)
            obstacle_turtle.forward(h)
            obstacle_turtle.left(90)
        obstacle_turtle.end_fill()
        obstacle_turtle.penup()
    # Draw moving obstacles
    for mob in moving_obstacles:
        x, y, w, h = mob['pos']
        obstacle_turtle.goto(x, y)
        obstacle_turtle.pendown()
        obstacle_turtle.fillcolor('red')
        obstacle_turtle.begin_fill()
        for _ in range(2):
            obstacle_turtle.forward(w)
            obstacle_turtle.left(90)
            obstacle_turtle.forward(h)
            obstacle_turtle.left(90)
        obstacle_turtle.end_fill()
        obstacle_turtle.penup()

def update_moving_obstacles():
    for i, mob in enumerate(moving_obstacles):
        # mob['pos'] structure: [x, y, w, h]
        assert len(mob['pos']) == 4, f"Moving obstacle pos should be [x, y, w, h], got {mob['pos']}"
        axis = mob['axis']
        speed = mob['speed'] * moving_obstacle_directions[i]
        if axis == 'x':
            mob['pos'][0] += speed  # Only update x
        else:
            mob['pos'][1] += speed  # Only update y
        # Do NOT modify w/h!
        if axis == 'x':
            if mob['pos'][0] < mob['range'][0] or mob['pos'][0] > mob['range'][1]:
                moving_obstacle_directions[i] *= -1
        else:
            if mob['pos'][1] < mob['range'][0] or mob['pos'][1] > mob['range'][1]:
                moving_obstacle_directions[i] *= -1

def caterpillar_hits_obstacle(obstacles):
    x, y = caterpillar_segments[0]
    for ox, oy, w, h in obstacles:
        if ox <= x <= ox + w and oy <= y <= oy + h:
            return True
    for mob in moving_obstacles:
        mx, my, mw, mh = mob['pos']
        if mx <= x <= mx + mw and my <= y <= my + mh:
            return True
    return False

def place_leaf():
    leaf.hideturtle()
    max_attempts = 100
    attempt = 0
    while attempt < max_attempts:
        x = random.randint(X_MIN+30, X_MAX-30)
        y = random.randint(Y_MIN+60, Y_MAX-60)
        collision = False
        for ox, oy, w, h in levels[selected_level]['obstacles']:
            if ox <= x <= ox + w and oy <= y <= oy + h:
                collision = True
                break
        for mob in moving_obstacles:
            mx, my, mw, mh = mob['pos']
            if mx <= x <= mx + mw and my <= y <= my + mh:
                collision = True
                break
        if caterpillar_segments and ((x, y) in caterpillar_segments or abs(x - caterpillar_segments[0][0]) < 50 and abs(y - caterpillar_segments[0][1]) < 50):
            collision = True
        if not collision:
            break
        attempt += 1
    leaf.goto(x, y)
    leaf.showturtle()
    animate_leaf()

def display_score(current_score):
    score_turtle.clear()
    x = X_MAX - 50
    y = Y_MAX - 50
    score_turtle.goto(x, y)
    score_turtle.write(str(current_score), align='right', font=('Arial', 32, 'bold'))

def play_point_sound():
    try:
        import winsound
        winsound.Beep(1000, 100)
    except:
        pass

def play_gameover_sound():
    try:
        import winsound
        winsound.Beep(400, 500)
    except:
        pass

def game_over():
    global game_state, high_score, combo_count
    caterpillar.color('yellow')
    leaf.color('yellow')
    t.penup()
    t.hideturtle()
    t.bgcolor('red')
    text_turtle.goto(0, 0)
    text_turtle.clear()
    text_turtle.write('GAME OVER!', align='center', font=('Arial', 36, 'normal'))
    text_turtle.goto(0, -60)
    text_turtle.write('Press Enter or tap to return to menu', align='center', font=('Arial', 16, 'normal'))
    if score > high_score:
        high_score = score
    arrow_turtle.clear()
    play_gameover_sound()
    combo_count = 0
    game_state = GAME_OVER

def apply_skin(idx):
    skin = skins[idx]
    caterpillar.shape('circle')
    caterpillar.color(skin['color'])

def start_game():
    global game_state, score, caterpillar_speed, caterpillar_segments, pause_state, powerup_active, last_leaf_time, combo_count
    shop_preview_turtle.clearstamps()
    shop_detail_turtle.clear()
    shop_preview_turtle.hideturtle()
    shop_detail_turtle.hideturtle()
    game_state = PLAYING
    score = 0
    pause_state = False
    powerup_active = False
    last_leaf_time = None
    combo_count = 0
    text_turtle.clear()
    caterpillar_speed = levels[selected_level]['speed']
    start_pos = levels[selected_level].get('start_pos', (0, 0))
    caterpillar_segments = [start_pos] * 7
    caterpillar.showturtle()
    caterpillar.goto(*start_pos)
    caterpillar.setheading(0)
    apply_skin(equipped_skin)
    leaf.color('orange')
    t.bgcolor(levels[selected_level]['bgcolor'])
    # Setup moving obstacles
    moving_obstacles.clear()
    moving_obstacle_directions.clear()
    for mob in levels[selected_level].get('moving_obstacles', []):
        moving_obstacles.append(mob.copy())
        moving_obstacle_directions.append(mob['dir'])
    draw_obstacles(levels[selected_level]['obstacles'])
    display_score(score)
    place_leaf()
    draw_caterpillar()
    special_fruit_timer()  # Start the special fruit timer
    game_loop()

def game_loop():
    global score, game_state, caterpillar_speed, caterpillar_segments, high_score, unlocked_skins, last_leaf_time, combo_count
    if game_state != PLAYING or pause_state:
        return
    update_moving_obstacles()
    draw_obstacles(levels[selected_level]['obstacles'])
    # Move: add new head, remove tail
    x, y = caterpillar_segments[0]
    caterpillar.goto(x, y)
    caterpillar.setheading(caterpillar.heading())
    caterpillar.forward(caterpillar_speed)
    new_head = caterpillar.pos()
    caterpillar_segments.insert(0, new_head)
    # Growth check
    growing = False
    if caterpillar.distance(leaf) < 20:
        now = time.time()
        if last_leaf_time and now - last_leaf_time < combo_timer:
            combo_count += 1
        else:
            combo_count = 1
        last_leaf_time = now
        if combo_count > 1:
            show_achievement(f"Combo x{combo_count}!")
        place_leaf()
        check_powerup_collision()
        if powerup_active:
            score += 20 * combo_count
        else:
            score += 10 * combo_count
        display_score(score)
        play_point_sound()
        growing = True
        for idx, skin in enumerate(skins):
            if score >= skin['unlock']:
                unlocked_skins.add(idx)
        if score >= 100 and not hasattr(start_game, 'score_100'):
            show_achievement("100 Points!")
            start_game.score_100 = True
    check_powerup_collision()
    if not growing:
        caterpillar_segments.pop()
    # Collision
    if outside_window() or caterpillar_hits_obstacle(levels[selected_level]['obstacles']) or new_head in caterpillar_segments[1:]:
        game_over()
        return
    draw_caterpillar()
    t.update()
    t.ontimer(game_loop, 60)

def outside_window():
    x, y = caterpillar_segments[0]
    return x < X_MIN or x > X_MAX or y > Y_MAX or y < Y_MIN

def on_up():
    global selected_menu, selected_level, selected_skin
    if game_state == MENU:
        selected_menu = (selected_menu - 1) % 4
        draw_menu()
    elif game_state == LEVEL_SELECT:
        selected_level = (selected_level - 1) % len(levels)
        draw_level_select()
    elif game_state == SHOP:
        selected_skin = (selected_skin - 1) % len(skins)
        draw_shop()
    elif game_state == PLAYING:
        if caterpillar.heading() == 0 or caterpillar.heading() == 180:
            caterpillar.setheading(90)

def on_down():
    global selected_menu, selected_level, selected_skin
    if game_state == MENU:
        selected_menu = (selected_menu + 1) % 4
        draw_menu()
    elif game_state == LEVEL_SELECT:
        selected_level = (selected_level + 1) % len(levels)
        draw_level_select()
    elif game_state == SHOP:
        selected_skin = (selected_skin + 1) % len(skins)
        draw_shop()
    elif game_state == PLAYING:
        if caterpillar.heading() == 0 or caterpillar.heading() == 180:
            caterpillar.setheading(270)

def on_left():
    if game_state == PLAYING:
        if caterpillar.heading() == 90 or caterpillar.heading() == 270:
            caterpillar.setheading(180)

def on_right():
    if game_state == PLAYING:
        if caterpillar.heading() == 90 or caterpillar.heading() == 270:
            caterpillar.setheading(0)

def on_enter():
    global game_state, equipped_skin
    if game_state == MENU:
        if selected_menu == 0:
            start_game()
        elif selected_menu == 1:
            game_state = LEVEL_SELECT
            draw_level_select()
        elif selected_menu == 2:
            game_state = SHOP
            draw_shop()
        elif selected_menu == 3:
            t.bye()
    elif game_state == LEVEL_SELECT:
        start_game()
    elif game_state == SHOP:
        if high_score >= skins[selected_skin]['unlock']:
            equipped_skin = selected_skin
            draw_shop()
    elif game_state == GAME_OVER:
        caterpillar.hideturtle()
        leaf.hideturtle()
        obstacle_turtle.clear()
        draw_menu()
        game_state = MENU

def on_escape():
    global game_state
    if game_state == LEVEL_SELECT or game_state == SHOP:
        game_state = MENU
        draw_menu()

def on_screen_click(x, y):
    global game_state
    if game_state == GAME_OVER:
        caterpillar.hideturtle()
        leaf.hideturtle()
        obstacle_turtle.clear()
        draw_menu()
        game_state = MENU

def draw_shop():
    t.bgcolor('blue')
    text_turtle.clear()
    arrow_turtle.clear()
    text_turtle.penup()
    item_height = 60
    total_height = item_height * len(skins)
    header_y = Y_MAX - 40
    text_turtle.goto(0, header_y)
    text_turtle.write('Shop: Caterpillar Skins', align='center', font=('Arial', 24, 'bold'))
    top_y = header_y - 40
    for i, skin in enumerate(skins):
        y = top_y - i * item_height
        text_turtle.goto(-60, y)
        marker = '>' if i == selected_skin else ' '
        status = ''
        if high_score >= skin['unlock']:
            status = 'Unlocked'
        else:
            status = f"Locked ({skin['unlock']} pts)"
        if i == equipped_skin:
            status += ' [Equipped]'
        text_turtle.write(
            f"{marker} {skin['name']} - {skin['color']} - {skin['shape']} - {status}      ",
            align='left',
            font=('Arial', 18, 'bold' if i == selected_skin else 'normal')
        )
        draw_caterpillar_preview(110, y, skin['color'], segment_count=5, size=16)
    text_turtle.goto(0, Y_MIN + 50)
    text_turtle.write('Enter: Equip  Esc: Menu', align='center', font=('Arial', 12, 'normal'))

t.onscreenclick(on_screen_click)

# Keyboard events (desktop)
t.listen()
t.onkey(on_up, 'Up')
t.onkey(on_down, 'Down')
t.onkey(on_left, 'Left')
t.onkey(on_right, 'Right')
t.onkey(on_enter, 'Return')
t.onkey(on_escape, 'Escape')
t.onkey(lambda: on_up() if game_state == PLAYING else None, 'w')
t.onkey(lambda: on_down() if game_state == PLAYING else None, 's')
t.onkey(lambda: on_left() if game_state == PLAYING else None, 'a')
t.onkey(lambda: on_right() if game_state == PLAYING else None, 'd')

t.tracer(0)
draw_menu()
t.mainloop()

html_content = """
<!DOCTYPE html>
<html>
<head>
    <title>Caterpillar Game</title>
    <style>
        canvas { border: 1px solid black; }
        #game-container { width: 600px; margin: 0 auto; }
        #controls { text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div id="game-container">
        <canvas id="gameCanvas" width="600" height="600"></canvas>
        <div id="controls">
            <button id="up">↑</button>
            <div>
                <button id="left">←</button>
                <button id="down">↓</button>
                <button id="right">→</button>
            </div>
        </div>
    </div>
    <script src="caterpillar.js"></script>
</body>
</html>
"""

js_content = """
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const SCREEN_WIDTH = 600;
const SCREEN_HEIGHT = 600;
const SEGMENT_SIZE = 20;

// Game state
let game_state = 'MENU';
let score = 0;
let high_score = 0;
let caterpillar = [];
let leaf = null;
let direction = 'right';
let nextDirection = 'right';

// Initialize game
function initGame() {
    // Initialize caterpillar
    caterpillar = [];
    for (let i = 0; i < 5; i++) {
        caterpillar.push({
            x: SCREEN_WIDTH/2 - i*SEGMENT_SIZE,
            y: SCREEN_HEIGHT/2
        });
    }
    
    // Place first leaf
    placeLeaf();
}

// Game loop
function gameLoop() {
    if (game_state === 'PLAYING') {
        update();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    // Update direction
    direction = nextDirection;
    
    // Move caterpillar
    for (let i = caterpillar.length - 1; i > 0; i--) {
        caterpillar[i].x = caterpillar[i-1].x;
        caterpillar[i].y = caterpillar[i-1].y;
    }
    
    // Move head
    const head = caterpillar[0];
    switch(direction) {
        case 'up': head.y -= SEGMENT_SIZE; break;
        case 'down': head.y += SEGMENT_SIZE; break;
        case 'left': head.x -= SEGMENT_SIZE; break;
        case 'right': head.x += SEGMENT_SIZE; break;
    }
    
    // Check collisions
    if (checkCollision()) {
        gameOver();
        return;
    }
    
    // Check leaf collision
    if (head.x === leaf.x && head.y === leaf.y) {
        caterpillar.push({
            x: head.x,
            y: head.y
        });
        placeLeaf();
        score++;
    }
}

// Draw game
function draw() {
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
    // Draw caterpillar
    ctx.fillStyle = 'black';
    for (let segment of caterpillar) {
        ctx.fillRect(segment.x, segment.y, SEGMENT_SIZE, SEGMENT_SIZE);
    }
    
    // Draw leaf
    ctx.fillStyle = 'green';
    ctx.fillRect(leaf.x, leaf.y, SEGMENT_SIZE, SEGMENT_SIZE);
    
    // Draw score
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 20);
}

// Place a new leaf
function placeLeaf() {
    leaf = {
        x: Math.floor(Math.random() * (SCREEN_WIDTH/SEGMENT_SIZE)) * SEGMENT_SIZE,
        y: Math.floor(Math.random() * (SCREEN_HEIGHT/SEGMENT_SIZE)) * SEGMENT_SIZE
    };
}

// Check for collisions
function checkCollision() {
    const head = caterpillar[0];
    
    // Check walls
    if (head.x < 0 || head.x >= SCREEN_WIDTH || 
        head.y < 0 || head.y >= SCREEN_HEIGHT) {
        return true;
    }
    
    // Check self
    for (let i = 1; i < caterpillar.length; i++) {
        if (head.x === caterpillar[i].x && head.y === caterpillar[i].y) {
            return true;
        }
    }
    
    return false;
}

// Game over
function gameOver() {
    game_state = 'GAME_OVER';
    alert(`Game Over! Score: ${score}`);
    if (score > high_score) {
        high_score = score;
    }
    score = 0;
    initGame();
}

// Handle key presses
function handleKeyPress(event) {
    const key = event.key;
    switch(key) {
        case 'ArrowUp':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'ArrowDown':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'ArrowLeft':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'ArrowRight':
            if (direction !== 'left') nextDirection = 'right';
            break;
    }
}

// Initialize game
initGame();
window.addEventListener('keydown', handleKeyPress);
gameLoop();
"""

# Save files
with open('index.html', 'w') as f:
    f.write(html_content)
with open('caterpillar.js', 'w') as f:
    f.write(js_content)

print("Game converted to web version. You can now host these files on any static website hosting service.")
