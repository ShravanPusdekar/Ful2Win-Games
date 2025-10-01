const basket = document.getElementById('basket');
const gameArea = document.getElementById('gameArea');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const startPopup = document.getElementById('startPopup');
const resultPopup = document.getElementById('resultPopup');
const finalScore = document.getElementById('finalScore');
const eggSound = document.getElementById('eggSound');
const bombSound = document.getElementById('bombSound');
const basketSlider = document.getElementById('basketSlider');
const loadingScreen = document.getElementById('loadingScreen');
const loadingProgress = document.getElementById('loadingProgress');
const loadingText = document.getElementById('loadingText');

let score = 0;
let timeLeft = 60;
let gameRunning = false;
let items = [];
let eggCount = 0;
let lastTime = 0;
let assetsLoaded = false;

// Asset preloading configuration
const ASSETS = {
    images: [
        'background.jpg',
        'basket.png',
        'basket-full.png',
        'eggs.png',
        'bomb.png'
    ],
    audio: [
        'egg.mp3',
        'bomb.mp3'
    ]
};

// Preload all assets before game initialization
preloadAssets();

// Initialize basket position to the left edge
basket.style.position = 'absolute';
basket.style.left = '0px';

// Function to update basket position based on slider
function updateBasketPositionFromSlider() {
    const sliderWidth = basketSlider.offsetWidth;
    const basketWidth = basket.offsetWidth;
    const gameAreaWidth = gameArea.clientWidth;

    // The slider's thumb position is based on the range's value
    const thumbPosition = (parseInt(basketSlider.value) / 100) * sliderWidth;

    // The horizontal offset of the slider from the left edge of the game area
    const sliderOffset = (gameAreaWidth - sliderWidth) / 2;

    // Calculate the basket's new position
    // Center the basket by subtracting half its width from the thumb's position
    let newLeft = (sliderOffset + thumbPosition) - (basketWidth / 2);

    // Clamp the position to keep the basket within the game area
    newLeft = Math.max(0, Math.min(newLeft, gameAreaWidth - basketWidth));

    basket.style.left = `${newLeft}px`;
}

// Function to update slider based on basket position
function updateSliderFromBasket() {
    const basketWidth = basket.offsetWidth;
    const sliderWidth = basketSlider.offsetWidth;
    const gameAreaWidth = gameArea.clientWidth;

    // The offset of the basket's center from the left edge of the game area
    const basketCenter = parseFloat(basket.style.left) + (basketWidth / 2);

    // The offset of the slider's track from the left edge of the game area
    const sliderOffset = (gameAreaWidth - sliderWidth) / 2;

    // Calculate the thumb's new position relative to the slider's track
    const newThumbPosition = basketCenter - sliderOffset;

    // Convert the thumb's position to a percentage value for the slider
    const percent = (newThumbPosition / sliderWidth) * 100;

    // Prevent unnecessary updates
    if (Math.abs(basketSlider.value - percent) > 0.1) {
        basketSlider.value = percent;
    }
}

// Asset preloading function
function preloadAssets() {
    loadingScreen.style.display = 'flex';
    
    const totalAssets = ASSETS.images.length + ASSETS.audio.length;
    let loadedAssets = 0;
    
    const updateProgress = () => {
        loadedAssets++;
        const progress = (loadedAssets / totalAssets) * 100;
        loadingProgress.style.width = `${progress}%`;
        loadingText.textContent = `Loading... ${Math.round(progress)}%`;
        
        if (loadedAssets === totalAssets) {
            assetsLoaded = true;
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                initializeGame();
            }, 500);
        }
    };
    
    // Preload images
    ASSETS.images.forEach(src => {
        const img = new Image();
        img.onload = updateProgress;
        img.onerror = () => {
            console.warn(`Failed to load image: ${src}`);
            updateProgress(); // Continue even if an asset fails
        };
        img.src = src;
    });
    
    // Preload audio
    ASSETS.audio.forEach(src => {
        const audio = new Audio();
        audio.oncanplaythrough = updateProgress;
        audio.onerror = () => {
            console.warn(`Failed to load audio: ${src}`);
            updateProgress(); // Continue even if an asset fails
        };
        audio.src = src;
    });
}

// Initialize game after assets are loaded
function initializeGame() {
    // Initialize basket position
    updateBasketPositionFromSlider();
    
    // Auto-start the game immediately (no welcome screen)
    startPopup.style.display = 'none';
    resultPopup.style.display = 'none';
    gameRunning = true;
    score = 0;
    timeLeft = 60;
    eggCount = 0;
    scoreDisplay.textContent = score;
    timerDisplay.textContent = timeLeft;

    // Remove existing items
    items.forEach(i => i.el.remove());
    items = [];

    startGame();
}

// Handle window resize
window.addEventListener('resize', () => {
    if (assetsLoaded) {
        // After resize, ensure basket stays within bounds
        updateBasketPositionFromSlider();
    }
});

// Slider input moves basket
basketSlider.addEventListener("input", () => {
    updateBasketPositionFromSlider();
});

// Start game button (kept for potential manual restart, but not shown initially)
startBtn.addEventListener('click', () => {
    if (!assetsLoaded) {
        alert('Please wait for assets to load!');
        return;
    }
    
    startPopup.style.display = 'none';
    resultPopup.style.display = 'none';
    gameArea.style.filter = 'none'; // Remove blur if restarting
    gameRunning = true;
    score = 0;
    timeLeft = 60;
    eggCount = 0;
    scoreDisplay.textContent = score;
    timerDisplay.textContent = timeLeft;

    // Reset basket position
    updateBasketPositionFromSlider();

    // Remove existing items
    items.forEach(i => i.el.remove());
    items = [];

    startGame();
});

// Function to spawn eggs or bombs
function spawnItem() {
    const item = document.createElement('div');
    item.classList.add('item');
    const isEgg = Math.random() > 0.3;
    item.classList.add(isEgg ? 'egg' : 'bomb');
    item.dataset.type = isEgg ? 'egg' : 'bomb';

    // Calculate the horizontal spawning range to match the basket's movement
    const itemWidth = item.offsetWidth || 40;
    const sliderWidth = basketSlider.offsetWidth;
    const gameAreaWidth = gameArea.clientWidth;
    const sliderOffset = (gameAreaWidth - sliderWidth) / 2;

    const spawnZoneStart = sliderOffset;
    const spawnZoneEnd = sliderOffset + sliderWidth;
    const spawnRange = spawnZoneEnd - spawnZoneStart;
    
    // Spawn randomly within the defined range
    let spawnLeft = Math.random() * (spawnRange - itemWidth);
    spawnLeft = spawnLeft + spawnZoneStart;

    // Apply the new position
    item.style.left = `${spawnLeft}px`;
    item.style.top = `-20px`; // start above view
    gameArea.appendChild(item);
    items.push({ el: item, top: 0 });
}

// Main game start
function startGame() {
    countdown();
    spawnLoop();
    requestAnimationFrame(updateLoop);
}

// Countdown timer
function countdown() {
    const timer = setInterval(() => {
        if (!gameRunning) return;
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            gameRunning = false;
            showResult();
        }
    }, 1000);
}

// Periodic egg/bomb spawn
function spawnLoop() {
    if (!gameRunning) return;
    spawnItem();
    setTimeout(spawnLoop, 800);
}

function updateLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = (timestamp - lastTime) / 16; // normalize for 60fps
    lastTime = timestamp;

    if (gameRunning) requestAnimationFrame(updateLoop);

    moveWithKeys(delta);
    updateItems(delta);
}

// Arrow key movement
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function moveWithKeys(delta) {
    const step = 12 * delta; 
    const maxLeft = gameArea.clientWidth - basket.offsetWidth;
    let left = parseFloat(basket.style.left) || 0;

    if (keys['ArrowLeft']) {
        left = Math.max(0, left - step);
    }
    if (keys['ArrowRight']) {
        left = Math.min(maxLeft, left + step);
    }
    // Clamp position
    left = Math.max(0, Math.min(left, maxLeft));
    basket.style.left = `${left}px`;

    // sync slider
    updateSliderFromBasket();
}

// Update falling items with precise collision detection
function updateItems(delta) {
    const basketRect = basket.getBoundingClientRect();
    const fallSpeed = 4 * delta;
    const basketWidth = basket.offsetWidth;
    const basketLeft = parseFloat(basket.style.left) || 0;
    
    // Define the basket's catching area (inner rim)
    // Adjust these values to fine-tune the catching zone
    const rimInset = basketWidth * 0.15; // 15% inset from each side
    const catchZoneLeft = basketLeft + rimInset;
    const catchZoneRight = basketLeft + basketWidth - rimInset;

    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.top += fallSpeed;
        item.el.style.top = `${item.top}px`;

        const itemRect = item.el.getBoundingClientRect();
        
        // Calculate the center point of the falling item
        const itemCenterX = itemRect.left + (itemRect.width / 2) - gameArea.getBoundingClientRect().left;
        const itemBottom = itemRect.bottom;
        
        // Check if item has reached the basket's vertical level
        const atBasketLevel = itemBottom >= basketRect.top && itemBottom <= basketRect.bottom;
        
        // Precise collision: center of item must be within the catch zone
        if (atBasketLevel && itemCenterX >= catchZoneLeft && itemCenterX <= catchZoneRight) {
            handleCollision(item);
            items.splice(i, 1);
        } else if (item.top > gameArea.clientHeight) {
            // Remove if falls below
            item.el.remove();
            items.splice(i, 1);
        }
    }
}

function handleCollision(item) {
    item.el.remove();
    const isEgg = item.el.dataset.type === 'egg';
    if (isEgg) {
        score++;
        eggCount++;
        eggSound.play();
    } else {
        score = Math.max(0, score - 1);
        eggCount = Math.max(0, eggCount - 1);
        bombSound.play();
    }
    scoreDisplay.textContent = score;
    // Optional: change basket image
    basket.style.backgroundImage = eggCount >= 3 ? "url('basket-full.png')" : "url('basket.png')";
}

function showResult() {
    // Apply blur effect to the game area
    gameArea.style.filter = 'blur(5px)';
    gameArea.style.transition = 'filter 0.3s ease';
    
    // Send the final score to parent window
    setTimeout(() => {
        window.parent.postMessage({ type: "GAME_OVER", score: score }, "*");
    }, 300); // Small delay for blur effect
}