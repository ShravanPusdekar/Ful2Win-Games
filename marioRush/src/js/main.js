const mario = document.querySelector('.mario')
const pipe = document.querySelector('.pipe')
const board = document.querySelector('.game-board')
const gameOver = document.querySelector('.game-over')
const scoreDisplay = document.getElementById('score-value')
const finalScoreDisplay = document.getElementById('final-score-value')
const timerDisplay = document.getElementById('timer-value')

window.game = window.game || { score: 0 }
var game = window.game

// Initialize audio with error handling
let audioStart, audioGameOver
try {
  audioStart = new Audio('./src/audio/audio_theme.mp3')
  audioGameOver = new Audio('./src/audio/audio_gameover.mp3')
  audioStart.volume = 0.5
  audioGameOver.volume = 0.5
} catch(e) {
  console.log('Audio files could not be loaded')
}

// --- Timer and speed helpers ---
function formatTime(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function setPipeSpeedStage(stage) {
  // Faster overall speed and bigger step per 30s
  if (isMobile) {
    const mobileBaseMultiplier = 1.6
    const mobilePerStageDelta = 0.25
    const mobileMin = 2.0
    const duration = Math.max(mobileMin, (basePipeDurationSec * mobileBaseMultiplier) - (stage * mobilePerStageDelta))
    pipe.style.animationDuration = `${duration}s`
  } else {
    const baseOffset = 0.8 // immediate speed-up from base
    const perStageDelta = 0.7 // additional speed-up each 30s
    const duration = Math.max(0.5, basePipeDurationSec - baseOffset - (stage * perStageDelta))
    pipe.style.animationDuration = `${duration}s`
  }
}

function updateSpeedStage() {
  const elapsed = totalTimeSec - remainingTimeSec
  const stage = Math.min(3, Math.floor(elapsed / 30)) // 0-30,30-60,60-90,90-120
  if (stage !== currentSpeedStage) {
    // Defer applying new stage until pipe loops off-screen to avoid animation jumps
    pendingSpeedStage = stage
  }
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function startTimer() {
  stopTimer()
  remainingTimeSec = totalTimeSec
  if (timerDisplay) timerDisplay.textContent = formatTime(remainingTimeSec)
  updateSpeedStage()

  timerInterval = setInterval(() => {
    if (!gameActive) return
    remainingTimeSec = Math.max(0, remainingTimeSec - 1)
    if (timerDisplay) timerDisplay.textContent = formatTime(remainingTimeSec)
    updateSpeedStage()

    if (remainingTimeSec === 0) {
      // Time up -> trigger game over
      stopTimer()
      const pipePosition = pipe.offsetLeft
      pipe.classList.remove('pipe-animation')
      try {
        const rightStr = window.getComputedStyle(pipe).right || '0px'
        pipe.style.right = rightStr
      } catch(e) {}
      if (audioStart) audioStart.pause()
      if (audioGameOver) {
        audioGameOver.play().catch(e => console.log('Audio play failed:', e))
        setTimeout(() => audioGameOver.pause(), 7000)
      }
      finalScoreDisplay.textContent = score
      gameOver.style.display = 'flex'
      gameActive = false
      window.parent.postMessage({ type: "GAME_OVER", score: game.score }, "*")
    }
  }, 1000)
}

// Detect mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

// Get responsive mario width
const getMarioWidth = () => {
  return parseInt(window.getComputedStyle(mario).width)
}

// Score tracking
let score = 0
let pipeHasPassed = false
let jumpedOverCurrentPipe = false
let onPipe = false
let lastMarioBottom = 0

// Timer and speed control
let timerInterval = null
const totalTimeSec = 120
let remainingTimeSec = totalTimeSec
let currentSpeedStage = -1 // active stage applied to animation
let pendingSpeedStage = -1 // stage to apply at next pipe loop
let basePipeDurationSec = 2 // fallback, will be read from computed styles

const startGame = () => {
  // Reset pipe to start position off the right edge and start animation
  pipe.classList.remove('pipe-animation')
  pipe.style.left = ''
  pipe.style.right = '-10vw'
  void pipe.offsetWidth // reflow to flush styles
  pipe.classList.add('pipe-animation')
  game.score = 0

  // Capture base pipe animation duration from CSS/media queries
  try {
    const durStr = window.getComputedStyle(pipe).animationDuration || '2s'
    const parsed = parseFloat(durStr)
    basePipeDurationSec = (!isNaN(parsed) && parsed > 0) ? parsed : 2
  } catch (e) {
    basePipeDurationSec = 2
  }

  // Initialize speed stage and start timer
  // Set initial speed immediately
  currentSpeedStage = 0
  setPipeSpeedStage(0)
  // Begin timer (which will queue future stage changes)
  startTimer()

  // audio
  if (audioStart) {
    audioStart.play().catch(e => console.log('Audio play failed:', e))
  }
}

const updateScore = () => {
  score++
  scoreDisplay.textContent = score
  game.score = score
}

const jump = () => {
  // Don't jump if already jumping
  if (mario.classList.contains('jump')) {
    return
  }
  
  mario.classList.add('jump')
  
  setTimeout(() => {
    mario.classList.remove('jump')
  }, 800)
}

let gameLoop
let gameActive = true

const loop = () => {
  const gameLoopFrame = () => {
    if (!gameActive) return
    
    const pipePosition = pipe.offsetLeft
    const marioPosition = parseFloat(window
      .getComputedStyle(mario)
      .bottom.replace('px', ''))
    const verticalSpeed = marioPosition - lastMarioBottom
    
    // Get collision boundaries (viewport-accurate)
    const pipeHeight = pipe.offsetHeight
    const marioRect = mario.getBoundingClientRect()
    const pipeRect = pipe.getBoundingClientRect()
    const boardRect = board.getBoundingClientRect()
    
    // Robust horizontal overlap check in viewport coordinates
    const safeMarioLeft = marioRect.left + 12
    const safeMarioRight = marioRect.right - 12
    const overlapLeft = Math.max(safeMarioLeft, pipeRect.left)
    const overlapRight = Math.min(safeMarioRight, pipeRect.right)
    const horizontalOverlap = overlapRight - overlapLeft
    const isColliding = (horizontalOverlap > 8) && (pipeRect.right > boardRect.left + 1)
    
    if (isColliding) {
      const pipeTop = pipeHeight
      
      if (marioPosition >= pipeTop - 1) {
        jumpedOverCurrentPipe = true
      }
      
      // Only land when Mario actually crosses the pipe top this frame
      const isDescending = verticalSpeed < -0.75
      const crossedTopThisFrame = (lastMarioBottom > pipeTop) && (marioPosition <= pipeTop + 1)
      
      if (isDescending && crossedTopThisFrame) {
        // Land smoothly on top of the pipe at the crossing moment
        if (mario.classList.contains('jump')) {
          mario.classList.remove('jump')
        }
        mario.style.transition = 'bottom 140ms ease-out'
        mario.style.bottom = `${pipeTop}px`
        onPipe = true
      } else if (!mario.classList.contains('jump') && !onPipe && marioPosition < pipeTop - 2) {
        // Side collision (below pipe top) while not jumping -> Game Over
        pipe.classList.remove('pipe-animation')
        // Freeze pipe by locking current 'right' position to avoid layout jump
        try {
          const rightStr = window.getComputedStyle(pipe).right || '0px'
          pipe.style.right = rightStr
        } catch(e) {}
        mario.classList.remove('jump')
        mario.style.bottom = `${marioPosition}px`
        mario.src = './src/img/game-over.png'
        mario.style.width = '80px'
        mario.style.marginLeft = ''
        
        if (audioStart) audioStart.pause()
        if (audioGameOver) {
          audioGameOver.play().catch(e => console.log('Audio play failed:', e))
          setTimeout(() => audioGameOver.pause(), 7000)
        }
        
        finalScoreDisplay.textContent = score
        gameOver.style.display = 'flex'
        gameActive = false
        stopTimer()
        window.parent.postMessage({ type: "GAME_OVER", score: game.score }, "*")
        return
      } else {
        // Overlapping from the side while jumping: allow jump to continue (no-op)
      }
    } else {
      // No collision - reset to ground
      if (onPipe && !mario.classList.contains('jump')) {
        mario.style.transition = 'bottom 150ms ease-in'
        mario.style.bottom = '0'
        onPipe = false
      } else if (marioPosition > 0 && !mario.classList.contains('jump')) {
        // Gentle snap back to ground if needed
        mario.style.transition = 'bottom 120ms ease-in'
        mario.style.bottom = '0'
      }
    }
    
    // Score increment when pipe passes Mario
    if (pipeRect.right < marioRect.left && !pipeHasPassed) {
      pipeHasPassed = true
      if (jumpedOverCurrentPipe) {
        updateScore()
      }
    }
    
    // Reset score flag and apply any pending speed stage when pipe loops off-screen
    if (pipeRect.right <= boardRect.left + 1) {
      pipeHasPassed = false
      jumpedOverCurrentPipe = false
      if (pendingSpeedStage !== -1) {
        setPipeSpeedStage(pendingSpeedStage)
        currentSpeedStage = pendingSpeedStage
        pendingSpeedStage = -1
      }
      // Force respawn from the right edge every loop to avoid mid-spawn issues
      pipe.classList.remove('pipe-animation')
      pipe.style.left = ''
      pipe.style.right = '-10vw'
      void pipe.offsetWidth
      pipe.classList.add('pipe-animation')
    }
    
    // Track last bottom for vertical speed next frame
    lastMarioBottom = parseFloat(window.getComputedStyle(mario).bottom.replace('px', '')) || 0
    gameLoop = requestAnimationFrame(gameLoopFrame)
  }
  
  gameLoop = requestAnimationFrame(gameLoopFrame)
}

// Auto-start the game
startGame()
loop()

// Keyboard controls
document.addEventListener('keypress', e => {
  const key = e.key
  if (key === ' ' && gameActive) {
    jump()
  }
})

// Touch controls for game board (tap to jump)
document.addEventListener('touchstart', e => {
  e.preventDefault()  // Prevent double tap zoom
  
  if (gameActive) {
    jump()
  }
}, { passive: false })

// Click controls for desktop
document.addEventListener('click', e => {
  if (gameActive) {
    jump()
  }
})

// Prevent touch scrolling on mobile
document.addEventListener('touchmove', e => {
  e.preventDefault()
}, { passive: false })

