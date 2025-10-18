document.addEventListener("DOMContentLoaded", () => {
    candyCrushGame();
});

function candyCrushGame() {
    // DOM Elements
    const grid = document.querySelector(".grid");
    const scoreDisplay = document.getElementById("score");
    const timerDisplay = document.getElementById("timer");
    const splashScreen = document.getElementById("splashScreen");

    // Game State Variables
    const width = 8;
    const squares = [];
    let score = 0;
    let timeLeft = 0;
    let gameInterval = null;
    let timerInterval = null;

    const candyColors = [
        "url(https://raw.githubusercontent.com/arpit456jain/Amazing-Js-Projects/master/Candy%20Crush/utils/red-candy.png)",
        "url(https://raw.githubusercontent.com/arpit456jain/Amazing-Js-Projects/master/Candy%20Crush/utils/blue-candy.png)",
        "url(https://raw.githubusercontent.com/arpit456jain/Amazing-Js-Projects/master/Candy%20Crush/utils/green-candy.png)",
        "url(https://raw.githubusercontent.com/arpit456jain/Amazing-Js-Projects/master/Candy%20Crush/utils/yellow-candy.png)",
        "url(https://raw.githubusercontent.com/arpit456jain/Amazing-Js-Projects/master/Candy%20Crush/utils/orange-candy.png)",
        "url(https://raw.githubusercontent.com/arpit456jain/Amazing-Js-Projects/master/Candy%20Crush/utils/purple-candy.png)",
    ];

    // Create the Game Board
    function createBoard() {
        grid.innerHTML = ""; // Clear existing grid
        squares.length = 0;  // Clear squares array
        
        // Create squares and generate board without initial matches
        for (let i = 0; i < width * width; i++) {
            const square = document.createElement("div");
            square.setAttribute("draggable", true);
            square.setAttribute("id", i);
            
            // Generate color that doesn't create matches
            let randomColor;
            let attempts = 0;
            do {
                randomColor = Math.floor(Math.random() * candyColors.length);
                attempts++;
            } while (attempts < 10 && wouldCreateMatch(i, randomColor));
            
            square.style.backgroundImage = candyColors[randomColor];
            grid.appendChild(square);
            squares.push(square);
        }
        
        // Add drag event listeners
        squares.forEach(square => square.addEventListener("dragstart", dragStart));
        squares.forEach(square => square.addEventListener("dragend", dragEnd));
        squares.forEach(square => square.addEventListener("dragover", dragOver));
        squares.forEach(square => square.addEventListener("dragenter", dragEnter));
        squares.forEach(square => square.addEventListener("dragleave", dragLeave));
        squares.forEach(square => square.addEventListener("drop", dragDrop));
        
        // Add touch event listeners for mobile
        squares.forEach(square => square.addEventListener("touchstart", touchStart, {passive: false}));
        squares.forEach(square => square.addEventListener("touchmove", touchMove, {passive: false}));
        squares.forEach(square => square.addEventListener("touchend", touchEnd, {passive: false}));
        
        // Clear any accidental matches that might have formed
        setTimeout(() => {
            clearInitialMatches();
            // Ensure there are valid moves available
            ensurePlayableMoves();
        }, 100);
    }

    // Helper function to check if placing a color would create a match
    function wouldCreateMatch(position, colorIndex) {
        const color = candyColors[colorIndex];
        const row = Math.floor(position / width);
        const col = position % width;
        
        // Check horizontal matches (left and right)
        let horizontalCount = 1;
        
        // Check left
        for (let i = col - 1; i >= 0; i--) {
            const checkPos = row * width + i;
            if (checkPos < squares.length && squares[checkPos] && squares[checkPos].style.backgroundImage === color) {
                horizontalCount++;
            } else {
                break;
            }
        }
        
        // Check right
        for (let i = col + 1; i < width; i++) {
            const checkPos = row * width + i;
            if (checkPos < squares.length && squares[checkPos] && squares[checkPos].style.backgroundImage === color) {
                horizontalCount++;
            } else {
                break;
            }
        }
        
        if (horizontalCount >= 3) return true;
        
        // Check vertical matches (up and down)
        let verticalCount = 1;
        
        // Check up
        for (let i = row - 1; i >= 0; i--) {
            const checkPos = i * width + col;
            if (checkPos < squares.length && squares[checkPos] && squares[checkPos].style.backgroundImage === color) {
                verticalCount++;
            } else {
                break;
            }
        }
        
        // Check down
        for (let i = row + 1; i < width; i++) {
            const checkPos = i * width + col;
            if (checkPos < squares.length && squares[checkPos] && squares[checkPos].style.backgroundImage === color) {
                verticalCount++;
            } else {
                break;
            }
        }
        
        return verticalCount >= 3;
    }
    
    // Clear any initial matches that might have formed
    function clearInitialMatches() {
        let hasMatches = true;
        let attempts = 0;
        
        while (hasMatches && attempts < 10) {
            hasMatches = false;
            attempts++;
            
            // Find and replace any matches
            for (let i = 0; i < squares.length; i++) {
                if (isPartOfMatch(i)) {
                    // Replace with a safe color
                    let newColor;
                    let colorAttempts = 0;
                    do {
                        newColor = Math.floor(Math.random() * candyColors.length);
                        colorAttempts++;
                    } while (colorAttempts < 10 && wouldCreateMatch(i, newColor));
                    
                    squares[i].style.backgroundImage = candyColors[newColor];
                    hasMatches = true;
                }
            }
        }
    }
    
    // Check if a position is part of a match
    function isPartOfMatch(position) {
        const color = squares[position].style.backgroundImage;
        if (!color || color === "") return false;
        
        const row = Math.floor(position / width);
        const col = position % width;
        
        // Check horizontal
        let horizontalCount = 1;
        for (let i = col - 1; i >= 0 && squares[row * width + i].style.backgroundImage === color; i--) {
            horizontalCount++;
        }
        for (let i = col + 1; i < width && squares[row * width + i].style.backgroundImage === color; i++) {
            horizontalCount++;
        }
        
        if (horizontalCount >= 3) return true;
        
        // Check vertical
        let verticalCount = 1;
        for (let i = row - 1; i >= 0 && squares[i * width + col].style.backgroundImage === color; i--) {
            verticalCount++;
        }
        for (let i = row + 1; i < width && squares[i * width + col].style.backgroundImage === color; i++) {
            verticalCount++;
        }
        
        return verticalCount >= 3;
    }
    
    // Ensure there are valid moves available on the board
    function ensurePlayableMoves() {
        // Check if there are any valid moves
        let hasValidMoves = false;
        
        for (let i = 0; i < squares.length && !hasValidMoves; i++) {
            const adjacentPositions = [
                i - 1, // left
                i + 1, // right
                i - width, // up
                i + width  // down
            ];
            
            for (let adjPos of adjacentPositions) {
                if (adjPos >= 0 && adjPos < squares.length) {
                    // Simulate the swap
                    const originalColor1 = squares[i].style.backgroundImage;
                    const originalColor2 = squares[adjPos].style.backgroundImage;
                    
                    squares[i].style.backgroundImage = originalColor2;
                    squares[adjPos].style.backgroundImage = originalColor1;
                    
                    // Check if this creates a match
                    if (checkIfMoveCreatesMatch(i, adjPos)) {
                        hasValidMoves = true;
                    }
                    
                    // Revert the swap
                    squares[i].style.backgroundImage = originalColor1;
                    squares[adjPos].style.backgroundImage = originalColor2;
                    
                    if (hasValidMoves) break;
                }
            }
        }
        
        // If no valid moves, shuffle some pieces to create opportunities
        if (!hasValidMoves) {
            // Create a guaranteed match opportunity
            const centerPos = Math.floor(squares.length / 2);
            const sameColor = candyColors[Math.floor(Math.random() * candyColors.length)];
            
            // Place two pieces of the same color with one space between
            if (centerPos + 2 < squares.length) {
                squares[centerPos].style.backgroundImage = sameColor;
                squares[centerPos + 2].style.backgroundImage = sameColor;
                
                // Make sure the middle piece is different
                let differentColor;
                do {
                    differentColor = candyColors[Math.floor(Math.random() * candyColors.length)];
                } while (differentColor === sameColor);
                
                squares[centerPos + 1].style.backgroundImage = differentColor;
            }
        }
    }

    // Drag and Drop Functions
    let colorBeingDragged, colorBeingReplaced, squareIdBeingDragged, squareIdBeingReplaced;

    function dragStart() {
        colorBeingDragged = this.style.backgroundImage;
        squareIdBeingDragged = parseInt(this.id);
    }

    function dragOver(e) {
        e.preventDefault();
    }

    function dragEnter(e) {
        e.preventDefault();
    }

    function dragLeave() {
        // No action needed
    }

    function dragDrop() {
        colorBeingReplaced = this.style.backgroundImage;
        squareIdBeingReplaced = parseInt(this.id);
        // Don't perform swap here - let dragEnd handle it with proper animation
    }

    function dragEnd() {
        // Define valid moves (adjacent squares: left, up, right, down)
        let validMoves = [
            squareIdBeingDragged - 1,
            squareIdBeingDragged - width,
            squareIdBeingDragged + 1,
            squareIdBeingDragged + width
        ];
        let validMove = validMoves.includes(squareIdBeingReplaced);

        if (squareIdBeingReplaced && validMove) {
            // Temporarily swap to check for matches
            squares[squareIdBeingReplaced].style.backgroundImage = colorBeingDragged;
            squares[squareIdBeingDragged].style.backgroundImage = colorBeingReplaced;
            
            // Check if this move creates a match
            if (checkIfMoveCreatesMatch(squareIdBeingDragged, squareIdBeingReplaced)) {
                // Valid move - animate the swap
                squares[squareIdBeingReplaced].style.backgroundImage = colorBeingReplaced;
                squares[squareIdBeingDragged].style.backgroundImage = colorBeingDragged;
                
                animatePieceSwap(squareIdBeingDragged, squareIdBeingReplaced, () => {
                    // Animation complete, matches will be processed by game loop
                });
            } else {
                // Move doesn't create a match - revert and animate invalid move
                squares[squareIdBeingReplaced].style.backgroundImage = colorBeingReplaced;
                squares[squareIdBeingDragged].style.backgroundImage = colorBeingDragged;
                
                animateInvalidMove(squareIdBeingDragged, squareIdBeingReplaced);
            }
        } else if (squareIdBeingReplaced && !validMove) {
            // Invalid move - animate rejection
            animateInvalidMove(squareIdBeingDragged, squareIdBeingReplaced);
        }
    }

    // Touch Event Functions for Mobile
    let touchStartX = 0;
    let touchStartY = 0;
    let touchSquareId = null;

    function touchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchSquareId = parseInt(this.id);
        colorBeingDragged = this.style.backgroundImage;
        squareIdBeingDragged = touchSquareId;
    }

    function touchMove(e) {
        e.preventDefault();
    }

    function touchEnd(e) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Determine swipe direction
        let targetSquareId = null;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > 30) { // Minimum swipe distance
                if (deltaX > 0) {
                    // Swipe right
                    targetSquareId = squareIdBeingDragged + 1;
                } else {
                    // Swipe left
                    targetSquareId = squareIdBeingDragged - 1;
                }
            }
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) > 30) { // Minimum swipe distance
                if (deltaY > 0) {
                    // Swipe down
                    targetSquareId = squareIdBeingDragged + width;
                } else {
                    // Swipe up
                    targetSquareId = squareIdBeingDragged - width;
                }
            }
        }
        
        // Perform the swap if valid
        if (targetSquareId !== null && targetSquareId >= 0 && targetSquareId < squares.length) {
            squareIdBeingReplaced = targetSquareId;
            colorBeingReplaced = squares[targetSquareId].style.backgroundImage;
            colorBeingDragged = squares[squareIdBeingDragged].style.backgroundImage;
            
            // Validate the move
            let validMoves = [
                squareIdBeingDragged - 1,
                squareIdBeingDragged - width,
                squareIdBeingDragged + 1,
                squareIdBeingDragged + width
            ];
            let validMove = validMoves.includes(squareIdBeingReplaced);
            
            if (!validMove) {
                // Invalid move - animate rejection
                animateInvalidMove(squareIdBeingDragged, squareIdBeingReplaced);
            } else {
                // Temporarily swap to check for matches
                squares[squareIdBeingReplaced].style.backgroundImage = colorBeingDragged;
                squares[squareIdBeingDragged].style.backgroundImage = colorBeingReplaced;
                
                // Check if this move creates a match
                if (checkIfMoveCreatesMatch(squareIdBeingDragged, squareIdBeingReplaced)) {
                    // Valid move - revert temporarily and animate the swap
                    squares[squareIdBeingReplaced].style.backgroundImage = colorBeingReplaced;
                    squares[squareIdBeingDragged].style.backgroundImage = colorBeingDragged;
                    
                    animatePieceSwap(squareIdBeingDragged, squareIdBeingReplaced, () => {
                        // Animation complete, matches will be processed by game loop
                    });
                } else {
                    // Move doesn't create a match - revert and animate invalid move
                    squares[squareIdBeingReplaced].style.backgroundImage = colorBeingReplaced;
                    squares[squareIdBeingDragged].style.backgroundImage = colorBeingDragged;
                    
                    animateInvalidMove(squareIdBeingDragged, squareIdBeingReplaced);
                }
            }
        }
    }

    // Helper function to get piece position
    function getPiecePosition(squareId) {
        const row = Math.floor(squareId / width);
        const col = squareId % width;
        const squareSize = squares[0].offsetWidth;
        return {
            x: col * squareSize,
            y: row * squareSize
        };
    }

    // Helper function to calculate movement direction
    function getMovementOffset(fromId, toId) {
        const fromPos = getPiecePosition(fromId);
        const toPos = getPiecePosition(toId);
        return {
            x: toPos.x - fromPos.x,
            y: toPos.y - fromPos.y
        };
    }

    // Animate piece movement
    function animatePieceSwap(piece1Id, piece2Id, onComplete) {
        const piece1 = squares[piece1Id];
        const piece2 = squares[piece2Id];
        
        // Prevent game loop from interfering during animation
        const wasGameRunning = gameInterval !== null;
        if (wasGameRunning) {
            clearInterval(gameInterval);
        }
        
        // Add initial pulse effect to show pieces are being swapped
        piece1.classList.add('swapping');
        piece2.classList.add('swapping');
        
        setTimeout(() => {
            // Remove pulse and start movement
            piece1.classList.remove('swapping');
            piece2.classList.remove('swapping');
            
            // Calculate movement offsets
            const offset1 = getMovementOffset(piece1Id, piece2Id);
            const offset2 = getMovementOffset(piece2Id, piece1Id);
            
            // Add moving class and apply transforms
            piece1.classList.add('moving');
            piece2.classList.add('moving');
            
            // Apply the movement transforms
            piece1.style.transform = `translate(${offset1.x}px, ${offset1.y}px)`;
            piece2.style.transform = `translate(${offset2.x}px, ${offset2.y}px)`;
            
            // Wait for movement animation to complete
            setTimeout(() => {
                // Swap the background images
                const temp = piece1.style.backgroundImage;
                piece1.style.backgroundImage = piece2.style.backgroundImage;
                piece2.style.backgroundImage = temp;
                
                // Reset transforms and remove moving class
                piece1.style.transform = '';
                piece2.style.transform = '';
                piece1.classList.remove('moving');
                piece2.classList.remove('moving');
                
                // Add final confirmation pulse
                piece1.classList.add('swapping');
                piece2.classList.add('swapping');
                
                setTimeout(() => {
                    piece1.classList.remove('swapping');
                    piece2.classList.remove('swapping');
                    
                    // Now check for matches and process them
                    processMatches(() => {
                        // Restart game loop after matches are processed
                        if (wasGameRunning) {
                            gameInterval = setInterval(gameLoop, 100);
                        }
                        if (onComplete) onComplete();
                    });
                }, 250); // Wait for confirmation pulse
                
            }, 250); // Wait for movement
        }, 250); // Wait for initial pulse
    }

    // Animate invalid move (pieces move slightly then return)
    function animateInvalidMove(piece1Id, piece2Id, onComplete) {
        const piece1 = squares[piece1Id];
        const piece2 = squares[piece2Id];
        
        // Add initial pulse to show attempt
        piece1.classList.add('swapping');
        piece2.classList.add('swapping');
        
        setTimeout(() => {
            piece1.classList.remove('swapping');
            piece2.classList.remove('swapping');
            
            // Calculate partial movement (30% of full movement)
            const offset1 = getMovementOffset(piece1Id, piece2Id);
            const offset2 = getMovementOffset(piece2Id, piece1Id);
            
            piece1.classList.add('moving');
            piece2.classList.add('moving');
            
            // Move pieces slightly towards each other
            piece1.style.transform = `translate(${offset1.x * 0.3}px, ${offset1.y * 0.3}px)`;
            piece2.style.transform = `translate(${offset2.x * 0.3}px, ${offset2.y * 0.3}px)`;
            
            // Return to original positions with shake
            setTimeout(() => {
                piece1.style.transform = '';
                piece2.style.transform = '';
                piece1.classList.remove('moving');
                piece2.classList.remove('moving');
                
                // Add shake effect to show invalid
                piece1.classList.add('invalid-move');
                piece2.classList.add('invalid-move');
                
                setTimeout(() => {
                    piece1.classList.remove('invalid-move');
                    piece2.classList.remove('invalid-move');
                    if (onComplete) onComplete();
                }, 400);
            }, 200);
        }, 250);
    }

    // Process matches with smooth animations
    function processMatches(onComplete) {
        // Find all matches with their lengths
        const matchGroups = findAllMatches();
        
        if (matchGroups.length > 0) {
            let matchedSquares = [];
            let totalScore = 0;
            
            // Process each match group and calculate score
            matchGroups.forEach(group => {
                matchedSquares = matchedSquares.concat(group.squares);
                totalScore += calculateMatchScore(group.length);
            });
            
            // Remove duplicates
            matchedSquares = [...new Set(matchedSquares)];
            
            // Add disappearing animation to matched pieces
            matchedSquares.forEach(index => {
                squares[index].classList.add('disappearing');
            });
            
            // Wait for disappearing animation to complete
            setTimeout(() => {
                // Remove the pieces and update score
                matchedSquares.forEach(index => {
                    squares[index].style.backgroundImage = "";
                    squares[index].classList.remove('disappearing');
                });
                
                // Update score with calculated total
                score += totalScore;
                scoreDisplay.innerHTML = score;
                
                // Move pieces down to fill gaps
                moveIntoSquareBelow();
                
                // Check for more matches after pieces fall
                setTimeout(() => {
                    processMatches(onComplete);
                }, 200);
                
            }, 300); // Wait for disappearing animation
        } else {
            // No matches found, complete
            if (onComplete) onComplete();
        }
    }
    
    // Calculate score based on match length
    function calculateMatchScore(matchLength) {
        if (matchLength === 3) return 5;
        if (matchLength === 4) return 10;
        if (matchLength === 5) return 20;
        // For 6+ pieces, double the score for each additional piece
        return 20 * Math.pow(2, matchLength - 5);
    }
    
    // Find all matches and group them by length
    function findAllMatches() {
        let matchGroups = [];
        let processedSquares = new Set();
        
        // Check horizontal matches
        for (let row = 0; row < width; row++) {
            for (let col = 0; col < width - 2; col++) {
                const startIndex = row * width + col;
                if (processedSquares.has(startIndex)) continue;
                
                const color = squares[startIndex].style.backgroundImage;
                if (!color || color === "") continue;
                
                let matchLength = 1;
                let matchSquares = [startIndex];
                
                // Count consecutive matching pieces to the right
                for (let i = col + 1; i < width; i++) {
                    const checkIndex = row * width + i;
                    if (squares[checkIndex].style.backgroundImage === color) {
                        matchLength++;
                        matchSquares.push(checkIndex);
                    } else {
                        break;
                    }
                }
                
                // If we have a match of 3 or more
                if (matchLength >= 3) {
                    matchGroups.push({
                        length: matchLength,
                        squares: matchSquares
                    });
                    // Mark these squares as processed
                    matchSquares.forEach(index => processedSquares.add(index));
                }
            }
        }
        
        // Check vertical matches
        for (let col = 0; col < width; col++) {
            for (let row = 0; row < width - 2; row++) {
                const startIndex = row * width + col;
                if (processedSquares.has(startIndex)) continue;
                
                const color = squares[startIndex].style.backgroundImage;
                if (!color || color === "") continue;
                
                let matchLength = 1;
                let matchSquares = [startIndex];
                
                // Count consecutive matching pieces downward
                for (let i = row + 1; i < width; i++) {
                    const checkIndex = i * width + col;
                    if (squares[checkIndex].style.backgroundImage === color) {
                        matchLength++;
                        matchSquares.push(checkIndex);
                    } else {
                        break;
                    }
                }
                
                // If we have a match of 3 or more
                if (matchLength >= 3) {
                    matchGroups.push({
                        length: matchLength,
                        squares: matchSquares
                    });
                    // Mark these squares as processed
                    matchSquares.forEach(index => processedSquares.add(index));
                }
            }
        }
        
        return matchGroups;
    }
    
    // Find row matches
    function findRowMatches() {
        let matches = [];
        
        // Check for 4 in a row
        for (let i = 0; i < 60; i++) {
            if (i % width >= width - 3) continue;
            let rowOfFour = [i, i + 1, i + 2, i + 3];
            let decidedColor = squares[i].style.backgroundImage;
            const isBlank = squares[i].style.backgroundImage === "";
            if (rowOfFour.every(index => squares[index].style.backgroundImage === decidedColor && !isBlank)) {
                matches = matches.concat(rowOfFour);
            }
        }
        
        // Check for 3 in a row
        for (let i = 0; i < 62; i++) {
            if (i % width >= width - 2) continue;
            let rowOfThree = [i, i + 1, i + 2];
            let decidedColor = squares[i].style.backgroundImage;
            const isBlank = squares[i].style.backgroundImage === "";
            if (rowOfThree.every(index => squares[index].style.backgroundImage === decidedColor && !isBlank)) {
                matches = matches.concat(rowOfThree);
            }
        }
        
        return matches;
    }
    
    // Find column matches
    function findColumnMatches() {
        let matches = [];
        
        // Check for 4 in a column
        for (let i = 0; i < 40; i++) {
            let columnOfFour = [i, i + width, i + 2 * width, i + 3 * width];
            let decidedColor = squares[i].style.backgroundImage;
            const isBlank = squares[i].style.backgroundImage === "";
            if (columnOfFour.every(index => squares[index].style.backgroundImage === decidedColor && !isBlank)) {
                matches = matches.concat(columnOfFour);
            }
        }
        
        // Check for 3 in a column
        for (let i = 0; i < 48; i++) {
            let columnOfThree = [i, i + width, i + 2 * width];
            let decidedColor = squares[i].style.backgroundImage;
            const isBlank = squares[i].style.backgroundImage === "";
            if (columnOfThree.every(index => squares[index].style.backgroundImage === decidedColor && !isBlank)) {
                matches = matches.concat(columnOfThree);
            }
        }
        
        return matches;
    }

    // Check if a move creates a match
    function checkIfMoveCreatesMatch(fromId, toId) {
        // Get the colors after the swap (they're already swapped at this point)
        const fromColor = squares[fromId].style.backgroundImage;
        const toColor = squares[toId].style.backgroundImage;
        
        // Check if either position creates a match of 3 or more
        return checkPositionForMatch(fromId, fromColor) || checkPositionForMatch(toId, toColor);
    }
    
    // Check if a specific position creates a match
    function checkPositionForMatch(position, color) {
        if (!color || color === "") return false;
        
        // Check horizontal matches
        let horizontalCount = 1;
        let row = Math.floor(position / width);
        
        // Check left
        for (let i = position - 1; i >= row * width && squares[i].style.backgroundImage === color; i--) {
            horizontalCount++;
        }
        
        // Check right
        for (let i = position + 1; i < (row + 1) * width && squares[i].style.backgroundImage === color; i++) {
            horizontalCount++;
        }
        
        if (horizontalCount >= 3) return true;
        
        // Check vertical matches
        let verticalCount = 1;
        
        // Check up
        for (let i = position - width; i >= 0 && squares[i].style.backgroundImage === color; i -= width) {
            verticalCount++;
        }
        
        // Check down
        for (let i = position + width; i < width * width && squares[i].style.backgroundImage === color; i += width) {
            verticalCount++;
        }
        
        return verticalCount >= 3;
    }

    // Move Candies Down
    function moveIntoSquareBelow() {
        // Fill empty squares in the first row
        for (let i = 0; i < width; i++) {
            if (squares[i].style.backgroundImage === "") {
                let randomColor = Math.floor(Math.random() * candyColors.length);
                squares[i].style.backgroundImage = candyColors[randomColor];
            }
        }
        // Move candies down to fill gaps
        for (let i = 0; i < width * (width - 1); i++) {
            if (squares[i + width].style.backgroundImage === "") {
                squares[i + width].style.backgroundImage = squares[i].style.backgroundImage;
                squares[i].style.backgroundImage = "";
            }
        }
    }

    // Check for Matches
    function checkRowForFour() {
        for (let i = 0; i < 60; i++) {
            if (i % width >= width - 3) continue; // Skip if not enough columns left
            let rowOfFour = [i, i + 1, i + 2, i + 3];
            let decidedColor = squares[i].style.backgroundImage;
            const isBlank = squares[i].style.backgroundImage === "";
            if (rowOfFour.every(index => squares[index].style.backgroundImage === decidedColor && !isBlank)) {
                score += 4;
                scoreDisplay.innerHTML = score;
                rowOfFour.forEach(index => squares[index].style.backgroundImage = "");
            }
        }
    }

    function checkColumnForFour() {
        for (let i = 0; i < 40; i++) {
            let columnOfFour = [i, i + width, i + 2 * width, i + 3 * width];
            let decidedColor = squares[i].style.backgroundImage;
            const isBlank = squares[i].style.backgroundImage === "";
            if (columnOfFour.every(index => squares[index].style.backgroundImage === decidedColor && !isBlank)) {
                score += 4;
                scoreDisplay.innerHTML = score;
                columnOfFour.forEach(index => squares[index].style.backgroundImage = "");
            }
        }
    }

    function checkRowForThree() {
        for (let i = 0; i < 62; i++) {
            if (i % width >= width - 2) continue; // Skip if not enough columns left
            let rowOfThree = [i, i + 1, i + 2];
            let decidedColor = squares[i].style.backgroundImage;
            const isBlank = squares[i].style.backgroundImage === "";
            if (rowOfThree.every(index => squares[index].style.backgroundImage === decidedColor && !isBlank)) {
                score += 3;
                scoreDisplay.innerHTML = score;
                rowOfThree.forEach(index => squares[index].style.backgroundImage = "");
            }
        }
    }

    function checkColumnForThree() {
        for (let i = 0; i < 48; i++) {
            let columnOfThree = [i, i + width, i + 2 * width];
            let decidedColor = squares[i].style.backgroundImage;
            const isBlank = squares[i].style.backgroundImage === "";
            if (columnOfThree.every(index => squares[index].style.backgroundImage === decidedColor && !isBlank)) {
                score += 3;
                scoreDisplay.innerHTML = score;
                columnOfThree.forEach(index => squares[index].style.backgroundImage = "");
            }
        }
    }

    // Game Loop - simplified since match processing is now handled by animations
    function gameLoop() {
        // Only handle falling pieces, matches are processed by animation system
        moveIntoSquareBelow();
    }

    // Start the Game
    function startGame() {
        splashScreen.style.display = "none";
        grid.style.display = "flex";
        scoreDisplay.parentElement.style.display = "flex"; // Show scoreboard
        createBoard();
        score = 0;
        scoreDisplay.innerHTML = score;
        gameInterval = setInterval(gameLoop, 100);

        timeLeft = 120; // 2 minutes in seconds
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                endGame();
            }
        }, 1000);
    }

    // Update Timer Display
    function updateTimerDisplay() {
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        timerDisplay.innerHTML = `Time Left: ${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    // End Game (Timed Mode)
    function endGame() {
        clearInterval(gameInterval);
        squares.forEach(square => square.setAttribute("draggable", false));
        
        // Blur the screen
        grid.style.filter = "blur(8px)";
        scoreDisplay.parentElement.style.filter = "blur(8px)";
        
        window.parent.postMessage({ type: "GAME_OVER", score: score }, "*");
    }

    // Auto-start game after splash screen (3.5 seconds)
    setTimeout(() => {
        startGame();
    }, 3500);
}