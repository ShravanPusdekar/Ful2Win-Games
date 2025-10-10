// Tetris Game Implementation
class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextPiece');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // Audio elements
        this.sounds = {
            rotate: document.getElementById('sound-rotate'),
            move: document.getElementById('sound-move'),
            lock: document.getElementById('sound-lock'),
            line: document.getElementById('sound-line'),
            gameover: document.getElementById('sound-gameover'),
            pause: document.getElementById('sound-pause')
        };
        
        // Game constants
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.dropTime = 0;
        this.dropInterval = 1000;
        
        // Particle system for line clear effects
        this.particles = [];
        
        // Initialize audio helper
        this.initAudio();
        
        this.initializeBoard();
        this.setupCanvas();
        this.setupEventListeners();
        this.generateNextPiece();
        this.spawnNewPiece();
        this.updateDisplay();
        this.gameLoop();
    }
    
    // Audio helper methods
    initAudio() {
        // Set volume for all sounds with optimized levels
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = 0.25; // Optimized volume for better experience
                sound.preload = 'auto'; // Ensure preloading
            }
        });
        
        // Set specific volumes for different sound types
        if (this.sounds.move) this.sounds.move.volume = 0.15; // Quieter for frequent sounds
        if (this.sounds.rotate) this.sounds.rotate.volume = 0.2;
        if (this.sounds.lock) this.sounds.lock.volume = 0.3;
        if (this.sounds.line) this.sounds.line.volume = 0.4; // Louder for achievement
        if (this.sounds.gameover) this.sounds.gameover.volume = 0.35;
        if (this.sounds.pause) this.sounds.pause.volume = 0.25;
    }
    
    playSound(soundName) {
        try {
            const sound = this.sounds[soundName];
            if (sound) {
                sound.currentTime = 0; // Reset to beginning
                sound.play().catch(e => console.log('Audio play failed:', e));
            }
        } catch (error) {
            console.log('Audio error:', error);
        }
    }
    
    togglePause() {
        this.paused = !this.paused;
        this.playSound('pause');
        
        if (this.paused) {
            console.log('Game paused');
        } else {
            console.log('Game resumed');
            // Reset drop time to prevent immediate drop
            this.dropTime = performance.now();
        }
    }
    
    // Tetromino definitions with all rotations
    tetrominoes = {
        I: {
            color: '#00f5ff',
            shapes: [
                [[1, 1, 1, 1]],
                [[1], [1], [1], [1]]
            ]
        },
        O: {
            color: '#ffed00',
            shapes: [
                [[1, 1], [1, 1]]
            ]
        },
        T: {
            color: '#a000f0',
            shapes: [
                [[0, 1, 0], [1, 1, 1]],
                [[1, 0], [1, 1], [1, 0]],
                [[1, 1, 1], [0, 1, 0]],
                [[0, 1], [1, 1], [0, 1]]
            ]
        },
        S: {
            color: '#00f000',
            shapes: [
                [[0, 1, 1], [1, 1, 0]],
                [[1, 0], [1, 1], [0, 1]]
            ]
        },
        Z: {
            color: '#f00000',
            shapes: [
                [[1, 1, 0], [0, 1, 1]],
                [[0, 1], [1, 1], [1, 0]]
            ]
        },
        J: {
            color: '#0000f0',
            shapes: [
                [[1, 0, 0], [1, 1, 1]],
                [[1, 1], [1, 0], [1, 0]],
                [[1, 1, 1], [0, 0, 1]],
                [[0, 1], [0, 1], [1, 1]]
            ]
        },
        L: {
            color: '#f0a000',
            shapes: [
                [[0, 0, 1], [1, 1, 1]],
                [[1, 0], [1, 0], [1, 1]],
                [[1, 1, 1], [1, 0, 0]],
                [[1, 1], [0, 1], [0, 1]]
            ]
        }
    };
    
    initializeBoard() {
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
    }
    
    setupCanvas() {
        // FINAL TECHNICAL FIX - Ensure canvas has proper pixel ratio for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        // FINAL AESTHETIC FIX - Calculate block size for PRECISE border-to-content matching
        const availableWidth = rect.width - 4; // Account for border only
        const availableHeight = rect.height - 4; // Account for border only
        
        // FINAL AESTHETIC PRECISION - Ensure 10 cells fit exactly with tight border
        this.BLOCK_SIZE = Math.floor(availableWidth / this.BOARD_WIDTH);
        
        // Verify height can accommodate 20 cells with tight fit
        const requiredHeight = this.BLOCK_SIZE * this.BOARD_HEIGHT;
        if (requiredHeight > availableHeight) {
            this.BLOCK_SIZE = Math.floor(availableHeight / this.BOARD_HEIGHT);
        }
        
        // FINAL AESTHETIC GUARANTEE - Optimal block size for tight border fit
        this.BLOCK_SIZE = Math.max(this.BLOCK_SIZE, 14);
        
        // FINAL AESTHETIC VERIFICATION - Ensure grid fills canvas completely
        const actualGridWidth = this.BLOCK_SIZE * this.BOARD_WIDTH;
        const actualGridHeight = this.BLOCK_SIZE * this.BOARD_HEIGHT;
        
        // Ensure the grid uses maximum available space
        if (actualGridWidth < availableWidth - 10) {
            this.BLOCK_SIZE = Math.floor(availableWidth / this.BOARD_WIDTH);
        }
        if (actualGridHeight < availableHeight - 20) {
            this.BLOCK_SIZE = Math.min(this.BLOCK_SIZE, Math.floor(availableHeight / this.BOARD_HEIGHT));
        }
        
        // Setup next piece canvas
        const nextRect = this.nextCanvas.getBoundingClientRect();
        this.nextCanvas.width = nextRect.width * dpr;
        this.nextCanvas.height = nextRect.height * dpr;
        this.nextCtx.scale(dpr, dpr);
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) {
                if (e.key === 'r' || e.key === 'R') {
                    this.restart();
                }
                return;
            }
            
            // Pause functionality
            if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                e.preventDefault();
                this.togglePause();
                return;
            }
            
            // Skip other controls if paused
            if (this.paused) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case ' ':
                    e.preventDefault();
                    this.hardDrop();
                    break;
                case 'r':
                case 'R':
                    e.preventDefault();
                    this.restart();
                    break;
            }
        });
        
        // Mobile touch controls
        this.setupMobileControls();
        
        // Handle window resize and orientation change
        window.addEventListener('resize', () => {
            setTimeout(() => this.setupCanvas(), 100);
        });
        
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.setupCanvas(), 200);
        });
    }
    
    setupMobileControls() {
        // Get mobile control buttons
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const downBtn = document.getElementById('downBtn');
        const rotateBtn = document.getElementById('rotateBtn');
        const hardDropBtn = document.getElementById('hardDropBtn');
        
        // Initialize control state
        this.controlState = {};
        
        // Prevent default touch behaviors
        const preventDefaults = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        
        // Helper function to setup button with reliable touch/click functionality
        const setupButton = (btn, action, holdAction = null, holdDelay = 150) => {
            if (!btn) return;
            
            let isPressed = false;
            let holdInterval = null;
            
            // Handle both touch and mouse events for maximum compatibility
            const startAction = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (!this.gameOver && !isPressed) {
                    isPressed = true;
                    action(); // Immediate action
                    
                    // Setup hold functionality if specified
                    if (holdAction) {
                        holdInterval = setInterval(() => {
                            if (!this.gameOver && isPressed) {
                                holdAction();
                            }
                        }, holdDelay);
                    }
                }
            };
            
            const endAction = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                isPressed = false;
                if (holdInterval) {
                    clearInterval(holdInterval);
                    holdInterval = null;
                }
            };
            
            // Touch events
            btn.addEventListener('touchstart', startAction, { passive: false });
            btn.addEventListener('touchend', endAction, { passive: false });
            btn.addEventListener('touchcancel', endAction, { passive: false });
            
            // Mouse events for desktop compatibility
            btn.addEventListener('mousedown', startAction);
            btn.addEventListener('mouseup', endAction);
            btn.addEventListener('mouseleave', endAction);
            
            // Prevent context menu
            btn.addEventListener('contextmenu', (e) => e.preventDefault());
        };
        
        // Setup all buttons with optimized actions
        setupButton(leftBtn, () => { if (!this.paused) this.movePiece(-1, 0); }, () => { if (!this.paused) this.movePiece(-1, 0); }, 150);
        setupButton(rightBtn, () => { if (!this.paused) this.movePiece(1, 0); }, () => { if (!this.paused) this.movePiece(1, 0); }, 150);
        setupButton(downBtn, () => { if (!this.paused) this.movePiece(0, 1); }, () => { if (!this.paused) this.movePiece(0, 1); }, 100);
        setupButton(rotateBtn, () => {
            // ULTIMATE FINAL rotate with absolute reliability and immediate 90° execution
            try {
                if (!this.gameOver && !this.paused && this.currentPiece && this.currentPiece.type) {
                    console.log('Rotate button pressed - executing ULTIMATE FINAL 90° rotation');
                    
                    // Prevent multiple rapid rotations with perfect responsiveness
                    if (this.rotateTimeout) return;
                    this.rotateTimeout = true;
                    
                    const success = this.rotatePiece();
                    if (success) {
                        // Force immediate visual update for instant feedback
                        this.draw();
                        // Add perfectly optimized haptic feedback
                        if (navigator.vibrate) {
                            navigator.vibrate(20);
                        }
                        // Ultimate final visual feedback - perfect button highlight
                        rotateBtn.style.transform = 'scale(0.85)';
                        rotateBtn.style.boxShadow = '0 0 55px rgba(0, 255, 136, 1.0), inset 0 0 20px rgba(0, 255, 136, 0.4)';
                        rotateBtn.style.borderColor = '#00ff44';
                        rotateBtn.style.backgroundColor = 'rgba(0, 255, 68, 0.15)';
                        setTimeout(() => {
                            rotateBtn.style.transform = '';
                            rotateBtn.style.boxShadow = '';
                            rotateBtn.style.borderColor = '';
                            rotateBtn.style.backgroundColor = '';
                        }, 80);
                    } else {
                        // Rotation failed feedback with crystal-clear indication
                        if (navigator.vibrate) {
                            navigator.vibrate([8, 8, 8]);
                        }
                        rotateBtn.style.borderColor = '#ff4444';
                        rotateBtn.style.transform = 'scale(0.92)';
                        rotateBtn.style.backgroundColor = 'rgba(255, 68, 68, 0.15)';
                        setTimeout(() => {
                            rotateBtn.style.borderColor = '';
                            rotateBtn.style.transform = '';
                            rotateBtn.style.backgroundColor = '';
                        }, 100);
                    }
                    
                    // Reset rotation timeout - perfect responsiveness
                    setTimeout(() => {
                        this.rotateTimeout = false;
                    }, 50);
                }
            } catch (error) {
                console.error('Rotate error:', error);
                this.rotateTimeout = false;
            }
        });
        setupButton(hardDropBtn, () => {
            // Enhanced hard drop with immediate feedback
            if (!this.gameOver && !this.paused && this.currentPiece) {
                this.hardDrop();
            }
        });
        
        // Touch gestures on game board
        this.setupTouchGestures();
    }
    
    setupTouchGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.gameOver) return;
            
            const touch = e.changedTouches[0];
            const touchEndX = touch.clientX;
            const touchEndY = touch.clientY;
            const touchEndTime = Date.now();
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const deltaTime = touchEndTime - touchStartTime;
            
            // Tap detection (quick touch)
            if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
                this.rotatePiece();
                return;
            }
            
            // Swipe detection
            const minSwipeDistance = 30;
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) {
                        this.movePiece(1, 0); // Right
                    } else {
                        this.movePiece(-1, 0); // Left
                    }
                }
            } else {
                // Vertical swipe
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0) {
                        this.movePiece(0, 1); // Down
                    } else {
                        this.hardDrop(); // Up swipe for hard drop
                    }
                }
            }
        });
        
        // Prevent scrolling on touch
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
    }
    
    generateNextPiece() {
        const pieces = Object.keys(this.tetrominoes);
        const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        const pieceData = this.tetrominoes[randomPiece];
        
        this.nextPiece = {
            type: randomPiece,
            shape: pieceData.shapes[0],
            color: pieceData.color,
            rotation: 0,
            x: 0,
            y: 0
        };
    }
    
    spawnNewPiece() {
        if (this.nextPiece) {
            this.currentPiece = {
                ...this.nextPiece,
                x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.nextPiece.shape[0].length / 2),
                y: 0
            };
        }
        
        this.generateNextPiece();
        
        // Check for game over
        if (this.currentPiece && this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
            this.gameOver = true;
            this.playSound('gameover');
            
            // Apply blur effect to game board
            const gameBoard = document.querySelector('.game-board-container');
            if (gameBoard) {
                gameBoard.classList.add('game-over-blur');
            }
            
            // Send parent message with final score
            window.parent.postMessage({ type: "GAME_OVER", score: this.score }, "*");
        }
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece || this.gameOver) return;
        
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (!this.checkCollision(newX, newY, this.currentPiece.shape)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            this.draw();
            
            // Play move sound for horizontal movement or soft drop
            if (dx !== 0 || dy > 0) {
                this.playSound('move');
            }
        } else if (dy > 0) {
            // Piece hit bottom or another piece
            this.lockPiece();
        }
    }
    
    rotatePiece() {
        if (!this.currentPiece || this.gameOver) return false;
        
        const pieceData = this.tetrominoes[this.currentPiece.type];
        if (!pieceData || !pieceData.shapes) return false;
        
        const nextRotation = (this.currentPiece.rotation + 1) % pieceData.shapes.length;
        const rotatedShape = pieceData.shapes[nextRotation];
        
        if (!rotatedShape) return false;
        
        // Try basic rotation
        if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y, rotatedShape)) {
            this.currentPiece.shape = rotatedShape;
            this.currentPiece.rotation = nextRotation;
            this.playSound('rotate');
            return true;
        }
        
        // Wall kick attempts - Enhanced for better rotation near walls
        const kicks = [[-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0], [-1, -1], [1, -1]];
        for (let kick of kicks) {
            const kickX = this.currentPiece.x + kick[0];
            const kickY = this.currentPiece.y + kick[1];
            
            if (!this.checkCollision(kickX, kickY, rotatedShape)) {
                this.currentPiece.x = kickX;
                this.currentPiece.y = kickY;
                this.currentPiece.shape = rotatedShape;
                this.currentPiece.rotation = nextRotation;
                this.playSound('rotate');
                return true;
            }
        }
        
        return false; // Rotation failed
    }
    
    hardDrop() {
        if (!this.currentPiece || this.gameOver) return;
        
        let dropDistance = 0;
        while (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + dropDistance + 1, this.currentPiece.shape)) {
            dropDistance++;
        }
        
        this.currentPiece.y += dropDistance;
        // Removed hard drop scoring - only score on line clears
        this.lockPiece();
    }
    
    checkCollision(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    // Check boundaries
                    if (newX < 0 || newX >= this.BOARD_WIDTH || newY >= this.BOARD_HEIGHT) {
                        return true;
                    }
                    
                    // Check collision with existing blocks
                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    lockPiece() {
        if (!this.currentPiece) return;
        
        // Play lock sound when piece hits ground
        this.playSound('lock');
        
        // Place piece on board
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const boardX = this.currentPiece.x + col;
                    const boardY = this.currentPiece.y + row;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        // Check for completed lines
        this.clearLines();
        
        // Spawn new piece
        this.spawnNewPiece();
        
        // Reset drop time
        this.dropTime = 0;
    }
    
    clearLines() {
        let linesCleared = 0;
        const clearedRows = [];
        
        for (let row = this.BOARD_HEIGHT - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                clearedRows.push(row);
                // Remove the completed line
                this.board.splice(row, 1);
                // Add new empty line at top
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                row++; // Check the same row again
            }
        }
        
        if (linesCleared > 0) {
            // Play line clear sound
            this.playSound('line');
            
            // Create particle effects for cleared lines
            this.createLineClearParticles(clearedRows);
            
            // Update score based on lines cleared
            const lineScores = [0, 100, 300, 500, 800];
            this.score += lineScores[linesCleared] * this.level;
            this.lines += linesCleared;
            
            // Level up every 10 lines
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                // Increase speed (decrease drop interval)
                this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
            }
            
            this.updateDisplay();
        }
    }
    
    updateDisplay() {
        // Update score display
        document.getElementById('score').textContent = this.score.toLocaleString();
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('level').textContent = this.level;
    }
    
    // Enhanced particle system for line clear effects
    createLineClearParticles(clearedRows) {
        const rect = this.canvas.getBoundingClientRect();
        const particleCount = 20; // Increased for more spectacular effect
        
        clearedRows.forEach(row => {
            for (let i = 0; i < particleCount; i++) {
                const x = Math.random() * rect.width;
                const y = (row * this.BLOCK_SIZE) + (this.BLOCK_SIZE / 2);
                
                // Enhanced particle properties for better visual effect
                this.particles.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 12, // Increased velocity range
                    vy: (Math.random() - 0.5) * 12,
                    life: 1.0,
                    decay: 0.015 + Math.random() * 0.02, // Slightly longer life
                    size: 1.5 + Math.random() * 4, // Varied sizes
                    color: `hsl(${100 + Math.random() * 80}, 100%, ${60 + Math.random() * 30}%)`, // Brighter colors
                    sparkle: Math.random() > 0.5 // Some particles sparkle
                });
            }
        });
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Apply gravity and air resistance
            particle.vy += 0.2;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            
            // Update life
            particle.life -= particle.decay;
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            
            // Enhanced glow effect
            this.ctx.shadowBlur = particle.sparkle ? 15 : 8;
            this.ctx.shadowColor = particle.color;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add sparkle effect for special particles
            if (particle.sparkle && particle.life > 0.5) {
                this.ctx.globalAlpha = particle.life * 0.8;
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(particle.x - particle.size * 1.5, particle.y);
                this.ctx.lineTo(particle.x + particle.size * 1.5, particle.y);
                this.ctx.moveTo(particle.x, particle.y - particle.size * 1.5);
                this.ctx.lineTo(particle.x, particle.y + particle.size * 1.5);
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        });
    }
    
    draw() {
        // TECHNICAL FIX - Performance optimization with precise dimensions
        const rect = this.canvas.getBoundingClientRect();
        
        // TECHNICAL FIX - Clear canvas with exact dimensions
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, rect.width, rect.height);
        
        // TECHNICAL FIX - Calculate precise grid offset for perfect centering
        const gridWidth = this.BLOCK_SIZE * this.BOARD_WIDTH;
        const gridHeight = this.BLOCK_SIZE * this.BOARD_HEIGHT;
        const offsetX = (rect.width - gridWidth) / 2;
        const offsetY = (rect.height - gridHeight) / 2;
        
        // TECHNICAL FIX - Draw board with precise positioning
        for (let row = 0; row < this.BOARD_HEIGHT; row++) {
            for (let col = 0; col < this.BOARD_WIDTH; col++) {
                if (this.board[row][col]) {
                    const x = offsetX + col * this.BLOCK_SIZE;
                    const y = offsetY + row * this.BLOCK_SIZE;
                    this.drawBlock(this.ctx, x, y, this.board[row][col]);
                }
            }
        }
        
        // TECHNICAL FIX - Draw current piece with precise positioning
        if (this.currentPiece) {
            for (let row = 0; row < this.currentPiece.shape.length; row++) {
                for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                    if (this.currentPiece.shape[row][col]) {
                        const x = offsetX + (this.currentPiece.x + col) * this.BLOCK_SIZE;
                        const y = offsetY + (this.currentPiece.y + row) * this.BLOCK_SIZE;
                        this.drawBlock(this.ctx, x, y, this.currentPiece.color);
                    }
                }
            }
        }
        
        // Draw particles (line clear effects)
        this.drawParticles();
        
        // Draw next piece
        this.drawNextPiece();
    }
    
    drawNextPiece() {
        // Clear next piece canvas
        const nextRect = this.nextCanvas.getBoundingClientRect();
        this.nextCtx.fillStyle = '#000';
        this.nextCtx.fillRect(0, 0, nextRect.width, nextRect.height);
        
        if (this.nextPiece) {
            const blockSize = Math.min(nextRect.width / 6, nextRect.height / 6);
            const offsetX = (nextRect.width - this.nextPiece.shape[0].length * blockSize) / 2;
            const offsetY = (nextRect.height - this.nextPiece.shape.length * blockSize) / 2;
            
            for (let row = 0; row < this.nextPiece.shape.length; row++) {
                for (let col = 0; col < this.nextPiece.shape[row].length; col++) {
                    if (this.nextPiece.shape[row][col]) {
                        const x = offsetX + col * blockSize;
                        const y = offsetY + row * blockSize;
                        this.drawBlock(this.nextCtx, x, y, this.nextPiece.color, blockSize);
                    }
                }
            }
        }
    }
    
    drawBlock(ctx, x, y, color, size = this.BLOCK_SIZE) {
        // Main block
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x, y, size, 2);
        ctx.fillRect(x, y, 2, size);
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x + size - 2, y + 2, 2, size - 2);
        ctx.fillRect(x + 2, y + size - 2, size - 2, 2);
        
        // Border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);
    }
    
    gameLoop() {
        const currentTime = performance.now();
        
        // Performance optimization - limit updates to necessary intervals
        if (!this.lastUpdateTime) this.lastUpdateTime = currentTime;
        const deltaTime = currentTime - this.lastUpdateTime;
        
        if (!this.gameOver && !this.paused) {
            // Handle automatic piece dropping
            if (currentTime - this.dropTime > this.dropInterval) {
                this.movePiece(0, 1);
                this.dropTime = currentTime;
            }
        }
        
        // Update particles for smooth animation (always update for smooth effects)
        this.updateParticles();
        
        // Optimized rendering - always draw for smooth 60fps experience
        this.draw();
        
        // Update display only when necessary for performance
        if (deltaTime > 16) { // ~60fps throttling
            this.updateDisplay();
        }
        
        this.lastUpdateTime = currentTime;
        
        // Use requestAnimationFrame for smooth 60fps
        requestAnimationFrame(() => this.gameLoop());
    }
    
    restart() {
        // Clear any active control state
        if (this.controlState) {
            this.controlState = {};
        }
        
        // Clear particles
        this.particles = [];
        
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.dropTime = 0;
        this.dropInterval = 1000;
        
        // Remove blur effect from game board
        const gameBoard = document.querySelector('.game-board-container');
        if (gameBoard) {
            gameBoard.classList.remove('game-over-blur');
        }
        
        this.initializeBoard();
        this.generateNextPiece();
        this.spawnNewPiece();
        this.updateDisplay();
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new TetrisGame();
});
