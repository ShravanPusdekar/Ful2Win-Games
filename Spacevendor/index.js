const canvas = document.getElementById("canvas");
const scoreEl = document.getElementById("scoreEl");
const ctx = canvas.getContext('2d');
canvas.width = 1024;
canvas.height = 600;

// Audio setup
const backgroundMusic = new Audio('./sounds/background.mp3');
const killSound = new Audio('./sounds/kill.wav');

// Configure background music
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3; // Adjust volume as needed

// Configure kill sound
killSound.volume = 0.5; // Adjust volume as needed

// Start background music when game starts
function startBackgroundMusic() {
    backgroundMusic.currentTime = 0;
    backgroundMusic.play().catch(error => {
        console.log("Audio play failed:", error);
    });
}

// Stop background music
function stopBackgroundMusic() {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
}

// Play kill sound for only 0.10 seconds
function playKillSound() {
    killSound.currentTime = 0;
    killSound.play().catch(error => {
        console.log("Kill sound play failed:", error);
    });
    
    // Stop the kill sound after 0.10 seconds (100ms)
    setTimeout(() => {
        killSound.pause();
        killSound.currentTime = 0;
    }, 100);
}

// Enable audio on first user interaction
let audioEnabled = false;
function enableAudio() {
    if (!audioEnabled) {
        // Create a promise to handle audio context
        backgroundMusic.load();
        killSound.load();
        audioEnabled = true;
    }
}

class Player {
    constructor() {

        this.velocity = {
            x: 0,
            y: 0
        }
        this.opacity = 1

        const image = new Image()
        image.src = "./images/spaceship.png"

        image.onload = () => {
            const scale = .15
            this.image = image
            this.width = image.width * scale;
            this.height = image.height * scale;
            this.position = {
                x: canvas.width / 2 - this.width / 2,
                y: canvas.height - this.height - 20
            }
        }

    }

    draw() {
        ctx.save()
        ctx.globalAlpha = this.opacity
        ctx.drawImage(
            this.image,
            this.position.x,
            this.position.y,
            this.width,
            this.height)
        ctx.restore()
    }

    update() {
        if (this.image) {
            this.draw()
            this.position.x += this.velocity.x
        }
    }
}

class Projectile {
    constructor({ position, velocity }) {
        this.position = position
        this.velocity = velocity
        this.radius = 3
    }

    draw() {
        ctx.beginPath()
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = 'blue'
        ctx.fill()
        ctx.closePath()
    }

    update() {
        this.draw()
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y
    }
}

class Particle {
    constructor({ position, velocity, radius, color, fades }) {
        this.position = position
        this.velocity = velocity
        this.radius = radius
        this.color = color
        this.opacity = 1
        this.fades = fades
    }

    draw() {
        ctx.save()
        ctx.globalAlpha = this.opacity
        ctx.beginPath()
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.closePath()
        ctx.restore()
    }

    update() {
        this.draw()
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y
        if (this.fades) this.opacity -= 0.01
    }
}


class InvaderProjectile {
    constructor({ position, velocity }) {
        this.position = position
        this.velocity = velocity
        this.width = 3
        this.height = 10
    }

    draw() {
        ctx.fillStyle = 'yellow'
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height)
    }

    update() {
        this.draw()
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y
    }


}


class Invader {
    constructor({ position }) {

        this.velocity = {
            x: 0,
            y: 0
        }

        const image = new Image()
        image.src = "./images/invader.png"

        image.onload = () => {
            const scale = 1
            this.image = image
            this.width = image.width * scale;
            this.height = image.height * scale;
            this.position = {
                x: position.x,
                y: position.y
            }
        }

    }

    draw() {
        ctx.drawImage(
            this.image,
            this.position.x,
            this.position.y,
            this.width,
            this.height)
    }

    update({ velocity }) {
        if (this.image) {
            this.draw()
            this.position.x += velocity.x
            this.position.y += velocity.y
        }
    }

    shoot(invaderProjectiles) {
        invaderProjectiles.push(new InvaderProjectile({
            position: {
                x: this.position.x + this.width / 2,
                y: this.position.y + this.height
            },
            velocity: {
                x: 0,
                y: 5
            }
        }))

    }
}

class Grid {
    constructor() {
        this.position = {
            x: 0,
            y: 0
        }
        this.velocity = {
            x: 3,
            y: 0
        }

        this.invaders = []
        const columns = Math.floor(Math.random() * 10 + 5)
        const rows = Math.floor(Math.random() * 5 + 2)

        this.width = columns * 30

        for (let x = 0; x < columns; x++) {
            for (let y = 0; y < rows; y++) {
                this.invaders.push(new Invader({
                    position: {
                        x: x * 30,
                        y: y * 30
                    }
                }))
            }
        }

    }

    update() {
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y
        this.velocity.y = 0
        if (this.position.x + this.width >= canvas.width || this.position.x <= 0) {
            this.velocity.x = - this.velocity.x
            this.velocity.y = 15 //go down 
        }

    }
}

const player = new Player()
const projectiles = []
const grids = []
const invaderProjectiles = []
const particles = []
const keys = {
    a: {
        pressed: false
    },

    d: {
        pressed: false
    },
    space: {
        pressed: false
    }

}

let frames = 0
let randomInterval = Math.floor(Math.random() * 500 + 500)
let game = {
    over: false,
    active: true
}

let score = 0
let lastFireTime = 0
const fireRate = 150 // milliseconds between shots
let musicStarted = false // Flag to track if music has started


for (let i = 0; i < 100; i++) {
    particles.push(new Particle({
        position: {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        },
        velocity: {
            x: 0,
            y: 0.3
        },
        radius: Math.random() * 1,
        color: '#fff'
    }))
}

function createParticles({ object, color, fades }) {
    for (let i = 0; i < 10; i++) {
        particles.push(new Particle({
            position: {
                x: object.position.x + object.width / 2,
                y: object.position.y + object.height / 2
            },
            velocity: {
                x: (Math.random() - 0.5) * 4,
                y: (Math.random() - 0.5) * 4
            },
            radius: Math.random() * 3,
            color: color || '#9400D3',
            fades
        }))
    }
}

function fireProjectile() {
    const currentTime = Date.now();
    if (currentTime - lastFireTime >= fireRate && player.position) {
        projectiles.push(new Projectile({
            position: {
                x: player.position.x + player.width / 2,
                y: player.position.y
            },
            velocity: {
                x: 0,
                y: -10
            }
        }));
        lastFireTime = currentTime;
    }
}

function animate() {
    if (!game.active) return
    
    // Start background music when game starts
    if (!musicStarted && !game.over) {
        startBackgroundMusic();
        musicStarted = true;
    }
    
    requestAnimationFrame(animate)
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    player.update()
    particles.forEach((particle, i) => {

        if (particle.position.y - particle.radius >= canvas.height) {
            particle.position.x = Math.random() * canvas.width
            particle.position.y = -particle.radius
        }


        if (particle.opacity <= 0) {
            setTimeout(() => {
                particles.splice(i, 1)
            }, 0)
        } else {
            particle.update()
        }
    })
    invaderProjectiles.forEach((invaderProjectile, index) => {
        if (invaderProjectile.position.y + invaderProjectile.height >= canvas.height) {
            setTimeout(() => {
                invaderProjectiles.splice(index, 1)
            }, 0)
        } else {
            invaderProjectile.update()
        }
        if (invaderProjectile.position.y + invaderProjectile.height >= player.position.y
            && invaderProjectile.position.x + invaderProjectile.width >= player.position.x &&
            invaderProjectile.position.x <= player.position.x + player.width) {
            const origin = window.location.hostname.includes("localhost")
  ? "http://localhost:5173"
  : "https://fulboost.fun";

window.parent.postMessage({ type: "GAME_OVER", score: score }, origin);

            setTimeout(() => {
                invaderProjectiles.splice(index, 1)
                player.opacity = 0
                game.over = true
                
                // Stop background music when game is over
                stopBackgroundMusic();
            }, 0)

            setTimeout(() => {
                game.active = false
            }, 2000)


            createParticles({
                object: player,
                color: '#fff',
                fades: true
            })
        }
    })
    projectiles.forEach((projectile, index) => {
        if (projectile.position.y + projectile.radius <= 0) {
            setTimeout(() => {
                projectiles.splice(index, 1)
            }, 0)
        }
        else {
            projectile.update()
        }
        projectile.update()
    })

    grids.forEach((grid, gridIndex) => {
        grid.update()
        if (frames % 40 === 0 && grid.invaders.length > 0) {
            grid.invaders[Math.floor(Math.random() * grid.invaders.length)].shoot(invaderProjectiles)
        }

        grid.invaders.forEach((invader, i) => {
            invader.update({ velocity: grid.velocity })
            projectiles.forEach((projectile, j) => {
                if (projectile.position.y - projectile.radius <= invader.position.y +
                    invader.height &&
                    projectile.position.x + projectile.radius >= invader.position.x && projectile.position.x - projectile.radius
                    <= invader.position.x + invader.width && projectile.position.y + projectile.radius >= invader.position.y) {

                    setTimeout(() => {
                        const invaderFound = grid.invaders.find((invader2) =>
                            invader2 === invader
                        )

                        const projectileFound = projectiles.find(projectile2 => projectile2 === projectile)
                        if (invaderFound && projectileFound) {
                            score+=100
                            scoreEl.innerHTML=score
                            
                            // Play kill sound when enemy is hit
                            playKillSound();
                            
                            createParticles({
                                object: invader,
                                fades: true
                            })
                            grid.invaders.splice(i, 1)
                            projectiles.splice(j, 1)

                            if (grid.invaders.length > 0) {
                                const firstInvader = grid.invaders[0]
                                const lastInvader = grid.invaders[grid.invaders.length - 1]
                                grid.width = lastInvader.position.x - firstInvader.position.x + lastInvader.width
                                grid.position.x = firstInvader.position.x
                            } else {
                                grids.splice(gridIndex, 1)
                            }
                        }
                    }, 0)
                }
            })
        })
    })

    if (keys.a.pressed && player.position.x >= 0) {
        player.velocity.x = -7
    }
    else if (keys.d.pressed && (player.position.x + player.width) <= canvas.width) {
        player.velocity.x = 7
    }
    else {
        player.velocity.x = 0
    }

    // Continuous firing when space is pressed
    if (keys.space.pressed && !game.over) {
        fireProjectile();
    }

    if (frames % randomInterval === 0) {
        grids.push(new Grid())
        randomInterval = Math.floor(Math.random() * 500 + 500)
        frames = 0
    }

    frames++
}
animate();

addEventListener('keydown', ({ key }) => {
    if (game.over) return
    
    // Enable audio on first interaction
    enableAudio();

    switch (key) {
        case 'a':
            console.log('left')
            keys.a.pressed = true
            break;
        case 'd':
            console.log('right')
            player.velocity.x += 5
            keys.d.pressed = true
            break;
        case ' ':
            console.log('space')
            keys.space.pressed = true
            break;
    }
})

addEventListener('keyup', ({ key }) => {
    switch (key) {
        case 'a':
            console.log('left')
            keys.a.pressed = false
            break;
        case 'd':
            console.log('right')
            player.velocity.x += 5
            keys.d.pressed = false
            break;
        case ' ':
            console.log('space')
            keys.space.pressed = false
            break;
    }
})

// Touch controls for mobile
const joystick = document.getElementById('joystick');
const joystickKnob = document.getElementById('joystickKnob');
const shootBtn = document.getElementById('shootBtn');

let joystickActive = false;
let joystickCenterX = 0;
let joystickCenterY = 0;
let joystickMaxDistance = 30; // Maximum distance the knob can move from center

function initJoystick() {
    if (joystick) {
        const rect = joystick.getBoundingClientRect();
        joystickCenterX = rect.width / 2;
        joystickCenterY = rect.height / 2;
    }
}

function updateJoystickPosition(clientX, clientY) {
    if (!joystick || !joystickKnob) return;
    
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Limit movement to circle
    let finalX = deltaX;
    let finalY = deltaY;
    
    if (distance > joystickMaxDistance) {
        finalX = (deltaX / distance) * joystickMaxDistance;
        finalY = (deltaY / distance) * joystickMaxDistance;
    }
    
    // Move the knob
    joystickKnob.style.transform = `translate(${finalX}px, ${finalY}px)`;
    
    // Update movement based on horizontal position
    const horizontalRatio = finalX / joystickMaxDistance;
    
    if (Math.abs(horizontalRatio) > 0.3) { // Dead zone
        if (horizontalRatio < 0) {
            keys.a.pressed = true;
            keys.d.pressed = false;
        } else {
            keys.d.pressed = true;
            keys.a.pressed = false;
        }
    } else {
        keys.a.pressed = false;
        keys.d.pressed = false;
    }
}

function resetJoystick() {
    if (joystickKnob) {
        joystickKnob.style.transform = 'translate(0px, 0px)';
    }
    keys.a.pressed = false;
    keys.d.pressed = false;
    joystickActive = false;
}

// Initialize joystick on load
window.addEventListener('load', initJoystick);
window.addEventListener('resize', initJoystick);

// Only add controls if elements exist
if (joystick && shootBtn) {
    let joystickTouchId = null;
    
    // Joystick touch events
    joystick.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
        if (game.over) return;
        
        // Store the touch ID for the joystick
        joystickTouchId = e.touches[0].identifier;
        
        // Enable audio on first interaction
        enableAudio();
        
        joystickActive = true;
        const touch = e.touches[0];
        updateJoystickPosition(touch.clientX, touch.clientY);
    });

    document.addEventListener('touchmove', (e) => {
        if (!joystickActive || game.over || joystickTouchId === null) return;
        
        // Find our specific touch
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === joystickTouchId) {
                updateJoystickPosition(e.touches[i].clientX, e.touches[i].clientY);
                break;
            }
        }
    });

    document.addEventListener('touchend', (e) => {
        if (!joystickActive || joystickTouchId === null) return;
        
        // Check if our joystick touch ended
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joystickTouchId) {
                resetJoystick();
                joystickTouchId = null;
                break;
            }
        }
    });
    
    document.addEventListener('touchcancel', (e) => {
        if (!joystickActive || joystickTouchId === null) return;
        
        // Check if our joystick touch was cancelled
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joystickTouchId) {
                resetJoystick();
                joystickTouchId = null;
                break;
            }
        }
    });

    // Joystick mouse events (for testing on desktop)
    joystick.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (game.over) return;
        joystickActive = true;
        updateJoystickPosition(e.clientX, e.clientY);
    });

    document.addEventListener('mousemove', (e) => {
        if (!joystickActive || game.over) return;
        e.preventDefault();
        updateJoystickPosition(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', (e) => {
        if (joystickActive) {
            e.preventDefault();
            resetJoystick();
        }
    });

    // Shoot button - continuous firing with multi-touch support
    let shootTouchId = null;
    
    shootBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
        if (game.over) return;
        
        // Store the touch ID for this button
        shootTouchId = e.touches[0].identifier;
        
        // Enable audio on first interaction
        enableAudio();
        
        keys.space.pressed = true;
    });

    shootBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
        
        // Only stop shooting if our specific touch ended
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === shootTouchId) {
                keys.space.pressed = false;
                shootTouchId = null;
                break;
            }
        }
    });

    shootBtn.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys.space.pressed = false;
        shootTouchId = null;
    });

    shootBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (game.over) return;
        keys.space.pressed = true;
    });

    shootBtn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        keys.space.pressed = false;
    });
}

// Prevent context menu on long press
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Prevent default touch behaviors
document.addEventListener('touchstart', (e) => {
    if (e.target.id === 'shootBtn' || e.target.classList.contains('shoot-btn')) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchend', (e) => {
    if (e.target.id === 'shootBtn' || e.target.classList.contains('shoot-btn')) {
        e.preventDefault();
    }
}, { passive: false });

