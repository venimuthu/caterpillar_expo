// Game Constants
const CANVAS_SIZE = 600;
const GRID_SIZE = 20;
const GRID_COUNT = CANVAS_SIZE / GRID_SIZE;
const FPS = 10;

// Sound effects
const sounds = {
    eat: new Audio('sounds/eat.mp3'),
    gameOver: new Audio('sounds/game-over.mp3'),
    levelUp: new Audio('sounds/level-up.mp3'),
    powerUp: new Audio('sounds/power-up.mp3')
};

// Initialize sound volumes
Object.values(sounds).forEach(sound => {
    if (sound) sound.volume = 0.5;
});

// Game State
const gameState = {
    currentScreen: 'menu',
    isPaused: false,
    score: 0,
    highScore: 0,
    coins: 0,
    level: 0,
    direction: 'right',
    nextDirection: 'right',
    gameLoop: null,
    lastUpdate: 0,
    gameSpeed: 150, // ms per update
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
};

// DOM Elements
const elements = {
    canvas: null,
    ctx: null,
    screens: {
        menu: null,
        game: null,
        levelSelect: null,
        shop: null,
        instructions: null,
        gameOver: null,
        pause: null
    },
    menuOptions: [],
    levelOptions: null,
    skinOptions: null,
    scoreDisplay: null,
    highScoreDisplay: null,
    levelDisplay: null
};

// Game Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const levelElement = document.getElementById('level');

// Game Objects
let caterpillar = [];
let food = { x: 0, y: 0 };
let specialFood = null;
let obstacles = [];
let movingObstacles = [];
let powerUps = [];
let animations = [];

// Game Settings
const settings = {
    sound: true,
    vibration: true,
    controls: 'arrows' // 'arrows' or 'swipe'
};

// Game Levels
const levels = [
    {
        name: 'Meadow',
        speed: 2,
        backgroundColor: '#87CEEB',
        foodCount: 1,
        obstacles: [],
        movingObstacles: []
    },
    {
        name: 'Forest',
        speed: 3,
        backgroundColor: '#90EE90',
        foodCount: 2,
        obstacles: [
            { x: 5, y: 10, width: 10, height: 2 },
            { x: 15, y: 5, width: 2, height: 10 }
        ],
        movingObstacles: [
            { x: 100, y: 100, width: 40, height: 20, speed: 2, direction: 1, axis: 'x', range: [100, 400] }
        ]
    },
    {
        name: 'Desert',
        speed: 4,
        backgroundColor: '#F4A460',
        foodCount: 3,
        obstacles: [
            { x: 5, y: 5, width: 10, height: 2 },
            { x: 20, y: 10, width: 2, height: 10 },
            { x: 5, y: 20, width: 10, height: 2 }
        ],
        movingObstacles: [
            { x: 200, y: 50, width: 30, height: 30, speed: 3, direction: 1, axis: 'y', range: [50, 400] },
            { x: 400, y: 200, width: 20, height: 60, speed: 2, direction: -1, axis: 'y', range: [100, 400] }
        ]
    },
    {
        name: 'Night',
        speed: 5,
        backgroundColor: '#191970',
        foodCount: 4,
        obstacles: [
            { x: 0, y: 10, width: 15, height: 2 },
            { x: 20, y: 5, width: 2, height: 10 },
            { x: 5, y: 25, width: 10, height: 2 },
            { x: 25, y: 20, width: 2, height: 10 }
        ],
        movingObstacles: [
            { x: 100, y: 100, width: 40, height: 20, speed: 2, direction: 1, axis: 'x', range: [100, 400] },
            { x: 200, y: 200, width: 30, height: 30, speed: 3, direction: 1, axis: 'y', range: [100, 400] },
            { x: 400, y: 300, width: 20, height: 60, speed: 4, direction: -1, axis: 'y', range: [100, 400] }
        ]
    }
];

// Skins
const skins = [
    { id: 0, name: 'Classic', color: '#4CAF50', price: 0, unlocked: true },
    { id: 1, name: 'Red', color: '#F44336', price: 50, unlocked: false },
    { id: 2, name: 'Blue', color: '#2196F3', price: 100, unlocked: false },
    { id: 3, name: 'Purple', color: '#9C27B0', price: 200, unlocked: false },
    { id: 4, name: 'Gold', color: '#FFD700', price: 500, unlocked: false }
];
let currentSkin = 0;

// Initialize the game
function init() {
    console.log('Initializing game...');
    
    // Get DOM elements
    elements.canvas = document.getElementById('gameCanvas');
    elements.ctx = elements.canvas.getContext('2d');
    
    // Get screen elements
    elements.screens.menu = document.getElementById('menu');
    elements.screens.levelSelect = document.getElementById('level-select');
    elements.screens.shop = document.getElementById('shop');
    elements.screens.instructions = document.getElementById('instructions');
    elements.screens.gameOver = document.getElementById('game-over');
    elements.screens.pause = document.getElementById('pause');
    
    // Get other UI elements
    elements.scoreDisplay = document.getElementById('score');
    elements.highScoreDisplay = document.getElementById('high-score');
    elements.levelDisplay = document.getElementById('level');
    elements.levelOptions = document.getElementById('level-options');
    elements.skinOptions = document.getElementById('skin-options');
    
    // Load saved game data
    loadGameData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize game screens
    setupMenu();
    setupLevelSelection();
    setupShop();
    
    // Hide all screens except menu
    showScreen('menu');
    
    console.log('Game initialized!');
}

// Set up menu event listeners
function setupMenu() {
    console.log('Setting up menu...');
    
    // Get all menu options
    const menuOptions = document.querySelectorAll('.menu-option');
    
    // Add click event to each menu option
    menuOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-option');
            console.log('Menu option clicked:', action);
            handleMenuAction(action);
        });
    });
    
    // Add click event to back buttons
    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', () => {
            console.log('Back button clicked');
            showScreen('menu');
        });
    });
    
    // Play again button
    const playAgainBtn = document.getElementById('play-again');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            console.log('Play again clicked');
            startGame(gameState.level);
        });
    }
    
    // Resume button
    const resumeBtn = document.getElementById('resume');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
            console.log('Resume clicked');
            gameState.isPaused = false;
            showScreen('game');
            gameLoop();
        });
    }
    
    // Main menu button
    const mainMenuBtn = document.getElementById('main-menu');
    if (mainMenuBtn) {
        mainMenuBtn.addEventListener('click', () => {
            console.log('Main menu clicked');
            gameState.isPaused = false;
            showScreen('menu');
            if (gameState.gameLoop) {
                clearInterval(gameState.gameLoop);
                gameState.gameLoop = null;
            }
        });
    }
}

// Set up level selection
function setupLevelSelection() {
    if (!elements.levelOptions) return;
    
    elements.levelOptions.innerHTML = ''; // Clear existing options
    
    levels.forEach((level, index) => {
        const levelButton = document.createElement('div');
        levelButton.className = 'level-option';
        levelButton.textContent = `Level ${index + 1}: ${level.name}`;
        levelButton.addEventListener('click', () => {
            console.log('Level selected:', index);
            startGame(index);
        });
        
        // Check if level is locked
        const isLocked = index > 0 && gameState.highScore < (index * 100);
        if (isLocked) {
            levelButton.textContent += ' (Locked)';
            levelButton.style.opacity = '0.6';
            levelButton.style.pointerEvents = 'none';
        }
        
        elements.levelOptions.appendChild(levelButton);
    });
}

// Set up shop
function setupShop() {
    if (!elements.skinOptions) return;
    
    elements.skinOptions.innerHTML = ''; // Clear existing options
    
    skins.forEach((skin, index) => {
        const skinButton = document.createElement('div');
        skinButton.className = 'skin-option';
        skinButton.innerHTML = `
            <div class="skin-name">${skin.name}</div>
            <div class="skin-preview" style="background-color: ${skin.color}"></div>
            <div class="skin-price">${skin.price} points</div>
        `;
        
        if (skin.unlocked) {
            skinButton.classList.add('unlocked');
            skinButton.addEventListener('click', () => {
                console.log('Skin selected:', skin.name);
                currentSkin = index;
                // Update selected skin style
                document.querySelectorAll('.skin-option').forEach(btn => btn.classList.remove('selected'));
                skinButton.classList.add('selected');
            });
            
            if (index === currentSkin) {
                skinButton.classList.add('selected');
            }
        } else {
            skinButton.classList.add('locked');
            skinButton.innerHTML += '<div class="skin-locked">Locked</div>';
        }
        
        elements.skinOptions.appendChild(skinButton);
    });
}

// Show a specific screen
function showScreen(screenName) {
    console.log('Showing screen:', screenName);
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show the requested screen
    const screen = document.getElementById(screenName);
    if (screen) {
        screen.classList.add('active');
    }
    
    // Update game state
    gameState.currentScreen = screenName;
    
    // Special handling for game screen
    if (screenName === 'game') {
        canvas.classList.remove('hidden');
        if (!gameState.isPaused) {
            gameLoop();
        }
    } else {
        canvas.classList.add('hidden');
    }
}

// Handle menu actions
function handleMenuAction(action) {
    console.log('Handling menu action:', action);
    
    switch (action) {
        case 'play':
            startGame(0); // Start with first level
            break;
        case 'levels':
            showScreen('level-select');
            break;
        case 'shop':
            showScreen('shop');
            break;
        case 'instructions':
            showScreen('instructions');
            break;
        case 'resume':
            gameState.isPaused = false;
            showScreen('game');
            break;
        case 'main-menu':
            if (gameState.gameLoop) {
                clearInterval(gameState.gameLoop);
                gameState.gameLoop = null;
            }
            showScreen('menu');
            break;
        default:
            console.warn('Unknown menu action:', action);
    }
}

// Start the game
function startGame(levelIndex) {
    console.log('Starting game, level:', levelIndex);
    
    // Reset game state
    gameState.score = 0;
    gameState.level = levelIndex;
    gameState.direction = 'right';
    gameState.nextDirection = 'right';
    gameState.isPaused = false;
    
    // Update UI
    updateUI();
    
    // Initialize game objects
    initGameObjects();
    
    // Show game screen
    showScreen('game');
    
    // Start game loop if not already running
    if (!gameState.gameLoop) {
        gameState.lastUpdate = Date.now();
        gameLoop();
    }
}

// Game loop
function gameLoop() {
    if (gameState.gameLoop) {
        clearInterval(gameState.gameLoop);
    }
    
    gameState.gameLoop = setInterval(() => {
        if (gameState.isPaused) return;
        
        const now = Date.now();
        const deltaTime = now - gameState.lastUpdate;
        
        if (deltaTime >= gameState.gameSpeed) {
            update();
            draw();
            gameState.lastUpdate = now - (deltaTime % gameState.gameSpeed);
        }
    }, 1000 / 60); // 60 FPS
}

// Initialize game objects
function initGameObjects() {
    // Clear existing game objects
    caterpillar = [];
    obstacles = [];
    movingObstacles = [];
    powerUps = [];
    
    // Initialize caterpillar
    const startX = Math.floor(GRID_COUNT / 4);
    const startY = Math.floor(GRID_COUNT / 2);
    
    for (let i = 0; i < 5; i++) {
        caterpillar.push({ x: startX - i, y: startY });
    }
    
    // Set up level
    setupLevel(gameState.level);
    
    // Place initial food
    placeFood();
}

// Load saved game data
function loadGameData() {
    const savedData = localStorage.getItem('caterpillarGameData');
    if (savedData) {
        const data = JSON.parse(savedData);
        gameState.highScore = data.highScore || 0;
        currentSkin = data.currentSkin || 0;
        
        // Unlock skins based on high score
        skins.forEach(skin => {
            if (gameState.highScore >= skin.price) {
                skin.unlocked = true;
            }
        });
    }
    
    // Update high score display
    highScoreElement.textContent = gameState.highScore;
}

// Save game data
function saveGameData() {
    const data = {
        highScore: gameState.highScore,
        currentSkin: currentSkin
    };
    localStorage.setItem('caterpillarGameData', JSON.stringify(data));
}

// Set up event listeners
function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', handleKeyDown);
    
    // Touch controls for mobile
    if (gameState.isMobile) {
        setupTouchControls();
    }
    
    // Pause button for mobile
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', togglePause);
    }
}

// Set up touch controls for mobile
function setupTouchControls() {
    const upBtn = document.getElementById('up');
    const downBtn = document.getElementById('down');
    const leftBtn = document.getElementById('left');
    const rightBtn = document.getElementById('right');
    
    // Directional buttons
    if (upBtn) upBtn.addEventListener('touchstart', () => handleSwipe('up'));
    if (downBtn) downBtn.addEventListener('touchstart', () => handleSwipe('down'));
    if (leftBtn) leftBtn.addEventListener('touchstart', () => handleSwipe('left'));
    if (rightBtn) rightBtn.addEventListener('touchstart', () => handleSwipe('right'));
    
    // Touch screen swipes
    let touchStartX = 0;
    let touchStartY = 0;
    
    elements.canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    elements.canvas.addEventListener('touchmove', (e) => {
        if (!touchStartX || !touchStartY) return;
        
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        
        // Determine the primary direction of the swipe
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe
            handleSwipe(diffX > 0 ? 'left' : 'right');
        } else {
            // Vertical swipe
            handleSwipe(diffY > 0 ? 'up' : 'down');
        }
        
        // Reset touch start coordinates
        touchStartX = 0;
        touchStartY = 0;
    }, { passive: true });
}

// Handle swipe/touch direction
function handleSwipe(direction) {
    if (gameState.currentScreen !== 'game' || gameState.isPaused) return;
    
    // Prevent 180-degree turns
    if ((direction === 'up' && gameState.direction !== 'down') ||
        (direction === 'down' && gameState.direction !== 'up') ||
        (direction === 'left' && gameState.direction !== 'right') ||
        (direction === 'right' && gameState.direction !== 'left')) {
        gameState.nextDirection = direction;
    }
}

// Play sound effect
function playSound(soundName) {
    if (!settings.sound || !sounds[soundName]) return;
    
    // Clone the audio element to allow overlapping sounds
    const sound = sounds[soundName].cloneNode();
    sound.volume = 0.5;
    sound.play().catch(e => console.warn('Audio play failed:', e));
}

// Show achievement notification
function showAchievement(title, description) {
    const achievement = document.getElementById('achievement');
    const content = document.querySelector('.achievement-content');
    
    if (!achievement || !content) return;
    
    content.innerHTML = `
        <h3>${title}</h3>
        <p>${description}</p>
    `;
    
    achievement.classList.remove('hidden');
    achievement.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        achievement.classList.remove('show');
        setTimeout(() => achievement.classList.add('hidden'), 300);
    }, 3000);
}

// Update the game loop
function update() {
    if (gameState.currentScreen !== 'game' || gameState.isPaused) return;
    
    // Update direction
    gameState.direction = gameState.nextDirection;
    
    // Get the head position
    const head = { ...caterpillar[0] };
    
    // Move the head based on direction
    switch (gameState.direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    
    // Check for collisions
    if (checkCollision(head)) {
        playSound('gameOver');
        gameOver();
        return;
    }
    
    // Add new head
    caterpillar.unshift(head);
    
    // Check if food is eaten
    if (head.x === food.x && head.y === food.y) {
        // Increase score and coins
        gameState.score += 10;
        gameState.coins += 5;
        
        // Update high score if needed
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            saveGameData();
        }
        
        // Play sound and show effect
        playSound('eat');
        showEatEffect(head.x, head.y);
        
        // Place new food
        placeFood();
        
        // Random chance for power-up
        if (Math.random() < 0.1) {
            spawnPowerUp();
        }
        
        // Update UI
        updateUI();
    } else {
        // Remove tail if no food was eaten
        caterpillar.pop();
    }
    
    // Check power-up collection
    checkPowerUpCollision(head);
    
    // Update moving obstacles
    updateMovingObstacles();
    
    // Check for level completion
    if (gameState.score >= (gameState.level + 1) * 100 && gameState.level < levels.length - 1) {
        nextLevel();
    }
}

// Show eat effect animation
function showEatEffect(x, y) {
    const effect = {
        x: x * GRID_SIZE + GRID_SIZE/2,
        y: y * GRID_SIZE + GRID_SIZE/2,
        size: 5,
        alpha: 1,
        update: function() {
            this.size += 2;
            this.alpha -= 0.05;
            return this.alpha > 0;
        },
        draw: function(ctx) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
    };
    
    animations.push(effect);
}

// Spawn a power-up at random position
function spawnPowerUp() {
    let x, y, validSpot;
    
    do {
        x = Math.floor(Math.random() * GRID_COUNT);
        y = Math.floor(Math.random() * GRID_COUNT);
        
        // Check if position is valid
        validSpot = !caterpillar.some(segment => segment.x === x && segment.y === y) &&
                   !obstacles.some(obs => 
                       x >= obs.x && x < obs.x + obs.width &&
                       y >= obs.y && y < obs.y + obs.height
                   ) &&
                   (x !== food.x || y !== food.y);
        
    } while (!validSpot);
    
    powerUps.push({
        x,
        y,
        type: Math.random() < 0.5 ? 'extraLife' : 'slowMotion',
        createdAt: Date.now(),
        duration: 10000 // 10 seconds
    });
}

// Check for power-up collection
function checkPowerUpCollision(head) {
    const now = Date.now();
    
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        
        // Remove expired power-ups
        if (now - powerUp.createdAt > powerUp.duration) {
            powerUps.splice(i, 1);
            continue;
        }
        
        // Check collision with caterpillar head
        if (head.x === powerUp.x && head.y === powerUp.y) {
            applyPowerUp(powerUp.type);
            powerUps.splice(i, 1);
            playSound('powerUp');
        }
    }
}

// Apply power-up effect
function applyPowerUp(type) {
    switch (type) {
        case 'extraLife':
            // Add an extra life or points
            gameState.score += 50;
            showAchievement('Extra Life!', 'You got 50 bonus points!');
            break;
            
        case 'slowMotion':
            // Slow down the game temporarily
            const originalSpeed = gameState.gameSpeed;
            gameState.gameSpeed = originalSpeed * 1.5; // Slow down
            
            setTimeout(() => {
                gameState.gameSpeed = originalSpeed;
            }, 5000); // 5 seconds of slow motion
            
            showAchievement('Slow Motion!', 'Everything slows down for 5 seconds!');
            break;
    }
    
    updateUI();
}

// Update the draw function
function draw() {
    if (!elements.ctx) return;
    
    const ctx = elements.ctx;
    const levelData = levels[gameState.level] || {};
    
    // Clear the canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw background
    ctx.fillStyle = levelData.backgroundColor || '#87CEEB';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw grid (optional)
    drawGrid();
    
    // Draw game elements
    drawObstacles();
    drawMovingObstacles();
    drawFood();
    drawPowerUps();
    drawCaterpillar();
    
    // Draw animations
    updateAndDrawAnimations();
    
    // Draw UI elements
    drawUI();
}

// Draw power-ups
function drawPowerUps() {
    const ctx = elements.ctx;
    const now = Date.now();
    
    powerUps.forEach(powerUp => {
        const timeLeft = powerUp.duration - (now - powerUp.createdAt);
        const pulse = Math.sin(now / 200) * 0.2 + 0.8; // Pulsing effect
        
        ctx.save();
        
        // Draw glow
        const gradient = ctx.createRadialGradient(
            powerUp.x * GRID_SIZE + GRID_SIZE/2,
            powerUp.y * GRID_SIZE + GRID_SIZE/2,
            0,
            powerUp.x * GRID_SIZE + GRID_SIZE/2,
            powerUp.y * GRID_SIZE + GRID_SIZE/2,
            GRID_SIZE * 1.5
        );
        
        gradient.addColorStop(0, powerUp.type === 'extraLife' ? 'rgba(255, 50, 50, 0.8)' : 'rgba(50, 150, 255, 0.8)');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.6 * pulse;
        ctx.fillRect(
            powerUp.x * GRID_SIZE - GRID_SIZE,
            powerUp.y * GRID_SIZE - GRID_SIZE,
            GRID_SIZE * 3,
            GRID_SIZE * 3
        );
        
        // Draw power-up
        ctx.globalAlpha = 1;
        ctx.fillStyle = powerUp.type === 'extraLife' ? '#FF3333' : '#3399FF';
        ctx.beginPath();
        ctx.arc(
            powerUp.x * GRID_SIZE + GRID_SIZE/2,
            powerUp.y * GRID_SIZE + GRID_SIZE/2,
            GRID_SIZE * 0.6 * pulse,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw icon
        ctx.fillStyle = 'white';
        ctx.font = `bold ${GRID_SIZE * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            powerUp.type === 'extraLife' ? '♥' : '⏱️',
            powerUp.x * GRID_SIZE + GRID_SIZE/2,
            powerUp.y * GRID_SIZE + GRID_SIZE/2 + 2
        );
        
        // Draw timer
        const radius = GRID_SIZE * 0.7;
        const endAngle = (timeLeft / 10000) * Math.PI * 2;
        
        ctx.beginPath();
        ctx.arc(
            powerUp.x * GRID_SIZE + GRID_SIZE/2,
            powerUp.y * GRID_SIZE + GRID_SIZE/2,
            radius + 2,
            0,
            Math.PI * 2
        );
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(
            powerUp.x * GRID_SIZE + GRID_SIZE/2,
            powerUp.y * GRID_SIZE + GRID_SIZE/2,
            radius,
            -Math.PI/2,
            -Math.PI/2 + endAngle
        );
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    });
}

// Update and draw animations
function updateAndDrawAnimations() {
    const ctx = elements.ctx;
    
    for (let i = animations.length - 1; i >= 0; i--) {
        const animation = animations[i];
        
        if (animation.update()) {
            animation.draw(ctx);
        } else {
            animations.splice(i, 1);
        }
    }
}

// Update UI elements
function updateUI() {
    // Update score display
    if (elements.scoreDisplay) elements.scoreDisplay.textContent = gameState.score;
    if (elements.highScoreDisplay) elements.highScoreDisplay.textContent = gameState.highScore;
    if (elements.levelDisplay) elements.levelDisplay.textContent = gameState.level + 1;
    
    // Update final score displays
    const finalScore = document.getElementById('final-score');
    const finalHighScore = document.getElementById('final-high-score');
    const coinsDisplay = document.getElementById('coins');
    
    if (finalScore) finalScore.textContent = gameState.score;
    if (finalHighScore) finalHighScore.textContent = Math.max(gameState.score, gameState.highScore);
    if (coinsDisplay) coinsDisplay.textContent = gameState.coins;
    
    // Save game data
    saveGameData();
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    
    // Focus the canvas for keyboard controls
    const canvas = document.getElementById('gameCanvas');
    if (canvas) canvas.focus();
    
    init();
});

// Prevent context menu on long press (for mobile)
window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
});

// Handle keyboard input
function handleKeyDown(e) {
    if (gameState.currentScreen === 'game') {
        switch(e.key) {
            case 'ArrowUp':
                if (gameState.direction !== 'down') gameState.nextDirection = 'up';
                break;
            case 'ArrowDown':
                if (gameState.direction !== 'up') gameState.nextDirection = 'down';
                break;
            case 'ArrowLeft':
                if (gameState.direction !== 'right') gameState.nextDirection = 'left';
                break;
            case 'ArrowRight':
                if (gameState.direction !== 'left') gameState.nextDirection = 'right';
                break;
            case ' ':
            case 'p':
                togglePause();
                break;
        }
    } else if (gameState.currentScreen === 'menu' || gameState.currentScreen === 'level-select' || gameState.currentScreen === 'shop' || gameState.currentScreen === 'instructions') {
        if (e.key === 'Escape') {
            showScreen('menu');
        }
    } else if (gameState.currentScreen === 'game-over' || gameState.currentScreen === 'pause') {
        if (e.key === 'Enter') {
            startGame(gameState.level);
        } else if (e.key === 'Escape') {
            showScreen('menu');
        }
    }
}

// Toggle pause
function togglePause() {
    if (gameState.isPaused) {
        gameState.isPaused = false;
        showScreen('game');
        gameLoop();
    } else {
        gameState.isPaused = true;
        showScreen('pause');
    }
}

// Set up the current level
function setupLevel(levelIndex) {
    const levelData = levels[levelIndex];
    if (!levelData) return;
    
    // Set game speed
    gameState.gameSpeed = Math.max(50, 200 - (levelIndex * 20));
    
    // Set up obstacles
    obstacles = [...(levelData.obstacles || [])];
    
    // Set up moving obstacles
    movingObstacles = [...(levelData.movingObstacles || [])];
    
    // Update level display
    const levelDisplay = document.getElementById('level');
    if (levelDisplay) {
        levelDisplay.textContent = levelIndex + 1;
    }
}

// Update UI elements
function updateUI() {
    scoreElement.textContent = gameState.score;
    highScoreElement.textContent = gameState.highScore;
    levelElement.textContent = gameState.level + 1;
    
    // Update final score display
    const finalScore = document.getElementById('final-score');
    const finalHighScore = document.getElementById('final-high-score');
    
    if (finalScore) finalScore.textContent = gameState.score;
    if (finalHighScore) {
        finalHighScore.textContent = Math.max(gameState.score, gameState.highScore);
    }
}

// Place food at random position
function placeFood() {
    let x, y, validSpot;
    
    do {
        x = Math.floor(Math.random() * GRID_COUNT);
        y = Math.floor(Math.random() * GRID_COUNT);
        
        // Check if position is on caterpillar
        validSpot = !caterpillar.some(segment => segment.x === x && segment.y === y);
        
        // Check if position is on obstacles
        validSpot = validSpot && !obstacles.some(obs => 
            x >= obs.x && x < obs.x + obs.width &&
            y >= obs.y && y < obs.y + obs.height
        );
        
    } while (!validSpot);
    
    food = { x, y };
}

// Update the game loop
function update() {
    if (gameState.currentScreen !== 'game' || gameState.isPaused) return;
    
    // Update direction
    gameState.direction = gameState.nextDirection;
    
    // Get the head position
    const head = { ...caterpillar[0] };
    
    // Move the head based on direction
    switch (gameState.direction) {
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
        case 'left':
            head.x--;
            break;
        case 'right':
            head.x++;
            break;
    }
    
    // Check for collisions
    if (checkCollision(head)) {
        gameOver();
        return;
    }
    
    // Add new head
    caterpillar.unshift(head);
    
    // Check if food is eaten
    if (head.x === food.x && head.y === food.y) {
        // Increase score
        gameState.score += 10;
        
        // Update high score if needed
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            saveGameData();
        }
        
        // Place new food
        placeFood();
        
        // Update UI
        updateUI();
    } else {
        // Remove tail if no food was eaten
        caterpillar.pop();
    }
    
    // Update moving obstacles
    updateMovingObstacles();
    
    // Check for level completion
    if (gameState.score >= (gameState.level + 1) * 100 && gameState.level < levels.length - 1) {
        nextLevel();
    }
}

// Check for collisions
function checkCollision(head) {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_COUNT || head.y < 0 || head.y >= GRID_COUNT) {
        return true;
    }
    
    // Self collision
    for (let i = 0; i < caterpillar.length; i++) {
        if (head.x === caterpillar[i].x && head.y === caterpillar[i].y) {
            return true;
        }
    }
    
    // Obstacle collision
    for (const obs of obstacles) {
        if (head.x >= obs.x && head.x < obs.x + obs.width &&
            head.y >= obs.y && head.y < obs.y + obs.height) {
            return true;
        }
    }
    
    // Moving obstacle collision
    for (const mobs of movingObstacles) {
        if (head.x * GRID_SIZE < mobs.x + mobs.width &&
            head.x * GRID_SIZE + GRID_SIZE > mobs.x &&
            head.y * GRID_SIZE < mobs.y + mobs.height &&
            head.y * GRID_SIZE + GRID_SIZE > mobs.y) {
            return true;
        }
    }
    
    return false;
}

// Update moving obstacles
function updateMovingObstacles() {
    movingObstacles.forEach(obs => {
        if (obs.axis === 'x') {
            obs.x += obs.speed * obs.direction;
            if (obs.x <= obs.range[0] || obs.x + obs.width >= obs.range[1]) {
                obs.direction *= -1;
            }
        } else {
            obs.y += obs.speed * obs.direction;
            if (obs.y <= obs.range[0] || obs.y + obs.height >= obs.range[1]) {
                obs.direction *= -1;
            }
        }
    });
}

// Draw moving obstacles
function drawMovingObstacles() {
    movingObstacles.forEach(obs => {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });
}

// Game over
function gameOver() {
    clearInterval(gameState.gameLoop);
    gameState.gameLoop = null;
    showScreen('game-over');
}

// Next level
function nextLevel() {
    gameState.level++;
    setupLevel(gameState.level);
    initGameObjects();
    updateUI();
}

// Update draw function to include moving obstacles and apply skin
function draw() {
    // Clear the canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw background
    ctx.fillStyle = levels[gameState.level].backgroundColor || '#87CEEB';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw grid (optional)
    drawGrid();
    
    // Draw obstacles
    drawObstacles();
    
    // Draw moving obstacles
    drawMovingObstacles();
    
    // Draw food
    drawFood();
    
    // Draw the caterpillar with current skin
    drawCaterpillar();
    
    // Draw UI elements
    drawUI();
}

// Draw grid (helper function)
function drawGrid() {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 0.5;
    
    // Vertical lines
    for (let i = 0; i <= CANVAS_SIZE; i += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_SIZE);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 0; i <= CANVAS_SIZE; i += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_SIZE, i);
        ctx.stroke();
    }
}

// Draw UI elements
function drawUI() {
    // Draw score, level, etc.
    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 10, 20);
    ctx.fillText(`High Score: ${gameState.highScore}`, 10, 40);
    ctx.fillText(`Level: ${gameState.level + 1}`, 10, 60);
}

// Update drawCaterpillar to use current skin
function drawCaterpillar() {
    const skinColor = skins[currentSkin]?.color || '#4CAF50';
    
    // Draw head with different color/shape
    const head = caterpillar[0];
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    const headX = head.x * GRID_SIZE + GRID_SIZE/2;
    const headY = head.y * GRID_SIZE + GRID_SIZE/2;
    ctx.arc(headX, headY, GRID_SIZE/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw eyes
    ctx.fillStyle = 'white';
    const eyeSize = GRID_SIZE * 0.2;
    const eyeOffset = GRID_SIZE * 0.25;
    ctx.beginPath();
    ctx.arc(
        headX - eyeOffset, 
        headY - eyeOffset, 
        eyeSize, 0, Math.PI * 2
    );
    ctx.arc(
        headX + eyeOffset, 
        headY - eyeOffset, 
        eyeSize, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Draw body segments
    for (let i = 1; i < caterpillar.length; i++) {
        const segment = caterpillar[i];
        ctx.fillStyle = skinColor;
        
        // Make segments slightly smaller for a better look
        const segmentSize = GRID_SIZE * 0.9;
        const offset = (GRID_SIZE - segmentSize) / 2;
        
        ctx.fillRect(
            segment.x * GRID_SIZE + offset,
            segment.y * GRID_SIZE + offset,
            segmentSize,
            segmentSize
        );
        
        // Add some details to segments
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(
            segment.x * GRID_SIZE + offset + 2,
            segment.y * GRID_SIZE + offset + 2,
            segmentSize - 4,
            2
        );
    }
}

// Draw the caterpillar
function drawCaterpillar() {
    caterpillar.forEach(segment => {
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    });
}

// Draw food
function drawFood() {
    ctx.fillStyle = '#FF9800';
    ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
}

// Draw obstacles
function drawObstacles() {
    obstacles.forEach(obs => {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(obs.x * GRID_SIZE, obs.y * GRID_SIZE, obs.width * GRID_SIZE, obs.height * GRID_SIZE);
    });
}
