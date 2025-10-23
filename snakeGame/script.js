const playBoard = document.querySelector(".play-board");
const scoreElement = document.querySelector(".score");
const timerElement = document.querySelector(".timer");
const controls = document.querySelectorAll(".controls i");

let gameOver = false;
let foodX, foodY;
let snakeX = 5, snakeY = 5;
let velocityX = 1, velocityY = 0;
let currentDirection = 'right';
let snakeBody = [];
let setIntervalId;
let timerIntervalId;
let score = 0;
let timeSeconds = 120; // Start at 120 seconds (2 minutes)

// Timer function - counts down
const updateTimer = () => {
    timeSeconds--;
    const minutes = Math.floor(timeSeconds / 60);
    const seconds = timeSeconds % 60;
    timerElement.innerText = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Game over when timer reaches 0
    if(timeSeconds <= 0) {
        gameOver = true;
    }
};

const updateFoodPosition = () => {
    // Passing a random 1 - 15 value as food position
    foodX = Math.floor(Math.random() * 15) + 1;
    foodY = Math.floor(Math.random() * 15) + 1;
}

const handleGameOver = () => {
    // Clearing the timer and blurring the screen on game over
    clearInterval(setIntervalId);
    clearInterval(timerIntervalId);
    playBoard.style.filter = "blur(5px)";
    window.parent.postMessage({ type: "GAME_OVER", score: score, time: timeSeconds }, "*");
}

const changeDirection = e => {
    // Changing velocity value based on key press
    if(e.key === "ArrowUp" && velocityY != 1) {
        velocityX = 0;
        velocityY = -1;
        currentDirection = 'up';
    } else if(e.key === "ArrowDown" && velocityY != -1) {
        velocityX = 0;
        velocityY = 1;
        currentDirection = 'down';
    } else if(e.key === "ArrowLeft" && velocityX != 1) {
        velocityX = -1;
        velocityY = 0;
        currentDirection = 'left';
    } else if(e.key === "ArrowRight" && velocityX != -1) {
        velocityX = 1;
        velocityY = 0;
        currentDirection = 'right';
    }
}

// Calling changeDirection on each key click and passing key dataset value as an object
controls.forEach(button => {
    button.addEventListener("click", () => changeDirection({ key: button.dataset.key }));
    button.addEventListener("touchstart", (e) => {
        e.preventDefault();
        changeDirection({ key: button.dataset.key });
    });
});

const initGame = () => {
    if(gameOver) return handleGameOver();
    let html = `<div class="food" style="grid-area: ${foodY} / ${foodX}"></div>`;

    // Checking if the snake hit the food
    if(snakeX === foodX && snakeY === foodY) {
        updateFoodPosition();
        snakeBody.push([foodY, foodX]); // Pushing food position to snake body array
        score++; // increment score by 1
        scoreElement.innerText = `Score: ${score}`;
    }
    // Updating the snake's head position based on the current velocity
    snakeX += velocityX;
    snakeY += velocityY;
    
    // Wrap around walls - snake comes from opposite side
    if(snakeX <= 0) snakeX = 15;
    if(snakeX > 15) snakeX = 1;
    if(snakeY <= 0) snakeY = 15;
    if(snakeY > 15) snakeY = 1;
    
    // Shifting forward the values of the elements in the snake body by one
    for (let i = snakeBody.length - 1; i > 0; i--) {
        snakeBody[i] = snakeBody[i - 1];
    }
    snakeBody[0] = [snakeX, snakeY]; // Setting first element of snake body to current snake position

    for (let i = 0; i < snakeBody.length; i++) {
        // Adding a div for each part of the snake's body
        // First segment gets the 'snake-head' class with direction for sprite
        const headClass = i === 0 ? `head snake-head ${currentDirection}` : "head";
        html += `<div class="${headClass}" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;
        // Checking if the snake head hit the body, if so set gameOver to true
        if (i !== 0 && snakeBody[0][1] === snakeBody[i][1] && snakeBody[0][0] === snakeBody[i][0]) {
            gameOver = true;
        }
    }
    playBoard.innerHTML = html;
}

updateFoodPosition();
// Initialize timer display
const minutes = Math.floor(timeSeconds / 60);
const seconds = timeSeconds % 60;
timerElement.innerText = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
setIntervalId = setInterval(initGame, 150); // Consistent linear speed
timerIntervalId = setInterval(updateTimer, 1000); // Update timer every second
document.addEventListener("keyup", changeDirection);