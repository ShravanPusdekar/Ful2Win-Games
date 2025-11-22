// TODO reduce the amount of global
var gameLevel;
var camera, scene, renderer;


//////////////////////////////////////////////////////////////////////////////////
//		ctor/dtor							//
//////////////////////////////////////////////////////////////////////////////////

Marble.PageGameLife	= function()
{
	this._containerSel	= '#canvasContainer';
	this._paused		= false;

	console.log("enter PageGameLife")

	// test if webgl is supported
	//console.assert( Detector.webgl, "WebGL isnt supported" );

	this._requestAnimId	= null;

	// initialiaze everything
	this._init();
	this._animate();
}

Marble.PageGameLife.prototype.destroy	= function()
{	
	this._requestAnimId	&& cancelRequestAnimationFrame( this._requestAnimId );
	this._requestAnimId	= null;

	this._winResize 	&& this._winResize.stop();

	this._stats 		&& this._stats.domElement.parentNode.removeChild(this._stats.domElement);

	gameLevel.destroy();
	gameLevel	= null;

	renderer	= null;

	jQuery(this._containerSel).empty();
}

// mixin MicroEvent
MicroEvent.mixin(Marble.PageGameLife);

//////////////////////////////////////////////////////////////////////////////////
//		misc								//
//////////////////////////////////////////////////////////////////////////////////

Marble.PageGameLife.prototype.triggerEndOfLevel	= function(result, reason)
{
	console.assert( result === 'win' || result === 'dead' );
	// Only show blur overlay on timeout; normal deaths are handled by lives logic
	if( result === 'dead' && reason === 'timeout'){
		this._showEndOverlay(result, reason);
	}
	else if( result === 'dead' ){
		// keep original behaviour for life lost: let PageGameMain handle respawn
		this.trigger('completed', reason);
	}
}

//////////////////////////////////////////////////////////////////////////////////
//		misc								//
//////////////////////////////////////////////////////////////////////////////////

Marble.PageGameLife.prototype._init	= function(){
	// create the container element
	var container = jQuery(this._containerSel).get(0);

	// init the WebGL renderer and append it to the Dom
	var supportWebGL= Detector.webgl ? true : false;
	var useWebGL	= supportWebGL;
	useWebGL	= jQuery.url().param('render') ? false : useWebGL;
	if( useWebGL ){
		renderer = new THREE.WebGLRenderer({
			antialias		: true,
			preserveDrawingBuffer	: true 
		});		
	}else{
		renderer	= new THREE.CanvasRenderer();
	}
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );
	
	// create the renderer cache
	renderer._microCache	= new MicroCache();

	// init the Stats and append it to the Dom - performance vuemeter
	this._stats	= new Stats();
	this._stats.domElement.style.position = 'absolute';
	this._stats.domElement.style.bottom	= '0px';
	container.appendChild( this._stats.domElement );

	// create the Scene
	scene = new THREE.Scene();

	// for debug
	//var mesh	= new THREE.Mesh( new THREE.SphereGeometry(75,16,8), new THREE.MeshNormalMaterial() );
	//scene.add(mesh);
	
	// for debug - display xyz axes on the screen
	scene.add(new THREE.Axes());

	gameLevel	= new Marble.GameLevel();

	this._winResize	= THREEx.WindowResize(renderer, gameLevel.camera().object());
}

// ## Animate and Display the Scene
Marble.PageGameLife.prototype._animate	= function()
{
	if( this._paused )	return;
	// render the 3D scene
	this._render();
	// relaunch the 'timer' 
	this._requestAnimId	= requestAnimationFrame( this._animate.bind(this) );
	// update the stats
	this._stats.update();
}

// ## Render the 3D Scene
Marble.PageGameLife.prototype._render = function()
{
	// gameLevel .tick()
	gameLevel.tick();
	
	// FIXME this should be INSIDE webgl renderer... bug
	renderer instanceof THREE.WebGLRenderer	&& renderer.context.depthMask( true );

	// actually display the scene in the Dom element
	renderer.render( scene, gameLevel.camera().object() );
}

Marble.PageGameLife.prototype._showEndOverlay = function(result, reason)
{
	// pause animation loop
	if( this._requestAnimId ){
		cancelRequestAnimationFrame( this._requestAnimId );
		this._requestAnimId	= null;
	}
	this._paused = true;

	var overlay = document.getElementById('gameOverlay');
	if( !overlay ){
		// if overlay is missing, fallback to old behaviour
		this._paused = false;
		this.trigger('completed', reason);
		return;
	}

	var titleEl	= overlay.querySelector('.overlay-title');
	var msgEl	= overlay.querySelector('.overlay-message');
	var hintEl	= overlay.querySelector('.overlay-hint');

	if( titleEl ){
		titleEl.textContent = (reason === 'timeout') ? 'Time Up' : 'Life Lost';
	}
	if( msgEl ){
		msgEl.textContent = (reason === 'timeout')
			? 'The timer reached zero.'
			: 'You lost a life.';
	}
	if( hintEl ){
		// Show current score instead of a generic tap hint
		var currentScore = jQuery('#osdContainer .score .value').html() || '0';
		hintEl.textContent = 'Score: ' + currentScore;
	}

	// If this is a timeout, notify parent as GAME_OVER with current score as well
	if( reason === 'timeout' ){
		try {
			var scoreText = jQuery('#osdContainer .score .value').html() || '0';
			var score = parseInt(scoreText, 10) || 0;
			window.game = window.game || {};
			window.game.score = score;
			if (window.parent && window.parent.postMessage) {
				window.parent.postMessage({ type: 'GAME_OVER', score: window.game.score }, '*');
			}
		} catch(e) {
			// ignore if postMessage not available
		}
	}

	overlay.style.display = 'flex';

	var self = this;
	var onClick = function(){
		overlay.style.display = 'none';
		overlay.removeEventListener('click', onClick);
		self._paused = false;
		// propagate completion so PageGameMain can handle lives / game over
		self.trigger('completed', reason);
		// restart animation loop for next life/level if still active
		self._animate();
	};
	overlay.addEventListener('click', onClick);
}
