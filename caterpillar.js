// Game constants
const SCREEN_WIDTH = 600;
const SCREEN_HEIGHT = 600;
const SEGMENT_SIZE = 20;
const GRID_SIZE = SCREEN_WIDTH / SEGMENT_SIZE;

// Game state
let game_state = 'PLAYING';
let score = 0;
let high_score = 0;
let caterpillar = [];
let leaf = null;
let direction = 'right';
let nextDirection = 'right';

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');

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
    if (game_state === 'PLAYING') {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
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
        scoreElement.textContent = `Score: ${score}`;
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
    
    return false;
}

// Game over
function gameOver() {
    game_state = 'GAME_OVER';
    gameOverElement.style.display = 'block';
    finalScoreElement.textContent = score;
    
    if (score > high_score) {
        high_score = score;
    }
}

// Restart game
function restartGame() {
    game_state = 'PLAYING';
    initGame();
}

// Handle key presses
function handleKeyPress(key) {
    if (game_state !== 'PLAYING') return;
    
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
document.addEventListener('DOMContentLoaded', initGame);
