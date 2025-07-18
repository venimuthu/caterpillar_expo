// Game constants
const SCREEN_WIDTH = 600;
const SCREEN_HEIGHT = 600;
const SEGMENT_SIZE = 20;
const GRID_SIZE = SCREEN_WIDTH / SEGMENT_SIZE;

// Game states
const MENU = 'MENU';
const LEVEL_SELECT = 'LEVEL_SELECT';
const SHOP = 'SHOP';
const PLAYING = 'PLAYING';
const GAME_OVER = 'GAME_OVER';

// Game state
let game_state = MENU;
let selected_menu = 0;
let selected_level = 0;
let selected_skin = 0;
let score = 0;
let high_score = 0;
let caterpillar = [];
let leaf = null;
let direction = 'right';
let nextDirection = 'right';
let powerup_active = false;
let powerup_end_time = 0;
let pause_state = false;

// Skins
const skins = [
    { name: 'Classic', shape: 'square', color: 'black', unlock: 0 },
    { name: 'Red', shape: 'square', color: 'red', unlock: 50 },
    { name: 'Turtle', shape: 'turtle', color: 'green', unlock: 100 },
    { name: 'Triangle', shape: 'triangle', color: 'blue', unlock: 200 },
    { name: 'Circle', shape: 'circle', color: 'orange', unlock: 300 }
];
let equipped_skin = 0;
let unlocked_skins = new Set([0]);

// Levels
const levels = [
    {
        name: 'Level 1: Meadow',
        speed: 2,
        bgcolor: 'skyblue',
        obstacles: [],
        moving_obstacles: [],
        start_pos: { x: SCREEN_WIDTH/2, y: SCREEN_HEIGHT/2 }
    },
    {
        name: 'Level 2: Forest',
        speed: 3,
        bgcolor: 'wheat',
        obstacles: [
            { x: -100, y: 0, width: 200, height: 20 },
            { x: 40, y: -100, width: 20, height: 200 }
        ],
        moving_obstacles: [
            { pos: { x: -50, y: 100, width: 40, height: 20 }, dir: 1, axis: 'x', range: [-150, 150], speed: 2 }
        ],
        start_pos: { x: -60, y: -60 }
    }
];

// Special fruits
let timed_fruit = null;
let timed_fruit_timer = 0;
let poison_fruit = null;
let poison_fruit_timer = 0;

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');

// Audio setup
const pointSound = new Audio('sounds/point.mp3');
const gameOverSound = new Audio('sounds/gameover.mp3');

// Initialize game
function initGame() {
    // Initialize caterpillar
    caterpillar = [];
    for (let i = 0; i < 5; i++) {
        caterpillar.push({
            x: Math.floor(SCREEN_WIDTH/2/SEGMENT_SIZE) * SEGMENT_SIZE - i*SEGMENT_SIZE,
            y: Math.floor(SCREEN_HEIGHT/2/SEGMENT_SIZE) * SEGMENT_SIZE
        });
    }
    
    // Place first leaf
    placeLeaf();
    
    // Reset score
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    
    // Hide game over screen
    gameOverElement.style.display = 'none';
    
    // Start game loop
    gameLoop();
}

// Game loop
function gameLoop() {
    if (game_state === PLAYING) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Update game state
function update() {
    if (pause_state) return;
    
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
        scoreElement.textContent = `Score: ${score}`;
        playPointSound();
        particleBurst(head.x, head.y, 'green');
    }
    
    // Update special fruits
    updateSpecialFruits();
    checkSpecialFruitCollisions();
    
    // Update powerups
    updatePowerup();
    checkPowerupCollision();
    
    // Update moving obstacles
    updateMovingObstacles();
}

// Draw game
function draw() {
    // Clear canvas
    ctx.fillStyle = levels[selected_level].bgcolor;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
    // Draw obstacles
    drawObstacles();
    
    // Draw caterpillar
    ctx.fillStyle = skins[selected_skin].color;
    for (let segment of caterpillar) {
        drawSegment(segment);
    }
    
    // Draw head details
    drawHeadDetails(caterpillar[0]);
    
    // Draw leaf
    ctx.fillStyle = 'green';
    ctx.fillRect(leaf.x, leaf.y, SEGMENT_SIZE, SEGMENT_SIZE);
    
    // Draw special fruits
    drawSpecialFruits();
    
    // Draw powerup if active
    drawPowerup();
}

// Draw segment with shape
function drawSegment(segment) {
    const shape = skins[selected_skin].shape;
    const size = SEGMENT_SIZE;
    
    switch(shape) {
        case 'square':
            ctx.fillRect(segment.x, segment.y, size, size);
            break;
        case 'circle':
            ctx.beginPath();
            ctx.arc(segment.x + size/2, segment.y + size/2, size/2, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'triangle':
            ctx.beginPath();
            ctx.moveTo(segment.x + size/2, segment.y);
            ctx.lineTo(segment.x + size, segment.y + size);
            ctx.lineTo(segment.x, segment.y + size);
            ctx.closePath();
            ctx.fill();
            break;
        case 'turtle':
            // Draw turtle shape
            ctx.beginPath();
            ctx.arc(segment.x + size/2, segment.y + size/2, size/2, 0, Math.PI * 2);
            ctx.fill();
            break;
    }
}

// Draw head details
function drawHeadDetails(head) {
    const size = SEGMENT_SIZE;
    
    // Draw eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(head.x + size/4, head.y + size/4, size/8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(head.x + size*3/4, head.y + size/4, size/8, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw pupils
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(head.x + size/4, head.y + size/4, size/16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(head.x + size*3/4, head.y + size/4, size/16, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw mouth
    ctx.beginPath();
    ctx.arc(head.x + size/2, head.y + size*3/4, size/4, Math.PI, Math.PI * 2);
    ctx.stroke();
}

// Place a new leaf
function placeLeaf() {
    let x, y;
    do {
        x = Math.floor(Math.random() * GRID_SIZE) * SEGMENT_SIZE;
        y = Math.floor(Math.random() * GRID_SIZE) * SEGMENT_SIZE;
    } while (caterpillar.some(segment => segment.x === x && segment.y === y));
    
    leaf = { x, y };
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
    
    // Check obstacles
    if (caterpillarHitsObstacle()) {
        return true;
    }
    
    return false;
}

// Game over
function gameOver() {
    game_state = GAME_OVER;
    gameOverElement.style.display = 'block';
    finalScoreElement.textContent = score;
    playGameOverSound();
    
    if (score > high_score) {
        high_score = score;
    }
}

// Restart game
function restartGame() {
    game_state = PLAYING;
    initGame();
}

// Handle key presses
function handleKeyPress(key) {
    if (game_state !== PLAYING) return;
    
    if (key === 'p') {
        togglePause();
        return;
    }
    
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

// Special fruit functions
function placeTimedFruit() {
    if (timed_fruit) return;
    
    let attempts = 0;
    while (attempts < 50) {
        let x = Math.floor(Math.random() * GRID_SIZE) * SEGMENT_SIZE;
        let y = Math.floor(Math.random() * GRID_SIZE) * SEGMENT_SIZE;
        
        if (!checkCollisionWithObstacles(x, y)) {
            timed_fruit = { x, y };
            timed_fruit_timer = Date.now() + 5000;
            break;
        }
        attempts++;
    }
}

function placePoisonFruit() {
    if (poison_fruit) return;
    
    let attempts = 0;
    while (attempts < 50) {
        let x = Math.floor(Math.random() * GRID_SIZE) * SEGMENT_SIZE;
        let y = Math.floor(Math.random() * GRID_SIZE) * SEGMENT_SIZE;
        
        if (!checkCollisionWithObstacles(x, y)) {
            poison_fruit = { x, y };
            poison_fruit_timer = Date.now() + 7000;
            break;
        }
        attempts++;
    }
}

function updateSpecialFruits() {
    const now = Date.now();
    if (timed_fruit && now > timed_fruit_timer) {
        timed_fruit = null;
    }
    if (poison_fruit && now > poison_fruit_timer) {
        poison_fruit = null;
    }
}

function checkSpecialFruitCollisions() {
    const head = caterpillar[0];
    
    if (timed_fruit && Math.abs(head.x - timed_fruit.x) < SEGMENT_SIZE && 
        Math.abs(head.y - timed_fruit.y) < SEGMENT_SIZE) {
        timed_fruit = null;
        score += 50;
        for (let i = 0; i < 3; i++) {
            caterpillar.push({ x: head.x, y: head.y });
        }
        scoreElement.textContent = `Score: ${score}`;
        playPointSound();
        particleBurst(head.x, head.y, 'purple');
    }
    
    if (poison_fruit && Math.abs(head.x - poison_fruit.x) < SEGMENT_SIZE && 
        Math.abs(head.y - poison_fruit.y) < SEGMENT_SIZE) {
        poison_fruit = null;
        score = Math.max(0, score - 30);
        if (caterpillar.length > 4) {
            caterpillar = caterpillar.slice(0, -2);
        }
        scoreElement.textContent = `Score: ${score}`;
        particleBurst(head.x, head.y, 'magenta');
    }
}

function drawSpecialFruits() {
    if (timed_fruit) {
        ctx.fillStyle = 'purple';
        ctx.beginPath();
        ctx.arc(timed_fruit.x + SEGMENT_SIZE/2, timed_fruit.y + SEGMENT_SIZE/2, SEGMENT_SIZE/2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    if (poison_fruit) {
        ctx.fillStyle = 'magenta';
        ctx.beginPath();
        ctx.arc(poison_fruit.x + SEGMENT_SIZE/2, poison_fruit.y + SEGMENT_SIZE/2, SEGMENT_SIZE/2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Powerup functions
function placePowerup() {
    let attempts = 0;
    while (attempts < 50) {
        let x = Math.floor(Math.random() * GRID_SIZE) * SEGMENT_SIZE;
        let y = Math.floor(Math.random() * GRID_SIZE) * SEGMENT_SIZE;
        
        if (!checkCollisionWithObstacles(x, y)) {
            powerup_active = true;
            powerup_end_time = Date.now() + 10000;
            break;
        }
        attempts++;
    }
}

function updatePowerup() {
    if (powerup_active && Date.now() > powerup_end_time) {
        powerup_active = false;
    }
}

function checkPowerupCollision() {
    if (!powerup_active) return;
    
    const head = caterpillar[0];
    if (Math.abs(head.x - leaf.x) < SEGMENT_SIZE && 
        Math.abs(head.y - leaf.y) < SEGMENT_SIZE) {
        // Apply powerup effect (e.g., speed boost)
        // This is a placeholder for actual powerup effect
        powerup_active = false;
    }
}

function drawPowerup() {
    if (powerup_active) {
        ctx.fillStyle = 'gold';
        ctx.beginPath();
        ctx.arc(leaf.x + SEGMENT_SIZE/2, leaf.y + SEGMENT_SIZE/2, SEGMENT_SIZE/2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Particle effects
function particleBurst(x, y, color) {
    ctx.fillStyle = color;
    for (let i = 0; i < 360; i += 36) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(i * Math.PI / 180);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(18, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(18, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Obstacle functions
function drawObstacles() {
    const level = levels[selected_level];
    
    // Draw static obstacles
    ctx.fillStyle = 'brown';
    for (let obstacle of level.obstacles) {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
    
    // Draw moving obstacles
    for (let obstacle of level.moving_obstacles) {
        ctx.fillRect(obstacle.pos.x, obstacle.pos.y, obstacle.pos.width, obstacle.pos.height);
    }
}

function updateMovingObstacles() {
    const level = levels[selected_level];
    
    for (let obstacle of level.moving_obstacles) {
        if (obstacle.axis === 'x') {
            obstacle.pos.x += obstacle.dir * obstacle.speed;
            if (obstacle.pos.x < obstacle.range[0]) {
                obstacle.dir = 1;
            } else if (obstacle.pos.x > obstacle.range[1]) {
                obstacle.dir = -1;
            }
        } else if (obstacle.axis === 'y') {
            obstacle.pos.y += obstacle.dir * obstacle.speed;
            if (obstacle.pos.y < obstacle.range[0]) {
                obstacle.dir = 1;
            } else if (obstacle.pos.y > obstacle.range[1]) {
                obstacle.dir = -1;
            }
        }
    }
}

function caterpillarHitsObstacle() {
    const head = caterpillar[0];
    const level = levels[selected_level];
    
    // Check static obstacles
    for (let obstacle of level.obstacles) {
        if (head.x >= obstacle.x && head.x < obstacle.x + obstacle.width &&
            head.y >= obstacle.y && head.y < obstacle.y + obstacle.height) {
            return true;
        }
    }
    
    // Check moving obstacles
    for (let obstacle of level.moving_obstacles) {
        if (head.x >= obstacle.pos.x && head.x < obstacle.pos.x + obstacle.pos.width &&
            head.y >= obstacle.pos.y && head.y < obstacle.pos.y + obstacle.pos.height) {
            return true;
        }
    }
    
    return false;
}

function checkCollisionWithObstacles(x, y) {
    const level = levels[selected_level];
    
    // Check static obstacles
    for (let obstacle of level.obstacles) {
        if (x >= obstacle.x && x < obstacle.x + obstacle.width &&
            y >= obstacle.y && y < obstacle.y + obstacle.height) {
            return true;
        }
    }
    
    // Check moving obstacles
    for (let obstacle of level.moving_obstacles) {
        if (x >= obstacle.pos.x && x < obstacle.pos.x + obstacle.pos.width &&
            y >= obstacle.pos.y && y < obstacle.pos.y + obstacle.pos.height) {
            return true;
        }
    }
    
    return false;
}

// Audio functions
function playPointSound() {
    pointSound.play();
}

function playGameOverSound() {
    gameOverSound.play();
}

// Pause functionality
function togglePause() {
    pause_state = !pause_state;
    if (pause_state) {
        document.getElementById('pause-overlay').style.display = 'block';
    } else {
        document.getElementById('pause-overlay').style.display = 'none';
    }
}

// Menu system
function drawMenu() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
    ctx.fillStyle = 'black';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Caterpillar Game', SCREEN_WIDTH/2, SCREEN_HEIGHT/3);
    
    ctx.font = '20px Arial';
    const menuItems = ['Play', 'Level Select', 'Shop', 'Exit'];
    const y = SCREEN_HEIGHT/2;
    
    for (let i = 0; i < menuItems.length; i++) {
        if (i === selected_menu) {
            ctx.font = '24px Arial';
            ctx.fillText('>', SCREEN_WIDTH/2 - 100, y + i * 40);
        }
        ctx.fillText(menuItems[i], SCREEN_WIDTH/2, y + i * 40);
    }
}

function drawLevelSelect() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
    ctx.fillStyle = 'black';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Select Level', SCREEN_WIDTH/2, SCREEN_HEIGHT/3);
    
    ctx.font = '20px Arial';
    const y = SCREEN_HEIGHT/2;
    
    for (let i = 0; i < levels.length; i++) {
        if (i === selected_level) {
            ctx.font = '24px Arial';
            ctx.fillText('>', SCREEN_WIDTH/2 - 100, y + i * 40);
        }
        ctx.fillText(levels[i].name, SCREEN_WIDTH/2, y + i * 40);
    }
}

function drawShop() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
    ctx.fillStyle = 'black';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Shop', SCREEN_WIDTH/2, SCREEN_HEIGHT/3);
    
    ctx.font = '20px Arial';
    const y = SCREEN_HEIGHT/2;
    
    for (let i = 0; i < skins.length; i++) {
        if (i === selected_skin) {
            ctx.font = '24px Arial';
            ctx.fillText('>', SCREEN_WIDTH/2 - 100, y + i * 40);
        }
        ctx.fillText(`${skins[i].name} - ${skins[i].unlock} points`, SCREEN_WIDTH/2, y + i * 40);
        if (unlocked_skins.has(i)) {
            ctx.fillText('Unlocked', SCREEN_WIDTH/2 + 100, y + i * 40);
        }
    }
}

// Initialize game
function startGame() {
    game_state = PLAYING;
    initGame();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initial menu
    drawMenu();
    
    // Keyboard events
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
                if (game_state === MENU) {
                    selected_menu = Math.max(0, selected_menu - 1);
                    drawMenu();
                } else if (game_state === LEVEL_SELECT) {
                    selected_level = Math.max(0, selected_level - 1);
                    drawLevelSelect();
                } else if (game_state === SHOP) {
                    selected_skin = Math.max(0, selected_skin - 1);
                    drawShop();
                }
                break;
                
            case 'ArrowDown':
            case 's':
                if (game_state === MENU) {
                    selected_menu = Math.min(3, selected_menu + 1);
                    drawMenu();
                } else if (game_state === LEVEL_SELECT) {
                    selected_level = Math.min(levels.length - 1, selected_level + 1);
                    drawLevelSelect();
                } else if (game_state === SHOP) {
                    selected_skin = Math.min(skins.length - 1, selected_skin + 1);
                    drawShop();
                }
                break;
                
            case 'Enter':
                if (game_state === MENU) {
                    switch(selected_menu) {
                        case 0: startGame(); break;
                        case 1: 
                            game_state = LEVEL_SELECT;
                            drawLevelSelect();
                            break;
                        case 2: 
                            game_state = SHOP;
                            drawShop();
                            break;
                        case 3: 
                            // Exit game
                            break;
                    }
                } else if (game_state === LEVEL_SELECT) {
                    startGame();
                } else if (game_state === SHOP) {
                    if (score >= skins[selected_skin].unlock && !unlocked_skins.has(selected_skin)) {
                        unlocked_skins.add(selected_skin);
                        score -= skins[selected_skin].unlock;
                        scoreElement.textContent = `Score: ${score}`;
                    }
                    selected_skin = 0;
                    game_state = MENU;
                    drawMenu();
                }
                break;
                
            case 'Escape':
                if (game_state === LEVEL_SELECT || game_state === SHOP) {
                    game_state = MENU;
                    drawMenu();
                }
                break;
                
            default:
                handleKeyPress(e.key);
        }
    });
});
