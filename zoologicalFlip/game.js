    const moves = document.getElementById("moves-count");
const timeValue = document.getElementById("time");
const levelValue = document.getElementById("level");
const scoreValue = document.getElementById("score");
const gameTitle = document.getElementById("game-title");
const gameContainer = document.querySelector(".game-container");
const result = document.getElementById("result");
const controls = document.querySelector(".controls-container");
const gameOverOverlay = document.getElementById("game-over-overlay");
const finalScore = document.getElementById("final-score");
const finalLevel = document.getElementById("final-level");

let cards;
let interval;
let firstCard = false;
let secondCard = false;

//Items array - all available images
const items = [
    { name: "bee", image: "images/bee.jpeg" },
    { name: "crocodile", image: "images/crocodile.png" },
    { name: "macaw", image: "images/macaw.jpeg" },
    { name: "gorilla", image: "images/gorilla.jpeg" },
    { name: "tiger", image: "images/tiger.jpg" },
    { name: "monkey", image: "images/monkey.jpeg" },
    { name: "chameleon", image: "images/chameleon.jpeg" },
    { name: "piranha", image: "images/piranha.jpg" },
    { name: "anaconda", image: "images/anaconda.jpeg" },
    { name: "sloth", image: "images/sloth.jpeg" },
    { name: "cockatoo", image: "images/cockatoo.jpeg" },
    { name: "toucan", image: "images/toucan.jpeg" },
    { name: "koala", image: "images/Koala.jpg" },
    { name: "elephant", image: "images/elephant.png" },
    { name: "fox", image: "images/fox.jpg" },
    { name: "kangaroo", image: "images/kangaroo.png" },
    { name: "panda", image: "images/panda.jpg" },
    { name: "penguin", image: "images/penguin.png" },
    { name: "zebra", image: "images/zebra.png" },
];

//Game state variables
let totalTimeInSeconds = 120; // 2 minutes countdown
let currentLevel = 1;
let gameScore = 0;
let movesCount = 0;
let winCount = 0;
let gameActive = false;
let currentGridSize = 4; // Start with 4x4 grid

//For countdown timer
const timeGenerator = () => {
    // Only run timer if game is active
    if (!gameActive) {
        clearInterval(interval);
        return;
    }
    
    totalTimeInSeconds -= 1;
    
    if (totalTimeInSeconds <= 0) {
        gameOver();
        return;
    }
    
    //format time before displaying
    let minutes = Math.floor(totalTimeInSeconds / 60);
    let seconds = totalTimeInSeconds % 60;
    let secondsValue = seconds < 10 ? `0${seconds}` : seconds;
    let minutesValue = minutes < 10 ? `0${minutes}` : minutes;
    timeValue.innerHTML = `<span>Time:</span>${minutesValue}:${secondsValue}`;
};

// For calculating moves and updating score
const movesCounter = () => {
    movesCount += 1;
    moves.innerHTML = `<span>Moves:</span>${movesCount}`;
};

// Update score display
const updateScore = (points) => {
    gameScore += points;
    scoreValue.innerHTML = `<span>Score:</span>${gameScore}`;
};

// Update level display
const updateLevel = () => {
    levelValue.innerHTML = `<span>Level:</span>${currentLevel}`;
};

// Game over function
const gameOver = () => {
    // Only show game over if game was actually active
    if (!gameActive) return;
    
    gameActive = false;
    clearInterval(interval);
    
    // Show game over overlay with blur effect
    gameOverOverlay.classList.remove("hide");
    finalScore.innerHTML = `Final Score: ${gameScore}`;
    finalLevel.innerHTML = `Level Reached: ${currentLevel}`;
    
    // Send message to parent window
    setTimeout(() => {
        window.parent.postMessage({ type: "GAME_OVER", score: gameScore }, "*");
    }, 1000);
};

// Advance to next level
const nextLevel = () => {
    currentLevel++;
    
    // Increase difficulty: larger grid size every 2 levels
    if (currentLevel % 2 === 0 && currentGridSize < 6) {
        currentGridSize++;
    }
    
    // Add bonus points for completing level
    updateScore(100 * currentLevel);
    
    // Reset for next level
    winCount = 0;
    firstCard = false;
    secondCard = false;
    
    // Update displays
    updateLevel();
    
    // Show level completion message briefly
    result.innerHTML = `<h2>Level ${currentLevel - 1} Complete!</h2><h4>Next Level Starting...</h4>`;
    
    // Start next level after delay
    setTimeout(() => {
        result.innerHTML = "";
        initializer();
    }, 2000);
};

//Pick random objects from the items array
const generateRandom = (size = 4) => {
    //temporary array
    let tempArray = [...items];
    //initializes cardValues array
    let cardValues = [];
    //size should be double (4*4 matrix)/2 since pairs of objects would exist
    size = (size * size) / 2;
    //Random object selection
    for (let i = 0; i < size; i++) {
        const randomIndex = Math.floor(Math.random() * tempArray.length);
        cardValues.push(tempArray[randomIndex]);
        //once selected remove the object from temp array
        tempArray.splice(randomIndex, 1);
    }
    return cardValues;
};

    const matrixGenerator = (cardValues, size = 4) => {
    gameContainer.innerHTML = "";
    cardValues = [...cardValues, ...cardValues];
    //simple shuffle
    cardValues.sort(() => Math.random() - 0.5);
    for (let i = 0; i < size * size; i++) {
        /*
            Create Cards
            before => front side (contains question mark)
            after => back side (contains actual image);
            data-card-values is a custom attribute which stores the names of the cards to match later
        */
        gameContainer.innerHTML += `
        <div class="card-container" data-card-value="${cardValues[i].name}">
            <div class="card-before"> ! </div>
            <div class="card-after">
            <img src="${cardValues[i].image}" class="image"/></div>
        </div>
        `;
    }
    //Grid
    gameContainer.style.gridTemplateColumns = `repeat(${size},auto)`;

    //Cards
    cards = document.querySelectorAll(".card-container");
    cards.forEach((card) => {
        card.addEventListener("click", () => {
        //If selected card is not matched yet then only run (i.e already matched card when clicked would be ignored)
        if (!card.classList.contains("matched")) {
            //flip the cliked card
            card.classList.add("flipped");
            //if it is the firstcard (!firstCard since firstCard is initially false)
            if (!firstCard) {
            //so current card will become firstCard
            firstCard = card;
            //current cards value becomes firstCardValue
            firstCardValue = card.getAttribute("data-card-value");
            } else {
            //increment moves since user selected second card
            movesCounter();
            //secondCard and value
            secondCard = card;
            let secondCardValue = card.getAttribute("data-card-value");
            if (firstCardValue == secondCardValue) {
                //if both cards match add matched class so these cards would beignored next time
                firstCard.classList.add("matched");
                secondCard.classList.add("matched");
                playSound("right");
                //set firstCard to false since next card would be first now
                firstCard = false;
                //winCount increment as user found a correct match
                winCount += 1;
                // Add points for successful match
                updateScore(10);
                
                //check if winCount ==half of cardValues (level complete)
                if (winCount == Math.floor(cardValues.length / 2)) {
                    playSound("success");
                    nextLevel();
                }
            } else {
                //if the cards dont match
                //flip the cards back to normal
                let [tempFirst, tempSecond] = [firstCard, secondCard];
                firstCard = false;
                secondCard = false;
                let delay = setTimeout(() => {
                tempFirst.classList.remove("flipped");
                tempSecond.classList.remove("flipped");
                }, 900);
                playSound("incorrect2");
            }
            }
        }
        });
    });
    };

//Auto-start game function
const startGame = () => {
    // Reset game state
    movesCount = 0;
    gameScore = 0;
    currentLevel = 1;
    currentGridSize = 4;
    totalTimeInSeconds = 120;
    gameActive = true;
    
    //controls and buttons visibility
    controls.classList.add("hide");
    gameOverOverlay.classList.add("hide");
    
    //Start timer
    interval = setInterval(timeGenerator, 1000);
    
    //initial displays
    moves.innerHTML = `<span>Moves:</span> ${movesCount}`;
    updateScore(0);
    updateLevel();
    
    initializer();
};

//Initialize values and func calls
const initializer = () => {
    result.innerText = "";
    winCount = 0;
    let cardValues = generateRandom(currentGridSize);
    console.log(cardValues);
    matrixGenerator(cardValues, currentGridSize);
};

// Add click handler to restart game from game over screen
gameOverOverlay.addEventListener("click", () => {
    gameOverOverlay.classList.add("hide");
    controls.classList.remove("hide");
    // Auto-start after 2 seconds
    setTimeout(startGame, 2000);
});

    //for sound
function playSound(name) {
    var audio = new Audio("sounds/" + name + ".mp3");
    audio.play();
}

// Initialize game on page load
document.addEventListener('DOMContentLoaded', function() {
    // Ensure game over overlay is hidden on page load
    gameOverOverlay.classList.add("hide");
    
    // Initialize displays
    moves.innerHTML = `<span>Moves:</span> 0`;
    timeValue.innerHTML = `<span>Time:</span>02:00`;
    levelValue.innerHTML = `<span>Level:</span>1`;
    scoreValue.innerHTML = `<span>Score:</span>0`;
    
    // Ensure game is not active on load
    gameActive = false;
    clearInterval(interval);
    
    // Auto-start game after 2 seconds
    setTimeout(startGame, 2000);
});