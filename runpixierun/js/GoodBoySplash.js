var GoodBoySplash = (function()
{
    var paperView = false;
    var paperStage = false;
	var paperRenderer = false;
    var loaded = false;
    var interval = false;
    
    var nStageWidth = 0;
    var nStageHeight = 0;
    
    var loadingFrames = [
        "img/loading_01.png",
        "img/loading_02.png",
        "img/loading_03.png",
        "img/loading_04.png",
        "img/goodboy_logo.png"
    ];
    
    
    function preload(fCallBack)
    {
        assetLoader = new PIXI.AssetLoader(loadingFrames, true);
        assetLoader.onComplete = fCallBack;
        assetLoader.load();
    }
    
    function init()
    {
        paperView = document.createElement('canvas');
        // Jungle green background matching Run Pixie Run theme
        paperStage = new PIXI.Stage(0x2D5016, true); // Dark jungle green
        paperRenderer = PIXI.autoDetectRenderer(nStageWidth, nStageHeight, paperView);
        
        document.body.appendChild(paperRenderer.view);
        
        preload(function()
        {
            var tick = 0;
            
            // Create title text for Run Pixie Run
            var titleText = new PIXI.Text("RUN PIXIE RUN", {
                font: "bold 72px Arial",
                fill: "#FFD700", // Gold color
                stroke: "#2D5016", // Dark green stroke
                strokeThickness: 8,
                dropShadow: true,
                dropShadowColor: "#000000",
                dropShadowBlur: 8,
                dropShadowAngle: Math.PI / 4,
                dropShadowDistance: 6
            });
            titleText.anchor.x = 0.5;
            titleText.anchor.y = 0.5;
            titleText.position.x = nStageWidth * 0.5;
            titleText.position.y = nStageHeight * 0.35;
            
            var loadingText = new PIXI.Text("LOADING...", {
                font: "bold 36px Arial",
                fill: "#FFFFFF",
                stroke: "#2D5016",
                strokeThickness: 5
            });
            loadingText.anchor.x = 0.5;
            loadingText.anchor.y = 0.5;
            loadingText.position.x = nStageWidth * 0.5;
            loadingText.position.y = nStageHeight * 0.65;
            
            interval = setInterval(function()
            {
                tick++;
                if(tick === loadingFrames.length)
                {
                    tick = 0;
                }
                
                paperStage.stage.children = [];
                
                // Add title
                paperStage.addChild(titleText);
                
                // Add animated loading indicator
                var sprite = SpritePool.getInstance().get(loadingFrames[tick]);
                sprite.anchor.x = 0.5;
                sprite.anchor.y = 0.5;
                sprite.position.x = nStageWidth * 0.5;
                sprite.position.y = nStageHeight * 0.5;
                sprite.scale.set(1.5); // Slightly larger loading animation
                
                paperStage.addChild(sprite);
                
                // Add loading text with pulsing effect
                loadingText.alpha = 0.5 + Math.sin(Date.now() / 200) * 0.5;
                paperStage.addChild(loadingText);
                
                paperRenderer.render(paperStage);
                
            }, 200);
        });
    }
    
    
    function show()
    {
        
    }
    
    function hide()
    {
        clearInterval(interval);
        for (var i = 1; i <= 100; i++) {
            setTimeout((function (x) {
                return function () {
                    fadeOutStep(100-x)
                };
            })(i), i * 10);
        }
    }
    
    function fadeOutStep(nOpacity)
    {
        paperRenderer.view.style.opacity = nOpacity;
        if(nOpacity === 0)
        {
            document.body.removeChild(paperRenderer.view);
        }
    }
    
    function resize(nWidth, nHeight)
    {
        nStageWidth = nWidth;
        nStageHeight = nHeight;
        
        paperRenderer.view.style.width = nStageWidth + "px";
        paperRenderer.view.style.height = nStageHeight + "px";
        
        paperRenderer.resize(nStageWidth, nStageHeight);
    }
    
    return {
        resize : resize,
        init : init,
        hide : hide
    }
})();

/***********
 *SpritePool
 */
function SpritePool ()
{
    if (SpritePool._isBirth)
        throw new Error("This class is a singleton!");
    else
    {
        SpritePool._instance = this;
        SpritePool._isBirth = true;
    };
    var _pool = [];
    this.get = function (frameId)
    {
        for (var i in _pool)
        {
            if (_pool[i].texture === PIXI.TextureCache[frameId])
            return _pool.splice(i, 1)[0];
        }
        return PIXI.Sprite.fromFrame(frameId);
    };
    this.recycle = function (sprite)
    {
        _pool.push(sprite);
    }
};
SpritePool._isBirth = false;
SpritePool.getInstance = function ()
{
    return SpritePool._instance != null ? SpritePool._instance : new SpritePool();
};