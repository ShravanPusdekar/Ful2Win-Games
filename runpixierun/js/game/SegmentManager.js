/**
 * @author Mat Groves
 */

/**
 * @author Mat Groves
 */

var GAME = GAME || {};

GAME.SegmentManager = function(engine)
{
	this.engine = engine;
	
	this.sections = data//[section1, section2];
	this.count = 0;
	this.currentSegment = data[0]
	//this.currentSegment.start = -10000
	this.startSegment = {length:1135 * 2, floor:[0,1135], blocks:[], coins:[]},
	this.chillMode = true;
	this.last = 0; 
	this.position = 0;
	
	// Randomize segment order on initialization for unpredictable gameplay
	this.shuffleSegments();
}

// constructor
GAME.SegmentManager.constructor = GAME.SegmentManager;

GAME.SegmentManager.prototype.shuffleSegments = function()
{
	// Fisher-Yates shuffle algorithm for true randomization
	var array = this.sections;
	for (var i = array.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
	console.log("[SegmentManager] Segments shuffled for random gameplay");
}

GAME.SegmentManager.prototype.reset = function(dontReset)
{
//	this.currentSegment.start;// = GAME.camera.x;
	if(dontReset)this.count = 0;
	this.currentSegment = this.startSegment;
	this.currentSegment.start = -200;
	
	// Re-shuffle segments on reset for different experience each game
	this.shuffleSegments();
	
	for ( var i = 0; i < this.currentSegment.floor.length; i++) 
	{
		this.engine.floorManager.addFloor( this.currentSegment.start + this.currentSegment.floor[i]);
	}
}

GAME.SegmentManager.prototype.update = function()
{
	this.position = GAME.camera.x + width * 2;
	// look at where we are..
	var relativePosition = this.position - this.currentSegment.start;
	
//	console.log(Math.round(relativePosition) + " " +this.currentSegment.length);
	if(relativePosition > this.currentSegment.length)
	{
		
			
		if(this.engine.joyrideMode)
		{
			var nextSegment = this.startSegment
			nextSegment.start = this.currentSegment.start + this.currentSegment.length;
			this.currentSegment = nextSegment;
	
			for ( var i = 0; i < this.currentSegment.floor.length; i++) 
			{
				this.engine.floorManager.addFloor(this.currentSegment.start + this.currentSegment.floor[i]);
			}
			
			return;
		}
		
		
		// RANDOMIZED: Pick segments with variation instead of pure sequential
		// 70% chance to use sequential, 30% chance to pick random segment
		var nextSegment;
		if(Math.random() < 0.7) {
			// Sequential with shuffled array
			nextSegment = this.sections[this.count % this.sections.length];
		} else {
			// Random segment selection for extra unpredictability
			var randomIndex = Math.floor(Math.random() * this.sections.length);
			nextSegment = this.sections[randomIndex];
		}
//		if(this.chillMode)nextSegment =  this.sections[0];
	//	console.log( this.sections.length)
		// section finished!
		nextSegment.start = this.currentSegment.start + this.currentSegment.length;
		
		this.currentSegment = nextSegment;
	
		// add the elements!
		for ( var i = 0; i < this.currentSegment.floor.length; i++) 
		{
			this.engine.floorManager.addFloor(this.currentSegment.start + this.currentSegment.floor[i]);
		}
		
		var blocks = this.currentSegment.blocks;
		var length = blocks.length/2;
		
		for ( var i = 0; i < length; i++) 
		{
			// Randomly skip 10% of obstacles for variation
			if(Math.random() < 0.1) continue;
			
			// Add slight random variation to enemy X position (±20 pixels)
			var xVariation = (Math.random() - 0.5) * 40;
			// Add slight random variation to enemy Y position (±15 pixels)
			var yVariation = (Math.random() - 0.5) * 30;
			this.engine.enemyManager.addEnemy(
				this.currentSegment.start + blocks[i*2] + xVariation, 
				blocks[(i*2)+1] + yVariation
			);
		}
		
		var pickups = this.currentSegment.coins;
		var length = pickups.length/2;
		
		for ( var i = 0; i < length; i++) 
		{
			// Randomly skip 5% of pickups for variation (less than obstacles)
			if(Math.random() < 0.05) continue;
			
			// Add random variation to pickup positions for unpredictability
			// X variation: ±30 pixels, Y variation: ±20 pixels
			var xVariation = (Math.random() - 0.5) * 60;
			var yVariation = (Math.random() - 0.5) * 40;
			this.engine.pickupManager.addPickup(
				this.currentSegment.start + pickups[i*2] + xVariation, 
				pickups[(i*2)+1] + yVariation
			);
		}
		
		this.count ++;
		
	}
	
}

