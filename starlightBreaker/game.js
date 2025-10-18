// 立即执行初始化
(function() {
    console.log('Immediate initialization...');
    
    // 等待DOM准备好
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupInitialState);
    } else {
        setupInitialState();
    }
    
    function setupInitialState() {
        console.log('Setting up initial state...');
        
        // 强制显示开始菜单
        setTimeout(() => {
            const startMenu = document.getElementById('startMenu');
            if (startMenu) {
                startMenu.classList.remove('hidden');
                startMenu.classList.add('active');
                console.log('Start menu forced to show with active class');
            }
            
            // 强制隐藏其他菜单
            const menusToHide = ['pauseMenu', 'instructionsMenu', 'highScoreMenu', 'gameMenu'];
            menusToHide.forEach(menuId => {
                const menu = document.getElementById(menuId);
                if (menu) {
                    menu.classList.remove('active');
                    menu.classList.add('hidden');
                    console.log('Hidden menu:', menuId);
                }
            });
        }, 50);
    }
})();

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 设备和屏幕检测
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isSmallScreen = () => window.innerWidth < 768;
const isVerySmallScreen = () => window.innerWidth < 480;

// 响应式 Canvas 尺寸配置
function getOptimalCanvasSize() {
    const maxWidth = window.innerWidth - 40; // 留边距
    const maxHeight = window.innerHeight - 40; // Reduce UI space reservation to prevent black areas

    const isPortrait = window.innerHeight > window.innerWidth;
    
    let width, height;

    if (isVerySmallScreen()) {
        // 超小屏幕：适应屏幕方向
        if (isPortrait) {
            width = Math.min(maxWidth, 320);
            height = Math.min(maxHeight, 480); // 更高的高度适合竖屏
        } else {
            width = Math.min(320, maxWidth);
            height = Math.min(240, maxHeight);
        }
    } else if (isSmallScreen()) {
        // 小屏幕：适应屏幕方向
        if (isPortrait) {
            width = Math.min(maxWidth, 400);
            height = Math.min(maxHeight, 600); // 竖屏时使用更高的高度
        } else {
            width = Math.min(480, maxWidth);
            height = Math.min(360, maxHeight);
        }
    } else {
        // 桌面：保持原始比例
        const aspectRatio = 4 / 3;
        width = Math.min(800, maxWidth);
        height = Math.min(600, maxHeight);
        
        // 确保保持宽高比
        if (width / height > aspectRatio) {
            width = height * aspectRatio;
        } else {
            height = width / aspectRatio;
        }
    }

    return { width: Math.floor(width), height: Math.floor(height) };
}

// 调整 Canvas 尺寸
function resizeCanvas() {
    // 安全检查：确保 canvas 元素存在
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    const size = getOptimalCanvasSize();
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;

    // 更新 canvas 尺寸
    canvas.width = size.width;
    canvas.height = size.height;

    // 如果游戏正在进行，需要重新缩放游戏元素
    if (gameState === 'playing' && oldWidth !== size.width) {
        const scaleX = size.width / oldWidth;
        const scaleY = size.height / oldHeight;

        // 缩放球的位置
        x = x * scaleX;
        y = y * scaleY;

        // 缩放挡板位置
        paddleX = paddleX * scaleX;

        // 重新初始化砖块位置（通过下次绘制自动更新）
    }

    console.log(`Canvas resized to ${size.width}x${size.height}`);
}

// 性能配置：根据设备调整粒子效果
const performanceConfig = {
    maxParticles: isSmallScreen() ? 50 : 100,  // 移动端减少粒子数量
    particleGenerationRate: isSmallScreen() ? 0.5 : 1,  // 移动端降低生成频率
    explosionParticleCount: isVerySmallScreen() ? 8 : (isSmallScreen() ? 10 : 15)  // 爆炸粒子数量
};


// Nuclear option button setup for mobile webview compatibility
function setupRobustButton(button, action, buttonName) {
    if (!button) {
        console.error(`${buttonName} not found!`);
        return;
    }
    
    // Force touch-action styles
    button.style.touchAction = 'manipulation';
    button.style.webkitTouchAction = 'manipulation';
    button.style.msTouchAction = 'manipulation';
    button.style.userSelect = 'none';
    button.style.webkitUserSelect = 'none';
    button.style.webkitTouchCallout = 'none';
    
    // Create handler with comprehensive event prevention
    const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log(`${buttonName} activated via ${e.type}`);
        action();
    };
    
    // Add multiple event types for maximum compatibility
    button.addEventListener('click', handler, { passive: false, capture: true });
    button.addEventListener('touchstart', handler, { passive: false, capture: true });
    button.addEventListener('touchend', handler, { passive: false, capture: true });
    button.addEventListener('pointerdown', handler, { passive: false, capture: true });
    button.addEventListener('pointerup', handler, { passive: false, capture: true });
    
    console.log(`${buttonName} setup with nuclear option event handlers`);
}

// 监听屏幕尺寸变化
window.addEventListener('resize', () => {
    resizeCanvas();
});

// 音效系统
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// 音效函数
function playSound(frequency, duration, type = 'sine', volume = 0.3) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playBrickHitSound() {
    playSound(800, 0.1, 'square', 0.2);
    setTimeout(() => playSound(600, 0.1, 'square', 0.15), 50);
}

function playPaddleHitSound() {
    playSound(200, 0.2, 'sawtooth', 0.3);
}

function playVictorySound() {
    playSound(523, 0.3, 'sine', 0.4);
    setTimeout(() => playSound(659, 0.3, 'sine', 0.4), 150);
    setTimeout(() => playSound(784, 0.3, 'sine', 0.4), 300);
    setTimeout(() => playSound(1047, 0.5, 'sine', 0.4), 450);
}

function playGameOverSound() {
    playSound(400, 0.5, 'sawtooth', 0.3);
    setTimeout(() => playSound(300, 0.5, 'sawtooth', 0.3), 200);
    setTimeout(() => playSound(200, 0.8, 'sawtooth', 0.3), 400);
}

// 背景音乐
let backgroundMusicPlaying = false;
function playBackgroundMusic() {
    if (!backgroundMusicPlaying) {
        backgroundMusicPlaying = true;
        const playMelody = () => {
            const melody = [262, 294, 330, 349, 392, 440, 494, 523];
            let noteIndex = 0;
            
            const playNote = () => {
                if (backgroundMusicPlaying) {
                    playSound(melody[noteIndex], 0.8, 'sine', 0.1);
                    noteIndex = (noteIndex + 1) % melody.length;
                    setTimeout(playNote, 1000);
                }
            };
            playNote();
        };
        playMelody();
    }
}

function stopBackgroundMusic() {
    backgroundMusicPlaying = false;
    console.log('Background music stopped');
}

let ballRadius = 10;
let x = 0;
let y = 0;
let dx = 0;
let dy = 0;
let currentLevel = 1;

// Removed loop detection variables - using natural physics instead

// Function to advance to next level
function nextLevel() {
    currentLevel++;
    
    // Reset all bricks for next level
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r].status = 1;
        }
    }
    
    // Level completion - continue immediately without popup
    playVictorySound();  // 播放胜利音效
    
    // Get new ball speed for the level
    const ballSpeed = getBallSpeed();
    
    // Reset ball position and speed
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = ballSpeed;
    dy = -ballSpeed;
    
    // Continue playing immediately
    setTimeout(() => {
        draw();
    }, 1000); // Brief pause to let victory sound play
}

// Responsive ball speed based on level (consistent across all devices)
function getBallSpeed() {
    // Use realistic base speed for better gameplay feel
    const baseSpeed = 3; // Increased from 1 to 3 for more realistic movement
    
    // Add level-based speed increase (10% per level, max 2x speed)
    const levelMultiplier = Math.min(2, 1 + (currentLevel - 1) * 0.1);
    const finalSpeed = Math.max(2, Math.floor(baseSpeed * levelMultiplier)); // Ensure minimum speed of 2
    
    return finalSpeed;
}

// Responsive paddle dimensions
function getPaddleDimensions() {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Calculate responsive paddle dimensions
    const paddleWidth = Math.max(60, Math.min(100, Math.floor(canvasWidth * 0.15))); // 15% of canvas width, between 60-100px
    const paddleHeight = Math.max(8, Math.floor(canvasHeight * 0.02)); // 2% of canvas height, minimum 8px
    
    return { paddleWidth, paddleHeight };
}

let paddleX = 0; // Will be initialized properly in initGame()

let rightPressed = false;
let leftPressed = false;

const brickRowCount = 5;
const brickColumnCount = 9;

// Responsive brick dimensions based on canvas size
function getBrickDimensions() {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Calculate responsive dimensions
    const totalHorizontalPadding = 60; // Left and right margins
    const availableWidth = canvasWidth - totalHorizontalPadding;
    const brickPadding = Math.max(2, Math.floor(availableWidth * 0.005)); // 0.5% of available width, minimum 2px (reduced gaps)
    
    // Calculate brick width to fit all bricks with padding
    const totalPaddingWidth = brickPadding * (brickColumnCount - 1);
    const brickWidth = Math.floor((availableWidth - totalPaddingWidth) / brickColumnCount);
    
    // Calculate brick height based on canvas height (responsive)
    const brickHeight = Math.max(18, Math.floor(canvasHeight * 0.04)); // 4% of canvas height, minimum 18px (increased for better hit detection)
    
    // Calculate offsets to center the brick grid
    const totalBricksWidth = (brickWidth * brickColumnCount) + (brickPadding * (brickColumnCount - 1));
    const brickOffsetLeft = Math.floor((canvasWidth - totalBricksWidth) / 2);
    const brickOffsetTop = Math.max(20, Math.floor(canvasHeight * 0.08)); // 8% from top, minimum 20px
    
    return {
        brickWidth,
        brickHeight,
        brickPadding,
        brickOffsetTop,
        brickOffsetLeft,
        brickRowPadding: Math.max(2, Math.floor(canvasHeight * 0.005)) // Small vertical padding between rows
    };
}

let bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
}

let score = 0;
let lives = 3;

const starImage = new Image();
starImage.src = 'start.svg';

const paddleImage = new Image();
paddleImage.src = 'deer.svg';

const tailParticles = [];  // For storing meteor tail particles

// 振动反馈功能
function vibrateDevice(duration = 10) {
    if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate(duration);
    }
}

// 改进的触摸位置计算
function getTouchPosition(touch) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const relativeX = (touch.clientX - rect.left) * scaleX;
    return relativeX;
}

// 鼠标和触摸事件处理
document.addEventListener("mousemove", mouseMoveHandler, false);
document.addEventListener("touchmove", touchMoveHandler, { passive: false });
document.addEventListener("touchstart", touchStartHandler, { passive: false });

function mouseMoveHandler(e) {
    if (gameState !== 'playing') return;
    
    const { paddleWidth } = getPaddleDimensions();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const relativeX = (e.clientX - rect.left) * scaleX;

    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, relativeX - paddleWidth / 2));
    }
}

function touchMoveHandler(e) {
    if (gameState !== 'playing') return;
    
    const { paddleWidth } = getPaddleDimensions();
    const touch = e.touches[0];
    const relativeX = getTouchPosition(touch);

    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, relativeX - paddleWidth / 2));
    }
}

function touchStartHandler(e) {
    e.preventDefault(); // 防止页面滚动

    if (gameState !== 'playing') return;
    
    const { paddleWidth } = getPaddleDimensions();
    const touch = e.touches[0];
    const relativeX = getTouchPosition(touch);

    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, relativeX - paddleWidth / 2));
        vibrateDevice(10); // 轻微振动反馈
    }
}

function collisionDetection() {
    // 确保球的位置值是有效的
    if (!isFinite(x) || !isFinite(y)) {
        return;
    }
    
    // Get responsive brick dimensions
    const dimensions = getBrickDimensions();
    const { brickWidth, brickHeight, brickPadding, brickOffsetTop, brickOffsetLeft, brickRowPadding } = dimensions;
    
    // 预计算球的边界
    const ballLeft = x - ballRadius;
    const ballRight = x + ballRadius;
    const ballTop = y - ballRadius;
    const ballBottom = y + ballRadius;
    
    // 只检测球可能碰撞的砖块区域
    const startCol = Math.max(0, Math.floor((ballLeft - brickOffsetLeft) / (brickWidth + brickPadding)));
    const endCol = Math.min(brickColumnCount - 1, Math.floor((ballRight - brickOffsetLeft) / (brickWidth + brickPadding)));
    const startRow = Math.max(0, Math.floor((ballTop - brickOffsetTop) / (brickHeight + brickRowPadding)));
    const endRow = Math.min(brickRowCount - 1, Math.floor((ballBottom - brickOffsetTop) / (brickHeight + brickRowPadding)));
    
    for (let c = startCol; c <= endCol; c++) {
        for (let r = startRow; r <= endRow; r++) {
            let b = bricks[c][r];
            if (b.status == 1) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.status = 0;
                    score += 5; // 5 points per brick instead of 1
                    generateCollisionEffect(b.x + brickWidth / 2, b.y + brickHeight / 2);  // Generate brick hitting effects
                    playBrickHitSound();  // 播放砖块击中音效
                    vibrateDevice(15);  // 砖块碰撞振动反馈
                    // Check if all bricks in current level are destroyed
                    let remainingBricks = 0;
                    for (let col = 0; col < brickColumnCount; col++) {
                        for (let row = 0; row < brickRowCount; row++) {
                            if (bricks[col][row].status == 1) {
                                remainingBricks++;
                            }
                        }
                    }
                    
                    if (remainingBricks == 0) {
                        nextLevel(); // Advance to next level instead of ending game
                    }
                    return; // 只处理第一个碰撞
                }
            }
        }
    }
}


function drawBall() {
    // 确保位置值是有效的
    if (!isFinite(x) || !isFinite(y) || x <= 0 || y <= 0) {
        return;
    }
    
    // 添加光晕效果
    ctx.beginPath();
    ctx.arc(x, y, ballRadius * 2, 0, Math.PI * 2);
    
    // 确保半径值是有效的
    const radius = ballRadius * 2;
    if (radius > 0) {
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        glowGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
        glowGradient.addColorStop(0.5, "rgba(0, 212, 255, 0.2)");
        glowGradient.addColorStop(1, "rgba(0, 212, 255, 0)");
        ctx.fillStyle = glowGradient;
        ctx.fill();
    }
    ctx.closePath();
    
    // 绘制星星
    if (starImage.complete) {
    ctx.drawImage(starImage, x - ballRadius, y - ballRadius, ballRadius * 2, ballRadius * 2);
    }
}


function drawPaddle() {
    // 确保挡板位置值是有效的
    if (!isFinite(paddleX)) {
        return;
    }
    
    // Get responsive paddle dimensions
    const { paddleWidth, paddleHeight } = getPaddleDimensions();
    
    const scaleFactor = 1.2;  // Scaling factor to slightly increase width and height
    const scaledWidth = paddleWidth * scaleFactor;
    const scaledHeight = paddleHeight * scaleFactor * 6;
    const offsetX = (scaledWidth - paddleWidth) / 2;
    const offsetY = (scaledHeight - paddleHeight) / 2;

    // 添加底部光晕效果
    ctx.beginPath();
    ctx.ellipse(paddleX + paddleWidth/2, canvas.height - paddleHeight/2, 
                scaledWidth/2, scaledHeight/4, 0, 0, Math.PI * 2);
    const paddleGlow = ctx.createRadialGradient(
        paddleX + paddleWidth/2, canvas.height - paddleHeight/2, 0,
        paddleX + paddleWidth/2, canvas.height - paddleHeight/2, scaledWidth/2
    );
    paddleGlow.addColorStop(0, "rgba(0, 255, 100, 0.3)");
    paddleGlow.addColorStop(1, "rgba(0, 255, 100, 0)");
    ctx.fillStyle = paddleGlow;
    ctx.fill();
    ctx.closePath();

    ctx.drawImage(paddleImage, paddleX - offsetX, canvas.height - paddleHeight - offsetY, scaledWidth, scaledHeight);
}

function drawBricks() {
    const colors = [
        { main: "#ff4757", light: "#ff6b7a", dark: "#c44569", glow: "#ff4757" }, // Red
        { main: "#2ed573", light: "#7bed9f", dark: "#2f9e44", glow: "#2ed573" }, // Green  
        { main: "#70a1ff", light: "#5352ed", dark: "#3742fa", glow: "#70a1ff" }, // Blue
        { main: "#ffa502", light: "#ffb142", dark: "#ff6348", glow: "#ffa502" }, // Orange
        { main: "#ff6348", light: "#ff7675", dark: "#e84393", glow: "#ff6348" }  // Pink
    ];
    
    // Get responsive brick dimensions
    const dimensions = getBrickDimensions();
    const { brickWidth, brickHeight, brickPadding, brickOffsetTop, brickOffsetLeft, brickRowPadding } = dimensions;
    
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status == 1) {
                let brickX = Math.floor((c * (brickWidth + brickPadding)) + brickOffsetLeft);
                let brickY = Math.floor((r * (brickHeight + brickRowPadding)) + brickOffsetTop);
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                
                const color = colors[r % colors.length];
                const cornerRadius = Math.min(brickWidth, brickHeight) * 0.15;
                
                // Draw shadow first
                ctx.save();
                ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
                
                // Main brick body with 3D gradient
                const mainGradient = ctx.createLinearGradient(brickX, brickY, brickX, brickY + brickHeight);
                mainGradient.addColorStop(0, color.light);
                mainGradient.addColorStop(0.5, color.main);
                mainGradient.addColorStop(1, color.dark);
                
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(brickX, brickY, brickWidth, brickHeight, cornerRadius);
                } else {
                    ctx.rect(brickX, brickY, brickWidth, brickHeight);
                }
                ctx.fillStyle = mainGradient;
                ctx.fill();
                ctx.restore();
                
                // Inner highlight for 3D effect
                const highlightGradient = ctx.createLinearGradient(brickX, brickY, brickX, brickY + brickHeight * 0.4);
                highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
                highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
                
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(brickX + 2, brickY + 2, brickWidth - 4, brickHeight * 0.4, cornerRadius - 1);
                } else {
                    ctx.rect(brickX + 2, brickY + 2, brickWidth - 4, brickHeight * 0.4);
                }
                ctx.fillStyle = highlightGradient;
                ctx.fill();
                
                // Glowing border
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(brickX, brickY, brickWidth, brickHeight, cornerRadius);
                } else {
                    ctx.rect(brickX, brickY, brickWidth, brickHeight);
                }
                ctx.strokeStyle = color.glow;
                ctx.lineWidth = 1.5;
                ctx.shadowColor = color.glow;
                ctx.shadowBlur = 8;
                ctx.stroke();
                ctx.shadowBlur = 0;
                
                // Inner border for depth
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(brickX + 1, brickY + 1, brickWidth - 2, brickHeight - 2, cornerRadius - 1);
                } else {
                    ctx.rect(brickX + 1, brickY + 1, brickWidth - 2, brickHeight - 2);
                }
                ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
                ctx.lineWidth = 1;
                ctx.stroke();
                
                ctx.closePath();
            }
        }
    }
}

function drawScore() {
    // 响应式字体大小
    const fontSize = isVerySmallScreen() ? 14 : (isSmallScreen() ? 16 : 18);
    ctx.font = `bold ${fontSize}px 'Orbitron', monospace`;
    ctx.fillStyle = "#00d4ff";
    ctx.shadowColor = "#00d4ff";
    ctx.shadowBlur = 10;
    ctx.fillText("SCORE: " + score, 15, 25);
    ctx.shadowBlur = 0;
}

function drawLives() {
    // 响应式字体大小
    const fontSize = isVerySmallScreen() ? 14 : (isSmallScreen() ? 16 : 18);
    ctx.font = `bold ${fontSize}px 'Orbitron', monospace`;
    ctx.fillStyle = "#00d4ff";
    ctx.shadowColor = "#00d4ff";
    ctx.shadowBlur = 10;

    // 根据屏幕大小调整位置
    const textWidth = ctx.measureText("LIVES: " + lives).width;
    ctx.fillText("LIVES: " + lives, canvas.width - textWidth - 15, 25);
    ctx.shadowBlur = 0;
}

function drawLevel() {
    // 响应式字体大小
    const fontSize = isVerySmallScreen() ? 14 : (isSmallScreen() ? 16 : 18);
    ctx.font = `bold ${fontSize}px 'Orbitron', monospace`;
    ctx.fillStyle = "#feca57"; // Golden yellow color for level
    ctx.shadowColor = "#feca57";
    ctx.shadowBlur = 10;

    // Position level in center top
    const text = "LEVEL: " + currentLevel;
    const textWidth = ctx.measureText(text).width;
    ctx.fillText(text, (canvas.width - textWidth) / 2, 25);
    ctx.shadowBlur = 0;
}


function drawTailParticles() {
    // 限制粒子数量以提高性能（使用动态配置）
    if (tailParticles.length > performanceConfig.maxParticles) {
        tailParticles.splice(0, tailParticles.length - performanceConfig.maxParticles);
    }
    
    for (let i = tailParticles.length - 1; i >= 0; i--) {
        let particle = tailParticles[i];
        
        // 更新粒子位置和属性
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.alpha *= 0.98;
        particle.radius *= 0.98;
        
        // 移除过期的粒子
        if (particle.alpha < 0.05 || particle.radius < 1) {
            tailParticles.splice(i, 1);
            continue;
        }
        
        // 绘制粒子
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        
        // 使用预设颜色而不是每次创建渐变
        if (particle.type === 'trail') {
            ctx.fillStyle = `rgba(100, 150, 255, ${particle.alpha})`;
        } else if (particle.type === 'explosion') {
            ctx.fillStyle = `rgba(255, 100, 100, ${particle.alpha})`;
        }
        
        ctx.fill();
        ctx.closePath();
    }
}

function generateTailParticle(x, y) {
    // 确保位置值是有效的
    if (!isFinite(x) || !isFinite(y)) {
        return;
    }

    // 根据性能配置控制粒子生成频率
    if (Math.random() > performanceConfig.particleGenerationRate) {
        return;
    }

    tailParticles.push({
        x: x,
        y: y,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2,
        radius: ballRadius / 3,
        alpha: 1.0,
        type: 'trail'
    });
}

function generateCollisionEffect(x, y) {
    // 确保位置值是有效的
    if (!isFinite(x) || !isFinite(y)) {
        return;
    }

    // 使用性能配置中的粒子数量
    for (let i = 0; i < performanceConfig.explosionParticleCount; i++) {
        tailParticles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 6,
            dy: (Math.random() - 0.5) * 6,
            radius: ballRadius / 2 + Math.random() * 3,
            alpha: 1.0,
            type: 'explosion'
        });
    }
}

function draw() {
    // 确保游戏状态有效
    if (gameState !== 'playing' && gameState !== 'gameOver') {
        return;
    }
    
    // 确保关键变量已初始化
    if (!isFinite(x) || !isFinite(y) || !isFinite(dx) || !isFinite(dy)) {
        console.error('Game variables not properly initialized');
        return;
    }
    
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 设置默认绘制状态
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;
    
    // Ensure crisp rendering
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    
    // 按层次绘制
    drawBricks();
    drawTailParticles();
    drawBall();
    drawPaddle();
    drawScore();
    drawLives();
    drawLevel();
    collisionDetection();

    // Wall collision with minimal randomness to prevent perfect loops
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
        // Add very slight angle variation only to prevent perfect horizontal bouncing
        dy += (Math.random() - 0.5) * 0.1;
    }
    if (y + dy < ballRadius) {
        dy = -dy;
        // Add very slight angle variation only to prevent perfect vertical bouncing
        dx += (Math.random() - 0.5) * 0.1;
    }
    
    // Removed artificial loop detection - let physics handle ball movement naturally

    // Check paddle collision separately and more precisely
    const { paddleWidth, paddleHeight } = getPaddleDimensions();
    const paddleTop = canvas.height - paddleHeight;
    
    // Only check paddle collision if ball is moving downward and near paddle level
    if (dy > 0 && y + dy >= paddleTop - ballRadius && y < paddleTop) {
        // Check if ball overlaps with paddle (including ball radius for more forgiving collision)
        const ballLeft = x - ballRadius;
        const ballRight = x + ballRadius;
        const paddleLeft = paddleX;
        const paddleRight = paddleX + paddleWidth;
        
        // More forgiving collision detection - ball edge can hit paddle edge
        if (ballRight >= paddleLeft && ballLeft <= paddleRight) {
            console.log('Paddle collision detected at x:', x, 'paddleX:', paddleX, 'paddleWidth:', paddleWidth);
            
            // Calculate hit position on paddle (-1 to 1, where 0 is center)
            const hitPosition = (x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
            
            // Calculate current ball speed
            const currentSpeed = Math.sqrt(dx * dx + dy * dy);
            
            // Create new velocity with subtle angle based on hit position
            const bounceAngle = hitPosition * Math.PI / 6; // Max 30 degrees (reduced from 45)
            dx = Math.sin(bounceAngle) * currentSpeed * 0.8; // Reduced horizontal influence
            dy = -Math.abs(Math.cos(bounceAngle) * currentSpeed); // Always upward
            
            y = paddleTop - ballRadius;
            generateCollisionEffect(x, paddleTop);
            playPaddleHitSound();
        }
    }
    
    // Check if ball falls off screen (game over condition)
    if (y + dy > canvas.height - ballRadius) {
        lives--;
        if (lives > 0) {
            // Life lost - reset ball position above paddle (paddle stays where user left it)
            const ballSpeed = getBallSpeed();
            const { paddleWidth } = getPaddleDimensions();
            x = paddleX + paddleWidth / 2; // Position ball above center of paddle
            y = canvas.height - 30;
            dx = ballSpeed;
            dy = -ballSpeed;
            // Removed: paddleX reset - let paddle stay where user positioned it
        } else {
            // Game over - freeze everything and blur screen
            playGameOverSound();  // 播放游戏结束音效
            saveHighScore(score);  // 保存高分
            gameState = 'gameOver'; // New game over state
            backgroundMusicPlaying = false;
            
            // Blur the canvas
            canvas.classList.add('game-over-blur');
            
            // Send postMessage to parent with score
            console.log('Sending GAME_OVER message with score:', score);
            window.parent.postMessage({ type: "GAME_OVER", score: score }, "*");
            
            return; // Stop the game loop - everything frozen in place
        }
    }

    // Only update ball position and continue animation if still playing
    if (gameState === 'playing') {
        x += dx;
        y += dy;
        generateTailParticle(x, y);  // Generate meteor tail particles
        animationId = requestAnimationFrame(draw);
    }
    // If gameState is 'gameOver', everything stays frozen in place
}

// Message popup functionality removed for cleaner gameplay experience

function resetGame() {
    lives = 3;
    score = 0;
    currentLevel = 1; // Reset to level 1
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r].status = 1;
        }
    }
    
    // Remove blur effect if it was applied
    canvas.classList.remove('game-over-blur');
    
    // Reset ball position above paddle without affecting paddle position
    const ballSpeed = getBallSpeed();
    const { paddleWidth } = getPaddleDimensions();
    x = paddleX + paddleWidth / 2; // Position ball above center of paddle
    y = canvas.height - 30;
    dx = ballSpeed;
    dy = -ballSpeed;
    
    gameState = 'playing';
    playBackgroundMusic();  // 开始播放背景音乐
}



function initGame() {
    // Get responsive paddle dimensions for proper initialization
    const { paddleWidth } = getPaddleDimensions();
    
    // Get responsive ball speed
    const ballSpeed = getBallSpeed();
    
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = ballSpeed;
    dy = -ballSpeed;
    
    // Initialize paddle position with responsive width
    paddleX = (canvas.width - paddleWidth) / 2;
    
    gameState = 'playing';
    playBackgroundMusic();  // 开始播放背景音乐
    draw();
}

// 菜单管理
let gameState = 'menu'; // 'menu', 'playing', 'paused'
let animationId;

// 高分榜系统
let highScores = JSON.parse(localStorage.getItem('starlightBreakerHighScores')) || [];

function saveHighScore(score) {
    highScores.push(score);
    highScores.sort((a, b) => b - a);
    highScores = highScores.slice(0, 10); // 只保留前10个高分
    localStorage.setItem('starlightBreakerHighScores', JSON.stringify(highScores));
}

function displayHighScores() {
    const highScoreList = document.getElementById('highScoreList');
    if (highScores.length === 0) {
        highScoreList.innerHTML = '<div class="score-item"><span>No high scores yet!</span></div>';
        return;
    }
    
    highScoreList.innerHTML = highScores.map((score, index) => `
        <div class="score-item">
            <span class="score-rank">#${index + 1}</span>
            <span class="score-value">${score}</span>
        </div>
    `).join('');
}

function showMenu(menuId) {
    console.log('Showing menu:', menuId);
    
    // 隐藏所有菜单
    document.querySelectorAll('.menu').forEach(menu => {
        menu.classList.remove('active');
        menu.classList.add('hidden');
        console.log('Hidden menu:', menu.id);
    });
    
    // 显示指定菜单
    const targetMenu = document.getElementById(menuId);
    if (targetMenu) {
        targetMenu.classList.remove('hidden');
        targetMenu.classList.add('active');
        console.log('Showed menu:', menuId, 'with active class');
    } else {
        console.error('Menu not found:', menuId);
    }
    
    // 隐藏游戏UI
    const gameMenu = document.getElementById('gameMenu');
    if (gameMenu) {
        gameMenu.classList.remove('active');
        gameMenu.classList.add('hidden');
    }
    
    // Start auto-countdown if showing start menu
    if (menuId === 'startMenu') {
        setTimeout(() => {
            startAutoCountdown();
        }, 500); // Small delay to let menu appear first
    }
}

function hideAllMenus() {
    console.log('Hiding all menus and showing game UI');
    
    document.querySelectorAll('.menu').forEach(menu => {
        menu.classList.remove('active');
        menu.classList.add('hidden');
    });
    
    // 显示游戏UI
    const gameMenu = document.getElementById('gameMenu');
    if (gameMenu) {
        gameMenu.classList.remove('hidden');
        gameMenu.classList.add('active');
        console.log('Game UI is now active');
    }
}

function pauseGame() {
    gameState = 'paused';
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    showMenu('pauseMenu');
}

function resumeGame() {
    gameState = 'playing';
    hideAllMenus();
    draw();
}

function restartGame() {
    gameState = 'playing';
    hideAllMenus();
    resetGame();
}

function backToMainMenu() {
    gameState = 'menu';
    backgroundMusicPlaying = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    // Cancel any existing countdown
    cancelAutoCountdown();
    
    // Restore start button if it was hidden
    const startButton = document.getElementById('startGameBtn');
    if (startButton) {
        startButton.style.display = 'block';
    }
    
    showMenu('startMenu');
}

// Auto-start countdown with manual override
let countdownInterval = null;
let countdownActive = false;

function startAutoCountdown() {
    if (countdownActive) return; // Prevent multiple countdowns
    
    countdownActive = true;
    let countdown = 5;
    const startMenu = document.getElementById('startMenu');
    const startButton = document.getElementById('startGameBtn');
    
    // Create small countdown number in top-left
    const countdownDisplay = document.createElement('div');
    countdownDisplay.id = 'autoCountdown';
    countdownDisplay.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        font-size: 24px;
        color: #feca57;
        text-shadow: 0 0 10px rgba(254, 202, 87, 0.8);
        font-weight: 700;
        z-index: 1001;
        font-family: 'Orbitron', monospace;
    `;
    
    // Add to document body instead of menu content
    document.body.appendChild(countdownDisplay);
    
    // Start countdown - just show the number
    countdownDisplay.textContent = countdown;
    
    countdownInterval = setInterval(() => {
        countdown--;
        
        if (countdown > 0) {
            countdownDisplay.textContent = countdown;
        } else {
            // Auto-start the game
            clearInterval(countdownInterval);
            countdownDisplay.remove();
            countdownActive = false;
            
            // Start the game
            gameState = 'playing';
            hideAllMenus();
            initGame();
        }
    }, 1000);
}

function cancelAutoCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    const countdownDisplay = document.getElementById('autoCountdown');
    if (countdownDisplay) {
        countdownDisplay.remove();
    }
    
    countdownActive = false;
}

// 事件监听器
document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM Content Loaded - Initializing game...');

    // 初始化 Canvas 尺寸（必须在 DOM 加载后）
    resizeCanvas();


    // 确保初始状态正确
    gameState = 'menu';

    // 确保开始菜单显示
    setTimeout(() => {
        console.log('Setting up initial menu state...');
        showMenu('startMenu');
    }, 100);
    
    // 开始菜单按钮
    const startGameBtn = document.getElementById('startGameBtn');
    setupRobustButton(startGameBtn, () => {
        console.log('Start game button clicked');
        // Cancel auto countdown and start game immediately
        cancelAutoCountdown();
        gameState = 'playing';
        hideAllMenus();
        initGame();
    }, 'Start Game Button');
    
    // All popup menus and game UI buttons have been removed for clean gameplay
    
    // Keyboard events removed - no pause functionality
    
    // Nuclear option: Document-level touch prevention for webview compatibility
    document.addEventListener('touchstart', (e) => {
        // Allow touches only on buttons and interactive elements
        const target = e.target;
        const isButton = target.tagName === 'BUTTON' || target.closest('button');
        const isCanvas = target.tagName === 'CANVAS';
        
        if (!isButton && !isCanvas) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }, { passive: false, capture: true });
    
    document.addEventListener('touchmove', (e) => {
        // Always prevent touchmove unless on canvas for game control
        const target = e.target;
        const isCanvas = target.tagName === 'CANVAS';
        
        if (!isCanvas) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, { passive: false, capture: true });
    
    document.addEventListener('touchend', (e) => {
        // Allow touchend on buttons and canvas
        const target = e.target;
        const isButton = target.tagName === 'BUTTON' || target.closest('button');
        const isCanvas = target.tagName === 'CANVAS';
        
        if (!isButton && !isCanvas) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }, { passive: false, capture: true });
    
    // Music control for screen changes and device power off
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('Page hidden - stopping background music');
            stopBackgroundMusic();
        }
    });
    
    // Handle page lifecycle events (mobile app switching, device sleep)
    window.addEventListener('pagehide', () => {
        console.log('Page hide - stopping background music');
        stopBackgroundMusic();
    });
    
    window.addEventListener('beforeunload', () => {
        console.log('Before unload - stopping background music');
        stopBackgroundMusic();
    });
    
    // Handle focus loss (window/tab switching)
    window.addEventListener('blur', () => {
        console.log('Window blur - stopping background music');
        stopBackgroundMusic();
    });
    
    // Mobile-specific events
    document.addEventListener('pause', () => {
        console.log('App pause - stopping background music');
        stopBackgroundMusic();
    });
    
    document.addEventListener('resume', () => {
        console.log('App resume - music will restart if game is playing');
        // Music will restart automatically if game is in playing state
    });
    
    console.log('All event listeners set up successfully');
});

// 全局调试函数 - 可以在控制台中调用
window.forceShowStartMenu = function() {
    console.log('Force showing start menu...');
    
    // 隐藏所有菜单
    document.querySelectorAll('.menu').forEach(menu => {
        menu.classList.remove('active');
        menu.classList.add('hidden');
    });
    
    // 显示开始菜单
    const startMenu = document.getElementById('startMenu');
    if (startMenu) {
        startMenu.classList.remove('hidden');
        startMenu.classList.add('active');
        console.log('Start menu is now visible with active class');
    }
    
    // 隐藏游戏UI
    const gameMenu = document.getElementById('gameMenu');
    if (gameMenu) {
        gameMenu.classList.remove('active');
        gameMenu.classList.add('hidden');
    }
    
    // 重置游戏状态
    gameState = 'menu';
    console.log('Game state reset to menu');
};

// 备用初始化 - 如果DOMContentLoaded没有触发
window.addEventListener('load', () => {
    console.log('Window load event - backup initialization');

    // 初始化 Canvas 尺寸（备用）
    if (canvas && canvas.width === 0) {
        resizeCanvas();
    }

    // 确保开始菜单显示
    const startMenu = document.getElementById('startMenu');
    if (startMenu) {
        startMenu.classList.remove('hidden');
        startMenu.classList.add('active');
        console.log('Backup: Start menu set to active');
    }

    // 确保其他菜单隐藏
    const otherMenus = ['pauseMenu', 'instructionsMenu', 'highScoreMenu', 'gameMenu'];
    otherMenus.forEach(menuId => {
        const menu = document.getElementById(menuId);
        if (menu) {
            menu.classList.remove('active');
            menu.classList.add('hidden');
            console.log('Backup: Hidden menu', menuId);
        }
    });
});

// 窗口大小改变时重新调整 Canvas
let resizeTimeout;
window.addEventListener('resize', () => {
    // 使用防抖避免频繁调整
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        resizeCanvas();
        // 如果游戏暂停，重新绘制一次
        if (gameState === 'paused' || gameState === 'menu') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }, 250);
});
