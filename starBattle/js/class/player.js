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

        setupButton('btn-shoot', 'shoot');
        this.initJoystick();
        
        // Process active movements in the game loop
        this.processContinuousMovement();
    }

    initJoystick() {
        const base = document.getElementById('joystick');
        const knob = document.getElementById('joystick-knob');
        if (!base || !knob) return;

        this.joystickVector = { x: 0, y: 0 };
        let active = false;
        let pid = null;

        const maxDist = () => Math.max(1, (base.clientWidth / 2) - (knob.clientWidth / 2));

        const setKnob = (nx, ny) => {
            const md = maxDist();
            knob.style.transform = `translate(-50%, -50%) translate(${nx * md}px, ${ny * md}px)`;
        };

        const updateFromClient = (cx, cy) => {
            const r = base.getBoundingClientRect();
            const centerX = r.left + r.width / 2;
            const centerY = r.top + r.height / 2;
            let dx = cx - centerX;
            let dy = cy - centerY;
            const md = maxDist();
            const dist = Math.hypot(dx, dy) || 1;
            if (dist > md) {
                dx = dx / dist * md;
                dy = dy / dist * md;
            }
            const nx = dx / md;
            const ny = dy / md;
            this.joystickVector = { x: Math.max(-1, Math.min(1, nx)), y: Math.max(-1, Math.min(1, ny)) };
            setKnob(this.joystickVector.x, this.joystickVector.y);
        };

        const start = (e) => {
            e.preventDefault();
            e.stopPropagation();
            active = true;
            pid = e.pointerId || 'touch';
            if (e.pointerId && base.setPointerCapture) base.setPointerCapture(e.pointerId);
            const p = e.touches ? e.touches[0] : e;
            updateFromClient(p.clientX, p.clientY);
        };

        const move = (e) => {
            if (!active) return;
            const p = e.touches ? e.touches[0] : e;
            updateFromClient(p.clientX, p.clientY);
        };

        const end = (e) => {
            active = false;
            pid = null;
            this.joystickVector = { x: 0, y: 0 };
            setKnob(0, 0);
            if (e && e.pointerId && base.releasePointerCapture) base.releasePointerCapture(e.pointerId);
        };

        base.addEventListener('pointerdown', start, { passive: false });
        base.addEventListener('pointermove', move, { passive: false });
        base.addEventListener('pointerup', end, { passive: false });
        base.addEventListener('pointercancel', end, { passive: false });
        base.addEventListener('touchstart', start, { passive: false });
        base.addEventListener('touchmove', move, { passive: false });
        base.addEventListener('touchend', end, { passive: false });
        base.addEventListener('touchcancel', end, { passive: false });
        base.addEventListener('mousedown', start, { passive: false });
        document.addEventListener('mousemove', move, { passive: false });
        document.addEventListener('mouseup', end, { passive: false });
    }

    processContinuousMovement() {
        const processMovements = () => {
            if (!this.run || this.scene.pauseFlag || this.scene.game.data.end) {
                requestAnimationFrame(processMovements);
                return;
            }
            
            const v = this.joystickVector || { x: 0, y: 0 };
            const dz = 0.2;
            if (v.y < -dz) this.up();
            if (v.y > dz) this.down();
            if (v.x < -dz) this.left();
            if (v.x > dz) this.right();

            // Execute all active movements
            this.activeMovements.forEach(action => {
                action.call(this);
            });
            
            requestAnimationFrame(processMovements);
        };
        
        processMovements();
    }
}