var c = document.getElementById("piano");
var context = c.getContext("2d");
var b = document.getElementById("background");
var context_back = b.getContext("2d");
var a = document.getElementById("score_bar");
var context_score = a.getContext("2d");
var t = document.getElementById("timer_bar");
var context_timer = t.getContext("2d");

// Dynamic canvas sizing
var canvasWidth, canvasHeight;
var columnWidth;
var numColumns = 4;

function resizeCanvas() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    
    c.width = canvasWidth;
    c.height = canvasHeight;
    b.width = canvasWidth;
    b.height = canvasHeight;
    
    columnWidth = canvasWidth / numColumns;
    
    console.log('Canvas resized to: ' + canvasWidth + 'x' + canvasHeight);
    console.log('Column width: ' + columnWidth);
    
    paintWindow();
    paintScoreBar();
}

// Initialize canvas size
resizeCanvas();

// Resize on window resize
window.addEventListener('resize', function() {
    resizeCanvas();
});

var numOfTiles = 5;
var myScore = 0;
var eachState = [false,false,false,false,false];
var myTiles = [];

var intervalTmp;
var geneTmp;

// Setup touch controls for mobile devices
setupTouchControls();

// Game state variables
var gameStarted = false; // Start as false until song is selected
var gameOver = false;
var tileSpeed = 1; // Initial speed
var tilesClicked = 0; // Track for speed increase
var blockGenerationInterval = 800; // Generate tiles every 800ms

// Timer variables
var gameTimer = 120; // 2 minutes = 120 seconds
var timerInterval;
var startTime;

// Music setup
var musicElement = document.getElementById('music');
musicElement.volume = 0.8; // Set to 80% volume for better audibility
musicElement.loop = true;

// Song selection variables
var selectedSong = null;
var autoSelectTimeout;
var countdownInterval;
var countdownDisplay;
var currentSongStartTime = 0;

// Handle song looping to start at custom time
musicElement.addEventListener('ended', function() {
    if (currentSongStartTime > 0) {
        musicElement.currentTime = currentSongStartTime;
        musicElement.play();
    }
});

// Check if audio file exists
musicElement.addEventListener('error', function() {
    console.error('Audio file not found or failed to load');
    console.log('Make sure all song files are in the same folder as index.html');
});

musicElement.addEventListener('canplay', function() {
    console.log('Audio file loaded successfully: ' + selectedSong);
});

// Function to start music
function startMusic() {
    if (!gameOver) {
        musicElement.currentTime = currentSongStartTime;
        var playPromise = musicElement.play();
        if (playPromise !== undefined) {
            playPromise.then(function() {
                console.log('✓ Music playing: ' + selectedSong + ' at ' + currentSongStartTime + 's');
            }).catch(function(error) {
                console.log('Autoplay blocked, music will start on first tap');
            });
        }
    }
}

// Function to start the game
function startGame() {
    if (gameStarted) return; // Prevent double start
    
    startTime = Date.now();
    gameStarted = true;
    
    // Start game loops
    intervalTmp = window.setInterval(upDate, 5);
    geneTmp = window.setInterval(geneBlock, blockGenerationInterval);
    timerInterval = window.setInterval(updateTimer, 100);
    
    // Start music
    startMusic();
    
    console.log('Game started with 2-minute timer - Song: ' + (selectedSong || 'Default'));
}

// Song selection setup
var songSelectionScreen = document.getElementById('song-selection');
var songButtons = document.querySelectorAll('.song-button');

// Song start times (in seconds) to skip silent intros
var songStartTimes = {
    'Daddy Yankee & Snow - Con Calma (Video Oficial) [133.02].mp3': 3,
    'DJ Snake - Taki Taki ft. Selena Gomez, Ozuna, Cardi B (Official Music Video) [138.864].mp3': 6,
    'Luis Fonsi - Despacito ft. Daddy Yankee [130.862].mp3': 0,
    'Pitbull - Fireball (Official Video) ft. John Ryan [134.322].mp3': 0,
    'Pitbull ft. @iamchino  & @PAPAYOMUSIC  - Se La Vi (Official Video) [129.495].mp3': 0
};

// Handle song selection
function selectSong(songFile) {
    if (autoSelectTimeout) {
        clearTimeout(autoSelectTimeout);
    }
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    selectedSong = songFile;
    currentSongStartTime = songStartTimes[songFile] || 0;
    
    console.log('Song selected: ' + songFile);
    console.log('Start time: ' + currentSongStartTime + 's');
    
    // Hide selection screen
    songSelectionScreen.classList.add('hidden');
    
    // Show game container and UI elements
    var gameContainer = document.getElementById('game-container');
    var scoreBar = document.getElementById('score_bar');
    var timerBar = document.getElementById('timer_bar');
    
    gameContainer.classList.add('visible');
    scoreBar.classList.add('visible');
    timerBar.classList.add('visible');
    
    // Load and start music, then start game
    musicElement.src = songFile;
    musicElement.load();
    
    musicElement.addEventListener('loadeddata', function() {
        console.log('Audio loaded, setting start time');
        musicElement.currentTime = currentSongStartTime;
        startGame();
    }, { once: true });
}

// Add click handlers to song buttons
songButtons.forEach(function(button) {
    // Touch event
    button.addEventListener('touchstart', function(e) {
        e.preventDefault();
        var song = this.getAttribute('data-song');
        selectSong(song);
    }, { passive: false });
    
    // Pointer event
    button.addEventListener('pointerdown', function(e) {
        e.preventDefault();
        var song = this.getAttribute('data-song');
        selectSong(song);
    }, { passive: false });
    
    // Click event (fallback)
    button.addEventListener('click', function(e) {
        e.preventDefault();
        var song = this.getAttribute('data-song');
        selectSong(song);
    });
});

// Countdown display
countdownDisplay = document.getElementById('countdown');
var secondsLeft = 5;
countdownInterval = setInterval(function() {
    secondsLeft--;
    if (secondsLeft > 0) {
        countdownDisplay.textContent = '(' + secondsLeft + 's)';
    } else {
        clearInterval(countdownInterval);
    }
}, 1000);

// Auto-select random song after 5 seconds
autoSelectTimeout = setTimeout(function() {
    if (!gameStarted) {
        // Array of all available songs
        var availableSongs = [
            'Daddy Yankee & Snow - Con Calma (Video Oficial) [133.02].mp3',
            'DJ Snake - Taki Taki ft. Selena Gomez, Ozuna, Cardi B (Official Music Video) [138.864].mp3',
            'Luis Fonsi - Despacito ft. Daddy Yankee [130.862].mp3',
            'Pitbull - Fireball (Official Video) ft. John Ryan [134.322].mp3',
            'Pitbull ft. @iamchino  & @PAPAYOMUSIC  - Se La Vi (Official Video) [129.495].mp3'
        ];
        
        // Pick random song
        var randomIndex = Math.floor(Math.random() * availableSongs.length);
        var randomSong = availableSongs[randomIndex];
        
        console.log('Auto-selecting random song after 5 seconds: ' + randomSong);
        selectSong(randomSong);
    }
}, 5000);

// Touch Controls Setup Function
function setupTouchControls() {
    // Force touch-action styles on canvas
    c.style.touchAction = 'none';
    c.style.webkitTouchAction = 'none';
    c.style.userSelect = 'none';
    
    // Function to find clicked tile from touch/click coordinates
    function findClickedTile(x, y) {
        var rect = c.getBoundingClientRect();
        var canvasX = x - rect.left;
        var canvasY = y - rect.top;
        
        // Scale coordinates to match canvas dimensions
        var scaleX = c.width / rect.width;
        var scaleY = c.height / rect.height;
        var scaledX = canvasX * scaleX;
        var scaledY = canvasY * scaleY;
        
        // Check all active tiles to see if click is within bounds
        for (var i = 0; i < numOfTiles; i++) {
            if (eachState[i] && myTiles[i] !== null && myTiles[i] && myTiles[i].live) {
                var tile = myTiles[i];
                if (scaledX >= tile.x && scaledX <= tile.x + tile.width &&
                    scaledY >= tile.y && scaledY <= tile.y + tile.height) {
                    console.log('Tile ' + i + ' clicked! Score: ' + (myScore + 1));
                    return i;
                }
            }
        }
        return -1;
    }
    
    // Function to handle tile click
    function handleTileClick(tileIndex) {
        if (tileIndex === -1 || gameOver) return;
        
        var tile = myTiles[tileIndex];
        if (!tile || !tile.live) return;
        
        // Ensure music is playing when user interacts (fallback for autoplay block)
        if (musicElement.paused || musicElement.currentTime === 0) {
            musicElement.currentTime = currentSongStartTime;
            musicElement.play().then(function() {
                console.log('Music started on user interaction');
            }).catch(function(e) {
                console.log('Music play failed:', e);
            });
        }
        
        // Change tile color to light blue
        context.clearRect(tile.x, tile.y, tile.width, tile.height);
        context.fillStyle = "rgba(100, 200, 255, 0.8)"; // Light blue
        context.fillRect(tile.x, tile.y, tile.width, tile.height);
        
        // Increase score
        myScore++;
        tilesClicked++;
        console.log('Score: ' + myScore);
        
        // Increase speed every 10 tiles (slower progression)
        if (tilesClicked % 10 === 0 && tileSpeed < 3) {
            tileSpeed += 0.2; // Smaller speed increase
            console.log('Speed increased to: ' + tileSpeed.toFixed(1));
            
            // Also decrease generation interval for faster gameplay
            if (blockGenerationInterval > 400) {
                window.clearInterval(geneTmp);
                blockGenerationInterval -= 50; // Smaller decrease
                geneTmp = window.setInterval(geneBlock, blockGenerationInterval);
                console.log('Generation interval: ' + blockGenerationInterval + 'ms');
            }
        }
        
        // Properly remove the tile
        var tileX = tile.x;
        var tileY = tile.y;
        var tileWidth = tile.width;
        var tileHeight = tile.height;
        
        // Show feedback briefly then clear immediately
        setTimeout(function() {
            context.clearRect(tileX, tileY, tileWidth, tileHeight);
        }, 80);
        
        tile.live = false;
        eachState[tileIndex] = false;
        myTiles[tileIndex] = null; // Remove tile reference completely
    }
    
    // Touch event handler
    function handleTouch(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        if (gameOver) return;
        
        var touch = e.touches ? e.touches[0] : e;
        if (!touch) return;
        
        var tileIndex = findClickedTile(touch.clientX, touch.clientY);
        handleTileClick(tileIndex);
    }
    
    // Pointer event handler
    function handlePointer(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        if (gameOver) return;
        
        var tileIndex = findClickedTile(e.clientX, e.clientY);
        handleTileClick(tileIndex);
    }
    
    // Mouse event handler (for desktop testing)
    function handleMouse(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (gameOver) return;
        
        var tileIndex = findClickedTile(e.clientX, e.clientY);
        handleTileClick(tileIndex);
    }
    
    // Add touch event listeners (for mobile) - only on touchstart for immediate response
    c.addEventListener('touchstart', handleTouch, { passive: false, capture: true });
    
    // Add pointer event listeners (modern mobile browsers)
    c.addEventListener('pointerdown', handlePointer, { passive: false, capture: true });
    
    // Add click event listener (for desktop and fallback)
    c.addEventListener('click', handleMouse, { passive: false, capture: true });
    
    console.log('Touch controls set up - tap tiles to play!');
    
    // Prevent canvas from interfering with touch events
    c.addEventListener('touchmove', function(e) {
        e.preventDefault();
        e.stopPropagation();
    }, { passive: false, capture: true });
    
    console.log('Touch controls initialized for Piano Tiles');
}

// Global document-level touch prevention for webview compatibility
document.addEventListener('touchstart', function(e) {
    var target = e.target;
    var isButton = target.id === 'btn' || target.id === 'start_btn' || target.closest('#btn');
    var isCanvas = target.id === 'piano' || target.id === 'background' || target.id === 'score_bar' || target.id === 'timer_bar';
    
    if (!isButton && !isCanvas) {
        e.preventDefault();
        e.stopPropagation();
    }
}, { passive: false, capture: true });

document.addEventListener('touchmove', function(e) {
    // Always prevent touchmove to stop scrolling
    e.preventDefault();
    e.stopPropagation();
}, { passive: false, capture: true });

document.addEventListener('touchend', function(e) {
    var target = e.target;
    var isButton = target.id === 'btn' || target.id === 'start_btn' || target.closest('#btn');
    var isCanvas = target.id === 'piano' || target.id === 'background' || target.id === 'score_bar' || target.id === 'timer_bar';
    
    if (!isButton && !isCanvas) {
        e.preventDefault();
        e.stopPropagation();
    }
}, { passive: false, capture: true });

console.log('Piano Tiles - Mobile webview compatibility enabled');

function paintScoreBar(){
    // Clear the score bar with transparent background
    context_score.clearRect(0, 0, 70, 35);
}

function paintTimerBar(){
    // Clear the timer bar with transparent background
    context_timer.clearRect(0, 0, 80, 35);
}

// Function to show game over screen
function showGameOver() {
    gameOver = true;
    
    // Stop all intervals
    window.clearInterval(intervalTmp);
    window.clearInterval(geneTmp);
    window.clearInterval(timerInterval);
    
    // Pause music
    document.getElementById('music').pause();
    
    // Hide all text elements by adding game-over class to body
    document.body.classList.add('game-over');
    
    // Show blur overlay
    var blurOverlay = document.getElementById('game-over-blur');
    blurOverlay.classList.add('active');
    
    console.log('GAME OVER! Final Score: ' + myScore);
    
    // Send message to parent window immediately
    window.parent.postMessage({ type: "GAME_OVER", score: myScore }, "*");
    console.log('Game over message sent to parent: score=' + myScore);
}

// Timer update function
function updateTimer() {
    if (gameOver) {
        return;
    }
    
    var elapsed = (Date.now() - startTime) / 1000; // Seconds elapsed
    var remaining = Math.max(0, gameTimer - elapsed);
    
    if (remaining <= 0) {
        // Time's up!
        console.log('TIME UP!');
        showGameOver();
    }
}

// Format timer display (MM:SS)
function formatTime(seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
}
function geneBlock(){
    // Stop generating blocks if game is over
    if (gameOver) {
        return;
    }
    
    // Find which columns have active tiles and their positions
    var columnTiles = [null, null, null, null]; // Track tile in each column
    
    for (var i = 0; i < numOfTiles; ++i) {
        if (eachState[i] && myTiles[i] && myTiles[i].live) {
            var col = myTiles[i].column;
            if (col >= 0 && col < 4) {
                columnTiles[col] = myTiles[i];
            }
        }
    }
    
    // Find available columns (no tile OR tile is far enough down)
    var availableColumns = [];
    var minSpacing = canvasHeight * 0.25; // 25% screen height between tiles
    
    for (var c = 0; c < 4; c++) {
        if (!columnTiles[c] || columnTiles[c].y > minSpacing) {
            availableColumns.push(c);
        }
    }
    
    // If no available columns, don't generate
    if (availableColumns.length === 0) {
        return;
    }
    
    // Pick a random available column
    var randomCol = availableColumns[Math.floor(Math.random() * availableColumns.length)];
    
    // Find an empty slot in the array
    for (var i = 0; i < numOfTiles; ++i) {
        if (!eachState[i] || !myTiles[i] || !myTiles[i].live) {
            myTiles[i] = new Block(i, randomCol);
            // console.log('Generated tile in column ' + randomCol + ' (slot ' + i + ')');
            return;
        }
    }
    console.log('WARNING: No empty slots available for new tile!');
}
function paintWindow(){
    my_gradient = context_back.createLinearGradient(0, 0, 0, canvasHeight);
    my_gradient.addColorStop(0,"rgba(65,234,246,0.6)");
    my_gradient.addColorStop(1,"rgba(254,74,251,0.5)");

    context_back.fillStyle = my_gradient;
    context_back.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw column dividers
    context_back.strokeStyle = "white";
    context_back.lineWidth = 2;
    
    for (var i = 1; i < numColumns; i++) {
        context_back.beginPath();
        context_back.moveTo(columnWidth * i, 0);
        context_back.lineTo(columnWidth * i, canvasHeight);
        context_back.stroke();
    }

    // Draw the hit line (at 80% height)
    var hitLineY = canvasHeight * 0.8;
    context_back.beginPath();
    context_back.moveTo(0, hitLineY);
    context_back.lineTo(canvasWidth, hitLineY);
    context_back.strokeStyle = "white";
    context_back.lineWidth = 3;
    context_back.stroke();
}
function Block(index, column){
    if(!eachState[index])
        eachState[index] = true;

    this.index = index;
    this.column = column;
    this.appearPos = column;
   
    // Dynamic width and height based on screen size
    this.width = columnWidth - 4; // Small gap between tiles
    this.height = canvasHeight * 0.2; // 20% of screen height
    this.color = "black";
    
    // Position based on column
    this.x = columnWidth * this.appearPos + 2; // 2px offset for visual gap
    this.y = -this.height; // Start above screen
    
    context.fillStyle = this.color;
    context.fillRect(this.x, this.y, this.width, this.height);
    this.live = true;
}
function move(index){
    if(myTiles[index].live){
        myTiles[index].y += 1;
        context.fillStyle = "black";
        context.fillRect(myTiles[index].x, myTiles[index].y, myTiles[index].width, myTiles[index].height);   
        context.clearRect(myTiles[index].x, myTiles[index].y-1, myTiles[index].width, 1);
    }
}
function afterRight(index){
    myScore++;
    context.clearRect(myTiles[index].x, myTiles[index].y, myTiles[index].width, myTiles[index].height);
    myTiles[index].live = false;
    eachState[index] = false;
}
function upDate(){//check keyCode whether correct
    // Stop if game is over
    if (gameOver) {
        return;
    }
    
    var i;

    // Update score display (top right)
    context_score.clearRect(0, 0, 70, 35);
    paintScoreBar();
    context_score.font = "bold 20px Arial, sans-serif";
    context_score.textAlign = 'center';
    context_score.fillStyle = "#ffffff";
    context_score.shadowColor = "rgba(0, 0, 0, 0.7)";
    context_score.shadowBlur = 8;
    context_score.fillText(myScore.toString(), 35, 24);
    context_score.shadowBlur = 0;
    
    // Update timer display (top left)
    var elapsed = (Date.now() - startTime) / 1000;
    var remaining = Math.max(0, gameTimer - elapsed);
    var timeText = formatTime(remaining);
    
    context_timer.clearRect(0, 0, 80, 35);
    paintTimerBar();
    context_timer.font = "bold 18px Arial, sans-serif";
    context_timer.textAlign = 'center';
    context_timer.fillStyle = remaining < 30 ? "#ff4444" : "#ffff00"; // Red if < 30 seconds
    context_timer.shadowColor = "rgba(0, 0, 0, 0.7)";
    context_timer.shadowBlur = 6;
    context_timer.fillText(timeText, 40, 23);
    context_timer.shadowBlur = 0;
    

    // Dynamic hit zone calculations
    var hitLineY = canvasHeight * 0.8; // 80% down the screen
    var hitZoneStart = canvasHeight * 0.6; // Start detecting at 60%
    var hitZoneEnd = canvasHeight * 0.85; // End detecting at 85%
    
    // Clean up inconsistent states (tiles marked as active but null or not live)
    for(i = 0; i < numOfTiles; ++i){
        if(eachState[i] && (!myTiles[i] || !myTiles[i].live)){
            eachState[i] = false;
            myTiles[i] = null;
        }
    }
    
    // Move tiles with progressive speed
    for(i = 0; i < numOfTiles; ++i){
        if(eachState[i] && myTiles[i] && myTiles[i].live){
            myTiles[i].y += tileSpeed;
            context.fillStyle = "black";
            context.fillRect(myTiles[i].x, myTiles[i].y, myTiles[i].width, myTiles[i].height);   
            context.clearRect(myTiles[i].x, myTiles[i].y - tileSpeed - 1, myTiles[i].width, tileSpeed + 1);
        }
    }
    for(i = 0; i < numOfTiles; ++i){
        if(eachState[i] && myTiles[i] && myTiles[i].live){
            // Check if tile hit the bottom line (game over)
            if(myTiles[i].y + myTiles[i].height >= hitLineY){
                // Turn tile red
                context.clearRect(myTiles[i].x, myTiles[i].y, myTiles[i].width, myTiles[i].height);
                context.fillStyle = "rgba(245,13,13,0.9)"; // Red
                context.fillRect(myTiles[i].x, myTiles[i].y, myTiles[i].width, myTiles[i].height);
                
                // Mark tile as dead
                myTiles[i].live = false;
                eachState[i] = false;
                gameStarted = false;
                
                console.log('Tile missed!');
                
                // Show game over screen with blur
                showGameOver();
                
                return;
            }
        }
    }
}
 