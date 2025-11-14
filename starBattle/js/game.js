class Game {
    constructor() {
        this.setup();
        this.setupResizeHandler();
    }

    setup() {
        this.initSize();
        this.initScenes();
    }

    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.initSize();
                if (this.scene && this.scene.canvas) {
                    const container = this.scene.canvas.parentElement;
                    if (container) {
                        this.scene.canvas.width = container.offsetWidth;
                        this.scene.canvas.height = container.offsetHeight;
                        config.game.w = container.offsetWidth;
                        config.game.h = container.offsetHeight;
                        
                        // Update scale based on new dimensions
                        const screenWidth = window.innerWidth;
                        config.game.scale = screenWidth <= 768 ? 0.5 : 1;
                    }
                }
            }, 250);
        });
    }

    initData() {
        this.data = config.data();
        this.data.end = false;
    }

    initSize() {
        const el = $('#app');
        const screenWidth = window.innerWidth;
        
        // Set default dimensions from config
        let gameWidth = 960;
        let gameHeight = 480;
        
        // For mobile devices, use viewport dimensions and scale down elements
        if (screenWidth <= 768) {
            gameWidth = window.innerWidth;
            gameHeight = window.innerHeight;
            
            // Calculate scale factor - smaller screen = smaller elements
            // Scale elements to 50% on mobile for better visibility
            config.game.scale = 0.5;
        } else {
            config.game.scale = 1;
        }
        
        style(
            el, {
                width: gameWidth + 'px',
                height: gameHeight + 'px',
            }
        );
    }

    initScenes() {
        this.scenes = {
            start: new Start('#start', this),
            play: new Play('#play', this),
            over: new Over('#over', this),
            rank: new Rank('#rank', this),
        }
    }

    toggleScene(scene) {
        if (this.scene === this.scenes[scene]) {
            return;
        }
        Object.keys(this.scenes).map(key => {
            this.scenes[key].hidden();
        });
        this.scene && this.scene.uninstall();
        this.scene = this.scenes[scene];
        this.scene.show();
        this.scene.setup();
    }

    start() {
        this.toggleScene('start');
    }

    play() {
        this.toggleScene('play');
    }

    over() {
        this.toggleScene('over');
    }

    rank() {
        this.toggleScene('rank');
    }

}