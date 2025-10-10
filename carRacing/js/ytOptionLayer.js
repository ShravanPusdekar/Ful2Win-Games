// Clean index-based selection system
var carOptions = ['BMW', 'FORD', 'LAMBORGHINI', 'PAGANI'];
var roadOptions = ['CANYON', 'CITY', 'DESERT', 'PRAIRIE', 'ICEFIELD', 'BRIDGE'];
var selectedCarIndex = 0;   // Default is BMW
var selectedRoadIndex = 0;  // Default is CANYON
var selectionConfirmed = false; // Flag to stop timer actions on click
var CAR_TIMEOUT_ID = null;
var ROAD_TIMEOUT_ID = null;

// Dynamic variables - updated when selections change
var selectedCarName = carOptions[selectedCarIndex]; // Will be updated on selection
var selectedRoadName = roadOptions[selectedRoadIndex]; // Will be updated on selection

var ytOptionLayer = (function () {
	function ytOptionLayer () {
		var s = this;
		LExtends(s, LSprite, []);

		s.carIndex = 0; // Default to first car
		s.placeIndex = 0; // Default to first place
		s.currentStep = 1; // 1 = car selection, 2 = road selection
		s.carTimer = null;
		
		// UNIVERSAL CLEANUP FUNCTIONS - Equivalent to document.querySelectorAll().forEach()
		
		// IMAGE-BASED HIGHLIGHT - Apply glow to car image + yellow text
		s.applyCarHighlight = function(carIndex) {
			console.log("=== IMAGE HIGHLIGHT: Applying glow to car", carIndex, "===");
			if (!s.carOptionLayer || carIndex < 0 || carIndex >= s.carOptionLayer.numChildren) {
				console.error("Invalid car index for highlight:", carIndex);
				return;
			}
			
			var carContainer = s.carOptionLayer.getChildAt(carIndex);
			if (carContainer && carContainer.carImage && carContainer.carNameText) {
				console.log("APPLYING IMAGE HIGHLIGHT: Car", carIndex, "- image glow + yellow text");
				
				// Apply glow directly to car image
				carContainer.carImage.filters = [
					new LDropShadowFilter(null, null, "#ffcc00", 25), // Gold glow around image
					new LDropShadowFilter(null, null, "rgba(255,255,255,0.9)", 20) // White outer glow
				];
				
				// Apply yellow color to car name text
				carContainer.carNameText.color = "#ffcc00"; // Bright yellow text
				carContainer.carNameText.filters = [
					new LDropShadowFilter(null, null, "rgba(0,0,0,0.8)", 5), // Dark shadow for contrast
					new LDropShadowFilter(null, null, "#ffcc00", 12) // Yellow glow
				];
				
				console.log("IMAGE HIGHLIGHT COMPLETE: Car", carIndex, "image glows + text is yellow");
			}
		};
		
		// IMAGE-BASED CLEANUP - Remove glow from car images + reset text to white
		s.removeAllCarHighlights = function() {
			console.log("=== IMAGE CLEANUP: Removing image glows + resetting text ===");
			if (!s.carOptionLayer) {
				console.error("Car container not available for cleanup");
				return;
			}
			
			var totalCars = s.carOptionLayer.numChildren;
			for (var i = 0; i < totalCars; i++) {
				var carContainer = s.carOptionLayer.getChildAt(i);
				if (carContainer && carContainer.carImage && carContainer.carNameText) {
					console.log("IMAGE CLEANUP: Removing glow from car", i);
					
					// STEP 1: Remove glow filter from car image
					carContainer.carImage.filters = [];
					
					// STEP 2: Reset car name text to white
					carContainer.carNameText.color = "white";
					carContainer.carNameText.filters = [new LDropShadowFilter(null, null, "rgba(0,0,0,0.8)", 5)];
					
					console.log("IMAGE CLEANUP COMPLETE: Car", i, "image + text reset to normal");
				}
			}
			console.log("=== IMAGE CAR CLEANUP COMPLETE - All highlights removed ===");
		};
		
		// IMAGE-BASED HIGHLIGHT - Apply glow to road image + yellow text
		s.applyRoadHighlight = function(roadIndex) {
			console.log("=== IMAGE HIGHLIGHT: Applying glow to road", roadIndex, "===");
			if (!s.placeOptionLayer || roadIndex < 0 || roadIndex >= s.placeOptionLayer.numChildren) {
				console.error("Invalid road index for highlight:", roadIndex);
				return;
			}
			
			var roadContainer = s.placeOptionLayer.getChildAt(roadIndex);
			if (roadContainer && roadContainer.roadImage && roadContainer.roadNameText) {
				console.log("APPLYING IMAGE HIGHLIGHT: Road", roadIndex, "- image glow + yellow text");
				
				// Apply glow directly to road image
				roadContainer.roadImage.filters = [
					new LDropShadowFilter(null, null, "#ffcc00", 25), // Gold glow around image
					new LDropShadowFilter(null, null, "rgba(255,255,255,0.9)", 20) // White outer glow
				];
				
				// Apply yellow color to road name text
				roadContainer.roadNameText.color = "#ffcc00"; // Bright yellow text
				roadContainer.roadNameText.filters = [
					new LDropShadowFilter(null, null, "rgba(0,0,0,0.8)", 5), // Dark shadow for contrast
					new LDropShadowFilter(null, null, "#ffcc00", 12) // Yellow glow
				];
				
				console.log("IMAGE HIGHLIGHT COMPLETE: Road", roadIndex, "image glows + text is yellow");
			}
		};
		
		// IMAGE-BASED CLEANUP - Remove glow from road images + reset text to white
		s.removeAllRoadHighlights = function() {
			console.log("=== IMAGE CLEANUP: Removing road image glows + resetting text ===");
			if (!s.placeOptionLayer) {
				console.error("Road container not available for cleanup");
				return;
			}
			
			var totalRoads = s.placeOptionLayer.numChildren;
			for (var i = 0; i < totalRoads; i++) {
				var roadContainer = s.placeOptionLayer.getChildAt(i);
				if (roadContainer && roadContainer.roadImage && roadContainer.roadNameText) {
					console.log("IMAGE CLEANUP: Removing glow from road", i);
					
					// STEP 1: Remove glow filter from road image
					roadContainer.roadImage.filters = [];
					
					// STEP 2: Reset road name text to white
					roadContainer.roadNameText.color = "white";
					roadContainer.roadNameText.filters = [new LDropShadowFilter(null, null, "rgba(0,0,0,0.8)", 5)];
					
					console.log("IMAGE CLEANUP COMPLETE: Road", i, "image + text reset to normal");
				}
			}
			console.log("=== IMAGE ROAD CLEANUP COMPLETE - All highlights removed ===");
		};
		s.roadTimer = null;
		s.carCountdown = 5;
		s.roadCountdown = 5;

		s.carInfoList = [
			{name : "BMW", data : 0},
			{name : "FORD", data : 1},
			{name : "LAMBORGHINI", data : 2},
			{name : "PAGANI", data : 3}
		];

		s.placeInfoList = [
			{name : "CANYON", data : "street_canyon"},
			{name : "CITY", data : "street_city"},
			{name : "DESERT", data : "street_desert"},
			{name : "PRAIRIE", data : "street_grass"},
			{name : "ICEFIELD", data : "street_snow"},
			{name : "BRIDGE", data : "street_water"}
		];

		var backgroundBmp = new LBitmap(dataList["default_menu_background"]);
		backgroundBmp.scaleX = LGlobal.width / backgroundBmp.getWidth();
		backgroundBmp.scaleY = LGlobal.height / backgroundBmp.getHeight();
		s.addChild(backgroundBmp);

		s.carOptionLayer = new LSprite();
		s.addChild(s.carOptionLayer);

		s.placeOptionLayer = new LSprite();
		s.addChild(s.placeOptionLayer);

		// Timer display layers
		s.timerLayer = new LSprite();
		s.addChild(s.timerLayer);

		// Start with car selection immediately
		s.addCarOption();
	}

	ytOptionLayer.prototype.addCarOption = function () {
		var s = this, carInfoList = s.carInfoList;

		// Clear any existing timers
		s.clearTimers();

		// Add countdown timer display
		s.addCarTimer();

		// MODERN GRID DESIGN - 2x2 Car Selection Layout
		console.log("=== CREATING MODERN CAR GRID ===");
		
		var carBmpd = dataList["menu_car_icons"].clone();
		carBmpd.setProperties(0, 0, carBmpd.width / 2, carBmpd.height / 6);
		
		// Grid layout parameters - optimized for 2x2 car display
		var GRID_COLS = 2;
		var GRID_ROWS = 2;
		var CAR_SPACING_X = 180; // Tighter horizontal spacing for better centering
		var CAR_SPACING_Y = 160; // Adequate vertical spacing for text
		var CAR_IMAGE_SCALE = 0.7; // Slightly smaller for better proportions

		for (var k = 0; k < carInfoList.length; k++) {
			var o = carInfoList[k];
			
			// Calculate grid position
			var gridX = k % GRID_COLS;
			var gridY = Math.floor(k / GRID_COLS);
			
			// Create car container (no background boxes!)
			var carContainer = new LSprite();
			carContainer.index = k;
			carContainer.carName = o.name;
			
			// Create car image (main clickable element)
			var cBmpd = carBmpd.clone();
			// Special handling for Pagani menu image position
			var menuImageIndex = o.data;
			if (o.name === "PAGANI") {
				menuImageIndex = 4; // Pagani menu image is at position 4
			}
			cBmpd.setCoordinate(0, menuImageIndex * carBmpd.height);
			var carImage = new LBitmap(cBmpd);
			carImage.scaleX = carImage.scaleY = CAR_IMAGE_SCALE;
			carImage.x = 0;
			carImage.y = 0;
			carContainer.addChild(carImage);
			
			// Create car name text (properly positioned below image)
			var carNameText = new LTextField();
			carNameText.text = o.name;
			carNameText.size = 18; // Slightly larger for better visibility
			carNameText.color = "white"; // Start with white text
			carNameText.weight = "bold";
			carNameText.filters = [new LDropShadowFilter(null, null, "rgba(0,0,0,0.9)", 6)];
			// Center text horizontally under the car image
			carNameText.x = (carImage.getWidth() - carNameText.getWidth()) / 2;
			// Position text with proper spacing below image
			carNameText.y = carImage.getHeight() + 15;
			carContainer.addChild(carNameText);
			
			// Position in grid with right column adjustment
			carContainer.x = gridX * CAR_SPACING_X + (gridX > 0 ? 15 : 0); // Add 15px to right column (Ford, Pagani)
			carContainer.y = gridY * CAR_SPACING_Y;
			
			// Store references for easy access
			carContainer.carImage = carImage;
			carContainer.carNameText = carNameText;
			
			// Add to layer
			s.carOptionLayer.addChild(carContainer);
			
			// IMAGE-BASED CLICK HANDLER (no button complexity!)
			carContainer.addEventListener(LMouseEvent.MOUSE_UP, function (e) {
				var clickedIndex = e.currentTarget.index;
				var clickedCarName = e.currentTarget.carName;
				
				console.log("=== CAR IMAGE CLICKED ===");
				console.log("Clicked Car:", clickedCarName, "at index:", clickedIndex);
				
				// STEP 1: Clean up ALL other cars (remove image glow + reset text)
				s.removeAllCarHighlights();
				
				// STEP 2: Apply highlight to clicked car image + text
				s.applyCarHighlight(clickedIndex);
				
				// STEP 3: Update selection variables using the stored car name
				selectedCarIndex = clickedIndex;
				selectedCarName = clickedCarName; // Use the name stored in container, not array lookup
				s.carIndex = clickedIndex;
				
				// STEP 4: Set confirmation flag
				selectionConfirmed = true;
				
				console.log("Car selected:", selectedCarName, "at index:", selectedCarIndex);
				console.log("VERIFICATION: Container stored name:", clickedCarName);
				console.log("VERIFICATION: Array lookup:", carOptions[clickedIndex]);
				console.log("=== CAR SELECTION COMPLETE ===");
			});
		}

		// Center the entire car grid on screen
		var totalGridWidth = (GRID_COLS * CAR_SPACING_X) - (CAR_SPACING_X - carBmpd.width * CAR_IMAGE_SCALE);
		var totalGridHeight = (GRID_ROWS * CAR_SPACING_Y);
		s.carOptionLayer.x = (LGlobal.width - totalGridWidth) * 0.5;
		s.carOptionLayer.y = (LGlobal.height - totalGridHeight) * 0.5 + 40; // Slight offset for timer

		// Apply default highlight to BMW (index 0)
		console.log("=== INITIALIZATION: Highlighting BMW in grid ===");
		s.applyCarHighlight(0);
		
		// Start 5-second countdown for car selection
		s.startCarTimer();
	};

	ytOptionLayer.prototype.addPlaceOption = function () {
		var s = this, placeInfoList = s.placeInfoList;

		// Clear car selection display
		s.carOptionLayer.removeAllChild();
		s.currentStep = 2;

		// Add countdown timer display for road selection
		s.addRoadTimer();

		// MODERN HORIZONTAL DESIGN - Road Selection Layout
		console.log("=== CREATING MODERN ROAD GALLERY ===");
		
		// Gallery layout parameters - optimized for 2x3 road display
		var ROAD_SPACING_X = 130; // Tighter spacing for compact gallery
		var ROAD_IMAGE_SCALE = 0.15; // Slightly larger for better visibility
		var ROADS_PER_ROW = 3;
		var ROW_SPACING_Y = 140; // More space for text below images

		for (var k = 0; k < placeInfoList.length; k++) {
			var o = placeInfoList[k];
			
			// Calculate position (2 rows of 3)
			var rowIndex = Math.floor(k / ROADS_PER_ROW);
			var colIndex = k % ROADS_PER_ROW;
			
			// Create road container (no background boxes!)
			var roadContainer = new LSprite();
			roadContainer.index = k;
			roadContainer.roadName = o.name;
			
			// Create road image (main clickable element)
			var cBmpd = dataList[o.data].clone();
			cBmpd.setProperties(0, 0, cBmpd.width, cBmpd.width);
			var roadImage = new LBitmap(cBmpd);
			roadImage.scaleX = roadImage.scaleY = ROAD_IMAGE_SCALE;
			roadImage.x = 0;
			roadImage.y = 0;
			roadContainer.addChild(roadImage);
			
			// Create road name text (properly positioned below image)
			var roadNameText = new LTextField();
			roadNameText.text = o.name;
			roadNameText.size = 16; // Larger for better readability
			roadNameText.color = "white"; // Start with white text
			roadNameText.weight = "bold";
			roadNameText.filters = [new LDropShadowFilter(null, null, "rgba(0,0,0,0.9)", 6)];
			// Center text horizontally under the road image
			roadNameText.x = (roadImage.getWidth() - roadNameText.getWidth()) / 2;
			// Position text with proper spacing below image
			roadNameText.y = roadImage.getHeight() + 12;
			roadContainer.addChild(roadNameText);
			
			// Position in grid
			roadContainer.x = colIndex * ROAD_SPACING_X;
			roadContainer.y = rowIndex * ROW_SPACING_Y;
			
			// Store references for easy access
			roadContainer.roadImage = roadImage;
			roadContainer.roadNameText = roadNameText;
			
			// Add to layer
			s.placeOptionLayer.addChild(roadContainer);
			
			// IMAGE-BASED CLICK HANDLER (no button complexity!)
			roadContainer.addEventListener(LMouseEvent.MOUSE_UP, function (e) {
				var clickedIndex = e.currentTarget.index;
				var clickedRoadName = e.currentTarget.roadName;
				
				console.log("=== ROAD IMAGE CLICKED ===");
				console.log("Clicked Road:", clickedRoadName, "at index:", clickedIndex);
				
				// STEP 1: Clean up ALL other roads (remove image glow + reset text)
				s.removeAllRoadHighlights();
				
				// STEP 2: Apply highlight to clicked road image + text
				s.applyRoadHighlight(clickedIndex);
				
				// STEP 3: Update selection variables using the stored road name
				selectedRoadIndex = clickedIndex;
				selectedRoadName = clickedRoadName; // Use the name stored in container, not array lookup
				s.placeIndex = clickedIndex;
				
				// STEP 4: Set confirmation flag
				selectionConfirmed = true;
				
				console.log("Road selected:", selectedRoadName, "at index:", selectedRoadIndex);
				console.log("VERIFICATION: Container stored name:", clickedRoadName);
				console.log("VERIFICATION: Array lookup:", roadOptions[clickedIndex]);
				console.log("=== ROAD SELECTION COMPLETE ===");
			});
		}

		// Center the entire road gallery on screen
		var totalGalleryWidth = (ROADS_PER_ROW * ROAD_SPACING_X) - (ROAD_SPACING_X * 0.2); // Adjust for actual content width
		var totalGalleryHeight = (2 * ROW_SPACING_Y);
		s.placeOptionLayer.x = (LGlobal.width - totalGalleryWidth) * 0.5;
		s.placeOptionLayer.y = (LGlobal.height - totalGalleryHeight) * 0.5 + 30; // Slight offset for timer

		// Apply default highlight to CANYON (index 0)
		console.log("=== INITIALIZATION: Highlighting CANYON in gallery ===");
		s.applyRoadHighlight(0);
		
		// Start 5-second countdown for road selection
		s.startRoadTimer();
	};

	// Timer management functions
	ytOptionLayer.prototype.clearTimers = function () {
		var s = this;
		// Clear global timer IDs
		if (CAR_TIMEOUT_ID) {
			clearInterval(CAR_TIMEOUT_ID);
			CAR_TIMEOUT_ID = null;
		}
		if (ROAD_TIMEOUT_ID) {
			clearInterval(ROAD_TIMEOUT_ID);
			ROAD_TIMEOUT_ID = null;
		}
		s.timerLayer.removeAllChild();
	};

	ytOptionLayer.prototype.addCarTimer = function () {
		var s = this;
		s.carCountdown = 5;
		
		s.carTimerText = new LTextField();
		s.carTimerText.text = "Auto-selecting in " + s.carCountdown + "s";
		s.carTimerText.size = 18;
		s.carTimerText.color = "#00ffff"; // Bright cyan for visibility
		s.carTimerText.weight = "bold";
		s.carTimerText.filters = [
			new LDropShadowFilter(null, null, "rgba(0,0,0,0.8)", 5), // Dark background
			new LDropShadowFilter(null, null, "#00ffff", 15) // Cyan glow
		];
		s.carTimerText.x = (LGlobal.width - s.carTimerText.getWidth()) * 0.5;
		s.carTimerText.y = 30; // Position at TOP to avoid overlap
		s.timerLayer.addChild(s.carTimerText);
	};

	ytOptionLayer.prototype.addRoadTimer = function () {
		var s = this;
		s.roadCountdown = 5;
		
		s.roadTimerText = new LTextField();
		s.roadTimerText.text = "Starting race in " + s.roadCountdown + "s";
		s.roadTimerText.size = 18;
		s.roadTimerText.color = "#ffff00"; // Bright yellow for visibility
		s.roadTimerText.weight = "bold";
		s.roadTimerText.filters = [
			new LDropShadowFilter(null, null, "rgba(0,0,0,0.8)", 5), // Dark background
			new LDropShadowFilter(null, null, "#ffff00", 15) // Yellow glow
		];
		s.roadTimerText.x = (LGlobal.width - s.roadTimerText.getWidth()) * 0.5;
		s.roadTimerText.y = 30; // Position at TOP to avoid overlap
		s.timerLayer.addChild(s.roadTimerText);
	};

	ytOptionLayer.prototype.startCarTimer = function () {
		var s = this;
		// Use global CAR_TIMEOUT_ID
		CAR_TIMEOUT_ID = setInterval(function () {
			s.carCountdown--;
			s.carTimerText.text = "Auto-selecting in " + s.carCountdown + "s";
			s.carTimerText.x = (LGlobal.width - s.carTimerText.getWidth()) * 0.5;
			
			if (s.carCountdown <= 0) {
				clearInterval(CAR_TIMEOUT_ID);
				CAR_TIMEOUT_ID = null;
				
				console.log("Car timer expired - advancing to road selection");
				
				// ONLY timeout action calls transitionToRoadScreen and starts ROAD_TIMEOUT_ID
				s.transitionToRoadScreen();
			}
		}, 1000);
	};

	ytOptionLayer.prototype.startRoadTimer = function () {
		var s = this;
		// Use global ROAD_TIMEOUT_ID
		ROAD_TIMEOUT_ID = setInterval(function () {
			s.roadCountdown--;
			s.roadTimerText.text = "Starting race in " + s.roadCountdown + "s";
			s.roadTimerText.x = (LGlobal.width - s.roadTimerText.getWidth()) * 0.5;
			
			if (s.roadCountdown <= 0) {
				clearInterval(ROAD_TIMEOUT_ID);
				ROAD_TIMEOUT_ID = null;
				
				console.log("Road timer expired - starting game with:", selectedCarName, selectedRoadName);
				
				// ONLY timeout action calls startGame
				s.startGameWithSelections();
			}
		}, 1000);
	};

	// Visual state management for car selection - ENFORCED UNIVERSAL DE-SELECTION
	ytOptionLayer.prototype.updateCarVisualSelection = function (selectedIndex) {
		var s = this;
		
		console.log("=== updateCarVisualSelection ===");
		console.log("Selected index:", selectedIndex);
		console.log("Total car buttons:", s.carOptionLayer.numChildren);
		
		// STEP 1: CRITICAL UNIVERSAL DE-SELECTION - Find ALL car buttons and remove highlight
		// Using parent container approach: equivalent to document.querySelectorAll('#car-list-container > *')
		console.log("STEP 1: Universal de-selection of ALL cars (visual function)");
		console.log("Car container has", s.carOptionLayer.numChildren, "children");
		
		// UNIVERSAL CLEANUP: Target ALL children in the car container
		var totalCarButtons = s.carOptionLayer.numChildren;
		for (var i = 0; i < totalCarButtons; i++) {
			var carBtn = s.carOptionLayer.getChildAt(i);
			
			if (!carBtn) {
				console.log("Warning: Visual car button", i, "is null/undefined");
				continue;
			}
			
			// FORCE reset to normal state (equivalent to removing .selected-item class)
			carBtn.alpha = 0.85;
			
			// COMPLETE filter removal - multiple approaches for safety
			if (carBtn.filters) {
				carBtn.filters.length = 0; // Clear array
			}
			carBtn.filters = null; // Complete removal
			carBtn.filters = []; // Ensure empty array
			
			// FORCE reset text to normal white - enhanced safety
			try {
				var contentLayer = null;
				var textField = null;
				
				// Enhanced navigation through nested structure
				if (carBtn.getChildAt && typeof carBtn.getChildAt === 'function') {
					contentLayer = carBtn.getChildAt(0);
					if (contentLayer && contentLayer.getChildAt && typeof contentLayer.getChildAt === 'function') {
						textField = contentLayer.getChildAt(1);
						if (textField && textField.color !== undefined) {
							// FORCE text reset
							textField.color = "white";
							
							// COMPLETE text filter removal
							if (textField.filters) {
								textField.filters.length = 0; // Clear array
							}
							textField.filters = null; // Complete removal
							textField.filters = [new LDropShadowFilter(null, null, "rgba(255,255,255,0.5)", 8)];
						}
					}
				}
			} catch (ex) {
				console.log("Visual text reset error for button", i, ":", ex.message);
			}
		}
		console.log("Visual universal de-selection complete - processed", totalCarButtons, "car buttons");
		
		// STEP 2: Apply highlight to ONLY the selected car
		if (selectedIndex >= 0 && selectedIndex < s.carOptionLayer.numChildren) {
			console.log("STEP 2: Applying highlight to car", selectedIndex);
			var selectedBtn = s.carOptionLayer.getChildAt(selectedIndex);
			
			// Force highlight application
			selectedBtn.alpha = 1.0;
			selectedBtn.filters = null; // Clear first
			selectedBtn.filters = [
				new LDropShadowFilter(null, null, "#ffcc00", 20), // Gold glow
				new LDropShadowFilter(null, null, "#f0a500", 15)  // Inner gold glow
			];
			
			// Force text color to gold
			try {
				if (selectedBtn.getChildAt && selectedBtn.getChildAt(0)) {
					var contentLayer = selectedBtn.getChildAt(0);
					if (contentLayer && contentLayer.getChildAt && contentLayer.getChildAt(1)) {
						var textField = contentLayer.getChildAt(1);
						if (textField && textField.color) {
							textField.color = "#ffcc00"; // Gold text
							textField.filters = null; // Clear first
							textField.filters = [
								new LDropShadowFilter(null, null, "#ffcc00", 20), // Gold text glow
								new LDropShadowFilter(null, null, "#f0a500", 10)  // Inner glow
							];
						}
					}
				}
			} catch (ex) {
				console.log("Visual text highlight error:", ex.message);
			}
			
			console.log("Car", selectedIndex, "highlighted with enforced universal de-selection");
		}
		console.log("=== updateCarVisualSelection COMPLETE ===");
	};

	// Visual state management for road selection - ENFORCED UNIVERSAL DE-SELECTION
	ytOptionLayer.prototype.updateRoadVisualSelection = function (selectedIndex) {
		var s = this;
		
		console.log("=== updateRoadVisualSelection ===");
		console.log("Selected index:", selectedIndex);
		console.log("Total road buttons:", s.placeOptionLayer.numChildren);
		
		// STEP 1: CRITICAL UNIVERSAL DE-SELECTION - Find ALL road buttons and remove highlight
		// Using parent container approach: equivalent to document.querySelectorAll('#road-list-container > *')
		console.log("STEP 1: Universal de-selection of ALL roads (visual function)");
		console.log("Road container has", s.placeOptionLayer.numChildren, "children");
		
		// UNIVERSAL CLEANUP: Target ALL children in the road container
		var totalRoadButtons = s.placeOptionLayer.numChildren;
		for (var i = 0; i < totalRoadButtons; i++) {
			var roadBtn = s.placeOptionLayer.getChildAt(i);
			
			if (!roadBtn) {
				console.log("Warning: Visual road button", i, "is null/undefined");
				continue;
			}
			
			// FORCE reset to normal state (equivalent to removing .selected-item class)
			roadBtn.alpha = 0.85;
			
			// COMPLETE filter removal - multiple approaches for safety
			if (roadBtn.filters) {
				roadBtn.filters.length = 0; // Clear array
			}
			roadBtn.filters = null; // Complete removal
			roadBtn.filters = []; // Ensure empty array
			
			// FORCE reset text to normal white - enhanced safety
			try {
				var contentLayer = null;
				var textField = null;
				
				// Enhanced navigation through nested structure
				if (roadBtn.getChildAt && typeof roadBtn.getChildAt === 'function') {
					contentLayer = roadBtn.getChildAt(0);
					if (contentLayer && contentLayer.getChildAt && typeof contentLayer.getChildAt === 'function') {
						textField = contentLayer.getChildAt(1);
						if (textField && textField.color !== undefined) {
							// FORCE text reset
							textField.color = "white";
							
							// COMPLETE text filter removal
							if (textField.filters) {
								textField.filters.length = 0; // Clear array
							}
							textField.filters = null; // Complete removal
							textField.filters = [new LDropShadowFilter(null, null, "rgba(255,255,255,0.5)", 8)];
						}
					}
				}
			} catch (ex) {
				console.log("Visual text reset error for road button", i, ":", ex.message);
			}
		}
		console.log("Visual universal de-selection complete - processed", totalRoadButtons, "road buttons");
		
		// STEP 2: Apply highlight to ONLY the selected road
		if (selectedIndex >= 0 && selectedIndex < s.placeOptionLayer.numChildren) {
			console.log("STEP 2: Applying highlight to road", selectedIndex);
			var selectedBtn = s.placeOptionLayer.getChildAt(selectedIndex);
			
			// Force highlight application
			selectedBtn.alpha = 1.0;
			selectedBtn.filters = null; // Clear first
			selectedBtn.filters = [
				new LDropShadowFilter(null, null, "#ffcc00", 20), // Gold glow
				new LDropShadowFilter(null, null, "#f0a500", 15)  // Inner gold glow
			];
			
			// Force text color to gold
			try {
				if (selectedBtn.getChildAt && selectedBtn.getChildAt(0)) {
					var contentLayer = selectedBtn.getChildAt(0);
					if (contentLayer && contentLayer.getChildAt && contentLayer.getChildAt(1)) {
						var textField = contentLayer.getChildAt(1);
						if (textField && textField.color) {
							textField.color = "#ffcc00"; // Gold text
							textField.filters = null; // Clear first
							textField.filters = [
								new LDropShadowFilter(null, null, "#ffcc00", 20), // Gold text glow
								new LDropShadowFilter(null, null, "#f0a500", 10)  // Inner glow
							];
						}
					}
				}
			} catch (ex) {
				console.log("Visual text highlight error:", ex.message);
			}
			
			console.log("Road", selectedIndex, "highlighted with enforced universal de-selection");
		}
		console.log("=== updateRoadVisualSelection COMPLETE ===");
	};

	// Transition to road screen (ONLY called by CAR_TIMEOUT_ID expiration)
	ytOptionLayer.prototype.transitionToRoadScreen = function () {
		var s = this;
		// Clear any remaining car timer
		if (CAR_TIMEOUT_ID) {
			clearInterval(CAR_TIMEOUT_ID);
			CAR_TIMEOUT_ID = null;
		}
		s.timerLayer.removeAllChild();
		
		console.log("Transitioning to road selection with car:", selectedCarName);
		
		// Reset selection flag for road selection
		selectionConfirmed = false;
		
		// Proceed to road selection and start ROAD_TIMEOUT_ID
		s.addPlaceOption();
	};

	// Start game with final selections (ONLY called by ROAD_TIMEOUT_ID expiration)
	ytOptionLayer.prototype.startGameWithSelections = function () {
		var s = this;
		
		console.log("=== ROAD TIMEOUT ACTION - STARTING GAME ===");
		console.log("Selected car:", selectedCarName, "at index:", selectedCarIndex);
		console.log("Selected road:", selectedRoadName, "at index:", selectedRoadIndex);
		
		// SAFETY CHECK: Ensure variables are valid
		if (!selectedCarName || selectedCarName === 'undefined') {
			selectedCarName = carOptions[selectedCarIndex] || carOptions[0];
			console.log("SAFETY: Fixed selectedCarName to:", selectedCarName);
		}
		if (!selectedRoadName || selectedRoadName === 'undefined') {
			selectedRoadName = roadOptions[selectedRoadIndex] || roadOptions[0];
			console.log("SAFETY: Fixed selectedRoadName to:", selectedRoadName);
		}
		
		// 1. Clear any remaining road timer
		if (ROAD_TIMEOUT_ID) {
			clearInterval(ROAD_TIMEOUT_ID);
			ROAD_TIMEOUT_ID = null;
		}
		
		// 2. Ensure UI Removal - Hide Road Selection UI
		s.timerLayer.removeAllChild();
		console.log("Road Selection UI removed");
		
		// 3. Ensure canvas/container visibility
		var canvas = document.querySelector('canvas');
		if (canvas) {
			canvas.style.display = 'block';
			canvas.style.visibility = 'visible';
			console.log("Canvas visibility ensured");
		}
		
		var container = document.getElementById('mylegend');
		if (container) {
			container.style.display = 'block';
			container.style.visibility = 'visible';
			console.log("Container visibility ensured");
		}
		
		// 4. Convert selections to game-compatible format
		// Car parameter: use the data value from carInfoList
		var carIndex = s.carInfoList[selectedCarIndex].data;
		
		// Road parameter: use the data value from placeInfoList  
		var roadData = s.placeInfoList[selectedRoadIndex].data;
		
		console.log("Final game parameters - Car Index:", carIndex, "Road Data:", roadData);
		console.log("Car info:", s.carInfoList[selectedCarIndex]);
		console.log("Road info:", s.placeInfoList[selectedRoadIndex]);
		
		// 5. Ensure music continues playing
		musicManager.play();
		
		// 6. Remove selection interface completely
		s.remove();
		console.log("Selection interface removed");
		
		// 7. CRITICAL: Start the game with confirmed variables
		console.log("=== FINAL GAME START VERIFICATION ===");
		console.log("Final selectedCarName:", selectedCarName);
		console.log("Final selectedRoadName:", selectedRoadName);
		console.log("Converted carIndex:", carIndex);
		console.log("Converted roadData:", roadData);
		console.log("Calling addGameInterface with:", carIndex, roadData);
		addGameInterface(carIndex, roadData);
		
		console.log("=== GAME START SEQUENCE COMPLETE ===");
	};



	return ytOptionLayer;
})();