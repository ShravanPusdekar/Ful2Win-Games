
(function(){

window.onload = function()
{
	setTimeout(function()
	{
		game.load();
	}, 10);
};

var ns = Q.use("fish");

var game = ns.game = 
{	
	container: null,
	width: 980,
	height: 545,
	baseWidth: 980,
	baseHeight: 545,
	scale: 1,
	fps: 60,
	frames: 0,
	params: null,
	events: Q.supportTouch ? ["touchstart", "touchend"] : ["mousedown", "mouseup"],
	
	fireInterval: 30,
	fireCount: 0,
	
	// Timer properties
	timeRemaining: 120, // 2 minutes in seconds
	timerInterval: null,
	timerDisplay: null,
	gameOver: false,
	score: 0
};

game.load = function(container)
{
    //获取URL参数设置
	var params = this.params = Q.getUrlParams();
	if(params.mode == undefined) params.mode = 2;
	if(params.fps) this.fps = params.fps;
	this.fireInterval = this.fps*0.5;
	
	//计算响应式尺寸
	this.screenWidth = window.innerWidth;
	this.screenHeight = window.innerHeight;
	
	// Calculate scale to fit screen while maintaining aspect ratio
	var scaleX = this.screenWidth / this.baseWidth;
	var scaleY = this.screenHeight / this.baseHeight;
	this.scale = Math.min(scaleX, scaleY);
	
	// Use base dimensions for game logic
	this.width = this.baseWidth;
	this.height = this.baseHeight;
	
	if(params.width) this.width = Number(params.width) || this.width;
	if(params.height) this.height = Number(params.height) || this.height;
	
	//初始化容器设置
	this.container = container || Q.getDOM("container");
	this.container.style.overflow = "hidden";
	this.container.style.width = Math.floor(this.width * this.scale) + "px";
	this.container.style.height = Math.floor(this.height * this.scale) + "px";
	
	//load info
	var div = Q.createDOM("div", {innerHTML: "Loading, please wait...<br>", style:
	{
		id: "loader",
		position: "absolute",
		width: this.width + "px",
		left: "0px",
		top: (this.height >> 1) + "px",
		textAlign: "center",
		color: "#fff",
		font: Q.isMobile ?  'bold 16px 黑体' : 'bold 16px 宋体',
		textShadow: "0 2px 2px #111"
	}});
	this.container.appendChild(div);
	this.loader = div;
    
    //hide nav bar
    this.hideNavBar();
    
    // Handle orientation change and window resize
    var resizeHandler = function()
    {
        game.hideNavBar();
        game.handleResize();
    };
    
    if(Q.supportOrientation)
    {
        window.addEventListener('orientationchange', resizeHandler);
    }
    window.addEventListener('resize', resizeHandler);
	
	//start load image
	var imgLoader = new Q.ImageLoader();
	imgLoader.addEventListener("loaded", Q.delegate(this.onLoadLoaded, this));
	imgLoader.addEventListener("complete", Q.delegate(this.onLoadComplete, this));
	imgLoader.load(ns.R.sources);
};

game.onLoadLoaded = function(e)
{
	var content = "Loading, please wait...<br>(" + Math.round(e.target.getLoadedSize()/e.target.getTotalSize()*100) + "%)";
	this.loader.innerHTML = content;
};

game.onLoadComplete = function(e)
{
	e.target.removeAllEventListeners();
	this.init(e.images);
};

game.init = function(images)
{
	ns.R.init(images);
	this.startup();
};

game.startup = function()
{
	var me = this;
	this.container.removeChild(this.loader);
	this.loader = null;
	
	//手持设备的特殊webkit设置	
	if(Q.isWebKit)
	{
		document.body.style.webkitTouchCallout = "none";
		document.body.style.webkitUserSelect = "none";
		document.body.style.webkitTextSizeAdjust = "none";
		document.body.style.webkitTapHighlightColor = "rgba(0,0,0,0)";
	}
	
	// Prevent default touch behaviors for better mobile gaming
	document.addEventListener('touchmove', function(e) {
		e.preventDefault();
	}, { passive: false });
	
	document.addEventListener('touchstart', function(e) {
		if(e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
			e.preventDefault();
		}
	}, { passive: false });
	
	var context = null;
	if(this.params.mode == 1)
	{
		var canvas = Q.createDOM("canvas", {id:"canvas", width:this.width, height:this.height, style:{position:"absolute"}});
		this.container.appendChild(canvas);
		this.context = new Q.CanvasContext({canvas:canvas});
	}else
	{
		this.context = new Q.DOMContext({canvas:this.container});
	}
	
	this.stage = new Q.Stage({width:this.width, height:this.height, context:this.context, update:Q.delegate(this.update, this)});
	this.stage.scaleX = this.stage.scaleY = this.params.scale || this.scale;
	
	var em = this.evtManager = new Q.EventManager();
	em.registerStage(this.stage, this.events, true, true);	
	
	this.initUI();
	this.initPlayer();
	
	//this.testFish();
	//this.testFishDirection();
	//this.testFishALL();
	
	this.fishManager = new ns.FishManager(this.fishContainer);
	this.fishManager.makeFish();
	
	var timer = this.timer = new Q.Timer(1000 / this.fps);
	timer.addListener(this.stage);
	timer.addListener(Q.Tween);
	timer.start();
	
	this.bgAudio = new Q.Audio("audios/bgmusic.m4a", true, true, true);
	
	this.showFPS();
	this.showInstructions();
	
	// Start timer after instructions (2 seconds delay)
	setTimeout(function() {
		me.startTimer();
	}, 2000);
};

game.initUI = function()
{
	this.bg = new Q.Bitmap({id:"bg", image:ns.R.mainbg, transformEnabled:false});
	
	this.fishContainer = new Q.DisplayObjectContainer({id:"fishContainer", width:this.width, height:this.height, eventChildren:false, transformEnabled:false});
	this.fishContainer.onEvent = function(e)
	{
		if(game.gameOver) return; // Don't allow actions when game is over
		
		if(e.type == game.events[0] && game.fireCount >= game.fireInterval)
		{
			game.fireCount = 0;
			game.player.fire({x:e.eventX, y:e.eventY});
			
			//load background audio for ios devices.
			if(game.bgAudio && !game.bgAudio.playing() && !game.bgAudio.loading)
			{
				game.bgAudio.loading = true;
				game.bgAudio.load();
			}
		}
	};
		
	this.bottom = new Q.Bitmap(ns.R.bottombar);
	this.bottom.id = "bottom";
	this.bottom.x = this.width - this.bottom.width >> 1;
	this.bottom.y = this.height - this.bottom.height + 2;
	this.bottom.transformEnabled = false;
	
	// Create timer display
	this.timerDisplay = Q.createDOM("div", {
		id: "timerDisplay",
		innerHTML: "TIME: 2:00",
		style: {
			position: "absolute",
			top: "5px",
			right: "5px",
			fontSize: "14px",
			fontWeight: "bold",
			color: "#FFD700",
			textShadow: "1px 1px 3px rgba(0, 0, 0, 0.9), 0 0 6px rgba(255, 215, 0, 0.5)",
			fontFamily: "Arial, sans-serif",
			zIndex: "1000",
			pointerEvents: "none",
			backgroundColor: "rgba(0, 0, 0, 0.7)",
			padding: "4px 10px",
			borderRadius: "6px",
			border: "1px solid rgba(255, 215, 0, 0.4)"
		}
	});
	this.container.appendChild(this.timerDisplay);
	
	// Create score display
	this.scoreDisplay = Q.createDOM("div", {
		id: "scoreDisplay",
		innerHTML: "SCORE: 0",
		style: {
			position: "absolute",
			top: "5px",
			left: "5px",
			fontSize: "14px",
			fontWeight: "bold",
			color: "#FFD700",
			textShadow: "1px 1px 3px rgba(0, 0, 0, 0.9), 0 0 6px rgba(255, 215, 0, 0.5)",
			fontFamily: "Arial, sans-serif",
			zIndex: "1000",
			pointerEvents: "none",
			backgroundColor: "rgba(0, 0, 0, 0.7)",
			padding: "4px 10px",
			borderRadius: "6px",
			border: "1px solid rgba(255, 215, 0, 0.4)"
		}
	});
	this.container.appendChild(this.scoreDisplay);
	
	this.stage.addChild(this.bg, this.fishContainer, this.bottom);	
};

game.initPlayer = function()
{
	var coin = Number(this.params.coin) || 10000;
	this.player = new ns.Player({id:"quark", coin:coin});
};

game.update = function(timeInfo)
{
	this.frames++;
	this.fireCount++;
	this.fishManager.update();
};

game.testFish = function()
{
	var num = this.params.num || 50, len = ns.R.fishTypes.length;
	for(var i = 0; i < num; i++)
	{
		var chance = Math.random() * (len - 1) >> 0;
		var index = Math.random() * chance + 1 >> 0;
		var type = ns.R.fishTypes[index];
		
		var fish = new ns.Fish(type);
		fish.x = Math.random()*this.width >> 0;
		fish.y = Math.random()*this.height >> 0;
		fish.moving = true;
		fish.rotation = Math.random() * 360 >> 0;
		fish.init();
		this.fishContainer.addChild(fish);
	}
};

game.testFishDirection = function()
{
	var dirs = [0, 45, 90, 135, 180, 225, 270, 315];
	
	for(var i = 0; i < 8; i++)
	{
		var fish = new ns.Fish(ns.R.fishTypes[1]);
		fish.x = this.width >> 1;
		fish.y = this.height >> 1;
		fish.speed = 0.5;
		fish.setDirection(dirs[i]);
		fish.moving = true;
		this.stage.addChild(fish);
	}
};

game.testFishALL = function()
{
	var sx = 100, sy = 50, y = 0, len = ns.R.fishTypes.length;
	for(var i = 0; i < len - 1; i++)
	{
		var type = ns.R.fishTypes[i+1];
		var fish = new ns.Fish(type);	
		if(i == 9) fish.x = sx;
		else fish.x = sx + Math.floor(i/5)*200;
		if(i == 9) y = sy + 320;
		else if(i%5 == 0) y = sy;
		fish.y = y + (i%5) * 20;
		y += fish.height;
		fish.update = function(){ };
		this.stage.addChild(fish);
	}
};

game.showFPS = function()
{
	var me = this, fpsContainer = Quark.getDOM("fps");
	if(fpsContainer)
	{
		setInterval(function()
		{
			fpsContainer.innerHTML = "FPS:" + me.frames;
			me.frames = 0;
		}, 1000);
	}
};

game.hideNavBar = function()
{
    window.scrollTo(0, 1);
};

game.showInstructions = function()
{
	var instructionsDiv = Q.createDOM("div", {
		id: "instructions",
		innerHTML: 
			'<div style="text-align: center;">' +
			'<div style="font-size: 28px; margin-bottom: 18px; color: #FFD700; text-shadow: 0 0 12px rgba(255, 215, 0, 0.8); font-weight: bold; letter-spacing: 1px; border-bottom: 2px solid rgba(255, 215, 0, 0.3); padding-bottom: 12px;">HOW TO PLAY</div>' +
			'<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 16px; text-align: center; margin-top: 15px;">' +
			'<div style="background: rgba(255, 215, 0, 0.1); padding: 12px; border-radius: 10px; border: 1px solid rgba(255, 215, 0, 0.3);"><strong>TAP</strong><br>to shoot</div>' +
			'<div style="background: rgba(255, 215, 0, 0.1); padding: 12px; border-radius: 10px; border: 1px solid rgba(255, 215, 0, 0.3);"><strong>+/- BUTTONS</strong><br>change power</div>' +
			'<div style="background: rgba(255, 215, 0, 0.1); padding: 12px; border-radius: 10px; border: 1px solid rgba(255, 215, 0, 0.3);"><strong>CATCH FISH</strong><br>earn points</div>' +
			'<div style="background: rgba(255, 215, 0, 0.1); padding: 12px; border-radius: 10px; border: 1px solid rgba(255, 215, 0, 0.3);"><strong>BEAT CLOCK</strong><br>win game</div>' +
			'</div>' +
			'</div>',
		style: {
			position: "absolute",
			top: "50%",
			left: "50%",
			transform: "translate(-50%, -50%)",
			backgroundColor: "rgba(0, 0, 0, 0.95)",
			padding: "30px 35px",
			borderRadius: "18px",
			border: "3px solid #FFD700",
			color: "#FFFFFF",
			fontFamily: "Arial, sans-serif",
			zIndex: "3000",
			boxShadow: "0 0 50px rgba(255, 215, 0, 0.7), inset 0 0 30px rgba(255, 215, 0, 0.05)",
			animation: "fadeIn 0.3s ease-in",
			maxWidth: "400px",
			minWidth: "300px"
		}
	});
	
	document.body.appendChild(instructionsDiv);
	
	// Remove instructions after 2 seconds
	setTimeout(function() {
		if(instructionsDiv && instructionsDiv.parentNode) {
			instructionsDiv.style.animation = "fadeOut 0.3s ease-out";
			setTimeout(function() {
				document.body.removeChild(instructionsDiv);
			}, 300);
		}
	}, 2000);
};

game.handleResize = function()
{
	if(!this.container || !this.stage) return;
	
	// Recalculate screen dimensions
	this.screenWidth = window.innerWidth;
	this.screenHeight = window.innerHeight;
	
	// Calculate new scale
	var scaleX = this.screenWidth / this.baseWidth;
	var scaleY = this.screenHeight / this.baseHeight;
	this.scale = Math.min(scaleX, scaleY);
	
	// Update container size
	this.container.style.width = Math.floor(this.width * this.scale) + "px";
	this.container.style.height = Math.floor(this.height * this.scale) + "px";
	
	// Update stage scale
	this.stage.scaleX = this.stage.scaleY = this.scale;
	
	// Update stage position if method exists
	if(this.stage.updatePosition) this.stage.updatePosition();
};

game.startTimer = function()
{
	var me = this;
	this.timerInterval = setInterval(function()
	{
		if(me.gameOver) return;
		
		me.timeRemaining--;
		me.updateTimerDisplay();
		
		if(me.timeRemaining <= 0)
		{
			me.triggerGameOver();
		}
	}, 1000);
};

game.updateTimerDisplay = function()
{
	if(!this.timerDisplay) return;
	
	var minutes = Math.floor(this.timeRemaining / 60);
	var seconds = this.timeRemaining % 60;
	var timeString = "TIME: " + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
	
	this.timerDisplay.innerHTML = timeString;
	
	// Change color when time is running out
	if(this.timeRemaining <= 10)
	{
		this.timerDisplay.style.color = "#FF0000";
		this.timerDisplay.style.textShadow = "0 0 5px rgba(255, 0, 0, 0.8), 1px 1px 3px rgba(0, 0, 0, 0.8)";
	}
	else if(this.timeRemaining <= 30)
	{
		this.timerDisplay.style.color = "#FFA500";
		this.timerDisplay.style.textShadow = "0 0 5px rgba(255, 165, 0, 0.8), 1px 1px 3px rgba(0, 0, 0, 0.8)";
	}
};

game.triggerGameOver = function()
{
	if(this.gameOver) return;
	
	this.gameOver = true;
	
	// Stop the timer
	if(this.timerInterval)
	{
		clearInterval(this.timerInterval);
		this.timerInterval = null;
	}
	
	// Stop the game timer
	if(this.timer)
	{
		this.timer.stop();
	}
	
	// Apply blur effect to the container
	this.container.style.filter = "blur(10px)";
	this.container.style.webkitFilter = "blur(10px)";
	
	// Send game over message to parent window
	window.parent.postMessage({ type: "GAME_OVER", score: this.score }, "*");
};

})();