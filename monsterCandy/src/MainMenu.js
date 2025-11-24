Candy.MainMenu = function(game){};
Candy.MainMenu.prototype = {
	create: function(){
		// display images
		this.add.sprite(0, 0, 'background');
		this.add.sprite(-130, Candy.GAME_HEIGHT-514, 'monster-cover');
		this.add.sprite((Candy.GAME_WIDTH-395)/2, 60, 'title');
		// add the button that will start the game
		this.add.button(Candy.GAME_WIDTH-401-10, Candy.GAME_HEIGHT-143-10, 'button-start', this.startGame, this, 1, 0, 2);
		// visible 5 second countdown before auto-start
		this._remainingSeconds = 5;
		this._menuFontStyle = { font: "40px Arial", fill: "#FFCC00", stroke: "#333", strokeThickness: 5, align: "center" };
		// show only the number in the top-left corner
		this._countdownText = this.add.text(20, 20, "" + this._remainingSeconds, this._menuFontStyle);
		// auto-start event after 5 seconds
		this._autoStartEvent = this.time.events.add(Phaser.Timer.SECOND * this._remainingSeconds, this.startGame, this);
		// update countdown text every second
		var self = this;
		this._countdownEvent = this.time.events.loop(Phaser.Timer.SECOND, function() {
			self._remainingSeconds--;
			if (self._remainingSeconds > 0) {
				self._countdownText.setText("" + self._remainingSeconds);
			} else {
				self._countdownText.visible = false;
				self.time.events.remove(self._countdownEvent);
			}
		}, this);
	},
	startGame: function() {
		if (this._autoStarted) {
			return;
		}
		this._autoStarted = true;
		// clean up countdown timers if they exist
		if (this._autoStartEvent) {
			this.time.events.remove(this._autoStartEvent);
			this._autoStartEvent = null;
		}
		if (this._countdownEvent) {
			this.time.events.remove(this._countdownEvent);
			this._countdownEvent = null;
		}
		if (this._countdownText) {
			this._countdownText.visible = false;
		}
		// start the Game state
		this.state.start('Game');
	}
};