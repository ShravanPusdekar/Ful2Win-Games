var menuButtons = function(game){
  this.game = game;    
  this.playbtn;
  this.soundPlay = true;    
};

    menuButtons.prototype = {
        
        create: function(){
            
this.playbtn = game.add.button(game.world.centerX,game.world.centerY,'play',this.handlePlay,this);
        this.playbtn.anchor.setTo(0.5,0.5);    
        this.playbtn.input.useHandCursor = true;
            // Help, credit, and menu sound buttons removed per requirements
        },
        
        handlePlay: function(){
            // run the play (core) state
            game.global.menuBgSound.stop();
            game.state.start('Play');
        },
        
        handleHelp: function(){
          this.game.state.start('Help');  
        },
        
        handleCredit: function(){
            this.game.state.start('Credit');
        },
                
        muteSound: function(){
            game.global.mute = !game.global.mute;
            
            if(game.global.mute == true){
                this.muteButton.frame = 0;
                game.global.soundPlay = false;
                game.global.menuBgSound.stop();
            }
            else{
                game.global.soundPlay = true;
                this.muteButton.frame = 1;
                game.global.menuBgSound.play();
            }
            
        },
        
        update:function(){
            
           
        }
        
        
    }
    
    
    