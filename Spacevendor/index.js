const canvas = document.getElementById("canvas");
const scoreEl = document.getElementById("scoreEl");
const timerEl = document.getElementById("timerEl");
const ctx = canvas.getContext('2d');

// Make the canvas responsive and scale it
function setCanvasSize() {
    const container = document.querySelector('.game-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    canvas.width = containerWidth;
    canvas.height = containerHeight;
}
window.addEventListener('resize', setCanvasSize);
setCanvasSize();

// --- Audio Setup ---
const backgroundMusic = new Audio('./sounds/background.mp3');
const killSound = new Audio('./sounds/kill.wav');
const fireSound = new Audio('./sounds/shoot.wav'); // Sound for player's gun

backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;
killSound.volume = 0.5;
fireSound.volume = 0.5;

let audioEnabled = false;

function startBackgroundMusic() {
    if (!audioEnabled) return;
    backgroundMusic.play().catch(error => { /* handle error */ });
}

function stopBackgroundMusic() {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
}

function playKillSound() {
    if (!audioEnabled) return;
    killSound.currentTime = 0;
    // We'll log an error if the sound fails to play, helping to debug the issue
    killSound.play().catch(error => {
        console.error("Error playing kill.wav. Check if the file exists and is in the correct path: ./sounds/kill.wav", error);
    });
}

function playFireSound() {
    if (!audioEnabled) return;
    fireSound.currentTime = 0;
    fireSound.play().catch(error => { /* handle error */ });
}

function enableAudio() {
    if (!audioEnabled) {
        audioEnabled = true;
        startBackgroundMusic();
    }
}

// --- Asset Loading ---
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
}

// --- Game State Management ---
const GAME_STATE = {
    START_SCREEN: 'start_screen',
    PLAYING: 'playing',
    GAME_OVER: 'game_over'
};

let game = {
    state: GAME_STATE.PLAYING,  // Start directly in playing state
    score: 0,
    active: true,
    level: 1,
    playerLives: 3,
    timeRemaining: 120,
    currentSpeed: 0.8  // Reduced from 1.5 for better playability
};

// --- Game Objects (Classes) ---
class Player {
    constructor(image) {
        this.velocity = { x: 0, y: 0 };
        this.opacity = 1;
        this.speed = 7;
        this.image = image;
        const scale = 0.15;
        this.width = this.image.width * scale;
        this.height = this.image.height * scale;
        this.position = {
            x: canvas.width / 2 - this.width / 2,
            y: canvas.height - this.height - 100
        };
    }
    draw() {
        if (!this.image) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
        ctx.restore();
    }
    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        if (this.position.x < 0) {
            this.position.x = 0;
        }
        if (this.position.x + this.width > canvas.width) {
            this.position.x = canvas.width - this.width;
        }
        
        if (this.position.y < 0) {
            this.position.y = 0;
        }
        if (this.position.y + this.height > canvas.height) {
            this.position.y = canvas.height - this.height;
        }
    }
    resetPosition() {
        this.position.x = canvas.width / 2 - this.width / 2;
        this.opacity = 1;
    }
}

class Invader {
    constructor({ position, image }) {
        this.velocity = { x: 0, y: 0 };
        this.image = image;
        this.width = 40; 
        this.height = 30;
        this.position = { x: position.x, y: position.y };
    }
    draw() {
        if (!this.image) return;
        ctx.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
    }
    update({ velocity }) {
        this.draw();
        this.position.x += velocity.x;
        this.position.y += velocity.y;
    }
    shoot(invaderProjectiles) {
        invaderProjectiles.push(new InvaderProjectile({
            position: { x: this.position.x + this.width / 2, y: this.position.y + this.height },
            velocity: { x: 0, y: 5 + game.level * 0.5 }
        }));
    }
}

class Projectile {
    constructor({ position, velocity }) {
        this.position = position;
        this.velocity = velocity;
        this.radius = 3;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'blue';
        ctx.fill();
        ctx.closePath();
    }
    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

class Particle {
    constructor({ position, velocity, radius, color, fades }) {
        this.position = position;
        this.velocity = velocity;
        this.radius = radius;
        this.color = color;
        this.opacity = 1;
        this.fades = fades;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        if (this.fades) this.opacity -= 0.01;
    }
}

class InvaderProjectile {
    constructor({ position, velocity }) {
        this.position = position;
        this.velocity = velocity;
        this.width = 3;
        this.height = 10;
    }
    draw() {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

class Grid {
    constructor(invaderImage) {
        this.position = { x: 0, y: 0 };
        this.velocity = { x: game.currentSpeed, y: 0 };
        this.invaders = [];

        const invaderSize = canvas.width < 500 ? 25 : 40;
        const invaderPadding = 5;
        const maxColumns = Math.floor((canvas.width - 20) / (invaderSize + invaderPadding));
        const maxRows = Math.floor(canvas.height * 0.2 / (invaderSize + invaderPadding));

        const columns = Math.min(maxColumns, Math.floor(Math.random() * 10 + 5));
        const rows = Math.min(maxRows, Math.floor(Math.random() * 5 + 2));

        this.width = (columns * invaderSize) + ((columns - 1) * invaderPadding);
        
        for (let x = 0; x < columns; x++) {
            for (let y = 0; y < rows; y++) {
                this.invaders.push(new Invader({
                    position: {
                        x: x * (invaderSize + invaderPadding),
                        y: y * (invaderSize + invaderPadding)
                    },
                    image: invaderImage
                }));
            }
        }
        const firstInvader = this.invaders[0];
        const lastInvader = this.invaders[this.invaders.length - 1];
        
        this.width = lastInvader.position.x - firstInvader.position.x + lastInvader.width;
        this.position.x = (canvas.width - this.width) / 2;
        this.position.y = 30;

        this.invaders.forEach(invader => {
            invader.position.x += this.position.x;
            invader.position.y += this.position.y;
        });
    }
    update() {
        this.velocity.y = 0;

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        
        if (this.position.x + this.width >= canvas.width || this.position.x <= 0) {
            this.velocity.x = -this.velocity.x;
            this.velocity.y = 8;  // Reduced from 20 - slower downward movement
        }
    }
}

// --- Game Variables ---
let player;
let projectiles = [];
let grids = [];
let invaderProjectiles = [];
let particles = [];

let frames = 0;
let lastFireTime = 0;
const fireRate = 150;

// --- Initialize Background Particles ---
function initBackgroundParticles() {
    particles = [];
    for (let i = 0; i < 100; i++) {
        particles.push(new Particle({
            position: { x: Math.random() * canvas.width, y: Math.random() * canvas.height },
            velocity: { x: 0, y: 0.3 },
            radius: Math.random() * 1,
            color: '#fff'
        }));
    }
}

// --- Particle Creation for Explosions ---
function createParticles({ object, color, fades }) {
    for (let i = 0; i < 10; i++) {
        particles.push(new Particle({
            position: { x: object.position.x + object.width / 2, y: object.position.y + object.height / 2 },
            velocity: { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 },
            radius: Math.random() * 3,
            color: color || '#9400D3',
            fades
        }));
    }
}

// --- Player Firing Logic ---
function fireProjectile() {
    const currentTime = Date.now();
    if (currentTime - lastFireTime >= fireRate && player && player.position && player.opacity > 0) {
        projectiles.push(new Projectile({
            position: { x: player.position.x + player.width / 2, y: player.position.y },
            velocity: { x: 0, y: -10 }
        }));
        playFireSound(); // Play sound when projectile is fired
        lastFireTime = currentTime;
    }
}

// --- UI Management Functions ---
function updateTimerDisplay() {
    const minutes = Math.floor(game.timeRemaining / 60);
    const seconds = game.timeRemaining % 60;
    const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    timerEl.textContent = `Time: ${formattedTime}`;
}

function showOverlay(title, message, buttonText, callback) {
    let overlay = document.querySelector('.overlay');
    overlay.innerHTML = `
        <h1>${title}</h1>
        <p>${message}</p>
        <button>${buttonText}</button>
    `;
    overlay.style.display = 'flex';
    if (buttonText) {
        overlay.querySelector('button').onclick = () => {
            overlay.style.display = 'none';
            callback();
        };
    }
}

// Start screen removed - game begins immediately
// Audio will be enabled on first user interaction (joystick or shoot button)

let gameEnded = false;  // Flag to ensure score is reported only once

function endGame() {
    if (gameEnded) return;  // Prevent multiple calls
    
    gameEnded = true;
    game.state = GAME_STATE.GAME_OVER;
    game.active = false;
    stopBackgroundMusic();
    
    // Step 1: Hide HUD elements (Score, Lives, Time)
    const scoreboard = document.querySelector('.scoreboard');
    if (scoreboard) {
        scoreboard.style.display = 'none';
    }
    
    // Step 2: Apply blur effect to canvas
    const canvas = document.getElementById('canvas');
    canvas.style.filter = 'blur(5px)';
    canvas.style.transition = 'filter 0.3s ease-in-out';
    
    // Step 3: Display "Better luck next time" message at the top
    const overlay = document.querySelector('.overlay');
    if (overlay) {
        overlay.innerHTML = `
            <h1 style="font-size: 2.5rem; color: #fff; text-shadow: 0 0 20px #fff, 0 0 30px #ff0000; margin: 0; animation: fadeIn 0.5s ease-in;">
                Better luck next time
            </h1>
        `;
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'flex-start';  // Align to top
        overlay.style.paddingTop = '80px';  // Position near top
        overlay.style.background = 'rgba(0, 0, 0, 0.3)';  // Subtle overlay
    }
    
    // Step 4: Report final score to parent window (executes exactly once)
    window.parent.postMessage({ type: "GAME_OVER", score: game.score }, "*");
    
    // Game loop will stop automatically due to state check
}

// --- Game Logic Functions ---
let spaceshipImage, invaderImage;
function initGame() {
    player = new Player(spaceshipImage);
    projectiles = [];
    grids = [];
    invaderProjectiles = [];

    game.score = 0;
    game.active = true;
    game.level = 1;
    game.playerLives = 3;
    game.timeRemaining = 120;
    game.currentSpeed = 0.8;  // Starting speed - slow and manageable
    gameEnded = false;  // Reset game ended flag
    
    scoreEl.innerHTML = `Score: 0 | Lives: 3`;
    updateTimerDisplay();

    initBackgroundParticles();
    
    grids.push(new Grid(invaderImage));
    
    // Reset canvas blur and hide overlay on init
    const canvas = document.getElementById('canvas');
    canvas.style.filter = 'none';
    
    // Show HUD elements on game start
    const scoreboard = document.querySelector('.scoreboard');
    if (scoreboard) {
        scoreboard.style.display = 'block';
    }
    
    const overlay = document.querySelector('.overlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.style.justifyContent = 'center';  // Reset to center for future use
        overlay.style.paddingTop = '0';  // Reset padding
    }
}

function startGame() {
    game.state = GAME_STATE.PLAYING;
    
    // Hide the overlay to show the game
    const overlay = document.querySelector('.overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    
    scoreEl.parentElement.style.display = 'block';
    startBackgroundMusic();
    animate();
}

function restartGame() {
    initGame();
    startGame();
}

// --- Main Animation Loop ---
function animate() {
    if (game.state !== GAME_STATE.PLAYING) return;

    requestAnimationFrame(animate);

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (player) {
      player.update();
    }
    scoreEl.innerHTML = `Score: ${game.score} | Lives: ${game.playerLives}`;

    // Timer logic
    if (frames % 60 === 0) {
        game.timeRemaining--;
        updateTimerDisplay();

        // Progressive difficulty: Speed increases gradually over time
        if (game.timeRemaining <= 90 && game.timeRemaining > 60) {
            game.currentSpeed = 1.2;  // Gentle increase at 30 seconds
        } else if (game.timeRemaining <= 60 && game.timeRemaining > 30) {
            game.currentSpeed = 1.6;  // Moderate increase at 60 seconds
        } else if (game.timeRemaining <= 30 && game.timeRemaining > 0) {
            game.currentSpeed = 2.0;  // Challenging but fair at 90 seconds
        } else if (game.timeRemaining <= 0) {
            game.state = GAME_STATE.GAME_OVER;
        }
    }
    
    // Timer runs out - end game immediately
    if (game.state === GAME_STATE.GAME_OVER && game.timeRemaining <= 0) {
        endGame();
        return;  // Stop animation loop
    }

    particles.forEach((particle, i) => {
        if (particle.position.y - particle.radius >= canvas.height) {
            particle.position.x = Math.random() * canvas.width;
            particle.position.y = -particle.radius;
        }
        if (particle.fades && particle.opacity <= 0) {
            setTimeout(() => particles.splice(i, 1), 0);
        } else {
            particle.update();
        }
    });

    invaderProjectiles.forEach((invaderProjectile, index) => {
        if (invaderProjectile.position.y + invaderProjectile.height >= canvas.height) {
            setTimeout(() => invaderProjectiles.splice(index, 1), 0);
        } else {
            invaderProjectile.update();
        }

        if (player && invaderProjectile.position.y + invaderProjectile.height >= player.position.y &&
            invaderProjectile.position.x + invaderProjectile.width >= player.position.x &&
            invaderProjectile.position.x <= player.position.x + player.width &&
            player.opacity > 0) {
            
            setTimeout(() => {
                invaderProjectiles.splice(index, 1);
                game.playerLives--;
                if (game.playerLives > 0) {
                    player.opacity = 0;
                    createParticles({ object: player, color: '#fff', fades: true });
                    setTimeout(() => {
                        player.resetPosition();
                    }, 500);
                } else {
                    // Player lost all lives - end game immediately
                    player.opacity = 0;
                    createParticles({ object: player, color: '#fff', fades: true });
                    endGame();
                    return;  // Stop animation loop
                }
            }, 0);
        }
    });

    projectiles.forEach((projectile, index) => {
        if (projectile.position.y + projectile.radius <= 0) {
            setTimeout(() => projectiles.splice(index, 1), 0);
        } else {
            projectile.update();
        }
    });

    grids.forEach((grid, gridIndex) => {
        // Adjust grid speed dynamically
        grid.velocity.x = grid.velocity.x > 0 ? game.currentSpeed : -game.currentSpeed;
        grid.update();

        // Check for game over condition (invaders reach the bottom)
        if (grid.invaders.some(invader => invader.position.y + invader.height >= canvas.height - 150)) {
            endGame();
            return;  // Stop animation loop
        }

        const shootInterval = Math.max(80 - game.level * 2, 20);
        if (frames % shootInterval === 0 && grid.invaders.length > 0) {
            const randomInvader = grid.invaders[Math.floor(Math.random() * grid.invaders.length)];
            randomInvader.shoot(invaderProjectiles);
        }

        grid.invaders.forEach((invader, i) => {
            invader.update({ velocity: grid.velocity });

            projectiles.forEach((projectile, j) => {
                if (projectile.position.y - projectile.radius <= invader.position.y + invader.height &&
                    projectile.position.x + projectile.radius >= invader.position.x &&
                    projectile.position.x - projectile.radius <= invader.position.x + invader.width &&
                    projectile.position.y + projectile.radius >= invader.position.y) {

                    setTimeout(() => {
                        const invaderFound = grid.invaders.find(invader2 => invader2 === invader);
                        const projectileFound = projectiles.find(projectile2 => projectile2 === projectile);

                        if (invaderFound && projectileFound) {
                            game.score += 25;
                            playKillSound();
                            createParticles({ object: invader, fades: true });
                            grid.invaders.splice(i, 1);
                            projectiles.splice(j, 1);

                            if (grid.invaders.length > 0) {
                                const firstInvader = grid.invaders[0];
                                const lastInvader = grid.invaders[grid.invaders.length - 1];
                                grid.width = lastInvader.position.x - firstInvader.position.x + lastInvader.width;
                                grid.position.x = firstInvader.position.x;
                            } else {
                                grids.splice(gridIndex, 1);
                                if (grids.length === 0) {
                                    game.level++;
                                    grids.push(new Grid(invaderImage));
                                }
                            }
                        }
                    }, 0);
                }
            });
        });
    });

    frames++;
}

// --- Event Listeners for Mobile-Only ---
const joystick = document.getElementById('joystick');
const joystickKnob = document.getElementById('joystickKnob');
const shootBtn = document.getElementById('shootBtn');

let joystickActive = false;
let joystickTouchID = null;
const joystickMaxDistance = 30;

function updateJoystickPosition(currentClientX) {
    if (!joystickActive || !player || game.state !== GAME_STATE.PLAYING) return;
    const rect = joystick.getBoundingClientRect();
    const joystickCenterX = rect.left + rect.width / 2;
    let deltaX = currentClientX - joystickCenterX;
    deltaX = Math.max(-joystickMaxDistance, Math.min(joystickMaxDistance, deltaX));
    joystickKnob.style.transform = `translateX(${deltaX}px)`;
    const horizontalRatio = deltaX / joystickMaxDistance;
    player.velocity.x = horizontalRatio * player.speed;
}

joystick.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
        joystickActive = true;
        joystickTouchID = e.touches[0].identifier;
        updateJoystickPosition(e.touches[0].clientX);
    }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (!joystickActive || game.state !== GAME_STATE.PLAYING) return;
    e.preventDefault();
    for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === joystickTouchID) {
            updateJoystickPosition(e.touches[i].clientX);
            break;
        }
    }
}, { passive: false });

document.addEventListener('touchend', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joystickTouchID) {
            joystickActive = false;
            joystickTouchID = null;
            if (player) player.velocity.x = 0;
            if (joystickKnob) joystickKnob.style.transform = 'translateX(0px)';
            break;
        }
    }
});

shootBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    enableAudio();  // Enable audio on first interaction
    if (game.state !== GAME_STATE.PLAYING) return;
    fireProjectile();
}, { passive: false });

// --- Keyboard Controls for Desktop ---
const keys = { left: false, right: false, space: false };

window.addEventListener('keydown', (e) => {
    enableAudio();  // Enable audio on first interaction
    if (game.state !== GAME_STATE.PLAYING) return;
    
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = true;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = true;
    }
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        keys.space = true;
        fireProjectile();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = false;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = false;
    }
    if (e.key === ' ' || e.key === 'Spacebar') {
        keys.space = false;
    }
});

// Update player velocity based on keyboard input
setInterval(() => {
    if (!player || game.state !== GAME_STATE.PLAYING) return;
    
    if (keys.left && !keys.right) {
        player.velocity.x = -player.speed;
    } else if (keys.right && !keys.left) {
        player.velocity.x = player.speed;
    } else if (!joystickActive) {
        // Only reset velocity if joystick is not active (for mobile compatibility)
        player.velocity.x = 0;
    }
}, 1000 / 60);

window.onload = () => {
    Promise.all([
        loadImage('./images/spaceship.png'),
        loadImage('./images/invader.png')
    ]).then(loadedImages => {
        spaceshipImage = loadedImages[0];
        invaderImage = loadedImages[1];
        initGame();
        startGame();  // Start game immediately after assets load
    }).catch(error => {
        console.error("Game failed to load assets:", error);
        document.body.innerHTML = `<div class="error-message" style="color:red; text-align:center; font-size:24px;">
                                     Failed to load game assets. Please check console for details.
                                   </div>`;
    });
};