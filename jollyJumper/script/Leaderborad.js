var leaderboardState = function(game){
    this.game = game;
    this.retriveData = 'Player';
    this.restartBtn;
    this.menuBtn;
    
    this.style = { font: "bold 34px Arial", fill: "#fff", tabs: [ 100, 300 ] };
    this.textStyle = { font: "28px Comic Sans MS",stroke: '#ffffff', strokeThickness: 4, fill: "#BE5446", tabs: [ 100, 300 ] };
    this.styleTextH = { font: "bold 58px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
    this.styleTextH2 = { font: "bold 36px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
    
};


leaderboardState.prototype = {
    
    create: function(){
        console.log('Leaderboard State');
        this.game.stage.backgroundColor = '#373F6C';
        game.global.menuBgSound.stop();
        
        this.buildInterface();
        
        this.showScore();
        
    },
    
    buildInterface: function(){
        // Simplified interface: background color only; score will be added in showScore()
    },
     
    showScore: function(){
        // Only display the player's final score in the center
        var currentScore = this.add.text(this.world.centerX, this.world.centerY, 'Your Score - ' + game.global.score, this.textStyle);
        currentScore.anchor.setTo(0.5);

        // Immediately notify parent that the game is over with the final score
        try {
            if (window.parent && window.parent.postMessage) {
                window.parent.postMessage({ type: "GAME_OVER", score: game.global.score }, "*");
            }
        } catch (e) {
            // ignore postMessage errors (e.g., cross-origin)
        }
    } // end showScore
    
    
}