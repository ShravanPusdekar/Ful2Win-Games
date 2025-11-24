/**
*/
Marble.Camera	= function()
{
	this._object		= new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 100000 );
	this._relativePos	= new THREE.Vector3(0, 300, 400);
	// for debug
	//this._relativePos	= new THREE.Vector3(0, 75*0.5, 150);
	//this._relativePos	= new THREE.Vector3(0, 600, 10);
	//this._relativePos	= new THREE.Vector3(0, 1.5*Marble.tileSize/2, 0);
	
	scene.add( this._object );
}

Marble.Camera.prototype.object	= function()
{
	return this._object;
}

Marble.Camera.prototype.tick	= function()
{
	var camera	= this._object;
	var player	= gameLevel.player();

	// Cross-version safe vector addition for camera offset
	var targetPos = new THREE.Vector3();
	if (typeof targetPos.copy === 'function') {
		targetPos.copy(player.mesh().position);
	} else {
		targetPos.set(player.mesh().position.x, player.mesh().position.y, player.mesh().position.z);
	}
	if (typeof targetPos.addVectors === 'function') {
		// Newer three.js
		targetPos.addVectors(player.mesh().position, this._relativePos);
	} else if (typeof targetPos.add === 'function') {
		// Older API: add(v) or add(a,b)
		if (targetPos.add.length >= 2) {
			// add(a,b) signature
			targetPos.add(player.mesh().position, this._relativePos);
		} else {
			// add(v) signature; already copied player pos
			targetPos.add(this._relativePos);
		}
	} else if (typeof targetPos.addSelf === 'function') {
		// Very old API
		targetPos.addSelf(this._relativePos);
	} else {
		// Fallback manual sum
		targetPos.x = player.mesh().position.x + this._relativePos.x;
		targetPos.y = player.mesh().position.y + this._relativePos.y;
		targetPos.z = player.mesh().position.z + this._relativePos.z;
	}
	if (typeof camera.position.copy === 'function') {
		camera.position.copy(targetPos);
	} else {
		camera.position = targetPos;
	}
	camera.lookAt( player.mesh().position );

	if( player.fpsControl().isActivated() ){
		camera.position.copy( player.mesh().position );
		camera.position.y	+= Marble.tileSize/2;
	
		var direction	= player.fpsControl().angleY();
		var target	= camera.position.clone();
		target.x	+= Math.cos(direction);
		target.z	+= Math.sin(direction);
		camera.lookAt( target );
	}
}

