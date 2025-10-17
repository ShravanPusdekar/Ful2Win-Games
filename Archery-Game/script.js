// Game State Variables
var gameState = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    timeLeft: 120, // 2 minutes in seconds
    gameTimer: null,
    arrowsShot: 0,
    maxVisibleArrows: 4,
    arrowElements: [],
    stuckArrows: [] // Arrows that hit the target and stick to it
};

// DOM Elements
var svg = document.querySelector("svg");
var cursor = svg.createSVGPoint();
var arrows = document.querySelector(".arrows");
var scoreElement = document.getElementById("score");
var timerElement = document.getElementById("timer");
var gameOverlay = document.getElementById("game-overlay");
var gameOverScreen = document.getElementById("game-over-screen");
var finalScoreElement = document.getElementById("final-score");
var restartButton = document.getElementById("restart-button");
var instructionsElement = document.getElementById("instructions");

// Game Variables
var randomAngle = 0;
var isDragging = false;
var currentTouch = null;

// Target and collision detection with moving functionality
var target = {
    x: 900,
    y: 249.5,
    originalX: 900,
    originalY: 249.5
};

var lineSegment = {
    x1: 875,
    y1: 280,
    x2: 925,
    y2: 220
};

var pivot = {
    x: 150, // Moved bow 50px to the right
    y: 250
};

// Asset preloading functions
function preloadAssets() {
    return new Promise((resolve, reject) => {
        const imagesToLoad = ['BG.png'];
        let loadedImages = 0;
        const totalImages = imagesToLoad.length;
        
        console.log("Starting to preload", totalImages, "images...");
        
        imagesToLoad.forEach((imageSrc) => {
            const img = new Image();
            
            img.onload = () => {
                loadedImages++;
                console.log(`Loaded: ${imageSrc} (${loadedImages}/${totalImages})`);
                updateLoadingProgress(loadedImages, totalImages);
                
                if (loadedImages === totalImages) {
                    console.log("All images preloaded successfully!");
                    resolve();
                }
            };
            
            img.onerror = () => {
                console.error(`Failed to load: ${imageSrc}`);
                reject(new Error(`Failed to load ${imageSrc}`));
            };
            
            img.src = imageSrc;
        });
    });
}

function showLoadingScreen() {
    // Create loading overlay if it doesn't exist
    let loadingOverlay = document.getElementById('loading-overlay');
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-content">
                <h2>🏹 Loading Archery Game</h2>
                <div class="loading-bar">
                    <div class="loading-progress" id="loading-progress"></div>
                </div>
                <p id="loading-text">Loading assets...</p>
            </div>
        `;
        document.body.appendChild(loadingOverlay);
    }
    loadingOverlay.classList.remove('hidden');
}

function hideLoadingScreen() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

function updateLoadingProgress(loaded, total) {
    const progressBar = document.getElementById('loading-progress');
    const loadingText = document.getElementById('loading-text');
    
    if (progressBar && loadingText) {
        const percentage = (loaded / total) * 100;
        progressBar.style.width = percentage + '%';
        loadingText.textContent = `Loading assets... ${loaded}/${total} (${Math.round(percentage)}%)`;
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
});

function initializeGame() {
    // Debug: Check if all elements are found
    console.log("Initializing game...");
    console.log("Timer element:", timerElement);
    console.log("Score element:", scoreElement);
    console.log("Restart button:", restartButton);
    
    // Show loading message
    showLoadingScreen();
    
    // Preload background image before starting game
    preloadAssets().then(() => {
        console.log("All assets loaded, starting game...");
        
        // NUCLEAR OPTION - Restart button event listeners with maximum override
        restartButton.addEventListener('click', restartGame);
        restartButton.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            restartGame();
        }, { passive: false, capture: true });
        restartButton.addEventListener('pointerdown', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            restartGame();
        }, { passive: false, capture: true });
        
        // Set up touch and mouse controls
        setupControls();
        
        // Hide loading screen and start game
        hideLoadingScreen();
        startGame();
        
        // Initial aim position
        aim({
            clientX: 370,
            clientY: 300
        });
    }).catch((error) => {
        console.error("Error loading assets:", error);
        // Start game anyway with fallback background
        hideLoadingScreen();
        startGame();
    });
}

function setupControls() {
    // Mouse events for desktop
    svg.addEventListener("mousedown", startDraw);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", endDraw);
    
    // Simplified touch events - direct approach
    svg.addEventListener("touchstart", function(e) {
        if (!gameState.isPlaying) return;
        e.preventDefault();
        console.log("SVG touchstart detected");
        const touch = e.touches[0];
        currentTouch = touch.identifier;
        startDraw({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: false });
    
    window.addEventListener("touchmove", function(e) {
        if (!gameState.isPlaying || !isDragging) return;
        e.preventDefault();
        const touch = Array.from(e.touches).find(t => t.identifier === currentTouch);
        if (touch) {
            handleMove({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }, { passive: false });
    
    window.addEventListener("touchend", function(e) {
        if (!gameState.isPlaying || !isDragging) return;
        e.preventDefault();
        console.log("Touch end - shooting arrow");
        currentTouch = null;
        endDraw();
    }, { passive: false });
    
    // SVG touch optimization - Allow interaction while preventing default behaviors
    svg.style.touchAction = 'none';
    svg.style.webkitTouchAction = 'none';
    svg.style.userSelect = 'none';
    svg.style.webkitUserSelect = 'none';
    svg.style.webkitTouchCallout = 'none';
    svg.style.webkitTapHighlightColor = 'transparent';
    
    // MODIFIED - Allow SVG game area touches while preventing other gestures
    document.addEventListener('touchstart', function(e) {
        const allowedElements = ['start-button', 'restart-button'];
        const isButton = allowedElements.some(id => e.target.id === id || e.target.closest('#' + id));
        const isSVG = e.target.closest('svg') || e.target.tagName === 'svg';
        
        // Allow buttons and SVG game area, block everything else
        if (!isButton && !isSVG) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }, { passive: false, capture: true });
    
    document.addEventListener('touchmove', function(e) {
        const isSVG = e.target.closest('svg') || e.target.tagName === 'svg';
        
        // Allow SVG touches during gameplay, prevent everything else
        if (!isSVG || !gameState.isPlaying) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }, { passive: false, capture: true });
    
    document.addEventListener('touchend', function(e) {
        const allowedElements = ['start-button', 'restart-button'];
        const isButton = allowedElements.some(id => e.target.id === id || e.target.closest('#' + id));
        const isSVG = e.target.closest('svg') || e.target.tagName === 'svg';
        
        // Allow buttons and SVG game area, block everything else
        if (!isButton && !isSVG) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }, { passive: false, capture: true });
    
    // Same logic for pointer events
    document.addEventListener('pointerdown', function(e) {
        const allowedElements = ['start-button', 'restart-button'];
        const isButton = allowedElements.some(id => e.target.id === id || e.target.closest('#' + id));
        const isSVG = e.target.closest('svg') || e.target.tagName === 'svg';
        
        // Allow buttons and SVG game area, block everything else
        if (!isButton && !isSVG) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }, { passive: false, capture: true });
    
    document.addEventListener('pointermove', function(e) {
        const isSVG = e.target.closest('svg') || e.target.tagName === 'svg';
        
        // Allow SVG touches during gameplay, prevent everything else
        if (!isSVG || !gameState.isPlaying) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }, { passive: false, capture: true });
    
    document.addEventListener('pointerup', function(e) {
        const allowedElements = ['start-button', 'restart-button'];
        const isButton = allowedElements.some(id => e.target.id === id || e.target.closest('#' + id));
        const isSVG = e.target.closest('svg') || e.target.tagName === 'svg';
        
        // Allow buttons and SVG game area, block everything else
        if (!isButton && !isSVG) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }, { passive: false, capture: true });
}

// Simplified event handlers

function startDraw(e) {
    if (!gameState.isPlaying || document.body.classList.contains('game-blur')) {
        console.log("startDraw called but game not playing or game over");
        return;
    }
    
    console.log("Starting draw - isDragging set to true");
    isDragging = true;
    randomAngle = (Math.random() * Math.PI * 0.03) - 0.015;
    
    TweenMax.to(".arrow-angle use", 0.3, {
        opacity: 1
    });
    
    aim(e);
}

function handleMove(e) {
    if (!gameState.isPlaying || !isDragging || document.body.classList.contains('game-blur')) return;
    aim(e);
}

function endDraw() {
    if (!gameState.isPlaying || !isDragging || document.body.classList.contains('game-blur')) return;
    
    console.log("Ending draw - shooting arrow");
    isDragging = false;
    loose();
}



// Game State Management

function startGame() {
    console.log("Starting game");
    gameState.isPlaying = true;
    gameState.score = 0;
    gameState.timeLeft = 120;
    gameState.arrowsShot = 0;
    
    // Remove blur effect if present
    document.body.classList.remove('game-blur');
    
    // Reset target to original position
    resetTarget();
    
    updateScore();
    updateTimer();
    hideOverlay();
    showInstructions();
    
    // Clear any existing timer first
    if (gameState.gameTimer) {
        clearInterval(gameState.gameTimer);
        gameState.gameTimer = null;
    }
    
    // Start game timer
    gameState.gameTimer = setInterval(function() {
        if (gameState.isPlaying) {
            gameState.timeLeft--;
            updateTimer();
            
            if (gameState.timeLeft <= 0) {
                endGame();
            }
        }
    }, 1000);
}

function restartGame() {
    console.log("Restarting game");
    
    // Clear any existing timers
    if (gameState.gameTimer) {
        clearInterval(gameState.gameTimer);
        gameState.gameTimer = null;
    }
    
    
    // Clear all arrows
    arrows.innerHTML = '';
    gameState.arrowElements = [];
    gameState.stuckArrows = [];
    
    // Reset arrow visibility
    TweenMax.set(".arrow-angle use", { opacity: 0 });
    
    // Reset game state
    gameState.isPlaying = false;
    isDragging = false;
    
    // Start new game directly
    startGame();
}

function endGame() {
    console.log("Ending game");
    gameState.isPlaying = false;
    isDragging = false;
    
    // Clear timer
    if (gameState.gameTimer) {
        clearInterval(gameState.gameTimer);
        gameState.gameTimer = null;
    }
    
    
    hideInstructions();
    
    // Apply blur effect and send message immediately
    document.body.classList.add('game-blur');
    
    // Send game over message to parent window immediately
    window.parent.postMessage({ 
        type: "GAME_OVER", 
        score: gameState.score 
    }, "*");
}

function showGameOverScreen() {
    finalScoreElement.textContent = gameState.score;
    gameOverlay.classList.remove('hidden');
    gameOverScreen.classList.remove('hidden');
}

function hideOverlay() {
    gameOverlay.classList.add('hidden');
}

function showInstructions() {
    instructionsElement.classList.remove('hidden');
}

function hideInstructions() {
    instructionsElement.classList.add('hidden');
}

function updateScore() {
    scoreElement.textContent = gameState.score;
}

function updateTimer() {
    var minutes = Math.floor(gameState.timeLeft / 60);
    var seconds = gameState.timeLeft % 60;
    var timeString = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    
    if (timerElement) {
        timerElement.textContent = timeString;
        
        // Add warning class when time is low
        if (gameState.timeLeft <= 30) {
            timerElement.classList.add('warning');
        } else {
            timerElement.classList.remove('warning');
        }
    } else {
        console.error("Timer element not found!");
    }
}

function addScore(points) {
    gameState.score += points;
    updateScore();
    
    // Show score popup
    showScorePopup(points);
}

function showScorePopup(points) {
    // Create temporary score popup
    var popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.color = '#00ff00';
    popup.style.fontSize = '2em';
    popup.style.fontWeight = 'bold';
    popup.style.textShadow = '0 0 10px #00ff00';
    popup.style.zIndex = '1000';
    popup.style.pointerEvents = 'none';
    popup.textContent = '+' + points;
    
    document.body.appendChild(popup);
    
    // Animate popup
    TweenMax.fromTo(popup, 1, 
        { opacity: 0, scale: 0.5, y: 0 },
        { opacity: 1, scale: 1.2, y: -50, ease: Power2.easeOut }
    );
    
    TweenMax.to(popup, 0.5, {
        delay: 0.5,
        opacity: 0,
        scale: 0.8,
        onComplete: function() {
            document.body.removeChild(popup);
        }
    });
}

function moveTarget() {
    // Generate new random position for target
    var minX = 700; // Keep target in right area
    var maxX = 950;
    var minY = 120; // Higher up
    var maxY = 240; // Don't go below bow level (250)
    
    var newX = minX + Math.random() * (maxX - minX);
    var newY = minY + Math.random() * (maxY - minY);
    
    // Update target position
    target.x = newX;
    target.y = newY;
    
    // Update collision line segment to match new target position
    var offset = 25; // Half the target size
    lineSegment.x1 = newX - offset;
    lineSegment.y1 = newY + offset;
    lineSegment.x2 = newX + offset;
    lineSegment.y2 = newY - offset;
    
    // Animate target to new position
    TweenMax.to("#target", 0.8, {
        x: newX - target.originalX,
        y: newY - target.originalY,
        ease: Power2.easeOut
    });
    
    // Move all stuck arrows with the target, maintaining their relative positions
    gameState.stuckArrows.forEach(function(arrowData) {
        if (arrowData.element && arrowData.element.parentNode) {
            var newArrowX = newX + arrowData.relativeX;
            var newArrowY = newY + arrowData.relativeY;
            
            TweenMax.to(arrowData.element, 0.8, {
                x: newArrowX,
                y: newArrowY,
                rotation: arrowData.rotation + "deg",
                ease: Power2.easeOut
            });
        }
    });
    
    console.log("Target moved to:", newX, newY, "with", gameState.stuckArrows.length, "stuck arrows moving with it");
}

function resetTarget() {
    // Reset target to original position
    target.x = target.originalX;
    target.y = target.originalY;
    
    // Reset collision line segment
    lineSegment.x1 = 875;
    lineSegment.y1 = 280;
    lineSegment.x2 = 925;
    lineSegment.y2 = 220;
    
    // Clear stuck arrows
    gameState.stuckArrows.forEach(function(arrowData) {
        if (arrowData.element && arrowData.element.parentNode) {
            arrowData.element.parentNode.removeChild(arrowData.element);
        }
    });
    gameState.stuckArrows = [];
    
    // Animate target back to original position
    TweenMax.to("#target", 0.5, {
        x: 0,
        y: 0,
        ease: Power2.easeOut
    });
}

function manageArrows(newArrow) {
    // Add new arrow to tracking array
    gameState.arrowElements.push(newArrow);
    
    // Check total visible arrows (flying + stuck)
    var totalVisibleArrows = gameState.arrowElements.length + gameState.stuckArrows.length;
    
    // If we have more than max arrows, remove the oldest arrows
    while (totalVisibleArrows > gameState.maxVisibleArrows) {
        // First try to remove flying arrows
        if (gameState.arrowElements.length > 1) { // Keep at least the current arrow
            var oldestArrow = gameState.arrowElements.shift();
            if (oldestArrow && oldestArrow.parentNode) {
                TweenMax.to(oldestArrow, 0.5, {
                    opacity: 0,
                    onComplete: function() {
                        if (oldestArrow.parentNode) {
                            oldestArrow.parentNode.removeChild(oldestArrow);
                        }
                    }
                });
            }
        } 
        // If no flying arrows to remove, remove oldest stuck arrow
        else if (gameState.stuckArrows.length > 0) {
            var oldestStuckArrow = gameState.stuckArrows.shift();
            if (oldestStuckArrow.element && oldestStuckArrow.element.parentNode) {
                TweenMax.to(oldestStuckArrow.element, 0.5, {
                    opacity: 0,
                    onComplete: function() {
                        if (oldestStuckArrow.element.parentNode) {
                            oldestStuckArrow.element.parentNode.removeChild(oldestStuckArrow.element);
                        }
                    }
                });
            }
        } else {
            break; // Safety break
        }
        
        totalVisibleArrows = gameState.arrowElements.length + gameState.stuckArrows.length;
    }
}

function aim(e) {
    // get mouse/touch position in relation to svg position and scale
    var point = getMouseSVG(e);
    point.x = Math.min(point.x, pivot.x - 7);
    point.y = Math.max(point.y, pivot.y + 7);
    var dx = point.x - pivot.x;
    var dy = point.y - pivot.y;
    // Make it more difficult by adding random angle each time
    var angle = Math.atan2(dy, dx) + randomAngle;
    var bowAngle = angle - Math.PI;
    var distance = Math.min(Math.sqrt((dx * dx) + (dy * dy)), 50);
    var scale = Math.min(Math.max(distance / 30, 1), 2);
    
    TweenMax.to("#bow", 0.3, {
        scaleX: scale,
        rotation: bowAngle + "rad",
        transformOrigin: "right center"
    });
    
    var arrowX = Math.min(pivot.x - ((1 / scale) * distance), 88);
    TweenMax.to(".arrow-angle", 0.3, {
        rotation: bowAngle + "rad",
        svgOrigin: "150 250"
    });
    
    TweenMax.to(".arrow-angle use", 0.3, {
        x: -distance
    });
    
    TweenMax.to("#bow polyline", 0.3, {
        attr: {
            points: "138,200 " + Math.min(pivot.x - ((1 / scale) * distance), 138) + ",250 138,300"
        }
    });

    var radius = distance * 9;
    var offset = {
        x: (Math.cos(bowAngle) * radius),
        y: (Math.sin(bowAngle) * radius)
    };
    var arcWidth = offset.x * 3;

    TweenMax.to("#arc", 0.3, {
        attr: {
            d: "M150,250c" + offset.x + "," + offset.y + "," + (arcWidth - offset.x) + "," + (offset.y + 50) + "," + arcWidth + ",50"
        },
        autoAlpha: distance/60
    });
}

function loose() {
    if (!gameState.isPlaying) return;
    
    console.log("Shooting arrow");
    gameState.arrowsShot++;
    
    TweenMax.to("#bow", 0.4, {
        scaleX: 1,
        transformOrigin: "right center",
        ease: Elastic.easeOut
    });
    
    TweenMax.to("#bow polyline", 0.4, {
        attr: {
            points: "138,200 138,250 138,300"
        },
        ease: Elastic.easeOut
    });
    
    // duplicate arrow
    var newArrow = document.createElementNS("http://www.w3.org/2000/svg", "use");
    newArrow.setAttributeNS('http://www.w3.org/1999/xlink', 'href', "#arrow");
    arrows.appendChild(newArrow);
    
    // Manage arrow count (limit to 4 visible)
    manageArrows(newArrow);

    // animate arrow along path
    var path = MorphSVGPlugin.pathDataToBezier("#arc");
    TweenMax.to([newArrow], 0.5, {
        force3D: true,
        bezier: {
            type: "cubic",
            values: path,
            autoRotate: ["x", "y", "rotation"]
        },
        onUpdate: hitTest,
        onUpdateParams: ["{self}"],
        onComplete: onMiss,
        ease: Linear.easeNone
    });
    
    TweenMax.to("#arc", 0.3, {
        opacity: 0
    });
    
    //hide previous arrow
    TweenMax.set(".arrow-angle use", {
        opacity: 0
    });
}

function hitTest(tween) {
    if (!gameState.isPlaying) return;
    
    // check for collisions with arrow and target
    var arrow = tween.target[0];
    var transform = arrow._gsTransform;
    var radians = transform.rotation * Math.PI / 180;
    var arrowSegment = {
        x1: transform.x,
        y1: transform.y,
        x2: (Math.cos(radians) * 60) + transform.x,
        y2: (Math.sin(radians) * 60) + transform.y
    }

    var intersection = getIntersection(arrowSegment, lineSegment);
    if (intersection.segment1 && intersection.segment2) {
        tween.pause();
        var dx = intersection.x - target.x;
        var dy = intersection.y - target.y;
        var distance = Math.sqrt((dx * dx) + (dy * dy));
        
        var selector = ".hit";
        var points = 50; // Hit points
        
        if (distance < 7) {
            selector = ".bullseye";
            points = 100; // Bullseye points
        }
        
        // Add score
        addScore(points);
        showMessage(selector);
        
        // Make the arrow stick to the target and move with it
        var hitArrow = tween.target[0];
        if (hitArrow && hitArrow.parentNode) {
            // Remove from flying arrows array
            var index = gameState.arrowElements.indexOf(hitArrow);
            if (index > -1) {
                gameState.arrowElements.splice(index, 1);
            }
            
            // Calculate relative position to target center
            var arrowData = {
                element: hitArrow,
                relativeX: intersection.x - target.x,
                relativeY: intersection.y - target.y,
                rotation: hitArrow._gsTransform ? hitArrow._gsTransform.rotation : 0
            };
            gameState.stuckArrows.push(arrowData);
            
            // Position arrow at the hit location initially
            TweenMax.set(hitArrow, {
                x: intersection.x,
                y: intersection.y,
                rotation: arrowData.rotation + "deg"
            });
            
            console.log("Arrow stuck to target at relative position:", arrowData.relativeX, arrowData.relativeY);
        }
        
        // Move target after hit to increase difficulty
        moveTarget();
    }
}

function onMiss() {
    if (!gameState.isPlaying) return;
    showMessage(".miss");
}

function showMessage(selector) {
    // handle all text animations by providing selector
    TweenMax.killTweensOf(selector);
    TweenMax.killChildTweensOf(selector);
    TweenMax.set(selector, {
        autoAlpha: 1
    });
    TweenMax.staggerFromTo(selector + " path", .5, {
        rotation: -5,
        scale: 0,
        transformOrigin: "center"
    }, {
        scale: 1,
        ease: Back.easeOut
    }, .05);
    TweenMax.staggerTo(selector + " path", .3, {
        delay: 2,
        rotation: 20,
        scale: 0,
        ease: Back.easeIn
    }, .03);
}



function getMouseSVG(e) {
    // normalize mouse/touch position within svg coordinates
    cursor.x = e.clientX;
    cursor.y = e.clientY;
    return cursor.matrixTransform(svg.getScreenCTM().inverse());
}

function getIntersection(segment1, segment2) {
    // find intersection point of two line segments and whether or not the point is on either line segment
    var dx1 = segment1.x2 - segment1.x1;
    var dy1 = segment1.y2 - segment1.y1;
    var dx2 = segment2.x2 - segment2.x1;
    var dy2 = segment2.y2 - segment2.y1;
    var cx = segment1.x1 - segment2.x1;
    var cy = segment1.y1 - segment2.y1;
    var denominator = dy2 * dx1 - dx2 * dy1;
    if (denominator == 0) {
        return null;
    }
    var ua = (dx2 * cy - dy2 * cx) / denominator;
    var ub = (dx1 * cy - dy1 * cx) / denominator;
    return {
        x: segment1.x1 + ua * dx1,
        y: segment1.y1 + ua * dy1,
        segment1: ua >= 0 && ua <= 1,
        segment2: ub >= 0 && ub <= 1
    };
}