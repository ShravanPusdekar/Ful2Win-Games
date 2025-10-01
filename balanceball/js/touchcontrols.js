////////////////////////////////////////////////////////////
// TOUCH CONTROLS
////////////////////////////////////////////////////////////

/*!
 * 
 * TOUCH CONTROLS INITIALIZATION - This is the function that initializes on-screen touch controls
 * 
 */

var touchControlsActive = false;
var leftPressed = false;
var rightPressed = false;
var moveSpeed = 8; // Speed of horizontal movement

/*!
 * 
 * INITIALIZE TOUCH CONTROLS - Show controls and setup event listeners
 * 
 */
function initTouchControls() {
    // Initialize touch controls (hidden by default via CSS)
    touchControlsActive = true;
    
    // Setup event listeners for D-Pad buttons
    setupDPadControls();
    
    // Setup event listener for Jump button
    setupJumpControl();
    
    console.log('✅ Touch controls initialized - Hold buttons for continuous movement');
}

/*!
 * 
 * SETUP D-PAD CONTROLS - Handle left/right movement
 * 
 */
function setupDPadControls() {
    var btnLeft = document.getElementById('btnLeft');
    var btnRight = document.getElementById('btnRight');
    
    if (!btnLeft || !btnRight) {
        console.error('❌ D-Pad buttons not found!');
        return;
    }
    
    // Left button events - HOLD for continuous movement
    btnLeft.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        leftPressed = true;
        rightPressed = false;
    });
    
    btnLeft.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        leftPressed = false;
    });
    
    btnLeft.addEventListener('touchcancel', function(e) {
        e.preventDefault();
        e.stopPropagation();
        leftPressed = false;
    });
    
    // Right button events - HOLD for continuous movement
    btnRight.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        rightPressed = true;
        leftPressed = false;
    });
    
    btnRight.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        rightPressed = false;
    });
    
    btnRight.addEventListener('touchcancel', function(e) {
        e.preventDefault();
        e.stopPropagation();
        rightPressed = false;
    });
    
    // Also support mouse events for testing on desktop
    btnLeft.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        leftPressed = true;
        rightPressed = false;
    });
    
    btnLeft.addEventListener('mouseup', function(e) {
        e.preventDefault();
        e.stopPropagation();
        leftPressed = false;
    });
    
    btnLeft.addEventListener('mouseleave', function(e) {
        leftPressed = false;
    });
    
    btnRight.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        rightPressed = true;
        leftPressed = false;
    });
    
    btnRight.addEventListener('mouseup', function(e) {
        e.preventDefault();
        e.stopPropagation();
        rightPressed = false;
    });
    
    btnRight.addEventListener('mouseleave', function(e) {
        rightPressed = false;
    });
}

/*!
 * 
 * SETUP JUMP CONTROL - Handle jump button
 * 
 */
function setupJumpControl() {
    var btnJump = document.getElementById('btnJump');
    
    if (!btnJump) {
        console.error('❌ Jump button not found!');
        return;
    }
    
    // Touch events
    btnJump.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        handleJump();
    });
    
    // Mouse events for testing on desktop
    btnJump.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        handleJump();
    });
}

/*!
 * 
 * HANDLE JUMP - Execute jump action
 * 
 */
function handleJump() {
    if (!gamePause) {
        if (playerJump == 0) {
            playerJump = 1;
            jumpPlayer();
        } else if (playerJump == 2) {
            jumpPlayer();
        }
    }
}

/*!
 * 
 * UPDATE TOUCH CONTROLS - Called every frame to handle continuous movement
 * This function enables HOLD-TO-WALK behavior
 */
function updateTouchControls() {
    if (!touchControlsActive) {
        return;
    }
    
    if (gamePause) {
        return;
    }
    
    // Get current player position
    var currentX = gamePlayer.x;
    var targetX = currentX;
    
    // Calculate continuous movement based on button press state
    // Player walks continuously while button is held down
    if (leftPressed) {
        targetX = currentX - moveSpeed;
    } else if (rightPressed) {
        targetX = currentX + moveSpeed;
    }
    
    // Apply movement if there's a change
    if (targetX !== currentX) {
        movePlayerPosX(targetX);
    }
}

/*!
 * 
 * HIDE TOUCH CONTROLS - Hide controls during menus
 * 
 */
function hideTouchControls() {
    // Remove 'active' class to hide controls (display: none)
    $('#touchControls').removeClass('active');
}

/*!
 * 
 * SHOW TOUCH CONTROLS - Show controls during gameplay
 * 
 */
function showTouchControls() {
    // Add 'active' class to show controls (display: block)
    $('#touchControls').addClass('active');
}

/*!
 * 
 * RESET TOUCH CONTROLS - Reset button states
 * 
 */
function resetTouchControls() {
    leftPressed = false;
    rightPressed = false;
}
