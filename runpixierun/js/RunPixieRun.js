domready(function() 
{
  onReady();
});

window.addEventListener('resize', function()
{
    resize();
});

window.onorientationchange = resize;

PIXI.Texture.fromFrameId = PIXI.Texture.fromFrame;

var GAME_MODE = {
    TITLE : 0, 
    COUNT_DOWN : 1, 
    PLAYING : 2, 
    GAME_OVER : 3, 
    INTRO : 4,
    PAUSED : 5
};

var width = 800;
var height = 600;
var isAdding = false;
var loader;
var game;
var mouseX = 0;
var mouseY = 0;
var ratio;
var offsetX;
var offsetY;
var holder;
var loadInterval = false;
var loadCount = 0;
var gameMode = 0;
var countdown;
var logo;
var black;
var interactive = true;
var stressTest;
var Device = new Fido.Device();
var pixiLogo;

var gameLoop = false;
var thrustLoop = false;
var thrusters = 0;
var thrustersVolume = 0;
// REMOVED: pauseButton, pauseScreen, resumeButton, restartButton
var soundToggleButton = false; // New standalone sound button
var isSoundMuted = false;

// Timer variables
var gameTimer = 120; // 2 minutes in seconds
var timerText = false; // Timer display (sprite-based numbers)
var timerColon = false; // Timer colon (text-based for clarity)
var timerActive = false; // Timer running state

function onReady()
{
    FidoAudio.init();
    stressTest = new PIXI.StressTest(onStressTestComplete);
    resize();
}

function onStressTestComplete()
{
        stressTest.end();
    GAME.lowMode = stressTest.result < 40;
    
    interactive = false;
    document.body.scroll = "no"; 
    
    loader = new PIXI.AssetLoader([
        "img/stretched_hyper_tile.jpg", 
        "img/SplashAssets.json", 
        "img/WorldAssets-hd.json", 
        "img/HudAssets-hd.json", 
        "img/PixiAssets-hd.json", 
        "img/iP4_BGtile.jpg",  
        "img/blackSquare.jpg",
        "assets/hud/pausedPanel.png",
        "assets/hud/pixieRevised_controls.png",
        "assets/hud/ContinuePlay.png",
        "assets/hud/RestartPlay.png",
        "assets/hud/soundOff.png",
        "assets/hud/soundOn.png",
        "assets/hud/pause.png",
        "assets/hud/PersonalBest.png"
    ]);
    
    loader.addEventListener('onComplete', function (event) 
    {	
        stressTest.remove();
        init();  
        clearInterval(loadInterval);
    });

    loader.load();
    resize();
}

function onTap(event)
{   
    event.originalEvent.preventDefault();
    
    if(event.target.type !== 'button')
    {   
        if(!interactive) return;
    
        if(gameMode === GAME_MODE.INTRO)
        {
            if(!Device.cocoonJS)
            {
                FidoAudio.play('gameMusic');
                FidoAudio.play('runRegular');
                FidoAudio.play('runFast');
            }
            
            interactive = false;
            gameMode =  GAME_MODE.TITLE;
            
            logo.alpha = 0;
            logo.scale.x = 1.5;
            logo.scale.y = 1.5;
            logo.setTexture(PIXI.Texture.fromFrame("assets/hud/pixieRevised_controls.png"));

            TweenLite.to(logo, 0.1, {
                alpha:1
            });
            
            TweenLite.to(logo.scale, 1, {
                x : 1, 
                y : 1, 
                ease : Elastic.easeOut, 
                onComplete : onIntroFaded
            });
        }
        else if(gameMode === GAME_MODE.TITLE)
        {
            interactive = false;
            
            game.start();
            gameMode = GAME_MODE.COUNT_DOWN;
            FidoAudio.setVolume('runRegular', 1);

            if(black) 
            {    
                TweenLite.to(black, 0.2, {
                    alpha : 0
                });
            }

            TweenLite.to(logo, 0.3, {
                alpha : 0, 
                onComplete : function()
                {
                    logo.visible = false;
                    logo.setTexture(PIXI.Texture.fromFrame("gameOver.png"));
                    game.view.showHud();
                    game.view.hud.removeChild(black);
                    countdown.startCountDown(onCountdownComplete);
                }
            });
        }
        else if(gameMode === GAME_MODE.GAME_OVER)
        {
            // DISABLED: Automatic restart on tap removed
            // Game Over screen now remains static and waits for external navigation
            console.log("Game Over - tap ignored, waiting for external input");
            return; // Prevent any action on Game Over screen
        }
        else
        {
            // handle our jump sound
            thrusters = true;
            if(game.isPlaying) game.steve.jump();
        }
    }
}

function init()
{
    gameMode = GAME_MODE.INTRO;
    interactive = false;

    game = new GAME.RprEngine();
    
    document.body.appendChild(game.view.renderer.view);
    game.view.renderer.view.style.position = "absolute";
    game.view.renderer.view.webkitImageSmoothingEnabled = false

    if(GAME.lowMode)
    {
        setInterval(update, 1000/30);
    }
    else
    {
        requestAnimFrame(update);
    }
    
    game.onGameover = onGameover;

    black = new PIXI.Sprite.fromImage("img/blackSquare.jpg");
    this.game.view.hud.addChild(black);
    
    TweenLite.to(black, 0.3, {
        alpha:0.75, 
        delay:0.5
    });
    
    logo = PIXI.Sprite.fromFrame("runLogo.png");
    logo.anchor.x = 0.5;
    logo.anchor.y = 0.5;
    logo.alpha = 0;
    
    this.game.view.hud.addChild(logo);
    
    personalBestTitle = PIXI.Sprite.fromImage("assets/hud/PersonalBest.png");
    personalBestTitle.anchor.x = 0.5;
    personalBestTitle.anchor.y = 0.5;
    personalBestTitle.alpha = 0;
    personalBestTitle.scale.x = 1.5;
    personalBestTitle.scale.y = 1.5;
    
    this.game.view.hud.addChild(personalBestTitle);
    
    var pressStart = PIXI.Sprite.fromFrame("spaceStart.png");
    pressStart.anchor.x = 0.5;
    pressStart.position.y = 200;

    TweenLite.to(logo, 0.1, {
        alpha : 1,
        delay : 0.6,
        onComplete : onIntroFaded
    });
    
    countdown = new GAME.Countdown();
    this.game.view.hud.addChild(countdown);
    
    // REMOVED: Pause button and pause screen (no longer needed)
    // REMOVED: Resume and restart buttons (pause menu removed)
    
    // Standalone Sound Toggle Button (top-left corner)
    soundToggleButton = PIXI.Sprite.fromImage("assets/hud/soundOn.png");
    soundToggleButton.anchor.x = 0.5;
    soundToggleButton.anchor.y = 0.5;
    soundToggleButton.scale.x = 0.8; // Slightly smaller for top-left placement
    soundToggleButton.scale.y = 0.8;
    soundToggleButton.alpha = 1; // Always visible
    soundToggleButton.interactive = true;
    soundToggleButton.type = "button";
    
    soundToggleButton.touchstart = soundToggleButton.mousedown = function(event)
    {
        event.originalEvent.preventDefault();
        onSoundToggle();
    }
    
    this.game.view.stage.addChild(soundToggleButton);
    
    // Timer Display (top-center) - Using sprite-based numbers like the score
    timerText = new GAME.Score(); // Reuse the Score class for consistent font style
    timerText.position.x = 0; // Will be centered in resize()
    timerText.position.y = 30;
    timerText.alpha = 0; // Hidden initially, shown when game starts
    
    // CRITICAL: Override setScore to prevent comma formatting on timer
    timerText.originalSetScore = timerText.setScore;
    timerText.setScore = function(score) {
        // Block setScore calls on timer - use updateTimerDisplay instead
        console.warn("[Timer] setScore blocked - use updateTimerDisplay");
    };
    
    // Create TEXT-BASED COLON for clear separation - matching green gradient style
    timerColon = new PIXI.Text(":", {
        font: "bold 72px 'Arial', 'Helvetica', sans-serif",
        fill: "#B0FF00", // Bright lime green (solid color for better rendering)
        stroke: "#004400",
        strokeThickness: 4,
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 4,
        dropShadowDistance: 2,
        lineJoin: 'round'
    });
    timerColon.anchor.x = 0.5;
    timerColon.anchor.y = 0.5; // Center anchor
    timerColon.alpha = 0; // Hidden initially
    timerColon.visible = false; // Start hidden
    timerText.addChild(timerColon); // Add as child so it moves with timer
    
    console.log("[Timer Init] Colon created:", timerColon.text);
    
    this.game.view.hud.addChild(timerText);
    updateTimerDisplay("2:00"); // Initial display using sprite numbers

    this.game.view.container.mousedown = this.game.view.container.touchstart = function(event)
    {
        onTap(event);
    }
    
    this.game.view.container.mouseup = this.game.view.container.touchend = function(event)
    {
        onTouchEnd(event);
    }
    
    resize();
    
    FidoAudio.play('gameMusic');
    FidoAudio.play('runRegular');
    FidoAudio.play('runFast');
}

// REMOVED: onResumePressed, onRestartPressed (pause menu removed)

function onSoundToggle()
{
    // Toggle sound on/off with visual feedback
    soundToggleButton.scale.set(0.6);
    
    TweenLite.to(soundToggleButton.scale, 0.5, {
        x : 0.8, 
        y : 0.8, 
        ease : Elastic.easeOut
    });
    
    if(isSoundMuted)
    {
        // Unmute sound
        FidoAudio.unMuteAll();
        soundToggleButton.setTexture(PIXI.Texture.fromImage("assets/hud/soundOn.png"));
        isSoundMuted = false;
        console.log("[Sound] Unmuted");
    }
    else
    {
        // Mute sound
        FidoAudio.muteAll();
        soundToggleButton.setTexture(PIXI.Texture.fromImage("assets/hud/soundOff.png"));
        isSoundMuted = true;
        console.log("[Sound] Muted");
    }
}

// REMOVED: pauseEnded() and onPaused() functions (pause functionality removed)

function onIntroFaded()
{
    interactive = true;
}

function onGameover()
{
    console.log("game is over");
    
    // Stop timer
    timerActive = false;
    
    // Print the score on game over
    if (game && typeof game.score !== "undefined") {
        // Send GAME_OVER message to parent window (preserved as required)
        window.parent.postMessage({ type: "GAME_OVER", score: game.score }, "*");
        console.log("Score: this run", game.score);
    } else {
        console.log("Score variable not found.");
    }
    // REMOVED: pauseButton hide logic (button no longer exists)
    FidoAudio.setVolume('thrusters', 0);
    
    gameMode = GAME_MODE.GAME_OVER;
    interactive = false;
    
    // Apply blur filter after 1 second delay
    setTimeout(function() {
        applyBlurEffect();
    }, 1000);
}

function applyBlurEffect()
{
    console.log("[Blur] Applying blur filter to game screen");
    
    // Create PIXI blur filter
    var blurFilter = new PIXI.BlurFilter();
    blurFilter.blur = 10; // Blur strength
    
    // Apply blur to the entire game view
    if(game && game.view && game.view.stage)
    {
        game.view.stage.filters = [blurFilter];
        console.log("[Blur] Blur filter applied successfully");
    }
}

function showGameover()
{
    console.log("show game over");
    logo.visible = true;
    TweenLite.to(logo, 0.3, {
        alpha:1, 
        onComplete : onGameoverShown
    });
}

function onGameoverShown()
{
    this.isGameReallyOver = true;
    interactive = true;
}

function onTouchStart(event)
{   
    onTap(event);   
}

function onCountdownComplete()
{
    interactive = true;
    gameMode = GAME_MODE.PLAYING;
    // REMOVED: pauseButton show logic (button no longer exists)
    
    // Start the 2-minute timer
    gameTimer = 120; // Reset to 2 minutes
    timerActive = true;
    
    // Show timer with fade-in animation
    TweenLite.to(timerText, 0.5, {
        alpha: 1
    });
    
    console.log("[Timer] Started - 2:00 countdown");
}

function onTouchEnd(event)
{
    event.originalEvent.preventDefault();
    thrusters = false;
    FidoAudio.setVolume('thrusters', 0);
    if(game.isPlaying) game.steve.fall();     
}

function getRatio(type, w, h) {

        var width = Device.cocoonJS ? window.innerWidth : w,
            height = Device.cocoonJS ? window.innerHeight : h;

        var dips = Device.pixelRatio;
        width = width * dips;
        height = height * dips;

        var scaleX = width / w,
            scaleY = height / h,
            result = {
                x: 1,
                y: 1
            };

        switch (type) {
            case 'all':
                result.x = scaleX > scaleY ? scaleY : scaleX;
                result.y = scaleX > scaleY ? scaleY : scaleX;
                break;
            case 'fit':
                result.x = scaleX > scaleY ? scaleX : scaleY;
                result.y = scaleX > scaleY ? scaleX : scaleY;
                break;
            case 'fill':
                result.x = scaleX;
                result.y = scaleY;
                break;
        }

        return result;
    }

function resize()
{
        window.scrollTo(0, 0);
        
        var h = 640;
    var width = window.innerWidth || document.body.clientWidth; 
    var height = window.innerHeight || document.body.clientHeight; 
        var ratio = height / h;
        
    if(game)
    {
            var view = game.view.renderer.view;
            view.style.height = h * ratio +"px";

            var newWidth = (width / ratio);

            view.style.width = width +"px";

            this.logo.position.x = newWidth / 2;
            this.logo.position.y = h/2 - 20;

            if(black)
            {
                black.scale.x = newWidth/16; 
                black.scale.y = h/16;
            }

            this.countdown.position.x = newWidth / 2;
            this.countdown.position.y = h/2;
        
            game.view.resize(newWidth , h);

            // Position sound toggle button in top-left corner
            soundToggleButton.position.x = 50; // 50px from left edge
            soundToggleButton.position.y = 50; // 50px from top edge
            
            // Position timer in top-center (sprite-based, already centered in updateTimerDisplay)
            timerText.position.x = newWidth / 2;
            timerText.position.y = 30; // 30px from top, matching initial setup
    }
    
    GAME.width = (width /ratio);
    GAME.height = h;
}

// Format timer display (seconds to MM:SS)
function formatTimer(seconds)
{
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    var timeString = mins + ":" + (secs < 10 ? "0" : "") + secs;
    
    // AGGRESSIVE FIX: Force replace ANY comma with colon at source
    timeString = timeString.replace(/,/g, ":");
    
    return timeString;
}

// Update timer display using sprite-based numbers with proper colon
function updateTimerDisplay(timeString)
{
    // QUAD-LAYER FIX: Aggressively ensure colon display
    // Layer 1: Replace commas AND apostrophes with colons
    timeString = timeString.replace(/[,']/g, ":");
    // Layer 2: Remove any non-time characters
    timeString = timeString.replace(/[^0-9:]/g, "");
    // Layer 3: Ensure format is correct (add colon if missing)
    if(timeString.indexOf(":") === -1 && timeString.length >= 2) {
        // If no colon found, insert it (e.g., "158" -> "1:58")
        var len = timeString.length;
        timeString = timeString.substring(0, len-2) + ":" + timeString.substring(len-2);
    }
    
    console.log("[Timer Display] Rendering:", timeString); // Debug output
    
    // Split into minutes and seconds for separate rendering
    var parts = timeString.split(":");
    var minutes = parts[0] || "0";
    var seconds = parts[1] || "00";
    
    // Combine without colon for sprite rendering
    var numbersOnly = minutes + seconds;
    
    var glyphs = timerText.glyphs;
    var digits = timerText.digits;
    var position = 0;
    var gap = -10; // Same gap as score display
    var colonPosition = 0; // Track where to place text colon
    
    // Render only numbers (skip colon character)
    var digitIndex = 0;
    for(var i = 0; i < numbersOnly.length && digitIndex < digits.length; i++)
    {
        var char = numbersOnly[i];
        var digit = digits[digitIndex];
        
        if(glyphs[char])
        {
            digit.visible = true;
            digit.setTexture(glyphs[char]);
            digit.scale.x = 1.0;
            digit.scale.y = 1.0;
            digit.position.x = position;
            digit.position.y = 0;
            position += digit.width + gap;
            digitIndex++;
            
            // After minutes, mark colon position
            if(i === minutes.length - 1)
            {
                colonPosition = position + 22; // Position for text colon (final spacing adjustment)
                position += 42; // Add more space for colon (final adjustment for visual balance)
            }
        }
    }
    
    // Hide unused sprite digits
    for(var i = digitIndex; i < digits.length; i++)
    {
        digits[i].visible = false;
    }
    
    // Center the timer display
    var centerOffset = position / 2;
    for(var i = 0; i < digits.length; i++)
    {
        digits[i].position.x -= centerOffset;
    }
    
    // Position and show text-based colon (centered with numbers)
    if(timerColon)
    {
        timerColon.position.x = colonPosition - centerOffset;
        timerColon.position.y = 38; // Vertical offset to perfectly center with sprite numbers
        timerColon.alpha = 1; // Make visible
        timerColon.visible = true; // Ensure visibility
        timerColon.updateText(); // Force text update
        console.log("[Timer Colon] Position X:", colonPosition - centerOffset, "Y:", 38);
    }
}

function update()
{
    game.update();
    
    // Update timer if active and game is playing
    if(timerActive && gameMode === GAME_MODE.PLAYING && !game.steve.isDead)
    {
        // Decrease timer: DELTA_TIME = 1.0 per frame at 60 FPS
        // Since we want real seconds, and DELTA_TIME represents frames, divide by 60
        // At 60 FPS: DELTA_TIME ≈ 1.0, so 1.0/60 = 0.0167 seconds per frame (correct!)
        gameTimer -= GAME.time.DELTA_TIME / 60;
        
        // Update timer display
        if(gameTimer > 0)
        {
            var timeString = formatTimer(gameTimer);
            updateTimerDisplay(timeString);
            
            // Visual warning when under 30 seconds - make sprites flash red
            if(gameTimer <= 30 && gameTimer > 0)
            {
                var flashIntensity = Math.sin(Date.now() / 200) * 0.5 + 0.5;
                var tintColor = 0xFFFFFF - Math.floor(flashIntensity * 0x0000FF);
                for(var i = 0; i < timerText.digits.length; i++)
                {
                    if(timerText.digits[i].visible)
                    {
                        timerText.digits[i].tint = tintColor;
                    }
                }
            }
            else
            {
                // Reset tint to white
                for(var i = 0; i < timerText.digits.length; i++)
                {
                    timerText.digits[i].tint = 0xFFFFFF;
                }
            }
        }
        else
        {
            // Timer reached 0:00 - trigger Game Over
            gameTimer = 0;
            updateTimerDisplay("0:00");
            // Tint red
            for(var i = 0; i < timerText.digits.length; i++)
            {
                if(timerText.digits[i].visible)
                {
                    timerText.digits[i].tint = 0xFF0000;
                }
            }
            timerActive = false;
            
            console.log("[Timer] Time's up! Triggering Game Over");
            
            // Trigger game over
            if(!game.steve.isDead)
            {
                game.steve.die();
            }
        }
    }

    if(!GAME.lowMode)
    {
        if(FidoAudio.isMuted() === false)
        {
            if(thrusters === true) 
            {
                thrustersVolume += (0.4 - thrustersVolume) * 0.1;
            }
            else
            {
                thrustersVolume += (0 - thrustersVolume) * 0.1;
            }

            if(thrustersVolume < 0.01) thrustersVolume = 0;

            FidoAudio.setVolume('thrusters', thrustersVolume);
        }
        
        requestAnimFrame(update);
    }
}

Time = function()
{
    this.deltaTime = 1;	
    this.lastTime = 0;
}

Time.constructor = Time;

Time.prototype.update = function()
{
    var time = Date.now();
    var currentTime =  time;
    var passedTime = currentTime - this.lastTime;
    
    if(passedTime > 100) passedTime = 100;

    this.DELTA_TIME = (passedTime * 0.06);
    this.lastTime = currentTime;
}

// Override
PIXI.InteractionManager.prototype.onTouchStart = function(event)
{
    var rect = this.interactionDOMElement.getBoundingClientRect();

    if(PIXI.AUTO_PREVENT_DEFAULT)event.preventDefault();
    
    var changedTouches = event.changedTouches;
    for (var i=0; i < changedTouches.length; i++)
    {
        var touchEvent = changedTouches[i];

        var touchData = this.pool.pop();
        if(!touchData)touchData = new PIXI.InteractionData();

        touchData.originalEvent =  event || window.event;

        this.touchs[touchEvent.identifier] = touchData;
        touchData.global.x = (touchEvent.clientX - rect.left) * (this.target.width / rect.width);
        touchData.global.y = (touchEvent.clientY - rect.top)  * (this.target.height / rect.height);
        
        if(navigator.isCocoonJS) 
        {
            var h = this.interactionDOMElement.style.height;
            var w = this.interactionDOMElement.style.width;
            
            var heightRatio = parseInt(h.replace('px', '')) / GAME.height;
            var widthRatio = parseInt(w.replace('px', '')) / GAME.width;
            
            touchData.global.x = touchEvent.clientX / widthRatio;
            touchData.global.y = touchEvent.clientY / heightRatio;
        }

        var length = this.interactiveItems.length;

        for (var j = 0; j < length; j++)
        {
            var item = this.interactiveItems[j];

            if(item.touchstart || item.tap)
            {
                item.__hit = this.hitTest(item, touchData);

                if(item.__hit)
                {
                    //call the function!
                    if(item.touchstart)item.touchstart(touchData);
                    item.__isDown = true;
                    item.__touchData = touchData;

                    if(!item.interactiveChildren)break;
                }
            }
        }
    }
};