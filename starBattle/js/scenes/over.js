class Over extends Scene{
    setup() {
        
        this.game.data.end = true;

        // Update the view first
        this.updateView();

        // Send game over message to parent window after screen is shown
        this.sendGameOverMessage();
    }

    sendGameOverMessage() {
        const gameData = {
            type: "GAME_OVER", 
            score: this.game.data.score,
            time: this.game.data.time,
            shots: this.game.data.shoot
        };

        console.log('Game Over - Sending message to parent:', gameData);
        
        // Send to parent window
        window.parent.postMessage(gameData, "*");
        
        // Also try sending to top window if different from parent
        if (window.top !== window.parent) {
            window.top.postMessage(gameData, "*");
        }
    }

    updateView(){
        const {
            time,
            score,
            shoot,
        } = this.game.data;
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        $('#over .time').innerHTML = formattedTime;
        $('#over .score').innerHTML = numberFormat(score);
        $('#over .shoot').innerHTML = numberFormat(shoot);
    }
}