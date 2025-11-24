var Candy = {};
Candy.Boot = function(game){};
Candy.Boot.prototype = {
	preload: function(){
		// preload the loading indicator first before anything else
		this.load.image('preloaderBar', 'img/loading-bar.png');
	},
	create: function(){
		// set scale options
		this.input.maxPointers = 1;
		if (this.game.device.desktop) {
			this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL; // preserve aspect on desktop
		} else {
			this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT; // fill screen on mobile
		}
		this.scale.pageAlignHorizontally = true;
		this.scale.pageAlignVertically = true;
		this.scale.setScreenSize(true);
		this.scale.refresh();
		// start the Preloader state
		this.state.start('Preloader');
	}
};