////////////////////////////////////////////////////////////
// MAIN
////////////////////////////////////////////////////////////
var stageW=1024;
var stageH=768;

/*!
 * 
 * START BUILD GAME - This is the function that runs build game
 * 
 */
function initMain(){
	if(!$.browser.mobile || !isTablet){
		$('#canvasHolder').show();	
	}else{
		checkMobileOrientation();	
	}
	
	initGameCanvas(stageW,stageH);
	buildGameCanvas();
	buildGameButton();
	
	goPage('main');
	resizeCanvas();
}

var windowW=windowH=0;
var scalePercent=0;

/*!
 * 
 * GAME RESIZE - This is the function that runs to resize and centralize the game
 * 
 */
function resizeGameFunc(){
	setTimeout(function() {
		windowW = $(window).width();
		windowH = $(window).height();
		
		// Calculate scale to fill screen while maintaining aspect ratio
		var scaleX = windowW / stageW;
		var scaleY = windowH / stageH;
		
		// Use the larger scale to fill the screen (may crop slightly)
		// Or use Math.min for letterboxing (black bars but everything visible)
		scalePercent = Math.min(scaleX, scaleY);
		
		// Calculate final dimensions
		var finalWidth = stageW * scalePercent;
		var finalHeight = stageH * scalePercent;
		
		var gameCanvas = document.getElementById("gameCanvas");
		gameCanvas.width = stageW * scalePercent;
		gameCanvas.height = stageH * scalePercent;
		
		// Center the canvas
		$('#canvasHolder').css({
			'width': finalWidth + 'px',
			'height': finalHeight + 'px',
			'max-width': 'none',
			'position': 'absolute',
			'top': '50%',
			'left': '50%',
			'transform': 'translate(-50%, -50%)'
		});
		
		$('#loaderHolder').css({
			'width': finalWidth + 'px',
			'height': finalHeight + 'px',
			'max-width': 'none',
			'position': 'absolute',
			'top': '50%',
			'left': '50%',
			'transform': 'translate(-50%, -50%)'
		});
		
		resizeCanvas();
	}, 100);	
}