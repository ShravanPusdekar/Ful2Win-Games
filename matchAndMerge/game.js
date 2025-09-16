const grid = document.querySelector(".grid");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const startButton = document.getElementById("start-button");
const overText = document.getElementById("over-text");
const resultText = document.getElementById("result");
const bgMusic = document.getElementById("bg-music");

let squares = [];
let score = 0;
let timerInterval;
let timeLeft;
const width = 4;

function updateTimerDisplay() {
    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const seconds = String(timeLeft % 60).padStart(2, '0');
    timerDisplay.textContent = `${minutes}:${seconds}`;
}

function startTimer() {
    timeLeft = 120;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endGame("time");
        }
    }, 1000);
}

function createBoard() {
    grid.innerHTML = "";
    squares = [];
    score = 0;
    scoreDisplay.textContent = score;

    for (let i = 0; i < width * width; i++) {
        const square = document.createElement("div");
        square.classList.add("box");
        square.classList.add("empty-box");
        square.innerHTML = "";
        grid.appendChild(square);
        squares.push(square);
    }

    generateTile();
    generateTile();
}

function generateTile() {
    const emptySquares = squares.filter(sq => sq.innerHTML === "");
    if (emptySquares.length === 0) return;

    const randomSquare = emptySquares[Math.floor(Math.random() * emptySquares.length)];
    randomSquare.innerHTML = 2;
    updateTileClass(randomSquare);
}

function updateTileClass(tile) {
    tile.className = "box";
    const val = parseInt(tile.innerHTML);
    if (!isNaN(val)) {
        tile.classList.add(`box-${val}`);
        tile.classList.remove("empty-box");
    } else {
        tile.classList.add("empty-box");
    }
}

async function moveLeft() {
    let boardChanged = false;
    for (let i = 0; i < width * width; i += width) {
        let row = [];
        for (let j = 0; j < width; j++) {
            const val = squares[i + j].innerHTML;
            row.push(val === "" ? null : parseInt(val));
        }

        let filtered = row.filter(val => val !== null);
        for (let j = 0; j < filtered.length - 1; j++) {
            if (filtered[j] === filtered[j + 1]) {
                filtered[j] *= 2;
                score += filtered[j];
                filtered[j + 1] = null;
                boardChanged = true;
            }
        }
        
        let compactedRow = filtered.filter(val => val !== null);
        while (compactedRow.length < width) {
            compactedRow.push(null);
        }

        for (let j = 0; j < width; j++) {
            if (squares[i+j].innerHTML != compactedRow[j]) {
                boardChanged = true;
                squares[i+j].innerHTML = compactedRow[j] === null ? "" : compactedRow[j];
                updateTileClass(squares[i+j]);
            }
        }
    }
    scoreDisplay.textContent = score;
    if (boardChanged) {
        await new Promise(resolve => setTimeout(resolve, 200));
        generateTile();
    }
    checkGameOver();
}

async function moveRight() {
    let boardChanged = false;
    for (let i = 0; i < width * width; i += width) {
        let row = [];
        for (let j = 0; j < width; j++) {
            const val = squares[i + j].innerHTML;
            row.push(val === "" ? null : parseInt(val));
        }

        let filtered = row.filter(val => val !== null);
        for (let j = filtered.length - 1; j > 0; j--) {
            if (filtered[j] === filtered[j - 1]) {
                filtered[j] *= 2;
                score += filtered[j];
                filtered[j - 1] = null;
                boardChanged = true;
            }
        }

        let compactedRow = filtered.filter(val => val !== null);
        while (compactedRow.length < width) {
            compactedRow.unshift(null);
        }
        
        for (let j = 0; j < width; j++) {
            if (squares[i+j].innerHTML != compactedRow[j]) {
                boardChanged = true;
                squares[i+j].innerHTML = compactedRow[j] === null ? "" : compactedRow[j];
                updateTileClass(squares[i+j]);
            }
        }
    }
    scoreDisplay.textContent = score;
    if (boardChanged) {
        await new Promise(resolve => setTimeout(resolve, 200));
        generateTile();
    }
    checkGameOver();
}

async function moveUp() {
    let boardChanged = false;
    for (let col = 0; col < width; col++) {
        let column = [];
        for (let row = 0; row < width; row++) {
            const val = squares[col + row * width].innerHTML;
            column.push(val === "" ? null : parseInt(val));
        }

        let filtered = column.filter(val => val !== null);
        for (let i = 0; i < filtered.length - 1; i++) {
            if (filtered[i] === filtered[i + 1]) {
                filtered[i] *= 2;
                score += filtered[i];
                filtered[i + 1] = null;
                boardChanged = true;
            }
        }

        let compactedColumn = filtered.filter(val => val !== null);
        while (compactedColumn.length < width) {
            compactedColumn.push(null);
        }
        
        for (let row = 0; row < width; row++) {
            if (squares[col + row * width].innerHTML != compactedColumn[row]) {
                boardChanged = true;
                squares[col + row * width].innerHTML = compactedColumn[row] === null ? "" : compactedColumn[row];
                updateTileClass(squares[col + row * width]);
            }
        }
    }
    scoreDisplay.textContent = score;
    if (boardChanged) {
        await new Promise(resolve => setTimeout(resolve, 200));
        generateTile();
    }
    checkGameOver();
}

async function moveDown() {
    let boardChanged = false;
    for (let col = 0; col < width; col++) {
        let column = [];
        for (let row = 0; row < width; row++) {
            const val = squares[col + row * width].innerHTML;
            column.push(val === "" ? null : parseInt(val));
        }

        let filtered = column.filter(val => val !== null);
        for (let i = filtered.length - 1; i > 0; i--) {
            if (filtered[i] === filtered[i - 1]) {
                filtered[i] *= 2;
                score += filtered[i];
                filtered[i - 1] = null;
                boardChanged = true;
            }
        }

        let compactedColumn = filtered.filter(val => val !== null);
        while (compactedColumn.length < width) {
            compactedColumn.unshift(null);
        }

        for (let row = 0; row < width; row++) {
            if (squares[col + row * width].innerHTML != compactedColumn[row]) {
                boardChanged = true;
                squares[col + row * width].innerHTML = compactedColumn[row] === null ? "" : compactedColumn[row];
                updateTileClass(squares[col + row * width]);
            }
        }
    }
    scoreDisplay.textContent = score;
    if (boardChanged) {
        await new Promise(resolve => setTimeout(resolve, 200));
        generateTile();
    }
    checkGameOver();
}

function control(e) {
    e.preventDefault();
    switch (e.key) {
        case "ArrowLeft":
            moveLeft();
            break;
        case "ArrowRight":
            moveRight();
            break;
        case "ArrowUp":
            moveUp();
            break;
        case "ArrowDown":
            moveDown();
            break;
    }
}

function checkGameOver() {
    const hasEmptyTile = squares.some(square => square.innerHTML === "");
    if (hasEmptyTile) return;

    for (let i = 0; i < squares.length; i++) {
        const current = parseInt(squares[i].innerHTML);
        const right = i % width < width - 1 ? parseInt(squares[i + 1].innerHTML) : null;
        const down = i + width < width * width ? parseInt(squares[i + width].innerHTML) : null;

        if (current === right || current === down) {
            return;
        }
    }
    endGame("nomoves");
}

function endGame(reason) {
    document.querySelector(".cover-screen").classList.remove("hide");
    overText.classList.remove("hide");

    if (reason === "time") {
        resultText.textContent = `Time's up! Your score: ${score}`;
    } else {
        resultText.textContent = `Your score: ${score}`;
    }

    clearInterval(timerInterval);
    document.removeEventListener("keydown", control);
    startButton.classList.add("hide");

    bgMusic.pause();

    const origin = window.location.hostname.includes("localhost")
        ? "http://localhost:5173"
        : "https://fulboost.fun";

    window.parent.postMessage({ type: "GAME_OVER", score: score }, origin);
}

startButton.addEventListener("click", () => {
    startButton.classList.remove("hide");
    document.querySelector(".cover-screen").classList.add("hide");
    document.querySelector(".container").classList.remove("hide");
    overText.classList.add("hide");
    resultText.textContent = "";
    createBoard();
    startTimer();
    document.addEventListener("keydown", control);

    bgMusic.currentTime = 0;
    bgMusic.play();
});

// Swipe Detection for Mobile Devices
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}

function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;

    handleSwipeGesture();
}

function handleSwipeGesture() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 30) {
            moveRight();
        } else if (deltaX < -30) {
            moveLeft();
        }
    } else {
        if (deltaY > 30) {
            moveDown();
        } else if (deltaY < -30) {
            moveUp();
        }
    }
}

grid.addEventListener('touchstart', handleTouchStart, false);
grid.addEventListener('touchend', handleTouchEnd, false);
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// New code to handle music when the page becomes hidden or visible
function handleVisibilityChange() {
    if (document.hidden) {
        bgMusic.pause();
    } else {
        // Only resume if the game is currently running
        if (timerInterval) {
            bgMusic.play();
        }
    }
}

document.addEventListener('visibilitychange', handleVisibilityChange);