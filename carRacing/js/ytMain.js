LInit(30, "mylegend", 400, 600, main);

var dataList = {};

function main () {
	LGlobal.aspectRatio = PORTRAIT;
	
	LGlobal.setDebug(false);

	var b = document.body;
	b.style.margin = "0px";
	b.style.padding = "0px";
	b.style.backgroundColor = "black";
	b.style.height = "100vh";
	b.style.width = "100vw";
	b.style.overflow = "hidden";

	var html = document.documentElement;
	html.style.margin = "0px";
	html.style.padding = "0px";
	html.style.height = "100vh";
	html.style.width = "100vw";

	if (LGlobal.mobile) {
		LGlobal.stageScale = LStageScaleMode.EXACT_FIT;
	}
	LGlobal.screen(LGlobal.FULL_SCREEN);

	loadGame();
}

function loadGame () {
	var loadData = [
		[
			{path : "./js/ytPreloader.js"},

			{name : "preloader_bar", path : "./images/preloader_bar.jpg"},
			{name : "preloader_bar_background", path : "./images/preloader_bar_background.jpg"},
			{name : "preloader_background", path : "./images/preloader_background.jpg"}
		],
		[
			{path : "./js/ytButton.js"},
			{path : "./js/ytMusicManager.js"},
			{path : "./js/ytMenuLayer.js"},
			{path : "./js/ytOptionLayer.js"},
			{path : "./js/ytGameLayer.js"},
			{path : "./js/ytBackground.js"},
			{path : "./js/ytStreetView.js"},
			{path : "./js/ytCar.js"},
			{path : "./js/ytCarLayer.js"},
			{path : "./js/ytExplosion.js"},
			{path : "./js/ytPoint.js"},
			{path : "./js/ytResultBox.js"},
			{path : "./js/ytHelpLayer.js"},
			{path : "./js/ytAboutLayer.js"},

			{name : "button_sheet", path : "./images/button_sheet.jpg"},
			{name : "menu_car_icons", path : "./images/menu_car_icons.png"},
			{name : "explosion", path : "./images/explosion.png"},
			{name : "cars_atlas", path : "./images/cars_atlas.png"},
			{name : "button_pause_sheet", path : "./images/button_pause_sheet.png"},
			{name : "default_menu_background", path : "./images/default_menu_background.jpg"},
			{name : "misc_atlas", path : "./images/misc_atlas.png"},
			{name : "numbers", path : "./images/numbers.png"},
			{name : "street_canyon", path : "./images/street_canyon.jpg"},
			{name : "street_city", path : "./images/street_city.jpg"},
			{name : "street_desert", path : "./images/street_desert.jpg"},
			{name : "street_grass", path : "./images/street_grass.jpg"},
			{name : "street_snow", path : "./images/street_snow.jpg"},
			{name : "street_water", path : "./images/street_water.jpg"},
			{name : "help", path : "./images/help.jpg"},
			{name : "background_music", path : "./music/background.wav"}
		]
	];

	LLoadManage.load(
		loadData[0],
		null,
		function (r) {
			updateDataList(r);

			var preloader = new ytPreloader();
			addChild(preloader);

			LLoadManage.load(
				loadData[1],
				function (p) {
					preloader.setProgress(p);
				},
				function (r) {
					updateDataList(r);

					preloader.remove();

					addMenuInterface();
				}
			);
		}
	);
}

function updateDataList (r) {
	for (var k in r) {
		var o = r[k];

		if (o instanceof Image) {
			dataList[k] = new LBitmapData(o);
		} else {
			dataList[k] = o;
		}
	}
}

function addMenuInterface () {
	// Initialize and start background music
	musicManager.init();
	musicManager.play();
	
	// TEMPORARY DEBUG: Test direct game start
	// Uncomment the next line to bypass selection screens and test game directly
	// console.log("DIRECT GAME TEST"); addGameInterface(0, "street_canyon"); return;
	
	// Skip the start screen and go directly to car selection
	addOptionInterface();
}

function addOptionInterface() {
	// Ensure music continues playing
	musicManager.play();
	var optionInterface = new ytOptionLayer();
	addChild(optionInterface);
}

function addGameInterface (car, place) {
	console.log("=== addGameInterface START ===");
	console.log("Parameters - Car:", car, "Place:", place);
	
	// 1. Show the game canvas (in case it was hidden)
	var canvas = document.querySelector('canvas');
	if (canvas) {
		canvas.style.display = 'block';
		canvas.style.visibility = 'visible';
		canvas.style.opacity = '1';
		console.log("Canvas visibility ensured - display:", canvas.style.display);
	} else {
		console.error("Canvas not found!");
	}
	
	// 2. Ensure the main container is visible
	var container = document.getElementById('mylegend');
	if (container) {
		container.style.display = 'block';
		container.style.visibility = 'visible';
		container.style.opacity = '1';
		console.log("Container visibility ensured - display:", container.style.display);
	} else {
		console.error("Container 'mylegend' not found!");
	}
	
	// 3. Clear any existing game layers to prevent conflicts
	try {
		// Remove any existing children that might interfere
		while (LGlobal.stage.numChildren > 0) {
			LGlobal.stage.removeChildAt(0);
		}
		console.log("Cleared existing stage children");
	} catch (e) {
		console.log("Stage clearing not needed or failed:", e.message);
	}
	
	// 4. Ensure music continues playing
	musicManager.play();
	
	// 5. Validate parameters before creating game layer
	if (typeof car === 'undefined' || typeof place === 'undefined') {
		console.error("Invalid parameters - Car:", car, "Place:", place);
		car = 0; // Default to BMW
		place = "street_canyon"; // Default to CANYON
		console.log("Using default parameters - Car:", car, "Place:", place);
	}
	
	// 6. Create and add game interface
	console.log("Creating ytGameLayer with validated parameters:", car, place);
	var gameInterface = new ytGameLayer(car, place);
	
	if (gameInterface) {
		addChild(gameInterface);
		console.log("Game interface created and added successfully");
		
		// 7. Ensure rendering is active
		if (typeof LGlobal !== 'undefined' && LGlobal.stage) {
			console.log("LufyLegend stage active, rendering should begin");
		}
	} else {
		console.error("Failed to create game interface!");
	}
	
	console.log("=== addGameInterface COMPLETE ===");
}

function addHelpInterface() {
	// Ensure music continues playing
	musicManager.play();
	var helpInterface = new ytHelpLayer();
	addChild(helpInterface);
}

function addAboutInterface() {
	// Ensure music continues playing
	musicManager.play();
	var aboutInterface = new ytAboutLayer();
	addChild(aboutInterface);
}