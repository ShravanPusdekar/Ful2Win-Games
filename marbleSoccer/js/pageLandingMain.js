var pageGameMain;
var soundPool;
var keyboard, devOrientation;

Marble.PageLandingMain	= function()
{
	this._pageSel		= "#pageLandingContainer";
	this._autoStartTimerId	= null;
	this._autoStartRemaining	= 0;

	// create Marble.SoundPool
	this._soundsCtor();
	this._preloadCtor();


	keyboard	= new THREEx.KeyboardState();
	devOrientation	= new THREEx.DeviceOrientationState();
	
	this._pageGameMain	= null;

	jQuery(this._pageSel).show();
	
	if( !Detector.webgl && !jQuery.url().param('render') ){
		this._nowebglShow();		
	}else{
		this._menuShow();		
	}
	this._chromeWebStoreCtor();

	jQuery(this._pageSel+" .menuDialog .button.play").addClass('disable');
	
	this._$playButtonClick		= this._playClick.bind(this);
	this._$tutorialButtonClick	= this._tutorialShow.bind(this);
	jQuery(this._pageSel+" .menuDialog .button.play").bind('click'		, this._$playButtonClick);
	jQuery(this._pageSel+" .menuDialog .button.tutorial").bind('click'	, this._$tutorialButtonClick);

	// adjust instructions for mobile vs desktop controls
	this._updateControlsInstructions();

	// start auto-start countdown (5s by default)
	this._startAutoStartCountdown(5);

	// go directly to pageGameMain
	if( jQuery.url().param('bypasslanding') !== undefined )	this._pageGameMainCtor();
}

Marble.PageLandingMain.prototype.destroy	= function()
{
	this._pageGameMainDtor();

	this._prealoadDtor();
	this._soundsDtor();

	keyboard.destroy();
	keyboard	= null;

	devOrientation.destroy();
	devOrientation	= null;

	this._soundPool && this._soundPool.destroy();
	this._soundPool	= null;
	// export in global
	soundPool	= this._soundPool;

	// clear landing auto-start timer
	if( this._autoStartTimerId ){
		clearInterval(this._autoStartTimerId);
		this._autoStartTimerId = null;
	}

	jQuery(this._pageSel).hide();
	jQuery(this._pageSel+" .menuDialog .button.play").unbind('click'	, this._$playButtonClick);
	jQuery(this._pageSel+" .menuDialog .button.tutorial").unbind('click'	, this._$tutorialButtonClick);
}

//////////////////////////////////////////////////////////////////////////////////
//										//
//////////////////////////////////////////////////////////////////////////////////

Marble.PageLandingMain.prototype._menuShow	= function()
{
	var dialogSel	= this._pageSel+' .menuDialog';
	jQuery(dialogSel).jqm( {overlay : 0} );
	jQuery(dialogSel).jqmShow();
}

Marble.PageLandingMain.prototype._startAutoStartCountdown = function(seconds)
{
	if( this._autoStartTimerId ){
		clearInterval(this._autoStartTimerId);
		this._autoStartTimerId = null;
	}
	this._autoStartRemaining = seconds;
	this._updateAutoStartCountdownDom();

	var self = this;
	this._autoStartTimerId = setInterval(function(){
		self._autoStartRemaining--;
		self._updateAutoStartCountdownDom();
		if( self._autoStartRemaining <= 0 ){
			clearInterval(self._autoStartTimerId);
			self._autoStartTimerId = null;
			// if game not started yet, start it
			if( !self._pageGameMain ){
				// hide any open tutorial dialog and its jqModal overlay
				var dialogSel = self._pageSel+' .tutorialDialog';
				try {
					jQuery(dialogSel).jqmHide && jQuery(dialogSel).jqmHide();
				} catch(e){}
				self._pageGameMainCtor();
			}
		}
	}, 1000);
}

Marble.PageLandingMain.prototype._updateAutoStartCountdownDom = function()
{
	var text = this._autoStartRemaining > 0 ? String(this._autoStartRemaining) : '';
	jQuery('#landingCountdown').text(text);
}

Marble.PageLandingMain.prototype._updateControlsInstructions = function()
{
	var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');

	var desktopText = 'Use <strong>Arrows</strong> to move the player And push the blue ball on the red squares.';
	var mobileText  = 'Use the on-screen joystick (touch and drag) to move the player and push the blue ball on the red squares.';

	var menuHtml = isMobile ? mobileText : desktopText;
	var tutorialHtml = isMobile ? mobileText : desktopText;
	var helpHtml = isMobile
		? 'Use the on-screen joystick (touch and drag) to move the player.'
		: 'Use <strong>Arrows</strong> to move the player.';

	// Landing menu dialog (second paragraph)
	jQuery(this._pageSel+' .menuDialog p').eq(1).html(menuHtml);

	// Tutorial dialog (second paragraph)
	jQuery(this._pageSel+' .tutorialDialog p').eq(1).html(tutorialHtml);

	// Help dialog in game HUD (second paragraph)
	jQuery('#osdContainer .helpDialog p').eq(1).html(helpHtml);
}

Marble.PageLandingMain.prototype._nowebglShow	= function()
{
	var dialogSel	= this._pageSel+' .nowebglDialog';

	var youtubeUrl	= 'http://www.youtube.com/embed/kW4oHaHCilo';
	var youtubeHtml	= '<iframe width="560" height="315" src="'+youtubeUrl+'" frameborder="0" allowfullscreen></iframe>';
	jQuery(dialogSel+ ' .youtube').html(youtubeHtml);
	
	jQuery(dialogSel).jqm( {overlay : 0} );
	jQuery(dialogSel).jqmShow();
}

//////////////////////////////////////////////////////////////////////////////////
//		callbacks for button						//
//////////////////////////////////////////////////////////////////////////////////

Marble.PageLandingMain.prototype._playClick	= function()
{
	var disable	= jQuery(this._pageSel+" .menuDialog .button.play").hasClass('disable');
	// cancel auto-start timer and clear countdown display
	if( this._autoStartTimerId ){
		clearInterval(this._autoStartTimerId);
		this._autoStartTimerId = null;
	}
	this._autoStartRemaining = 0;
	this._updateAutoStartCountdownDom();
	this._pageGameMainCtor();
}


Marble.PageLandingMain.prototype._tutorialShow	= function()
{
	var dialogSel	= this._pageSel+' .tutorialDialog';
	jQuery(dialogSel).jqm();
	jQuery(dialogSel).jqmShow();
	// reset auto-start timer to 10 seconds
	this._startAutoStartCountdown(10);
}

//////////////////////////////////////////////////////////////////////////////////
//		sounds								//
//////////////////////////////////////////////////////////////////////////////////

Marble.PageLandingMain.prototype._preloadCtor	= function()
{
	this._preloader	= new THREEx.Preloader();
// TODO well there is a preloader... but what happened to it ?
	this._preloader.bind('complete', function(){
		jQuery(this._pageSel+" .menuDialog .button.play").removeClass('disable');
	}.bind(this));
	this._preloader.start();
}

Marble.PageLandingMain.prototype._preloadDtor	= function()
{	
	this._preloader && this._preloader.destroy();
}

//////////////////////////////////////////////////////////////////////////////////
//		sounds								//
//////////////////////////////////////////////////////////////////////////////////

Marble.PageLandingMain.prototype._soundsCtor	= function()
{
	console.assert( !this._soundPool );

	var disabled	= jQuery.url().param('nosound') !== undefined ? true : false;

	this._soundPool	= new Marble.SoundPool();
	this._soundPool.insert('goal', new Marble.Sound({
		//urls	: ['sounds/pacman/eatghost.mp3'],
		urls	: ['sounds/flashkit.com/Poolshot-GamePro9-8159_hifi.mp3'],
		disabled: disabled
	}));
	this._soundPool.insert('die', new Marble.Sound({
		urls	: ['sounds/pacman/die.mp3'],
		disabled: disabled
	}));
	this._soundPool.insert('marbleContact', new Marble.Sound({
		//urls	: ['sounds/pacman/eating.short.mp3'],
		urls	: ['sounds/flashkit.com/Poolshot-GamePro9-8159_hifi.mp3'],
		disabled: disabled
	}));

	// export in global
	soundPool	= this._soundPool;
}

Marble.PageLandingMain.prototype._soundsDtor	= function()
{
	this._soundPool.destroy();
	this._soundPool	= null;
}

//////////////////////////////////////////////////////////////////////////////////
//		chromeWebStore							//
//////////////////////////////////////////////////////////////////////////////////

Marble.PageLandingMain.prototype._chromeWebStoreCtor	= function()
{
	var domSelector	= this._pageSel + ' .chromeWebStoreInstall';

	var isAvailable	= THREEx.ChromeWebStoreInstall.apiAvailable()
	if( isAvailable === false )	return;

	var isInstalled	= THREEx.ChromeWebStoreInstall.isInstalled();
	if( isInstalled ){
		jQuery(domSelector+" .value").text('Installed');
		jQuery(domSelector).addClass("installed");
	}else{
		jQuery(domSelector+" .value").text('Available');
		jQuery(domSelector).addClass("toInstall");
		jQuery(domSelector).bind('click', function(event){
			event.preventDefault();
			THREEx.ChromeWebStoreInstall.install();
		}.bind(this));
	}
	jQuery(domSelector).show();
}

Marble.PageLandingMain.prototype._chromeWebStoreDtor	= function()
{
	var domSelector	= this._pageSel + ' .chromeWebStoreInstall';
	jQuery(domSelector).hide();
}
//////////////////////////////////////////////////////////////////////////////////
//		pageGameMain							//
//////////////////////////////////////////////////////////////////////////////////

Marble.PageLandingMain.prototype._pageGameMainCtor	= function()
{
	console.assert( !this._pageGameMain );
	
	this._pageGameMain	= new Marble.PageGameMain();

	this._$pageGameMainOnCompleted	= this._pageGameMainOnCompleted.bind(this);
	this._pageGameMain.bind('completed', this._$pageGameMainOnCompleted);

	jQuery(this._pageSel).hide();

	// export as a global
	pageGameMain	= this._pageGameMain;
}

Marble.PageLandingMain.prototype._pageGameMainDtor	= function()
{
	if( !this._pageGameMain )	return;
	
	this._pageGameMain.unbind('completed', this._$pageGameMainOnCompleted);
	this._pageGameMain.destroy();
	this._pageGameMain	= null;

	// export as a global
	pageGameMain	= this._pageGameMain;
}

Marble.PageLandingMain.prototype._pageGameMainOnCompleted	= function()
{
	this._pageGameMainDtor();
	jQuery(this._pageSel).show();
}
