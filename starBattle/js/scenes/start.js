class Start extends Scene {
    constructor(el, game) {
        super(el, game);
        this.countdownTimer = null;
        this.countdownValue = 5;
    }

    setup() {
        super.setup();
        this.game.initData();
        this.event();
        this.startCountdown();
    }

    startCountdown() {
        const countdownElement = $('#countdown-number');
        this.countdownValue = 5;
        
        if (countdownElement) {
            countdownElement.textContent = this.countdownValue;
        }

        // Clear any existing timer
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }

        // Start countdown
        this.countdownTimer = setInterval(() => {
            this.countdownValue--;
            
            if (countdownElement) {
                countdownElement.textContent = this.countdownValue;
            }

            // Auto-start when countdown reaches 0
            if (this.countdownValue <= 0) {
                this.stopCountdown();
                const btn = $('#start-btn');
                if (btn && !btn.hasAttribute('disabled')) {
                    btn.click();
                }
            }
        }, 1000);
    }

    stopCountdown() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    }

    event() {
        const btn = $('#start-btn');
        on(
            btn,
            'click',
            () => {
                // Stop countdown when user clicks start
                this.stopCountdown();
                
                btn.setAttribute('disabled', 'disabled');
                res.loadAssets(() => {
                    this.game.play();
                    btn.removeAttribute('disabled');
                })
            }
        )
    }

    uninstall() {
        // Clean up countdown timer when leaving start screen
        this.stopCountdown();
        super.uninstall();
    }
}