// Game state variables
let gameScore = 0;
let gameTimer = 120; // 2 minutes in seconds
let timerInterval = null;
let gameStarted = false;
let ballsInCenter = 0;
let lastScoringState = 0; // Track the last scoring state to prevent duplicate scoring
let modeSelected = false;
let hardMode = false;
let modeSelectionTimer = null;
let countdownSeconds = 5;

// Responsive scaling variables
let scaleFactor = 1;
let BASE_WIDTH = 350;
let BASE_HEIGHT = 315;
let BASE_PATH_W = 25;
let BASE_WALL_W = 10;
let BASE_BALL_SIZE = 10;
let BASE_HOLE_SIZE = 18;
let BASE_END_SIZE = 65;

// Fixed dimensions for stability (8% smaller for better proportions)
const pathW = 23; // Path width (reduced from 25)
const wallW = 9; // Wall width (reduced from 10)
const ballSize = 9; // Width and height of the ball (reduced from 10)
const holeSize = 17; // Hole size (reduced from 18)
const endSize = 60; // End target size (reduced from 65)
const mazeWidth = 320;
const mazeHeight = 290;

Math.minmax = (value, limit) => {  
    return Math.max(Math.min(value, limit), -limit);  
};

const distance2D = (p1, p2) => {  
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);  
};

// Simple initialization function
const initializeGame = () => {
    // Let CSS handle all dimensions - don't override with JavaScript
    const mazeElement = document.getElementById("maze");
    const endElement = document.getElementById("end");
    
    // Only set properties that CSS can't handle
    if (endElement) {
        endElement.style.border = `5px dashed var(--end-color)`;
    }
};  
   // Angle between the two points  
   const getAngle = (p1, p2) => {  
    let angle = Math.atan((p2.y - p1.y) / (p2.x - p1.x));  
    if (p2.x - p1.x < 0) angle += Math.PI;  
    return angle;  
   };  
   // The closest a ball and a wall cap can be  
   const closestItCanBe = (cap, ball) => {  
    let angle = getAngle(cap, ball);  
    const deltaX = Math.cos(angle) * (wallW / 2 + ballSize / 2);  
    const deltaY = Math.sin(angle) * (wallW / 2 + ballSize / 2);  
    return { x: cap.x + deltaX, y: cap.y + deltaY };  
   };  
   // Roll the ball around the wall cap  
   const rollAroundCap = (cap, ball) => {  
    // The direction the ball can't move any further because the wall holds it back  
    let impactAngle = getAngle(ball, cap);  
    // The direction the ball wants to move based on it's velocity  
    let heading = getAngle(  
     { x: 0, y: 0 },  
     { x: ball.velocityX, y: ball.velocityY }  
    );  
    // The angle between the impact direction and the ball's desired direction  
    // The smaller this angle is, the bigger the impact  
    // The closer it is to 90 degrees the smoother it gets (at 90 there would be no collision)  
    let impactHeadingAngle = impactAngle - heading;  
    // Velocity distance if not hit would have occurred  
    const velocityMagnitude = distance2D(  
     { x: 0, y: 0 },  
     { x: ball.velocityX, y: ball.velocityY }  
    );  
    // Velocity component diagonal to the impact  
    const velocityMagnitudeDiagonalToTheImpact =  
     Math.sin(impactHeadingAngle) * velocityMagnitude;  
    // How far should the ball be from the wall cap  
    const closestDistance = wallW / 2 + ballSize / 2;  
    const rotationAngle = Math.atan(  
     velocityMagnitudeDiagonalToTheImpact / closestDistance  
    );  
    const deltaFromCap = {  
     x: Math.cos(impactAngle + Math.PI - rotationAngle) * closestDistance,  
     y: Math.sin(impactAngle + Math.PI - rotationAngle) * closestDistance  
    };  
    const x = ball.x;  
    const y = ball.y;  
    const velocityX = ball.x - (cap.x + deltaFromCap.x);  
    const velocityY = ball.y - (cap.y + deltaFromCap.y);  
    const nextX = x + velocityX;  
    const nextY = y + velocityY;  
    return { x, y, velocityX, velocityY, nextX, nextY };  
   };  
   // Decreases the absolute value of a number but keeps it's sign, doesn't go below abs 0  
   const slow = (number, difference) => {  
    if (Math.abs(number) <= difference) return 0;  
    if (number > difference) return number - difference;  
    return number + difference;  
   };  
   const mazeElement = document.getElementById("maze");  
   const joystickHeadElement = document.getElementById("joystick-head");  
   const noteElement = document.getElementById("note"); // Note element for instructions and game won, game failed texts
   const scoreElement = document.getElementById("score");
   const timerElement = document.getElementById("timer");

   // Timer functions
   const updateTimer = () => {
       const minutes = Math.floor(gameTimer / 60);
       const seconds = gameTimer % 60;
       timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
   };

   const startTimer = () => {
       if (timerInterval) clearInterval(timerInterval);
       timerInterval = setInterval(() => {
           gameTimer--;
           updateTimer();
           if (gameTimer <= 0) {
               endGame("Time's up!");
           }
       }, 1000);
   };

   const stopTimer = () => {
       if (timerInterval) {
           clearInterval(timerInterval);
       }
   };

   // Score functions
   const updateScore = (points) => {
      gameScore += points;
      
      // Check for game over in Hard Mode if score drops below 0
      if (hardMode && gameScore < 0 && gameInProgress) {
          endGame("Game Over! Score dropped below 0!");
      }
      
      // Display score as 0 minimum, but keep actual gameScore for game logic
      const displayScore = Math.max(0, gameScore);
      scoreElement.textContent = displayScore;
  };

   const resetScore = () => {
       gameScore = 0;
       scoreElement.textContent = gameScore;
   };

   // End game function
   const endGame = (message) => {
       gameInProgress = false;
       gameStarted = false;
       stopTimer();
       
       // Apply complete blur effect to entire game screen
       const centerElement = document.getElementById("center");
       if (centerElement) {
           centerElement.style.filter = "blur(8px)";
           centerElement.style.transition = "filter 0.8s ease";
           centerElement.style.pointerEvents = "none"; // Disable all interactions
       }
       
       // Disable joystick input completely
       joystickHeadElement.style.pointerEvents = "none";
       joystickHeadElement.style.cursor = "not-allowed";
       joystickHeadElement.style.opacity = "0.5";
       
       // Reset maze rotation and disable physics
       mazeElement.style.cssText = `transform: translate(-50%, -50%) rotateY(0deg) rotateX(0deg)`;
       
       // Show game over message (keep unblurred for readability)
       noteElement.innerHTML = `${message}<br>Final Score: ${gameScore}<br><p>Game Over!</p>`;
       noteElement.style.opacity = 1;
       noteElement.style.filter = "none";
       noteElement.style.pointerEvents = "auto"; // Keep note interactive
       noteElement.style.position = "relative";
       noteElement.style.zIndex = "1001"; // Ensure it's above blurred content
       
       // Communicate score to parent window
       try {
           window.parent.postMessage({ type: "GAME_OVER", score: gameScore }, "*");
       } catch (error) {
           console.log("Could not send message to parent window:", error);
       }
   };  
  
   let previousTimestamp;  
   let gameInProgress;  
   let mouseStartX;  
   let mouseStartY;  
   let accelerationX;  
   let accelerationY;  
   let frictionX;  
   let frictionY;  
   const debugMode = false;  
   let balls = [];  
   let ballElements = [];  
   let holeElements = [];

   // Dynamic walls function
   const getWalls = () => {
       return [
           // Border  
           { column: 0, row: 0, horizontal: true, length: 10 },  
           { column: 0, row: 0, horizontal: false, length: 9 },  
           { column: 0, row: 9, horizontal: true, length: 10 },  
           { column: 10, row: 0, horizontal: false, length: 9 },  
           // Horizontal lines starting in 1st column  
           { column: 0, row: 6, horizontal: true, length: 1 },  
           { column: 0, row: 8, horizontal: true, length: 1 },  
           // Horizontal lines starting in 2nd column  
           { column: 1, row: 1, horizontal: true, length: 2 },  
           { column: 1, row: 7, horizontal: true, length: 1 },  
           // Horizontal lines starting in 3rd column  
           { column: 2, row: 2, horizontal: true, length: 2 },  
           { column: 2, row: 4, horizontal: true, length: 1 },  
           { column: 2, row: 5, horizontal: true, length: 1 },  
           { column: 2, row: 6, horizontal: true, length: 1 },  
           // Horizontal lines starting in 4th column  
           { column: 3, row: 3, horizontal: true, length: 1 },  
           { column: 3, row: 8, horizontal: true, length: 3 },  
           // Horizontal lines starting in 5th column  
           { column: 4, row: 6, horizontal: true, length: 1 },  
           // Horizontal lines starting in 6th column  
           { column: 5, row: 2, horizontal: true, length: 2 },  
           { column: 5, row: 7, horizontal: true, length: 1 },  
           // Horizontal lines starting in 7th column  
           { column: 6, row: 1, horizontal: true, length: 1 },  
           { column: 6, row: 6, horizontal: true, length: 2 },  
           // Horizontal lines starting in 8th column  
           { column: 7, row: 3, horizontal: true, length: 2 },  
           { column: 7, row: 7, horizontal: true, length: 2 },  
           // Horizontal lines starting in 9th column  
           { column: 8, row: 1, horizontal: true, length: 1 },  
           { column: 8, row: 2, horizontal: true, length: 1 },  
           { column: 8, row: 3, horizontal: true, length: 1 },  
           { column: 8, row: 4, horizontal: true, length: 2 },  
           { column: 8, row: 8, horizontal: true, length: 2 },  
           // Vertical lines after the 1st column  
           { column: 1, row: 1, horizontal: false, length: 2 },  
           { column: 1, row: 4, horizontal: false, length: 2 },  
           // Vertical lines after the 2nd column  
           { column: 2, row: 2, horizontal: false, length: 2 },  
           { column: 2, row: 5, horizontal: false, length: 1 },  
           { column: 2, row: 7, horizontal: false, length: 2 },  
           // Vertical lines after the 3rd column  
           { column: 3, row: 0, horizontal: false, length: 1 },  
           { column: 3, row: 4, horizontal: false, length: 1 },  
           { column: 3, row: 6, horizontal: false, length: 2 },  
           // Vertical lines after the 4th column  
           { column: 4, row: 1, horizontal: false, length: 2 },  
           { column: 4, row: 6, horizontal: false, length: 1 },  
           // Vertical lines after the 5th column  
           { column: 5, row: 0, horizontal: false, length: 2 },  
           { column: 5, row: 6, horizontal: false, length: 1 },  
           { column: 5, row: 8, horizontal: false, length: 1 },  
           // Vertical lines after the 6th column  
           { column: 6, row: 4, horizontal: false, length: 1 },  
           { column: 6, row: 6, horizontal: false, length: 1 },  
           // Vertical lines after the 7th column  
           { column: 7, row: 1, horizontal: false, length: 4 },  
           { column: 7, row: 7, horizontal: false, length: 2 },  
           // Vertical lines after the 8th column  
           { column: 8, row: 2, horizontal: false, length: 1 },  
           { column: 8, row: 4, horizontal: false, length: 2 },  
           // Vertical lines after the 9th column  
           { column: 9, row: 1, horizontal: false, length: 1 },  
           { column: 9, row: 5, horizontal: false, length: 2 }  
       ].map((wall) => ({  
           x: wall.column * (pathW + wallW),  
           y: wall.row * (pathW + wallW),  
           horizontal: wall.horizontal,  
           length: wall.length * (pathW + wallW)  
       }));
   };

   // Dynamic holes function (reduced number for Hard Mode)
   const getHoles = () => {
       return [  
           { column: 2, row: 4 },  
           { column: 6, row: 2 },  
           { column: 6, row: 8 },  
           { column: 8, row: 1 }  
       ].map((hole) => ({  
           x: hole.column * (wallW + pathW) + (wallW / 2 + pathW / 2),  
           y: hole.row * (wallW + pathW) + (wallW / 2 + pathW / 2)  
       }));
   };

   // Draw walls function
   const drawWalls = () => {
       // Remove existing walls
       const existingWalls = mazeElement.querySelectorAll('.wall');
       existingWalls.forEach(wall => mazeElement.removeChild(wall));
       
       // Draw new walls with current scaling
       const walls = getWalls();
       walls.forEach(({ x, y, horizontal, length }) => {
           const wall = document.createElement("div");
           wall.setAttribute("class", "wall");
           wall.style.cssText = `
               left: ${x}px;
               top: ${y}px;
               width: ${wallW}px;
               height: ${length}px;
               transform: rotate(${horizontal ? -90 : 0}deg);
           `;
           mazeElement.appendChild(wall);
       });
   };

   // Initialize game and draw initial elements (but don't start)
   initializeGame();
   drawWalls();

   // Initialize displays
   updateTimer();
   resetScore();  

   // Start game function (unified for mouse and touch)
   const startGame = (clientX, clientY) => {
       if (!gameInProgress && modeSelected) {
           mouseStartX = clientX;
           mouseStartY = clientY;
           gameInProgress = true;
           gameStarted = true;
           
           // Start timer
           gameTimer = 120;
           updateTimer();
           startTimer();
           
           window.requestAnimationFrame(main);
           noteElement.style.opacity = 0;
           joystickHeadElement.style.cssText = `
               animation: none;
               cursor: grabbing;
           `;
       }
   };

   // Mouse events
   joystickHeadElement.addEventListener("mousedown", function (event) {
       startGame(event.clientX, event.clientY);
   });

   // Touch events for mobile support
   joystickHeadElement.addEventListener("touchstart", function (event) {
       event.preventDefault();
       const touch = event.touches[0];
       startGame(touch.clientX, touch.clientY);
   });  
   // Update game function (unified for mouse and touch)
   const updateGame = (clientX, clientY) => {
       if (gameInProgress) {
           const mouseDeltaX = -Math.minmax(mouseStartX - clientX, 15);
           const mouseDeltaY = -Math.minmax(mouseStartY - clientY, 15);
           
           joystickHeadElement.style.cssText = `
               left: ${mouseDeltaX}px;
               top: ${mouseDeltaY}px;
               animation: none;
               cursor: grabbing;
           `;
           
           const rotationY = mouseDeltaX * 1.0; // Increased sensitivity for better responsiveness
           const rotationX = mouseDeltaY * 1.0;
           
           mazeElement.style.cssText = `
               transform: translate(-50%, -50%) rotateY(${rotationY}deg) rotateX(${-rotationX}deg)
           `;
           
           const gravity = 6.0; // Significantly increased for ultra-fast response
           const friction = 0.008; // Further reduced for maximum responsiveness
           const dampening = 0.98; // Maintained for natural feel
           
           accelerationX = gravity * Math.sin((rotationY / 180) * Math.PI);
           accelerationY = gravity * Math.sin((rotationX / 180) * Math.PI);
           frictionX = gravity * Math.cos((rotationY / 180) * Math.PI) * friction;
           frictionY = gravity * Math.cos((rotationX / 180) * Math.PI) * friction;
       }
   };

   // Mouse movement
   window.addEventListener("mousemove", function (event) {
       updateGame(event.clientX, event.clientY);
   });

   // Touch movement with improved responsiveness
   window.addEventListener("touchmove", function (event) {
       event.preventDefault();
       if (gameInProgress && event.touches.length > 0) {
           const touch = event.touches[0];
           updateGame(touch.clientX, touch.clientY);
       }
   }, { passive: false });
   
   // Additional touch optimization for better mobile performance
   window.addEventListener("touchstart", function (event) {
       if (gameInProgress) {
           event.preventDefault();
       }
   }, { passive: false });  
   // Window resize handler (simplified)
   let resizeTimeout;
   window.addEventListener("resize", function() {
       clearTimeout(resizeTimeout);
       resizeTimeout = setTimeout(() => {
           initializeGame();
           drawWalls();
       }, 100);
   });

   // Orientation change handler for mobile
   window.addEventListener("orientationchange", function() {
       setTimeout(() => {
           initializeGame();
           drawWalls();
       }, 500);
   });  
   function resetGame() {  
    previousTimestamp = undefined;  
    gameInProgress = false;
    gameStarted = false;
    ballsInCenter = 0;
    lastScoringState = 0;
    
    // Stop and reset timer
    stopTimer();
    gameTimer = 120;
    updateTimer();
    
    // Reset score only if not continuing from a previous game
    if (!gameStarted) {
        resetScore();
    }
    
    mouseStartX = undefined;  
    mouseStartY = undefined;  
    accelerationX = undefined;  
    accelerationY = undefined;  
    frictionX = undefined;  
    frictionY = undefined;  
    
    // Initialize game elements
    initializeGame();
    
    // Remove blur effect from previous game end
    const gameElement = document.getElementById("game");
    if (gameElement) {
        gameElement.style.filter = "none";
        gameElement.style.transition = "filter 0.5s ease";
    }
    
    mazeElement.style.cssText = `  
      transform: translate(-50%, -50%) rotateY(0deg) rotateX(0deg)  
     `;  
    joystickHeadElement.style.cssText = `  
      left: 0;  
      top: 0;  
      animation: glow;  
      cursor: grab;  
     `;  
    
    
    if (hardMode) {  
     noteElement.innerHTML = `Click the joystick to start!  
       <p>Hard mode: Avoid black holes!</p>`;  
    } else {  
     noteElement.innerHTML = `Click the joystick to start!  
       <p>Move every ball to the center.</p>`;  
    }  
    noteElement.style.opacity = 1;  
    
    // Reset balls to corners (4 balls exactly)
    balls = [  
     { column: 0, row: 0 },  
     { column: 9, row: 0 },  
     { column: 0, row: 8 },  
     { column: 9, row: 8 }  
    ].map((ball) => ({  
     x: ball.column * (wallW + pathW) + (wallW / 2 + pathW / 2),  
     y: ball.row * (wallW + pathW) + (wallW / 2 + pathW / 2),  
     velocityX: 0,  
     velocityY: 0  
    }));  
    
    // Remove existing ball elements
    ballElements.forEach((ballElement) => {
        if (ballElement.parentNode) {
            mazeElement.removeChild(ballElement);
        }
    });
    ballElements = [];
    
    // Create new ball elements
    balls.forEach(({ x, y }) => {
        const ball = document.createElement("div");
        ball.setAttribute("class", "ball");
        ball.style.cssText = `left: ${x}px; top: ${y}px;`;
        mazeElement.appendChild(ball);
        ballElements.push(ball);
    });  
    
    // Remove previous hole elements  
    holeElements.forEach((holeElement) => {  
     mazeElement.removeChild(holeElement);  
    });  
    holeElements = [];  
    
    // Reset hole elements if hard mode  
    if (hardMode) {  
     const holes = getHoles();
     holes.forEach(({ x, y }) => {  
      const hole = document.createElement("div");  
      hole.setAttribute("class", "black-hole");  
      hole.style.cssText = `left: ${x}px; top: ${y}px; `;  
      mazeElement.appendChild(hole);  
      holeElements.push(hole);  
     });  
    }  
   }  
   function main(timestamp) {  
    // It is possible to reset the game mid-game. This case the look should stop  
    if (!gameInProgress) return;  
    if (previousTimestamp === undefined) {  
     previousTimestamp = timestamp;  
     window.requestAnimationFrame(main);  
     return;  
    }  
    const maxVelocity = 3.2; // Significantly increased for ultra-fast movement  
    // Time passed since last cycle divided by 16  
    // This function gets called every 16 ms on average so dividing by 16 will result in 1  
    const timeElapsed = (timestamp - previousTimestamp) / 16;  
    try {  
     // If mouse didn't move yet don't do anything  
     if (accelerationX != undefined && accelerationY != undefined) {  
      const velocityChangeX = accelerationX * timeElapsed;  
      const velocityChangeY = accelerationY * timeElapsed;  
      const frictionDeltaX = frictionX * timeElapsed;  
      const frictionDeltaY = frictionY * timeElapsed;  
      balls.forEach((ball) => {  
       if (velocityChangeX == 0) {  
        // No rotation, the plane is flat  
        // On flat surface friction can only slow down, but not reverse movement  
        ball.velocityX = slow(ball.velocityX, frictionDeltaX);  
       } else {  
        ball.velocityX = ball.velocityX + velocityChangeX;  
        ball.velocityX = Math.max(Math.min(ball.velocityX, maxVelocity), -maxVelocity);  
        ball.velocityX = ball.velocityX - Math.sign(velocityChangeX) * frictionDeltaX;  
        ball.velocityX = Math.minmax(ball.velocityX, maxVelocity);
        // Apply dampening for ultra-responsive movement
        ball.velocityX *= 0.999;  
       }  
       if (velocityChangeY == 0) {  
        // No rotation, the plane is flat  
        // On flat surface friction can only slow down, but not reverse movement  
        ball.velocityY = slow(ball.velocityY, frictionDeltaY);  
       } else {  
        ball.velocityY = ball.velocityY + velocityChangeY;  
        ball.velocityY = ball.velocityY - Math.sign(velocityChangeY) * frictionDeltaY;  
        ball.velocityY = Math.minmax(ball.velocityY, maxVelocity);
        // Apply dampening for ultra-responsive movement
        ball.velocityY *= 0.999;  
       }  
       // Preliminary next ball position, only becomes true if no hit occurs  
       // Used only for hit testing, does not mean that the ball will reach this position  
       ball.nextX = ball.x + ball.velocityX;  
       ball.nextY = ball.y + ball.velocityY;  
       if (debugMode) console.log("tick", ball);  
       const walls = getWalls();
       walls.forEach((wall, wi) => {  
        if (wall.horizontal) {  
         // Horizontal wall  
         if (  
          ball.nextY + ballSize / 2 >= wall.y - wallW / 2 &&  
          ball.nextY - ballSize / 2 <= wall.y + wallW / 2  
         ) {  
          // Ball got within the strip of the wall  
          // (not necessarily hit it, could be before or after)  
          const wallStart = {  
           x: wall.x,  
           y: wall.y  
          };  
          const wallEnd = {  
           x: wall.x + wall.length,  
           y: wall.y  
          };  
          if (  
           ball.nextX + ballSize / 2 >= wallStart.x - wallW / 2 &&  
           ball.nextX < wallStart.x  
          ) {  
           // Ball might hit the left cap of a horizontal wall  
           const distance = distance2D(wallStart, {  
            x: ball.nextX,  
            y: ball.nextY  
           });  
           if (distance < ballSize / 2 + wallW / 2) {  
            if (debugMode && wi > 4)  
             console.warn("too close h head", distance, ball);  
            // Ball hits the left cap of a horizontal wall  
            const closest = closestItCanBe(wallStart, {  
             x: ball.nextX,  
             y: ball.nextY  
            });  
            const rolled = rollAroundCap(wallStart, {  
             x: closest.x,  
             y: closest.y,  
             velocityX: ball.velocityX,  
             velocityY: ball.velocityY  
            });  
            Object.assign(ball, rolled);  
           }  
          }  
          if (  
           ball.nextX - ballSize / 2 <= wallEnd.x + wallW / 2 &&  
           ball.nextX > wallEnd.x  
          ) {  
           // Ball might hit the right cap of a horizontal wall  
           const distance = distance2D(wallEnd, {  
            x: ball.nextX,  
            y: ball.nextY  
           });  
           if (distance < ballSize / 2 + wallW / 2) {  
            if (debugMode && wi > 4)  
             console.warn("too close h tail", distance, ball);  
            // Ball hits the right cap of a horizontal wall  
            const closest = closestItCanBe(wallEnd, {  
             x: ball.nextX,  
             y: ball.nextY  
            });  
            const rolled = rollAroundCap(wallEnd, {  
             x: closest.x,  
             y: closest.y,  
             velocityX: ball.velocityX,  
             velocityY: ball.velocityY  
            });  
            Object.assign(ball, rolled);  
           }  
          }  
          if (ball.nextX >= wallStart.x && ball.nextX <= wallEnd.x) {  
           // The ball got inside the main body of the wall  
           if (ball.nextY < wall.y) {  
            // Hit horizontal wall from top  
            ball.nextY = wall.y - wallW / 2 - ballSize / 2;  
           } else {  
            // Hit horizontal wall from bottom  
            ball.nextY = wall.y + wallW / 2 + ballSize / 2;  
           }  
           ball.y = ball.nextY;  
           ball.velocityY = -ball.velocityY / 3;  
           if (debugMode && wi > 4)  
            console.error("crossing h line, HIT", ball);  
          }  
         }  
        } else {  
         // Vertical wall  
         if (  
          ball.nextX + ballSize / 2 >= wall.x - wallW / 2 &&  
          ball.nextX - ballSize / 2 <= wall.x + wallW / 2  
         ) {  
          // Ball got within the strip of the wall  
          // (not necessarily hit it, could be before or after)  
          const wallStart = {  
           x: wall.x,  
           y: wall.y  
          };  
          const wallEnd = {  
           x: wall.x,  
           y: wall.y + wall.length  
          };  
          if (  
           ball.nextY + ballSize / 2 >= wallStart.y - wallW / 2 &&  
           ball.nextY < wallStart.y  
          ) {  
           // Ball might hit the top cap of a horizontal wall  
           const distance = distance2D(wallStart, {  
            x: ball.nextX,  
            y: ball.nextY  
           });  
           if (distance < ballSize / 2 + wallW / 2) {  
            if (debugMode && wi > 4)  
             console.warn("too close v head", distance, ball);  
            // Ball hits the left cap of a horizontal wall  
            const closest = closestItCanBe(wallStart, {  
             x: ball.nextX,  
             y: ball.nextY  
            });  
            const rolled = rollAroundCap(wallStart, {  
             x: closest.x,  
             y: closest.y,  
             velocityX: ball.velocityX,  
             velocityY: ball.velocityY  
            });  
            Object.assign(ball, rolled);  
           }  
          }  
          if (  
           ball.nextY - ballSize / 2 <= wallEnd.y + wallW / 2 &&  
           ball.nextY > wallEnd.y  
          ) {  
           // Ball might hit the bottom cap of a horizontal wall  
           const distance = distance2D(wallEnd, {  
            x: ball.nextX,  
            y: ball.nextY  
           });  
           if (distance < ballSize / 2 + wallW / 2) {  
            if (debugMode && wi > 4)  
             console.warn("too close v tail", distance, ball);  
            // Ball hits the right cap of a horizontal wall  
            const closest = closestItCanBe(wallEnd, {  
             x: ball.nextX,  
             y: ball.nextY  
            });  
            const rolled = rollAroundCap(wallEnd, {  
             x: closest.x,  
             y: closest.y,  
             velocityX: ball.velocityX,  
             velocityY: ball.velocityY  
            });  
            Object.assign(ball, rolled);  
           }  
          }  
          if (ball.nextY >= wallStart.y && ball.nextY <= wallEnd.y) {  
           // The ball got inside the main body of the wall  
           if (ball.nextX < wall.x) {  
            // Hit vertical wall from left  
            ball.nextX = wall.x - wallW / 2 - ballSize / 2;  
           } else {  
            // Hit vertical wall from right  
            ball.nextX = wall.x + wallW / 2 + ballSize / 2;  
           }  
           ball.x = ball.nextX;  
           ball.velocityX = -ball.velocityX / 3;  
           if (debugMode && wi > 4)  
            console.error("crossing v line, HIT", ball);  
          }  
         }  
        }  
       });  
       // Detect if a ball fell into a hole  
       if (hardMode) {  
        const holes = getHoles();
        holes.forEach((hole, hi) => {  
         const distance = distance2D(hole, {  
          x: ball.nextX,  
          y: ball.nextY  
         });  
         if (distance <= holeSize / 2) {  
          // The ball fell into a hole - deduct points and respawn
          updateScore(-5);
          holeElements[hi].style.backgroundColor = "red";
          
          // Flash effect
          setTimeout(() => {
              if (holeElements[hi]) {
                  holeElements[hi].style.backgroundColor = "black";
              }
          }, 300);
          
          // Respawn ball at original position
          const ballIndex = balls.indexOf(ball);
          const originalPositions = [
              { column: 0, row: 0 },
              { column: 9, row: 0 },
              { column: 0, row: 8 },
              { column: 9, row: 8 }
          ];
          
          if (ballIndex >= 0 && ballIndex < originalPositions.length) {
              const pos = originalPositions[ballIndex];
              ball.x = pos.column * (wallW + pathW) + (wallW / 2 + pathW / 2);
              ball.y = pos.row * (wallW + pathW) + (wallW / 2 + pathW / 2);
              ball.velocityX = 0;
              ball.velocityY = 0;
              ball.nextX = ball.x;
              ball.nextY = ball.y;
          }
         }  
        });  
       }  
       // Ball-to-ball collision detection (prevent merging) - Enhanced
       for (let i = 0; i < balls.length; i++) {
           if (i === balls.indexOf(ball)) continue; // Skip self
           
           const otherBall = balls[i];
           const distance = distance2D(ball, otherBall);
           const minDistance = ballSize + 2; // Add buffer to prevent sticking
           
           if (distance < minDistance && distance > 0.1) {
               // Calculate collision response with improved physics
               const angle = getAngle(ball, otherBall);
               const overlap = minDistance - distance;
               
               // Separate balls more aggressively
               const separationX = Math.cos(angle) * (overlap / 2 + 1);
               const separationY = Math.sin(angle) * (overlap / 2 + 1);
               
               // Move balls apart
               ball.x -= separationX;
               ball.y -= separationY;
               otherBall.x += separationX;
               otherBall.y += separationY;
               
               // Update next positions to prevent immediate re-collision
               ball.nextX = ball.x;
               ball.nextY = ball.y;
               otherBall.nextX = otherBall.x;
               otherBall.nextY = otherBall.y;
               
               // Elastic collision with realistic physics
               const relativeVelX = ball.velocityX - otherBall.velocityX;
               const relativeVelY = ball.velocityY - otherBall.velocityY;
               const collisionNormalX = Math.cos(angle);
               const collisionNormalY = Math.sin(angle);
               
               const relativeSpeed = relativeVelX * collisionNormalX + relativeVelY * collisionNormalY;
               
               if (relativeSpeed > 0) continue; // Objects separating
               
               const restitution = 0.8; // Bounce factor
               const impulse = 2 * relativeSpeed / 2; // Assuming equal mass
               
               ball.velocityX -= impulse * collisionNormalX * restitution;
               ball.velocityY -= impulse * collisionNormalY * restitution;
               otherBall.velocityX += impulse * collisionNormalX * restitution;
               otherBall.velocityY += impulse * collisionNormalY * restitution;
           }
       }

       // Adjust ball metadata  
       ball.x = ball.x + ball.velocityX;  
       ball.y = ball.y + ball.velocityY;  
      });  
      // Move balls to their new position on the UI  
      balls.forEach(({ x, y }, index) => {  
       ballElements[index].style.cssText = `left: ${x}px; top: ${y}px; `;  
      });  
     }  
     // Ball center detection and individual respawn
     const centerX = mazeWidth / 2;
     const centerY = mazeHeight / 2;
     const centerRadius = (endSize / 2) + 5; // Slightly larger radius for easier scoring
     const originalPositions = [
        { column: 0, row: 0 },
        { column: 9, row: 0 },
        { column: 0, row: 8 },
        { column: 9, row: 8 }
    ];
    
    // Check how many balls are simultaneously in the center (using ball center position)
     let ballsCurrentlyInCenter = 0;
     let ballsToRespawn = [];
     
     balls.forEach((ball, index) => {
         // Use ball center position for collision detection
         const ballCenterX = ball.x + (ballSize / 2);
         const ballCenterY = ball.y + (ballSize / 2);
         const distanceToCenter = distance2D({ x: ballCenterX, y: ballCenterY }, { x: centerX, y: centerY });
         
         // Check if ball center is within target radius
         if (distanceToCenter <= centerRadius) {
             console.log(`Ball ${index} reached center! Distance: ${distanceToCenter.toFixed(2)}, Radius: ${centerRadius}`);
             ballsCurrentlyInCenter++;
             ballsToRespawn.push(index);
         }
     });
     
     // Award points based on total balls that have reached center (cumulative scoring)
    if (ballsCurrentlyInCenter > 0) {
        // Increment the total count of balls that have reached center
        ballsInCenter += ballsCurrentlyInCenter;
        
        // Calculate incremental points based on total balls reached
        let points = 0;
        if (ballsInCenter === 1) points = 10;
        else if (ballsInCenter === 2) points = 20; // +20 more (total becomes 30)
        else if (ballsInCenter === 3) points = 50; // +50 more (total becomes 80)
        else if (ballsInCenter >= 4) points = 100; // +100 more (total becomes 180)
        
        // Award incremental points for this achievement
        updateScore(points);
        console.log(`Balls in center: ${ballsInCenter}, Points awarded: ${points}, Total score: ${gameScore + points}`);
        
        // Instantly vanish and respawn all balls that reached the center
        ballsToRespawn.forEach(index => {
            if (index < originalPositions.length) {
                const pos = originalPositions[index];
                // Instant teleport to starting position
                balls[index].x = pos.column * (wallW + pathW) + (wallW / 2 + pathW / 2);
                balls[index].y = pos.row * (wallW + pathW) + (wallW / 2 + pathW / 2);
                // Reset velocity for clean respawn
                balls[index].velocityX = 0;
                balls[index].velocityY = 0;
            }
        });
        
        // Check if all 4 balls have reached center for game completion
        if (ballsInCenter >= 4) {
            console.log("All balls reached center! Game complete!");
            // Reset for next round or end game
            ballsInCenter = 0;
        }
    }
     
     // Continue game loop
     previousTimestamp = timestamp;
     window.requestAnimationFrame(main);  
    } catch (error) {  
     console.error("Game error:", error);
     endGame("An error occurred!");
    }  
   }

   // Mode Selection Functions
   const showModeSelection = () => {
       document.getElementById('mode-selection').classList.remove('hide');
       document.querySelectorAll('.game-element').forEach(el => {
           el.style.display = 'none';
           el.classList.remove('show');
       });
       modeSelected = false;
       
       // Start countdown timer
       countdownSeconds = 5;
       updateCountdownDisplay();
       startModeSelectionCountdown();
   };

   const hideModeSelection = () => {
      // Clear countdown timer when hiding
      if (modeSelectionTimer) {
          clearInterval(modeSelectionTimer);
          modeSelectionTimer = null;
      }
      
      document.getElementById('mode-selection').classList.add('hide');
      document.querySelectorAll('.game-element').forEach(el => {
          el.style.display = 'block';
          el.classList.add('show');
      });
      modeSelected = true;
  };

  const updateCountdownDisplay = () => {
      const countdownElement = document.getElementById('countdown-timer');
      if (countdownElement) {
          countdownElement.textContent = `Auto-start Easy Mode in: ${countdownSeconds}s`;
      }
  };

  const startModeSelectionCountdown = () => {
      if (modeSelectionTimer) {
          clearInterval(modeSelectionTimer);
      }
      
      modeSelectionTimer = setInterval(() => {
          countdownSeconds--;
          updateCountdownDisplay();
          
          if (countdownSeconds <= 0) {
              clearInterval(modeSelectionTimer);
              modeSelectionTimer = null;
              // Auto-start Easy Mode
              startGameMode(false);
          }
      }, 1000);
  };

   const startGameMode = (isHardMode) => {
      hardMode = isHardMode;
      hideModeSelection();
      resetGame();
      // Start game loop
      window.requestAnimationFrame(main);
  };

  // Mode selection event listeners
   document.addEventListener('DOMContentLoaded', () => {
       const easyModeBtn = document.getElementById('easy-mode-btn');
       const hardModeBtn = document.getElementById('hard-mode-btn');
       
       if (easyModeBtn) {
           easyModeBtn.addEventListener('click', () => startGameMode(false));
       }
       
       if (hardModeBtn) {
           hardModeBtn.addEventListener('click', () => startGameMode(true));
       }
       
       // Show mode selection on page load
       showModeSelection();
   });  