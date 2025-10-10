document.addEventListener('DOMContentLoaded', () => {
    const welcomeScreen = document.getElementById('welcome-screen');
    const gameScreen = document.getElementById('game-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const sudokuGrid = document.getElementById('sudoku-grid');
    const playerGridDiv = document.getElementById('player-grid');
    const solutionGridDiv = document.getElementById('solution-grid');
    const livesCounter = document.getElementById('lives-counter');
    const gameOverMessage = document.getElementById('game-over-message');
    
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const numberButtons = document.querySelectorAll('.number-btn');
    const backButton = document.getElementById('back-btn');
    const playAgainBtn = document.getElementById('play-again-btn');

    let selectedCell = null;
    let puzzle = [];
    let initialPuzzle = []; 
    let solution = [];
    let lives = 3;

    const difficulties = {
        easy: 35, 
        medium: 45,
        hard: 55
    };

    difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const difficulty = btn.id.replace('-btn', '');
            startGame(difficulty);
        });
    });

    numberButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (selectedCell) {
                const value = parseInt(btn.textContent);
                updateCell(selectedCell, value);
            }
        });
    });

    backButton.addEventListener('click', () => {
        endGame();
    });

    playAgainBtn.addEventListener('click', () => {
        gameOverScreen.classList.add('hidden');
        welcomeScreen.classList.remove('hidden');
    });

    function startGame(difficulty) {
        const [newPuzzle, newSolution] = generateSudoku(difficulties[difficulty]);
        puzzle = newPuzzle;
        initialPuzzle = JSON.parse(JSON.stringify(newPuzzle));
        solution = newSolution;
        lives = 3;
        livesCounter.textContent = `Lives: ${'❤️'.repeat(lives)}`;
        
        createGrid(sudokuGrid, puzzle, false, true);
        
        welcomeScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
    }

    function createGrid(container, data, highlightIncorrect = false, isInteractive = false) {
        container.innerHTML = '';
        data.flat().forEach((value, index) => {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            
            const row = Math.floor(index / 9);
            const col = index % 9;
            const initialValue = initialPuzzle[row][col];
            
            // This is the key change: use `value` to display the number, regardless of if it's initial or player-entered.
            if (value !== 0) {
                 cell.textContent = value;
            }

            if (initialValue !== 0 && isInteractive) {
                cell.classList.add('given');
                cell.textContent = initialValue; // Ensure initial values are always shown
            }

            if (highlightIncorrect && value !== solution[row][col] && value !== 0) {
                cell.classList.add('incorrect');
            } else if (highlightIncorrect && value === solution[row][col] && value !== 0 && initialValue === 0) {
                 cell.style.color = 'var(--primary-color)';
                 cell.style.fontWeight = 'bold';
            }
            
            if (isInteractive && initialValue === 0) {
                cell.addEventListener('click', () => selectCell(cell));
            }

            container.appendChild(cell);
        });
    }

    function selectCell(cell) {
        if (selectedCell) {
            selectedCell.classList.remove('selected');
        }
        selectedCell = cell;
        selectedCell.classList.add('selected');
    }
    function updateCell(cell, value) {
        const index = Array.from(sudokuGrid.children).indexOf(cell);
        const row = Math.floor(index / 9);
        const col = index % 9;
        
        if (value === solution[row][col]) {
            cell.textContent = value;
            cell.classList.remove('error');
            cell.classList.remove('selected');
            cell.classList.add('user-entered');
            puzzle[row][col] = value;
            selectedCell = null;
            checkWin();
        } else {
            cell.classList.add('error');
            setTimeout(() => {
                cell.classList.remove('error');
            }, 500);
            loseLife();
        }
    }

    function loseLife() {
        lives--;
        livesCounter.textContent = `Lives: ${'❤️'.repeat(lives)}`;
        if (lives === 0) {
            showGameOverScreen(false);
        }
    }
    
    function checkWin() {
        const isComplete = puzzle.flat().every((num, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            return num === solution[row][col];
        });
        
        if (isComplete) {
            showGameOverScreen(true);
        }
    }

    function showGameOverScreen(didWin) {
        gameScreen.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
        
        if (didWin) {
            gameOverMessage.textContent = 'Congratulations! You solved the puzzle!';
            gameOverMessage.style.color = 'var(--primary-color)';
        } else {
            gameOverMessage.textContent = 'Game Over! You ran out of lives.';
            gameOverMessage.style.color = 'var(--secondary-color)';
        }
        
        // Use the puzzle and solution arrays to populate the game over grids
        createGrid(playerGridDiv, puzzle, true, false);
        createGrid(solutionGridDiv, solution, false, false);
        
        selectedCell = null;
    }

    function endGame() {
        gameScreen.classList.add('hidden');
        welcomeScreen.classList.remove('hidden');
        selectedCell = null;
    }

    // Sudoku generation logic (unchanged)
    function generateSudoku(emptyCount) {
        const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
        fillGrid(grid);
        const solutionGrid = JSON.parse(JSON.stringify(grid));
        
        let removedCount = 0;
        while(removedCount < emptyCount) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);
            if (grid[row][col] !== 0) {
                grid[row][col] = 0;
                removedCount++;
            }
        }
        return [grid, solutionGrid];
    }
    
    function fillGrid(grid) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) {
                    const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    for (const num of numbers) {
                        if (isValid(grid, row, col, num)) {
                            grid[row][col] = num;
                            if (fillGrid(grid)) {
                                return true;
                            }
                            grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    function isValid(grid, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (grid[row][i] === num || grid[i][col] === num) return false;
        }
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[boxRow + i][boxCol + j] === num) return false;
            }
        }
        return true;
    }

    function shuffle(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }
});