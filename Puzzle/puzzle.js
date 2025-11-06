// Splash Screen and Asset Preloading
document.body.classList.add('loading');

// Array of available images
const images = [
    'Images/Bugs%20bunny.jpg',
    'Images/L.jpg',
    'Images/Lola%20Bunny.jpg',
    'Images/Spiderman.jpg',
    'Images/Tardis.jpg',
    'Images/Tazmanian%20Devil.jpg',
    'Images/vegeta.jpg',
    'Images/Batman.jpg'
];

function preloadAssets() {
    return new Promise((resolve) => {
        const progressFill = document.getElementById('progress-fill');
        const loadingPercentage = document.getElementById('loading-percentage');
        const splashScreen = document.getElementById('splash-screen');
        
        let loadedCount = 0;
        const totalAssets = images.length;
        
        function updateProgress() {
            loadedCount++;
            const percentage = Math.round((loadedCount / totalAssets) * 100);
            progressFill.style.width = percentage + '%';
            loadingPercentage.textContent = percentage + '%';
            
            if (loadedCount === totalAssets) {
                setTimeout(() => {
                    splashScreen.classList.add('fade-out');
                    setTimeout(() => {
                        splashScreen.style.display = 'none';
                        document.body.classList.remove('loading');
                        resolve();
                    }, 500);
                }, 300);
            }
        }
        
        // Preload all images
        images.forEach((imageSrc) => {
            const img = new Image();
            img.onload = updateProgress;
            img.onerror = updateProgress; // Still update progress even if image fails
            img.src = imageSrc;
        });
    });
}

// Global timer control
let globalTimerInterval = null;
let globalTimeRemaining = 120;
let globalGameEnded = false;

function startGameTimer() {
    const timerElement = document.getElementById('timer');
    const timerContainer = document.querySelector('.stat-item.timer');
    const scoreElement = document.getElementById('score');
    
    globalTimerInterval = setInterval(() => {
        if (globalGameEnded) {
            clearInterval(globalTimerInterval);
            return;
        }
        
        globalTimeRemaining--;
        const minutes = Math.floor(globalTimeRemaining / 60);
        const seconds = globalTimeRemaining % 60;
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Warning at 30 seconds
        if (globalTimeRemaining <= 30 && globalTimeRemaining > 10) {
            timerContainer.classList.add('warning');
            timerContainer.classList.remove('danger');
        }
        // Danger at 10 seconds
        else if (globalTimeRemaining <= 10) {
            timerContainer.classList.add('danger');
            timerContainer.classList.remove('warning');
        }
        
        // Time's up!
        if (globalTimeRemaining <= 0) {
            clearInterval(globalTimerInterval);
            globalGameEnded = true;
            
            // Blur the screen
            document.body.classList.add('game-over-blur');
            
            // Send game over message to parent
            window.parent.postMessage({ 
                type: "GAME_OVER", 
                score: 0 
            }, "*");
        }
    }, 1000);
}

// Start preloading assets
preloadAssets().then(() => {
    // Start timer immediately after assets are loaded
    startGameTimer();
});

// Puzzle Drag and Drop Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Prevent all scrolling on the page
    document.body.addEventListener('touchmove', function(e) {
        // Allow scrolling only in the piece-scroller
        if (!e.target.closest('.piece-scroller')) {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.body.addEventListener('wheel', function(e) {
        // Allow scrolling only in the piece-scroller
        if (!e.target.closest('.piece-scroller')) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Apply random image to grid and scroller
    const grid = document.querySelector('g');
    const scroller = document.querySelector('.piece-scroller');
    let currentImageIndex = Math.floor(Math.random() * images.length);
    let currentImage = images[currentImageIndex];
    grid.style.setProperty('--i', `url(${currentImage})`);
    scroller.style.setProperty('--i', `url(${currentImage})`);
    
    // Get all required elements
    const pieces = document.querySelectorAll('b[draggable="true"]');
    const slots = document.querySelectorAll('z');
    let draggedPiece = null;
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    const lockedPieces = new Set();
    
    // Game Stats Tracking
    let totalMoves = 0;
    let firstTryCorrect = 0;
    let currentScore = 0;
    let currentCombo = 0; // Track consecutive correct placements
    const slotAttempted = new Set(); // Track which slots have been attempted
    
    const scoreElement = document.getElementById('score');
    
    function addScore(points, isFirstTry, isCorrect) {
        if (isCorrect) {
            // Base points for correct placement
            currentScore += 10;
            
            // First try bonus
            if (isFirstTry) {
                currentScore += 20;
            }
            
            // Increment combo
            currentCombo++;
            
            // Combo bonuses
            if (currentCombo === 2) {
                currentScore += 50; // x2 combo
            } else if (currentCombo >= 3) {
                currentScore += 70; // x3+ combo
            }
        } else {
            // Reset combo on wrong placement
            currentCombo = 0;
        }
        
        updateScoreDisplay();
    }
    
    function addPuzzleCompleteBonus() {
        currentScore += 150;
        updateScoreDisplay();
    }
    
    function updateScoreDisplay() {
        scoreElement.textContent = currentScore;
    }
    
    function checkGameCompletion() {
        if (lockedPieces.size === 16 && !globalGameEnded) {
            // Add puzzle complete bonus
            addPuzzleCompleteBonus();
            
            // Show completion animation
            grid.classList.add('puzzle-complete');
            
            // Load next puzzle after animation
            setTimeout(() => {
                loadNextPuzzle();
            }, 1000);
        }
    }
    
    function loadNextPuzzle() {
        // Remove completion animation
        grid.classList.remove('puzzle-complete');
        
        // Select random image (different from current)
        let newImageIndex;
        do {
            newImageIndex = Math.floor(Math.random() * images.length);
        } while (newImageIndex === currentImageIndex && images.length > 1);
        
        currentImageIndex = newImageIndex;
        currentImage = images[currentImageIndex];
        
        // Update image for grid and scroller
        grid.style.setProperty('--i', `url(${currentImage})`);
        scroller.style.setProperty('--i', `url(${currentImage})`);
        
        // Reset game state for new puzzle
        lockedPieces.clear();
        slotAttempted.clear();
        totalMoves = 0;
        firstTryCorrect = 0;
        
        // Reset all pieces to scroller
        pieces.forEach(piece => {
            // Remove from body if it's there
            if (piece.parentElement === document.body) {
                scroller.appendChild(piece);
            }
            
            // Reset piece styles
            piece.style.position = '';
            piece.style.left = '';
            piece.style.top = '';
            piece.style.width = '';
            piece.style.height = '';
            piece.style.backgroundSize = '';
            piece.style.boxShadow = '';
            piece.style.cursor = 'grab';
            piece.style.pointerEvents = 'auto';
            piece.style.opacity = '1';
            piece.style.visibility = 'visible';
            
            // Update background image
            const pos = piece.getAttribute('data-pos');
            piece.style.backgroundImage = `url(${currentImage})`;
        });
        
        // Shuffle pieces again
        shufflePieces();
    }
    
    function endGame(success) {
        if (success) {
            // Blur the screen
            document.body.classList.add('game-over-blur');
            
            // Send game over message to parent with final score
            setTimeout(() => {
                window.parent.postMessage({ 
                    type: "GAME_OVER", 
                    score: currentScore 
                }, "*");
            }, 500);
        }
    }
    
    // Get actual grid size
    function getGridSize() {
        return grid.getBoundingClientRect().width;
    }

    // Add drag event listeners to pieces
    pieces.forEach(piece => {
        piece.addEventListener('mousedown', handleMouseDown);
    });
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Shuffle pieces in the scroller
    function shufflePieces() {
        const scroller = document.querySelector('.piece-scroller');
        const piecesArray = Array.from(pieces);
        
        // Fisher-Yates shuffle algorithm
        for (let i = piecesArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [piecesArray[i], piecesArray[j]] = [piecesArray[j], piecesArray[i]];
        }
        
        // Re-append pieces in shuffled order
        piecesArray.forEach(piece => {
            scroller.appendChild(piece);
        });
    }
    
    // Initialize pieces from scroller
    pieces.forEach(piece => {
        const pos = piece.getAttribute('data-pos');
        piece.setAttribute('data-original-pos', pos);
    });
    
    // Shuffle pieces in the scroller
    shufflePieces();

    function handleMouseDown(e) {
        const piece = e.target.closest('b');
        if (!piece || lockedPieces.has(piece)) return;
        
        e.preventDefault();
        isDragging = true;
        draggedPiece = piece;
        
        // If piece is in scroller, move it to body for free positioning
        if (piece.parentElement.classList.contains('piece-scroller')) {
            const rect = piece.getBoundingClientRect();
            
            // Get the background image from the scroller
            const scrollerBg = getComputedStyle(document.querySelector('.piece-scroller')).getPropertyValue('--i');
            const currentBgPosition = getComputedStyle(piece).backgroundPosition;
            
            document.body.appendChild(piece);
            piece.style.position = 'fixed';
            piece.style.left = rect.left + 'px';
            piece.style.top = rect.top + 'px';
            piece.style.width = '70px';
            piece.style.height = '70px';
            piece.style.backgroundImage = scrollerBg;
            piece.style.backgroundPosition = currentBgPosition;
            piece.style.backgroundSize = '280px 280px';
            piece.style.backgroundRepeat = 'no-repeat';
            piece.style.zIndex = '10000';
            piece.style.display = 'block';
            piece.style.visibility = 'visible';
        }
        
        const rect = piece.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        piece.style.cursor = 'grabbing';
        piece.style.opacity = '0.9';
        piece.style.display = 'block';
        piece.style.visibility = 'visible';
    }
    
    function handleMouseMove(e) {
        if (!isDragging || !draggedPiece) return;
        
        e.preventDefault();
        
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        
        draggedPiece.style.left = x + 'px';
        draggedPiece.style.top = y + 'px';
    }
    
    function handleMouseUp(e) {
        if (!isDragging || !draggedPiece) return;
        
        isDragging = false;
        draggedPiece.style.cursor = 'grab';
        draggedPiece.style.opacity = '1';
        
        // Store original position of dragged piece
        const draggedPieceOriginalRect = {
            left: draggedPiece.style.left,
            top: draggedPiece.style.top,
            width: draggedPiece.style.width,
            height: draggedPiece.style.height
        };
        
        // Check if piece is dropped on correct slot
        const pieceRect = draggedPiece.getBoundingClientRect();
        const pieceCenterX = pieceRect.left + pieceRect.width / 2;
        const pieceCenterY = pieceRect.top + pieceRect.height / 2;
        
        // Check if dropped on another piece
        let droppedOnPiece = null;
        const allFixedPieces = Array.from(document.querySelectorAll('body > b')).filter(p => p !== draggedPiece);
        allFixedPieces.forEach(piece => {
            if (lockedPieces.has(piece)) return; // Skip locked pieces
            const otherRect = piece.getBoundingClientRect();
            if (pieceCenterX >= otherRect.left && pieceCenterX <= otherRect.right &&
                pieceCenterY >= otherRect.top && pieceCenterY <= otherRect.bottom) {
                droppedOnPiece = piece;
            }
        });
        
        // If dropped on another unlocked piece, swap positions
        if (droppedOnPiece) {
            const tempLeft = droppedOnPiece.style.left;
            const tempTop = droppedOnPiece.style.top;
            const tempWidth = droppedOnPiece.style.width;
            const tempHeight = droppedOnPiece.style.height;
            
            droppedOnPiece.style.left = draggedPieceOriginalRect.left;
            droppedOnPiece.style.top = draggedPieceOriginalRect.top;
            droppedOnPiece.style.width = draggedPieceOriginalRect.width;
            droppedOnPiece.style.height = draggedPieceOriginalRect.height;
            
            draggedPiece.style.left = tempLeft;
            draggedPiece.style.top = tempTop;
            draggedPiece.style.width = tempWidth;
            draggedPiece.style.height = tempHeight;
            
            draggedPiece = null;
            return;
        }
        
        let droppedOnSlot = null;
        slots.forEach((slot, index) => {
            const slotRect = slot.getBoundingClientRect();
            if (pieceCenterX >= slotRect.left && pieceCenterX <= slotRect.right &&
                pieceCenterY >= slotRect.top && pieceCenterY <= slotRect.bottom) {
                droppedOnSlot = { slot, index: index + 1 };
            }
        });
        
        if (droppedOnSlot) {
            const piecePos = parseInt(draggedPiece.getAttribute('data-pos'));
            const slotIndex = droppedOnSlot.index;
            
            // Track total moves
            totalMoves++;
            
            if (piecePos === slotIndex) {
                // Correct position - lock the piece
                const slotRect = droppedOnSlot.slot.getBoundingClientRect();
                const gridSize = getGridSize();
                draggedPiece.style.position = 'fixed';
                draggedPiece.style.left = slotRect.left + 'px';
                draggedPiece.style.top = slotRect.top + 'px';
                draggedPiece.style.width = slotRect.width + 'px';
                draggedPiece.style.height = slotRect.height + 'px';
                draggedPiece.style.backgroundSize = gridSize + 'px ' + gridSize + 'px';
                draggedPiece.style.boxShadow = 'none';
                draggedPiece.style.cursor = 'default';
                draggedPiece.style.pointerEvents = 'none';
                
                // Add to locked pieces
                lockedPieces.add(draggedPiece);
                
                // Check if first try and add score
                const isFirstTry = !slotAttempted.has(slotIndex);
                if (isFirstTry) {
                    firstTryCorrect++;
                }
                slotAttempted.add(slotIndex);
                
                // Add score for correct placement
                addScore(0, isFirstTry, true);
                
                // Check completion
                checkGameCompletion();
            } else {
                // Wrong position - snap to slot but keep draggable
                const slotRect = droppedOnSlot.slot.getBoundingClientRect();
                const gridSize = getGridSize();
                draggedPiece.style.position = 'fixed';
                draggedPiece.style.left = slotRect.left + 'px';
                draggedPiece.style.top = slotRect.top + 'px';
                draggedPiece.style.width = slotRect.width + 'px';
                draggedPiece.style.height = slotRect.height + 'px';
                draggedPiece.style.backgroundSize = gridSize + 'px ' + gridSize + 'px';
                draggedPiece.style.boxShadow = 'none';
                
                // Mark slot as attempted and reset combo
                slotAttempted.add(slotIndex);
                addScore(0, false, false);
            }
        }
        // If not dropped on slot, piece stays where it was dropped
        
        draggedPiece = null;
    }

    function checkWin() {
        if (lockedPieces.size === 16) {
            // Puzzle completed - all pieces are locked!
        }
    }

    // Add touch support for mobile devices
    pieces.forEach(piece => {
        piece.addEventListener('touchstart', handleTouchStart, { passive: false });
    });
    
    document.addEventListener('touchmove', handleTouchMoveEvent, { passive: false });
    document.addEventListener('touchend', handleTouchEndEvent, { passive: false });

    function handleTouchStart(e) {
        const piece = e.target.closest('b');
        if (!piece || lockedPieces.has(piece)) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        isDragging = true;
        draggedPiece = piece;
        
        // If piece is in scroller, move it to body
        if (piece.parentElement.classList.contains('piece-scroller')) {
            const rect = piece.getBoundingClientRect();
            
            // Get the background image from the scroller
            const scrollerBg = getComputedStyle(document.querySelector('.piece-scroller')).getPropertyValue('--i');
            const currentBgPosition = getComputedStyle(piece).backgroundPosition;
            
            document.body.appendChild(piece);
            piece.style.position = 'fixed';
            piece.style.left = rect.left + 'px';
            piece.style.top = rect.top + 'px';
            piece.style.width = '70px';
            piece.style.height = '70px';
            piece.style.backgroundImage = scrollerBg;
            piece.style.backgroundPosition = currentBgPosition;
            piece.style.backgroundSize = '280px 280px';
            piece.style.backgroundRepeat = 'no-repeat';
            piece.style.zIndex = '10000';
            piece.style.display = 'block';
            piece.style.visibility = 'visible';
        }
        
        const rect = piece.getBoundingClientRect();
        offsetX = touch.clientX - rect.left;
        offsetY = touch.clientY - rect.top;
        
        piece.style.opacity = '0.9';
        piece.style.display = 'block';
        piece.style.visibility = 'visible';
    }

    function handleTouchMoveEvent(e) {
        if (!isDragging || !draggedPiece) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        
        const x = touch.clientX - offsetX;
        const y = touch.clientY - offsetY;
        
        draggedPiece.style.left = x + 'px';
        draggedPiece.style.top = y + 'px';
    }

    function handleTouchEndEvent(e) {
        if (!isDragging || !draggedPiece) return;
        
        isDragging = false;
        draggedPiece.style.opacity = '1';
        
        // Store original position of dragged piece
        const draggedPieceOriginalRect = {
            left: draggedPiece.style.left,
            top: draggedPiece.style.top,
            width: draggedPiece.style.width,
            height: draggedPiece.style.height
        };
        
        const touch = e.changedTouches[0];
        const pieceRect = draggedPiece.getBoundingClientRect();
        const pieceCenterX = pieceRect.left + pieceRect.width / 2;
        const pieceCenterY = pieceRect.top + pieceRect.height / 2;
        
        // Check if dropped on another piece
        let droppedOnPiece = null;
        const allFixedPieces = Array.from(document.querySelectorAll('body > b')).filter(p => p !== draggedPiece);
        allFixedPieces.forEach(piece => {
            if (lockedPieces.has(piece)) return; // Skip locked pieces
            const otherRect = piece.getBoundingClientRect();
            if (pieceCenterX >= otherRect.left && pieceCenterX <= otherRect.right &&
                pieceCenterY >= otherRect.top && pieceCenterY <= otherRect.bottom) {
                droppedOnPiece = piece;
            }
        });
        
        // If dropped on another unlocked piece, swap positions
        if (droppedOnPiece) {
            const tempLeft = droppedOnPiece.style.left;
            const tempTop = droppedOnPiece.style.top;
            const tempWidth = droppedOnPiece.style.width;
            const tempHeight = droppedOnPiece.style.height;
            
            droppedOnPiece.style.left = draggedPieceOriginalRect.left;
            droppedOnPiece.style.top = draggedPieceOriginalRect.top;
            droppedOnPiece.style.width = draggedPieceOriginalRect.width;
            droppedOnPiece.style.height = draggedPieceOriginalRect.height;
            
            draggedPiece.style.left = tempLeft;
            draggedPiece.style.top = tempTop;
            draggedPiece.style.width = tempWidth;
            draggedPiece.style.height = tempHeight;
            
            draggedPiece = null;
            return;
        }
        
        let droppedOnSlot = null;
        slots.forEach((slot, index) => {
            const slotRect = slot.getBoundingClientRect();
            if (pieceCenterX >= slotRect.left && pieceCenterX <= slotRect.right &&
                pieceCenterY >= slotRect.top && pieceCenterY <= slotRect.bottom) {
                droppedOnSlot = { slot, index: index + 1 };
            }
        });
        
        if (droppedOnSlot) {
            const piecePos = parseInt(draggedPiece.getAttribute('data-pos'));
            const slotIndex = droppedOnSlot.index;
            
            // Track total moves
            totalMoves++;
            
            if (piecePos === slotIndex) {
                // Correct position - lock the piece
                const slotRect = droppedOnSlot.slot.getBoundingClientRect();
                const gridSize = getGridSize();
                draggedPiece.style.position = 'fixed';
                draggedPiece.style.left = slotRect.left + 'px';
                draggedPiece.style.top = slotRect.top + 'px';
                draggedPiece.style.width = slotRect.width + 'px';
                draggedPiece.style.height = slotRect.height + 'px';
                draggedPiece.style.backgroundSize = gridSize + 'px ' + gridSize + 'px';
                draggedPiece.style.boxShadow = 'none';
                draggedPiece.style.pointerEvents = 'none';
                
                lockedPieces.add(draggedPiece);
                
                // Check if first try and add score
                const isFirstTry = !slotAttempted.has(slotIndex);
                if (isFirstTry) {
                    firstTryCorrect++;
                }
                slotAttempted.add(slotIndex);
                
                // Add score for correct placement
                addScore(0, isFirstTry, true);
                
                // Check completion
                checkGameCompletion();
            } else {
                // Wrong position
                const slotRect = droppedOnSlot.slot.getBoundingClientRect();
                const gridSize = getGridSize();
                draggedPiece.style.position = 'fixed';
                draggedPiece.style.left = slotRect.left + 'px';
                draggedPiece.style.top = slotRect.top + 'px';
                draggedPiece.style.width = slotRect.width + 'px';
                draggedPiece.style.height = slotRect.height + 'px';
                draggedPiece.style.backgroundSize = gridSize + 'px ' + gridSize + 'px';
                draggedPiece.style.boxShadow = 'none';
                
                // Mark slot as attempted and reset combo
                slotAttempted.add(slotIndex);
                addScore(0, false, false);
            }
        }
        
        draggedPiece = null;
    }
});
