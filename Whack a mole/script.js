const holes = document.querySelectorAll(".hole");
const scoreBoard = document.querySelector(".score");
const timerDisplay = document.querySelector(".timer");
const moles = document.querySelectorAll(".mole");
const hammer = document.querySelector("#hammer");
const gameArea = document.querySelector(".game");
const gameOverOverlay = document.querySelector("#game-over-overlay");
const finalScoreDisplay = document.querySelector("#final-score");
let lastHole;
let timeUp = false;
let score = 0;
let isGameActive = false;
let gameTimer = 120; // 2 minutes in seconds
let timerInterval;

function randomTime(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function randomHole(holes) {
  const idx = Math.floor(Math.random() * holes.length);
  const hole = holes[idx];

  if (hole === lastHole) {
    console.log("Same one");
    return randomHole(holes);
  }

  lastHole = hole;
  return hole;
}

function peep() {
  const time = randomTime(1200, 2500); // Even slower moles - stay up longer
  const hole = randomHole(holes);
  hole.classList.add("up");
  setTimeout(() => {
    hole.classList.remove("up");
    if (!timeUp) {
      // Add delay before next mole appears
      setTimeout(() => {
        peep();
      }, randomTime(300, 800));
    }
  }, time);
}

// Timer functions
function updateTimer() {
  const minutes = Math.floor(gameTimer / 60);
  const seconds = gameTimer % 60;
  timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  if (gameTimer <= 0) {
    endGame();
    return;
  }
  
  gameTimer--;
}

function endGame() {
  timeUp = true;
  isGameActive = false;
  clearInterval(timerInterval);
  hammer.classList.remove("active");
  
  // Show game over overlay with blur
  finalScoreDisplay.textContent = score;
  gameOverOverlay.classList.remove("hidden");
  
  // Send message to parent window
  window.parent.postMessage({ type: "GAME_OVER", score: score }, "*");
}

function startGame() {
  scoreBoard.textContent = 0;
  timerDisplay.textContent = "2:00";
  timeUp = false;
  score = 0;
  gameTimer = 120;
  isGameActive = true;
  hammer.classList.add("active");
  
  // Position hammer below the game area border
  const gameRect = gameArea.getBoundingClientRect();
  const centerX = gameRect.width / 2;
  const centerY = gameRect.height + 40; // 40px below the game area
  
  hammer.style.left = centerX + "px";
  hammer.style.top = centerY + "px";
  
  // Start timer
  timerInterval = setInterval(updateTimer, 1000);
  
  peep();
}

// Auto-start the game when page loads
window.addEventListener('load', () => {
  startGame();
});

function bonk(e) {
  if (!e.isTrusted || !isGameActive) return;
  score++;
  this.classList.remove("up");
  this.classList.add("hit");
  scoreBoard.textContent = score;
  
  // Add explosion effect and score popup
  createExplosionEffect(this);
  createScorePopup(this, 1);
  
  // Trigger realistic hammer swing animation
  hammer.classList.remove("preparing", "miss");
  hammer.classList.add("hit");
  
  // Remove animations after completion
  setTimeout(() => {
    hammer.classList.remove("hit");
    this.classList.remove("hit");
  }, 600);
}

// Hammer drag mechanics
let isDraggingHammer = false;
let hammerStartX = 0;
let hammerStartY = 0;

function startHammerDrag(x, y) {
  if (!isGameActive) return false;
  
  const hammerRect = hammer.getBoundingClientRect();
  const hammerCenterX = hammerRect.left + hammerRect.width / 2;
  const hammerCenterY = hammerRect.top + hammerRect.height / 2;
  
  // Check if click/touch is near the hammer (within 60px radius)
  const distance = Math.sqrt(Math.pow(x - hammerCenterX, 2) + Math.pow(y - hammerCenterY, 2));
  
  if (distance <= 60) {
    isDraggingHammer = true;
    hammerStartX = x;
    hammerStartY = y;
    return true;
  }
  
  return false;
}

function moveHammer(x, y) {
  if (!isGameActive || !isDraggingHammer) return;
  
  const gameRect = gameArea.getBoundingClientRect();
  const relativeX = x - gameRect.left;
  const relativeY = y - gameRect.top;
  
  hammer.style.left = relativeX + "px";
  hammer.style.top = relativeY + "px";
  
  // Check if hammer is over a mole
  const hitMole = checkHammerOverMole(relativeX, relativeY);
  
  // If dragging over a mole, trigger hit
  if (hitMole && !hitMole.classList.contains("hit")) {
    handleSwipeHit(hitMole);
    stopHammerDrag(); // Stop dragging after hit
  }
}

function stopHammerDrag() {
  isDraggingHammer = false;
}

// Handle swipe hit on mole
function handleSwipeHit(moleHole) {
  if (!isGameActive) return;
  
  const mole = moleHole.querySelector('.mole');
  if (!mole) return;
  
  // Increase score
  score++;
  scoreBoard.textContent = score;
  
  // Remove mole and add hit animation
  moleHole.classList.remove("up");
  moleHole.classList.add("hit");
  
  // Add explosion effect and score popup
  createExplosionEffect(moleHole);
  createScorePopup(moleHole, 1);
  
  // Trigger hammer swing animation
  hammer.classList.remove("preparing", "miss");
  hammer.classList.add("hit");
  
  // Remove animations after completion
  setTimeout(() => {
    hammer.classList.remove("hit");
    moleHole.classList.remove("hit");
  }, 600);
  
  console.log("Swipe hit! Score:", score);
}

// Create explosion effect
function createExplosionEffect(moleHole) {
  // The explosion is handled by CSS ::before pseudo-element
  // Add screen shake for extra impact
  gameArea.classList.add('shake');
  setTimeout(() => {
    gameArea.classList.remove('shake');
  }, 300);
}

// Create score popup
function createScorePopup(moleHole, points) {
  const popup = document.createElement('div');
  popup.className = 'score-popup';
  popup.textContent = '+' + points;
  
  // Position popup at the center of the hole
  const holeRect = moleHole.getBoundingClientRect();
  const gameRect = gameArea.getBoundingClientRect();
  
  popup.style.left = (holeRect.left - gameRect.left + holeRect.width / 2) + 'px';
  popup.style.top = (holeRect.top - gameRect.top + holeRect.height / 2) + 'px';
  
  gameArea.appendChild(popup);
  
  // Remove popup after animation
  setTimeout(() => {
    if (popup.parentNode) {
      popup.parentNode.removeChild(popup);
    }
  }, 1000);
}

// Check if hammer is hovering over an active mole
function checkHammerOverMole(x, y) {
  let isOverMole = false;
  let hitMole = null;
  
  holes.forEach(hole => {
    if (hole.classList.contains("up")) {
      const holeRect = hole.getBoundingClientRect();
      const gameRect = gameArea.getBoundingClientRect();
      
      const holeX = holeRect.left - gameRect.left + holeRect.width / 2;
      const holeY = holeRect.top - gameRect.top + holeRect.height / 2;
      
      const distance = Math.sqrt(Math.pow(x - holeX, 2) + Math.pow(y - holeY, 2));
      
      if (distance < 60) { // Within striking distance
        isOverMole = true;
        hitMole = hole;
      }
    }
  });
  
  // Add preparation animation when over mole
  if (isOverMole && !hammer.classList.contains("hit") && !hammer.classList.contains("preparing")) {
    hammer.classList.add("preparing");
    setTimeout(() => {
      hammer.classList.remove("preparing");
    }, 300);
  }
  
  return hitMole;
}

// Add miss animation when clicking empty space
function handleMiss(x, y) {
  if (!isGameActive) return;
  
  hammer.classList.remove("preparing");
  hammer.classList.add("miss");
  
  setTimeout(() => {
    hammer.classList.remove("miss");
  }, 300);
}

// Mouse events for hammer dragging
gameArea.addEventListener("mousemove", (e) => {
  moveHammer(e.clientX, e.clientY);
});

gameArea.addEventListener("mousedown", (e) => {
  const hammerGrabbed = startHammerDrag(e.clientX, e.clientY);
  
  // If hammer wasn't grabbed and not clicking on a mole, show miss animation
  if (!hammerGrabbed && !e.target.classList.contains("mole")) {
    handleMiss(e.clientX, e.clientY);
  }
});

gameArea.addEventListener("mouseup", (e) => {
  stopHammerDrag();
});

// NUCLEAR OPTION - Touch events for mobile with maximum override
gameArea.addEventListener("touchmove", (e) => {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  const touch = e.touches[0];
  moveHammer(touch.clientX, touch.clientY);
}, { passive: false, capture: true });

gameArea.addEventListener("touchstart", (e) => {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  const touch = e.touches[0];
  const hammerGrabbed = startHammerDrag(touch.clientX, touch.clientY);
  
  // If hammer wasn't grabbed and not touching a mole, show miss animation
  if (!hammerGrabbed && !e.target.classList.contains("mole")) {
    handleMiss(touch.clientX, touch.clientY);
  }
}, { passive: false, capture: true });

gameArea.addEventListener("touchend", (e) => {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  stopHammerDrag();
}, { passive: false, capture: true });

// Pointer events for additional compatibility
gameArea.addEventListener("pointermove", (e) => {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  moveHammer(e.clientX, e.clientY);
}, { passive: false, capture: true });

gameArea.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  const hammerGrabbed = startHammerDrag(e.clientX, e.clientY);
  
  // If hammer wasn't grabbed and not clicking on a mole, show miss animation
  if (!hammerGrabbed && !e.target.classList.contains("mole")) {
    handleMiss(e.clientX, e.clientY);
  }
}, { passive: false, capture: true });

gameArea.addEventListener("pointerup", (e) => {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  stopHammerDrag();
}, { passive: false, capture: true });

// Prevent context menu on long press
gameArea.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

// Add click and touch events to moles with nuclear option
moles.forEach((mole) => {
  mole.addEventListener("click", bonk);
  mole.addEventListener("touchstart", (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    bonk.call(mole, e);
  }, { passive: false, capture: true });
  mole.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    bonk.call(mole, e);
  }, { passive: false, capture: true });
});

// Apply nuclear option styles to game area
gameArea.style.touchAction = 'none';
gameArea.style.webkitTouchAction = 'none';
gameArea.style.msTouchAction = 'none';
gameArea.style.pointerEvents = 'auto';
