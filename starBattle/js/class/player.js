class Player extends Plane{
    
    setup() {
        super.setup('player');
        this.initBullet('playerBullet', this.scene.playerBullets);
        this.event();
    }

    up() {
        if (this.y <= 0) return;
        this.y-=this.speed;
    }
    left() {
        if (this.x <= 0) return;
        this.x-=this.speed;
    }
    right() {
        if (this.x+this.w >= config.game.w) return;
        this.x+=this.speed;
    }
    down() {
        if (this.y+this.h >= config.game.h) return;
        this.y+=this.speed;
    }

    event() {
        const called = callback=>{
            if (!this.run) return;
            if (this.scene.pauseFlag) return;
            if (this.scene.game.data.end) return;
            callback.call(this);
        };
        const keys = {
            'w': this.up,
            'a': this.left,
            's': this.down,
            'd': this.right,
        };
        Object.keys(keys).map((key) => {
            hotkey.reg(key, () => {
               called(keys[key]);
            }); 
        });
        
        hotkey.reg(' ', () => {
            called(()=>{
                res.replay('shoot');
                this.fire();
            });
        }, true);

        // Mobile touch controls
        this.setupTouchControls();
    }

    setupTouchControls() {
        // Track active movements
        this.activeMovements = new Set();
        
        const setupButton = (buttonId, action) => {
            const button = document.getElementById(buttonId);
            if (!button) return;

            const called = callback => {
                if (!this.run) return;
                if (this.scene.pauseFlag) return;
                if (this.scene.game.data.end) return;
                callback.call(this);
            };

            const startAction = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (action === 'shoot') {
                    called(() => {
                        res.replay('shoot');
                        this.fire();
                    });
                } else {
                    // Add to active movements for continuous motion
                    this.activeMovements.add(action);
                }
            };

            const endAction = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Remove from active movements
                if (action !== 'shoot') {
                    this.activeMovements.delete(action);
                }
            };

            // Multiple event types for maximum compatibility
            button.addEventListener('touchstart', startAction, { passive: false, capture: true });
            button.addEventListener('touchend', endAction, { passive: false, capture: true });
            button.addEventListener('touchcancel', endAction, { passive: false, capture: true });
            button.addEventListener('pointerdown', startAction, { passive: false, capture: true });
            button.addEventListener('pointerup', endAction, { passive: false, capture: true });
            button.addEventListener('pointercancel', endAction, { passive: false, capture: true });
            button.addEventListener('pointerleave', endAction, { passive: false, capture: true });
            button.addEventListener('mousedown', startAction, { passive: false });
            button.addEventListener('mouseup', endAction, { passive: false });
            button.addEventListener('mouseleave', endAction, { passive: false });
        };

        setupButton('btn-up', this.up);
        setupButton('btn-down', this.down);
        setupButton('btn-left', this.left);
        setupButton('btn-right', this.right);
        setupButton('btn-shoot', 'shoot');
        
        // Process active movements in the game loop
        this.processContinuousMovement();
    }

    processContinuousMovement() {
        const processMovements = () => {
            if (!this.run || this.scene.pauseFlag || this.scene.game.data.end) {
                requestAnimationFrame(processMovements);
                return;
            }
            
            // Execute all active movements
            this.activeMovements.forEach(action => {
                action.call(this);
            });
            
            requestAnimationFrame(processMovements);
        };
        
        processMovements();
    }
}