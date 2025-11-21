var menuState = function(game){
    this.game = game;
    this.buttons = null;
    this.titleBg = null;
    this.menuTitle = null;
    this.musicButton = null;
    this.autoStartTime = 5; // seconds
    this.autoTimerText = null;
    this._lastAutoTick = null;
    this.autoStarted = false;
};


    menuState.prototype = {
        
        create: function(){

            console.log(game.state.getCurrentState());
            
            this.titleBg = game.add.sprite(game.world.centerX,game.world.centerY,'title-bg');
            this.titleBg.anchor.setTo(0.5,0.5);
            this.titleBg.scale.setTo(0.6,0.6);
            
            game.global.menuBgSound = this.game.add.audio('menuBg',1,true);
            
            this.buttons = new menuButtons(game);
            this.buttons.create();
            this.menuTitle = game.add.sprite(game.world.centerX,game.world.height-450,'menu-title');
            this.menuTitle.anchor.setTo(0.5,0.5);
            
            if(game.global.soundPlay){
                game.global.menuBgSound.play();
            }
            
            this.tweenButton(this.buttons.playbtn); // make button juicy

            // auto-start countdown number in bottom-left corner
            this.autoTimerText = this.add.text(
                10,
                game.world.height - 40,
                '',
                { font: '24px Arial', fill: '#ffffff' }
            );
            this.autoTimerText.anchor.setTo(0, 0.5);
            this.updateAutoTimerText();
        },
        
        tweenButton: function(button){
            var rnd = this.game.rnd.integerInRange(7,10);
            game.add.tween(button).to({
               y:button.y+rnd,y:button.y-rnd 
            },1000,Phaser.Easing.Linear.None,true,0,-1,true);
        },
        
        update: function(){
            // handle 5-second auto-start if player does nothing
            if (this.autoStarted) { return; }

            if (!this._lastAutoTick) {
                this._lastAutoTick = this.time.now;
                return;
            }

            var now = this.time.now;
            var delta = now - this._lastAutoTick;
            if (delta >= 1000) {
                var steps = Math.floor(delta / 1000);
                this.autoStartTime = Math.max(0, this.autoStartTime - steps);
                this._lastAutoTick += steps * 1000;
                this.updateAutoTimerText();

                if (this.autoStartTime <= 0) {
                    this.autoStarted = true;
                    this.buttons.handlePlay();
                }
            }
        },

        updateAutoTimerText: function(){
            if (this.autoTimerText) {
                this.autoTimerText.text = this.autoStartTime.toString();
            }
        }
           
    }