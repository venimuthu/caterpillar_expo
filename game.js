// Game Constants
const CANVAS_SIZE = 600;
const GRID_SIZE = 20;
const GRID_COUNT = CANVAS_SIZE / GRID_SIZE;
const FPS = 10;

// Game State
let gameState = 'MENU'; // MENU, PLAYING, PAUSED, GAME_OVER, LEVEL_SELECT, SHOP, INSTRUCTIONS
let score = 0;
let highScore = localStorage.getItem('caterpillarHighScore') || 0;
let level = 0;
let gameSpeed = 150; // ms per frame
let gameLoop;

// Game Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const levelElement = document.getElementById('level');

// Game Objects
let caterpillar = [];
let direction = 'right';
let nextDirection = 'right';
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
    // Load saved data
    loadGameData();
    
    // Initialize UI
    updateUI();
    
    // Set up event listeners
    setupEventListeners();
    
    // Start the game loop
    gameLoop = setInterval(update, 1000 / FPS);
}

// Load saved game data
function loadGameData() {
    const savedData = localStorage.getItem('caterpillarGameData');
    if (savedData) {
        const data = JSON.parse(savedData);
        highScore = data.highScore || 0;
        currentSkin = data.currentSkin || 0;
        
        // Unlock skins based on high score
        skins.forEach(skin => {
            if (highScore >= skin.price) {
                skin.unlocked = true;
            }
        });
    }
    
    // Update high score display
    highScoreElement.textContent = highScore;
}

// Save game data
function saveGameData() {
    const data = {
        highScore: highScore,
        currentSkin: currentSkin
    };
    localStorage.setItem('caterpillarGameData', JSON.stringify(data));
}

// Set up event listeners
function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', handleKeyDown);
    
    // Menu navigation
    document.querySelectorAll('.menu-option').forEach(option => {
        option.addEventListener('click', handleMenuClick);
    });
    
    // Back buttons
    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', () => showScreen('menu'));
    });
    
    // Play again button
    document.getElementById('play-again').addEventListener('click', startGame);
    
    // Resume button
    document.getElementById('resume').addEventListener('click', () => {
        gameState = 'PLAYING';
        showScreen('game');
    });
    
    // Touch controls for mobile
    setupTouchControls();
}

// Handle keyboard input
function handleKeyDown(e) {
    if (gameState === 'PLAYING') {
        switch(e.key) {
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
            case ' ':
            case 'p':
                togglePause();
                break;
        }
    } else if (gameState === 'MENU' || gameState === 'LEVEL_SELECT' || gameState === 'SHOP' || gameState === 'INSTRUCTIONS') {
        if (e.key === 'Escape') {
            showScreen('menu');
        }
    } else if (gameState === 'GAME_OVER' || gameState === 'PAUSED') {
        if (e.key === 'Enter') {
            startGame();
        } else if (e.key === 'Escape') {
            showScreen('menu');
        }
    }
}
