var DEBUG = false;
var input;
var stage;

var assets = [];
var loader;
var spriteSheets = {};

function initialize() {
	stage = new createjs.Stage("myCanvas");
	createjs.Ticker.timingMode = createjs.Ticker.RAF;
	createjs.Ticker.addEventListener("tick", stage);
	createjs.Ticker.setFPS(60);
	createjs.Touch.enable(stage);
	createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin]);
    createjs.Sound.alternateExtensions = ["ogg"];

	var manifest = [{
		src: "assets/main_screen.jpg",
		id: "mainMenu"
	}];

	loader = new createjs.LoadQueue(true);
	loader.installPlugin(createjs.Sound);
	loader.addEventListener("fileload", handleFileLoad);
	loader.addEventListener("complete", createLoader);
	loader.loadManifest(manifest);
}

function createLoader() {
	loader.removeAllEventListeners("fileload");
	loader.removeAllEventListeners("complete");

	var main = new createjs.Container();
	main.name = "mainMenu";
	stage.addChild(main);

	var img = loader.getResult("mainMenu");
	var bg = new createjs.Bitmap(img);
	main.addChild(bg);

	var titleLabel = new createjs.Text(localization.title, "50px gameFont", "#7269a8");
	titleLabel.name = "titleLabel";
	titleLabel.x = 240;
	titleLabel.y = 95;
	titleLabel.textAlign = "center";
	titleLabel.textBaseline = 'middle';
	titleLabel.lineHeight = 0;
	main.addChild(titleLabel);

	var loadingLabel = new createjs.Text(localization.loading, "40px gameFont", "#ffffff");
	loadingLabel.name = "loadingLabel";
	loadingLabel.x = 240;
	loadingLabel.y = 290;
	loadingLabel.textAlign = "center";
	loadingLabel.textBaseline = "middle";
	main.addChild(loadingLabel);

	var manifest = [{
		src: "assets/gumball.png",
		id: "gumballBMP"
	}, {
		src: "assets/obstacles.png",
		id: "obstaclesBMP"
	}, {
		src: "assets/ui.png",
		id: "uiBMP"
	}, {
		src: "assets/gumball.json",
		id: "gumballData"
	}, {
		src: "assets/obstacles.json",
		id: "obstaclesData"
	}, {
		src: "assets/ui.json",
		id: "uiData"
	}];

	for (var key in sounds) {
		manifest.push({
			id: key,
			src: sounds[key].src
		});
	}

	loader.addEventListener("fileload", handleFileLoad);
	loader.addEventListener("progress", onProgress);
	loader.addEventListener("complete", createMainMenu);
	loader.loadManifest(manifest);
}

function onProgress(event) {
	stage.getChildByName("mainMenu").getChildByName("loadingLabel").text = localization.loading + ": " + Math.round(event.progress * 100);
}

function handleFileLoad(event) {
	assets.push(event.item);
}

function createMainMenu() {
	loader.removeAllEventListeners("fileload");
	loader.removeAllEventListeners("complete");
	loader.removeAllEventListeners("progress");

	setTimeout(function() {
		spriteSheets["ui"] = new createjs.SpriteSheet(JSON.parse(loader.getResult("uiData", true)));
		spriteSheets["gumball"] = new createjs.SpriteSheet(JSON.parse(loader.getResult("gumballData", true)));
		spriteSheets["obstacles"] = new createjs.SpriteSheet(JSON.parse(loader.getResult("obstaclesData", true)));
		spriteSheets["ui"].getAnimation("tutorial").speed = 0.033;

		var mainMenu = stage.getChildByName("mainMenu");
		mainMenu.getChildByName("loadingLabel").visible = false;

		// AUTO-ADVANCE: Skip play button and go directly to tutorial
		setTimeout(function() {
			createGame(null); // Skip tutorial and go directly to game
		}, 500); // Small delay to show loading completion
	}, 250);
}

function createTutorial() {
	playSound("button");

	var tutorial = new createjs.Container();
	tutorial.name = "tutorial";
	stage.addChild(tutorial);

	var bitmapAnimation = new createjs.Sprite(spriteSheets["ui"]);
	bitmapAnimation.gotoAndPlay("tutorial");

	tutorial.addChild(bitmapAnimation);

	var tutorialLabel = new createjs.Text(localization.tutorial, "50px gameFont", "#7269a8");
	tutorialLabel.name = "tutorialLabel";
	tutorialLabel.x = 240;
	tutorialLabel.y = 85;
	tutorialLabel.textAlign = "center";
	tutorialLabel.textBaseline = 'middle';
	tutorialLabel.lineHeight = 0;
	tutorial.addChild(tutorialLabel);

	tutorial.addEventListener("click", function() {});
	tutorial.alpha = 0;
	createjs.Tween.get(tutorial)
		.to({
			alpha: 1
		}, 500, createjs.Ease.backOut)
		.call(function() {
			tutorial.addEventListener("click", createGame);
		});
}

// NEW FUNCTION: Show tutorial during gameplay (help button)
function showTutorial(ces) {
	playSound("button");
	
	// Pause the game
	ces.stop();
	
	// Create tutorial overlay
	var tutorialOverlay = new createjs.Container();
	tutorialOverlay.name = "tutorialOverlay";
	stage.addChild(tutorialOverlay);
	
	// Add semi-transparent background
	var bg = new createjs.Shape();
	bg.graphics.beginFill("rgba(0,0,0,0.7)").drawRect(0, 0, 480, 320);
	tutorialOverlay.addChild(bg);
	
	// Add tutorial animation
	var bitmapAnimation = new createjs.Sprite(spriteSheets["ui"]);
	bitmapAnimation.gotoAndPlay("tutorial");
	tutorialOverlay.addChild(bitmapAnimation);
	
	// Add tutorial label
	var tutorialLabel = new createjs.Text(localization.tutorial, "50px gameFont", "#7269a8");
	tutorialLabel.x = 240;
	tutorialLabel.y = 85;
	tutorialLabel.textAlign = "center";
	tutorialLabel.textBaseline = 'middle';
	tutorialOverlay.addChild(tutorialLabel);
	
	// Add "Click to continue" text
	var continueLabel = new createjs.Text("Click to continue", "20px gameFont", "#ffffff");
	continueLabel.x = 240;
	continueLabel.y = 280;
	continueLabel.textAlign = "center";
	tutorialOverlay.addChild(continueLabel);
	
	// Make it clickable to close
	tutorialOverlay.addEventListener("click", function() {
		playSound("button");
		stage.removeChild(tutorialOverlay);
		ces.start(); // Resume the game
	});
	
	// Fade in animation
	tutorialOverlay.alpha = 0;
	createjs.Tween.get(tutorialOverlay)
		.to({
			alpha: 1
		}, 300, createjs.Ease.backOut);
}

function createGame(event) {
	playSound("music");

	input = {
		mouseDown: false
	}

	//------------------------------------------------------------------
	// Game
	//------------------------------------------------------------------
	var ces = new CES();
	ces.addSystem(new InputSystem());
	ces.addSystem(new Gravity());
	ces.addSystem(new RunnerSystem());
	ces.addSystem(new DisplacementSystem());
	ces.addSystem(new Collision());

	var onRunFunc = function(score) {
		guiLayer.getChildByName("scoreValue").text = score
	};

	var onDieFunc = function(score) {
		stopSound("music");
		
		// Add blur effect to entire screen
		var gameContainer = stage.getChildByName("game");
		if (gameContainer) {
			gameContainer.filters = [new createjs.BlurFilter(8, 8, 1)];
			gameContainer.cache(0, 0, stage.canvas.width, stage.canvas.height);
			
			// Send game over message immediately after blur effect is applied
			window.parent.postMessage({ type: "GAME_OVER", score: score }, "*");
		}
		
		guiLayer.getChildByName("gameOverContainer").visible = true;
		guiLayer.getChildByName("gameOverContainer").getChildByName("gameOverScore").text = score;
		createjs.Tween.get(guiLayer.getChildByName("gameOverContainer"))
			.wait(1250)
			.to({
				alpha: 1
			}, 500, createjs.Ease.backOut)
			.call(function() {
				ces.stop();
			});
	};

	ces.addSystem(new PlayerActionCheck(onRunFunc, onDieFunc));
	ces.addSystem(new InfiniteFloorSystem());
	ces.addSystem(new CameraSystem());
	ces.addSystem(new SpawnSystem());
	ces.addSystem(new RenderSystem(stage));

	//------------------------------------------------------------------
	// Creation
	//------------------------------------------------------------------
	// Add global event listeners for full-screen jump input
	document.body.addEventListener("mousedown", onMouseDown);
	document.body.addEventListener("touchstart", onMouseDown);
	
	var mouseCacher = new createjs.Shape();
	mouseCacher.graphics.beginFill("rgba(150, 150, 255, 0)");
	mouseCacher.graphics.rect(0, 0, 480, 320);
	mouseCacher.graphics.endFill();

	var game = new createjs.Container();
	game.name = "game";
	game.alpha = event ? 0 : 1;

	var skyLayer = new createjs.Container();
	var backgroundLayer = new createjs.Container();
	var floorLayer = new createjs.Container();
	var gameLayer = new createjs.Container();
	var foregroundLayer = new createjs.Container();
	var guiLayer = new createjs.Container();

	addBgTiles(skyLayer, spriteSheets["obstacles"], ["bg_tile"]);
	addBgTiles(backgroundLayer, spriteSheets["obstacles"], ["2nd_tile"], new Vec2(0, 127));
	addBgTiles(floorLayer, spriteSheets["obstacles"], ["grass_tile01", "grass_tile02"], new Vec2(0, 254));

	stage.addChild(game);
	game.addChild(mouseCacher);
	game.addChild(skyLayer);
	game.addChild(backgroundLayer);
	game.addChild(floorLayer);
	game.addChild(gameLayer);
	game.addChild(foregroundLayer);
	game.addChild(guiLayer);

	createGUI(ces, guiLayer);

	createPlayer(ces, gameLayer, new Vec2(-200, 160), guiLayer);
	createFloorTile(ces, gameLayer);
	createCamera(ces, foregroundLayer, gameLayer, floorLayer, backgroundLayer, skyLayer);
	createObstacleSpawner(ces, gameLayer);

	ces.start();

	createjs.Tween.get(game)
		.to({
			alpha: 1
		}, 1000, createjs.Ease.backOut)
		.call(function() {
			var tutorialContainer = stage.getChildByName("tutorial");
			stage.removeChild(tutorialContainer);
		});
}

function onMouseDown(event) {
	// Prevent default behavior to avoid unwanted zoom/scroll
	if (event.preventDefault) {
		event.preventDefault();
	}
	input.mouseDown = true;
}

function cleanupGameEvents() {
	// Remove global event listeners when game ends
	document.body.removeEventListener("mousedown", onMouseDown);
	document.body.removeEventListener("touchstart", onMouseDown);
}

function createGUI(ces, layer) {
	// MUTE/UNMUTE BUTTON (replaces pause button)
	if (!isChrome) {
		var rectMute = spriteSheets["ui"].getFrame(spriteSheets["ui"].getAnimation("sound_btn_on").frames[0]).rect;
		var muteBtn = new createjs.Sprite(spriteSheets["ui"]);
		muteBtn.name = "muteBtn";
		muteBtn.snapToPixel = true;
		muteBtn.gotoAndStop("sound_btn_on");
		muteBtn.regX = rectMute.width / 2;
		muteBtn.regY = rectMute.height / 2;
		muteBtn.x = 34.5;
		muteBtn.y = 34.5;
		muteBtn.cursor = "pointer";
		muteBtn.visible = createjs.Sound.getVolume() == 1;
		muteBtn.addEventListener("click", function(e) {
			playSound("button");
			layer.getChildByName("muteBtn").visible = false;
			layer.getChildByName("unmuteBtn").visible = true;
			createjs.Sound.setVolume(0);
		});
		layer.addChild(muteBtn);

		var unmuteBtn = new createjs.Sprite(spriteSheets["ui"]);
		unmuteBtn.name = "unmuteBtn";
		unmuteBtn.snapToPixel = true;
		unmuteBtn.gotoAndStop("sound_btn_off");
		unmuteBtn.regX = rectMute.width / 2;
		unmuteBtn.regY = rectMute.height / 2;
		unmuteBtn.x = 34.5;
		unmuteBtn.y = 34.5;
		unmuteBtn.cursor = "pointer";
		unmuteBtn.visible = createjs.Sound.getVolume() == 0;
		unmuteBtn.addEventListener("click", function(e) {
			layer.getChildByName("muteBtn").visible = true;
			layer.getChildByName("unmuteBtn").visible = false;
			createjs.Sound.setVolume(1);
			playSound("button");
		});
		layer.addChild(unmuteBtn);
	}

	// HELP BUTTON (shows tutorial) - Using text-based button
	var helpBtn = new createjs.Container();
	helpBtn.name = "helpBtn";
	
	// Create circular background
	var helpBg = new createjs.Shape();
	helpBg.graphics.beginFill("#7269a8").drawCircle(0, 0, 20);
	helpBg.graphics.beginStroke("#ffffff").setStrokeStyle(2).drawCircle(0, 0, 20);
	helpBtn.addChild(helpBg);
	
	// Add "?" text - properly centered
	var helpText = new createjs.Text("?", "24px gameFont", "#ffffff");
	helpText.textAlign = "center";
	helpText.textBaseline = "middle";
	helpText.x = 0;
	helpText.y = -2; // Slight adjustment to visually center the text
	helpBtn.addChild(helpText);
	
	// Position the help button
	helpBtn.x = 80;
	helpBtn.y = 34.5;
	helpBtn.cursor = "pointer";
	
	// Add click handler
	helpBtn.addEventListener("click", function(e) {
		playSound("button");
		showTutorial(ces);
	});
	
	// Add hover effects
	helpBtn.addEventListener("mouseover", function(e) {
		helpBg.graphics.clear().beginFill("#8a7bb8").drawCircle(0, 0, 20);
		helpBg.graphics.beginStroke("#ffffff").setStrokeStyle(2).drawCircle(0, 0, 20);
	});
	
	helpBtn.addEventListener("mouseout", function(e) {
		helpBg.graphics.clear().beginFill("#7269a8").drawCircle(0, 0, 20);
		helpBg.graphics.beginStroke("#ffffff").setStrokeStyle(2).drawCircle(0, 0, 20);
	});
	
	layer.addChild(helpBtn);

	// Score
	var rectBg = spriteSheets["ui"].getFrame(spriteSheets["ui"].getAnimation("score_container").frames[0]).rect;
	var scoreBg = new createjs.Sprite(spriteSheets["ui"]);
	scoreBg.snapToPixel = true;
	scoreBg.gotoAndStop("score_container");
	scoreBg.regX = rectBg.width / 2;
	scoreBg.regY = rectBg.height / 2;
	scoreBg.x = 405;
	scoreBg.y = 35;
	layer.addChild(scoreBg);

	var scoreLabel = new createjs.Text(localization.score, "20px gameFont", "#ffffff");
	scoreLabel.name = "scoreLabel";
	scoreLabel.x = 405;
	scoreLabel.y = 15;
	scoreLabel.textAlign = "center";
	scoreLabel.alpha = 0.5;
	scoreLabel.textBaseline = "top";
	layer.addChild(scoreLabel);

	var scoreValue = new createjs.Text("0", "26px gameFont", "#ffffff");
	scoreValue.name = "scoreValue";
	scoreValue.x = 405;
	scoreValue.y = 31;
	scoreValue.textAlign = "center";
	scoreValue.alpha = 0.8;
	scoreValue.textBaseline = "top";
	layer.addChild(scoreValue);

	// Pause popup
	var pauseContainer = new createjs.Container();
	pauseContainer.name = "pauseContainer";
	layer.addChild(pauseContainer);

	var pauseBg = new createjs.Sprite(spriteSheets["ui"]);
	pauseBg.snapToPixel = true;
	pauseBg.gotoAndStop("pause_container");
	pauseBg.addEventListener("click", function(e) {});
	pauseContainer.addChild(pauseBg);

	var pauseLabel = new createjs.Text(localization.pause, "45px gameFont", "#ffffff");
	pauseLabel.name = "pauseLabel";
	pauseLabel.x = 240;
	pauseLabel.y = 50;
	pauseLabel.textAlign = "center";
	pauseLabel.textBaseline = "top";
	pauseContainer.addChild(pauseLabel);

	if (!isChrome) {
		var rectMute = spriteSheets["ui"].getFrame(spriteSheets["ui"].getAnimation("sound_btn_on").frames[0]).rect;
		var muteBtn = new createjs.Sprite(spriteSheets["ui"]);
		muteBtn.name = "muteBtn";
		muteBtn.snapToPixel = true;
		muteBtn.gotoAndStop("sound_btn_on");
		muteBtn.regX = rectMute.width / 2;
		muteBtn.regY = rectMute.height / 2;
		muteBtn.x = 240;
		muteBtn.y = 150;
		muteBtn.cursor = "pointer";
		muteBtn.visible = createjs.Sound.getVolume() == 1;
		muteBtn.addEventListener("click", function(e) {
			pauseContainer.getChildByName("muteBtn").visible = false;
			pauseContainer.getChildByName("unmuteBtn").visible = true;
			createjs.Sound.setVolume(0);
		});
		pauseContainer.addChild(muteBtn);

		var unmuteBtn = new createjs.Sprite(spriteSheets["ui"]);
		unmuteBtn.name = "unmuteBtn";
		unmuteBtn.snapToPixel = true;
		unmuteBtn.gotoAndStop("sound_btn_off");
		unmuteBtn.regX = rectMute.width / 2;
		unmuteBtn.regY = rectMute.height / 2;
		unmuteBtn.x = 240;
		unmuteBtn.y = 150;
		unmuteBtn.cursor = "pointer";
		unmuteBtn.visible = createjs.Sound.getVolume() == 0;
		unmuteBtn.addEventListener("click", function(e) {
			pauseContainer.getChildByName("muteBtn").visible = true;
			pauseContainer.getChildByName("unmuteBtn").visible = false;
			createjs.Sound.setVolume(1);
			playSound("button");
		});
		pauseContainer.addChild(unmuteBtn);
	}

	var backBtn = createButton(spriteSheets["ui"], localization.back, function(e) {
		playSound("button");
		ces.start();
		createjs.Tween.get(layer.getChildByName("pauseContainer"))
			.to({
				alpha: 0
			}, 500, createjs.Ease.backOut)
			.call(function() {
				layer.getChildByName("pauseContainer").visible = false;
			});
	});

	backBtn.x = 240;
	backBtn.y = 210;
	pauseContainer.addChild(backBtn);

	var exitBtn = createButton(spriteSheets["ui"], localization.exit, function(e) {
		playSound("button");
		stopSound("music");
		cleanupGameEvents();
		ces = null;
		var game = stage.getChildByName("game");
		createjs.Tween.get(game)
			.to({
				alpha: 0
			}, 500, createjs.Ease.backOut)
			.call(function() {
				stage.removeChild(game);
			});
	});

	exitBtn.x = 240;
	exitBtn.y = 260;
	pauseContainer.addChild(exitBtn);
	pauseContainer.alpha = 0;
	pauseContainer.visible = false;

	// GameOver
	var gameOverContainer = new createjs.Container();
	gameOverContainer.name = "gameOverContainer";
	layer.addChild(gameOverContainer);

	var gameOverBg = new createjs.Sprite(spriteSheets["ui"]);
	gameOverBg.snapToPixel = true;
	gameOverBg.gotoAndStop("pause_container");
	pauseBg.addEventListener("click", function(e) {});
	gameOverContainer.addChild(gameOverBg);

	var gameOverLabel = new createjs.Text(localization.score, "45px gameFont", "#ffffff");
	gameOverLabel.name = "gameOverLabel";
	gameOverLabel.x = 240;
	gameOverLabel.y = 50;
	gameOverLabel.textAlign = "center";
	gameOverLabel.textBaseline = "top";
	gameOverLabel.alpha = 0.5;
	gameOverContainer.addChild(gameOverLabel);

	var gameOverScore = new createjs.Text("0", "60px gameFont", "#ffffff");
	gameOverScore.name = "gameOverScore";
	gameOverScore.x = 240;
	gameOverScore.y = 100;
	gameOverScore.textAlign = "center";
	gameOverScore.textBaseline = "top";
	gameOverScore.alpha = 0.8;
	gameOverContainer.addChild(gameOverScore);

	// REPLAY BUTTON REMOVED - No longer needed
	// Game over will send postMessage to parent window instead
	gameOverContainer.alpha = 0;
	gameOverContainer.visible = false;
}

function createButton(spriteSheet, text, handler) {
	var btn = new createjs.Container();
	btn.cursor = "pointer";
	btn.addEventListener("click", handler);

	var rectBg = spriteSheet.getFrame(spriteSheet.getAnimation("pause_screen_btn").frames[0]).rect;
	var btnBg = new createjs.Sprite(spriteSheet);
	btnBg.snapToPixel = true;
	btnBg.gotoAndStop("pause_screen_btn");
	btnBg.x = -rectBg.width / 2;
	btnBg.y = -rectBg.height / 2;
	btn.addChild(btnBg);

	var label = new createjs.Text(text, "30px gameFont", "#ffe88d");
	label.name = "label";
	label.x = 0;
	label.y = 0;
	label.textAlign = "center";
	label.textBaseline = "middle";
	btn.addChild(label);

	return btn;
}

function createPlayer(ces, container, position, guiLayer) {
	var id = ces.getNewEntityId();

	var transform = new Transform();
	transform.position = position;
	ces.addComponentToEntity(transform, id);

	var rigidBody = new RigidBody();
	rigidBody.velocity = new Vec2(400, 0);
	ces.addComponentToEntity(rigidBody, id);

	var runner = new Runner();
	runner.acceleration = new Vec2(5, -10);
	ces.addComponentToEntity(runner, id);

	var collider = new Collider();
	collider.size = new Vec2(32, 52);
	ces.addComponentToEntity(collider, id);

	spriteSheets["gumball"].getAnimation("run").speed = 0.5;
	spriteSheets["gumball"].getAnimation("jump_in").next = false;
	spriteSheets["gumball"].getAnimation("jump_in").speed = 0.25;
	spriteSheets["gumball"].getAnimation("jump_out").next = false;
	var rect = spriteSheets["gumball"].getFrame(spriteSheets["gumball"].getAnimation("run").frames[0]).rect;

	var bitmapAnimation = new createjs.Sprite(spriteSheets["gumball"]);
	bitmapAnimation.regX = rect.width / 2;
	bitmapAnimation.regY = rect.height / 2;
	bitmapAnimation.snapToPixel = true;
	bitmapAnimation.gotoAndPlay("run");
	ces.addComponentToEntity(new View(bitmapAnimation, collider, container), id);

	ces.addComponentToEntity(new Player(), id);
}

function createObstacle(ces, container, position, name, colliderSize, colliderCenter) {
	var id = ces.getNewEntityId();

	var transform = new Transform();
	transform.position = position;
	ces.addComponentToEntity(transform, id);

	var collider = new Collider();
	collider.size = colliderSize;
	collider.center = colliderCenter || new Vec2();
	ces.addComponentToEntity(collider, id);

	var rect = spriteSheets["obstacles"].getFrame(spriteSheets["obstacles"].getAnimation(name).frames[0]).rect;
	var bitmapAnimation = new createjs.Sprite(spriteSheets["obstacles"]);
	bitmapAnimation.regX = rect.width / 2;
	bitmapAnimation.regY = rect.height / 2;
	bitmapAnimation.snapToPixel = true;
	bitmapAnimation.gotoAndStop(name);
	ces.addComponentToEntity(new View(bitmapAnimation, collider, container), id);
}

function addBgTiles(container, spriteSheet, bitmapsName, offset) {
	var offset = offset || new Vec2();

	for (var i = 0; i < 3; i++) {
		var index = Math.floor(Math.random() * bitmapsName.length);
		var bitmapAnimation = new createjs.Sprite(spriteSheet);
		bitmapAnimation.snapToPixel = true;
		bitmapAnimation.gotoAndStop(bitmapsName[index]);
		bitmapAnimation.x = offset.x;
		bitmapAnimation.y = offset.y;
		container.addChild(bitmapAnimation);
		offset.x += 479;
	}
}

function createFloorTile(ces, container) {
	var id = ces.getNewEntityId();
	var transform = new Transform();
	transform.position = new Vec2(240, 300);
	ces.addComponentToEntity(transform, id);

	var collider = new Collider();
	collider.size = new Vec2(4800, 40);
	ces.addComponentToEntity(collider, id);

	ces.addComponentToEntity(new InfiniteFloor(), id);
	ces.addComponentToEntity(new View(new createjs.Shape(), collider, container), id);
}

function createCamera(ces, foregroundLayer, gameLayer, floorLayer, backgroundLayer, skyLayer) {
	var id = ces.getNewEntityId();
	ces.addComponentToEntity(new Camera(foregroundLayer, gameLayer, floorLayer, backgroundLayer, skyLayer), id);
}

function createObstacleSpawner(ces, gameLayer) {
	var id = ces.getNewEntityId();
	ces.addComponentToEntity(new ObstacleSpawner(ces, gameLayer, 2, 1), id);
}