var osdLayer;
var pageGameLife;
var vJoystick;

Marble.PageGameMain	= function()
{
	this._playerLives	= 3;

	osdLayer	= new Marble.OsdLayer();
	osdLayer.livesSet( this._playerLives );

	this._virtualJoystick	= new VirtualJoystick({
		container   : document.body,
		mouseSupport: false
	});
	vJoystick	= this._virtualJoystick;

	this._gameLifeCtor();
}

Marble.PageGameMain.prototype.destroy	= function()
{
	this._gameLifeDtor();

	this._virtualJoystick	&& this._virtualJoystick.destroy();
	this._virtualJoystick	= null;
	vJoystick		= this._virtualJoystick;

	osdLayer	&& osdLayer.destroy();
	osdLayer	= null;
}

// mixin MicroEvent
MicroEvent.mixin(Marble.PageGameMain);

//////////////////////////////////////////////////////////////////////////////////
//		pageGameLife							//
//////////////////////////////////////////////////////////////////////////////////

Marble.PageGameMain.prototype._gameLifeCtor	= function()
{
	console.assert(!this._gameLife);

	this._gameLife		= new Marble.PageGameLife();

	this._$gameLifeOnCompleted	= this._gameLifeOnCompleted.bind(this);
	this._gameLife.bind("completed", this._$gameLifeOnCompleted);

	// export as a global
	pageGameLife	= this._gameLife;
}

Marble.PageGameMain.prototype._gameLifeDtor	= function()
{
	if( !this._gameLife )	return;
	
	this._gameLife.unbind("completed", this._$gameLifeOnCompleted);

	this._gameLife	&& this._gameLife.destroy();
	this._gameLife	= null;
	
	// export as a global
	pageGameLife	= this._gameLife;
}
Marble.PageGameMain.prototype._gameLifeOnCompleted	= function(reason)
{
	// If this was a timeout, keep old behaviour: restart level and decrement life
	if( reason === 'timeout' ){
		this._gameLifeDtor();
		this._playerLives--;
		if( this._playerLives <= 0 ){
			this._showGameOverOverlay();
			return;
		}
		osdLayer.livesSet( this._playerLives );
		this._gameLifeCtor();
		return;
	}

	// Normal death (killed): do NOT reset level, just lose a life
	if( reason === 'killed' ){
		this._playerLives--;
		if( this._playerLives <= 0 ){
			this._showGameOverOverlay();
			return;
		}
		osdLayer.livesSet( this._playerLives );
		// keep existing GameLife/GameLevel and timer running
		return;
	}

	// Fallback: default to old behaviour
	this._gameLifeDtor();
	this._playerLives--;
	if( this._playerLives <= 0 ){
		this._showGameOverOverlay();
		return;
	}
	osdLayer.livesSet( this._playerLives );
	this._gameLifeCtor();
}

Marble.PageGameMain.prototype._showGameOverOverlay = function()
{
	var overlay = document.getElementById('gameOverlay');
	if( overlay ){
		var titleEl = overlay.querySelector('.overlay-title');
		var msgEl   = overlay.querySelector('.overlay-message');
		var hintEl  = overlay.querySelector('.overlay-hint');

		if( titleEl ) titleEl.textContent = 'Game Over';
		if( msgEl )   msgEl.textContent   = 'All lives are lost.';
		if( hintEl ){
			var currentScore = jQuery('#osdContainer .score .value').html() || '0';
			hintEl.textContent = 'Score: ' + currentScore;
		}

		// Notify parent window that the game is over with the current score
		try {
			var scoreText = jQuery('#osdContainer .score .value').html() || '0';
			var score = parseInt(scoreText, 10) || 0;
			// expose score via a simple object so parent pages can read it
			window.game = window.game || {};
			window.game.score = score;
			if (window.parent && window.parent.postMessage) {
				// run the exact code requested
				window.parent.postMessage({ type: 'GAME_OVER', score: window.game.score }, '*');
			}
		} catch(e) {
			// fail silently if postMessage is not available
		}

		overlay.style.display = 'flex';

		var self = this;
		var onClick = function(){
			overlay.style.display = 'none';
			overlay.removeEventListener('click', onClick);
			self.trigger('completed');
		};
		overlay.addEventListener('click', onClick);
	}else{
		// Fallback if overlay missing
		this.trigger('completed');
	}
}
