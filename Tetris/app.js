document.addEventListener('DOMContentLoaded', () => {
	const canvas           = document.getElementById('tetris');
	const nextPieceCanvas  = document.getElementById('nextPiece');
	const nextPieceContext = nextPieceCanvas.getContext('2d');
	const mainGameContext  = canvas.getContext('2d');
	const score            = document.getElementById('score');
	const borderWidth      = 0.1;
	let lastTimestamp      = 0;
	let dropCounter        = 0;
	let dropInterval       = 1000;
	
	// Audio system
	const sounds = {
		rotate: document.getElementById('audio-rotate'),
		drop: document.getElementById('audio-drop'),
		line: document.getElementById('audio-line'),
		crash: document.getElementById('audio-crash'),
		pause: document.getElementById('audio-pause'),
		end: document.getElementById('audio-end')
	};
	
	// Continuous movement system
	let isDownPressed = false;
	let downInterval = null;
	
	// Game state
	let gameOver = false;
	
	// Audio helper functions
	const initAudio = () => {
		Object.values(sounds).forEach(sound => {
			if (sound) {
				sound.volume = 0.3;
				sound.preload = 'auto';
			}
		});
		
		// Set specific volumes
		if (sounds.rotate) sounds.rotate.volume = 0.2;
		if (sounds.drop) sounds.drop.volume = 0.4;
		if (sounds.line) sounds.line.volume = 0.5;
		if (sounds.crash) sounds.crash.volume = 0.6;
		if (sounds.end) sounds.end.volume = 0.5;
	};
	
	const playSound = (soundName) => {
		try {
			const sound = sounds[soundName];
			if (sound) {
				sound.currentTime = 0;
				sound.play().catch(e => console.log('Audio play failed:', e));
			}
		} catch (error) {
			console.log('Audio error:', error);
		}
	};
	const controls         = {
		ArrowDown : 'ArrowDown',
		ArrowLeft : 'ArrowLeft',
		ArrowRight: 'ArrowRight',
		a         : 'a',
		A         : 'A',
		d         : 'd',
		D         : 'D',
		s         : 's',
		S         : 'S',
		q         : 'q',
		Q         : 'Q',
		e         : 'e',
		E         : 'E',
	};
	const pieces           = { T: 'T', L: 'L', O: 'O', S: 'S', I: 'I', J: 'J', Z: 'Z' };
	const colorMap         = {
		0: { base: '#2f2f2f' },
		1: { base: '#dc4200', gradientStart: '#ffdd59', border: '#ffebcd' },
		2: { base: '#a80600', gradientStart: '#ff5e57', border: '#ffd8d6' },
		3: { base: '#0023bd', gradientStart: '#8c9fff', border: '#d9e2ff' },
		4: { base: '#008545', gradientStart: '#0be881', border: '#d0fae6' },
		5: { base: '#281b69', gradientStart: '#786fa6', border: '#cfc8ef' },
		6: { base: '#a60036', gradientStart: '#f8a5c2', border: '#f8d8e1' },
		7: { base: '#005879', gradientStart: '#4bcffa', border: '#e5f5fc' },
	};
	const pieceString      = 'TLOSIJZ';
	let nextPiece          = {
		pos   : { x: 0, y: 0 },
		matrix: [],
	};
	const player           = {
		pos   : { x: 0, y: 0 },
		matrix: [],
		score : 0,
		type  : null,
		rotation: 0,
		level : 1,
		lines : 0,
	};
	
	const getRandomPiece = () => {
		const type = pieceString[Math.floor(Math.random() * pieceString.length)];
		return { type, matrix: createPiece(type) };
	};
	
	const merge = (arena, player) => {
		player.matrix.forEach((row, y) => {
			row.forEach((value, x) => {
				if (value !== 0) {
					console.log(player);
					arena[y + player.pos.y][x + player.pos.x] = value;
				}
			});
		});
	};
	
	const collide = (arena, player) => {
		const { pos, matrix } = player;
		for (let row = 0; row < matrix.length; row++) {
			for (let col = 0; col < matrix[row].length; col++) {
				if (matrix[row][col] !== 0) {
					const newX = pos.x + col;
					const newY = pos.y + row;
					
					// Check boundaries - enhanced boundary checking like reference game
					if (newX < 0 || newX >= arena[0].length || newY >= arena.length) {
						return true;
					}
					
					// Check collision with existing blocks (allow pieces above board)
					if (newY >= 0 && arena[newY] && arena[newY][newX] !== 0) {
						return true;
					}
				}
			}
		}
		return false;
	};
	
	const draw = () => {
		mainGameContext.fillStyle = colorMap[0].base;
		mainGameContext.fillRect(0, 0, canvas.width, canvas.height);
		
		nextPieceContext.fillStyle = colorMap[0].base;
		nextPieceContext.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
		
		drawMatrix(mainGameContext, arena, { x: 0, y: 0 });
		drawMatrix(mainGameContext, player.matrix, player.pos);
		
		nextPieceArena = createMatrix(6, 6);
		drawMatrix(nextPieceContext, nextPieceArena, { x: 0, y: 0 });
		drawMatrix(nextPieceContext, nextPiece.matrix, nextPiece.pos);
	};
	
	const createMatrix = (width, height) => {
		const matrix = [];
		while (height--) {
			matrix.push(new Array(width).fill(0));
		}
		return matrix;
	};
	
	const drawMatrix = (context, matrix, pos) => {
		matrix.forEach((row, y) => {
			row.forEach((value, x) => {
				if (value !== 0) {
					const gradient = context.createLinearGradient(
						x + pos.x + borderWidth, y + pos.y + borderWidth,
						x + pos.x + (1 - borderWidth), y + pos.y + (1 - borderWidth),
					);
					gradient.addColorStop(0, colorMap[value].gradientStart);
					gradient.addColorStop(1, colorMap[value].base);
					context.fillStyle   = gradient;
					context.strokeStyle = colorMap[value].border;
					context.lineWidth   = borderWidth;
					context.strokeRect(x + pos.x, y + pos.y, 1, 1);
					context.fill('evenodd');
					context.fillRect(
						x + pos.x + borderWidth / 2, y + pos.y + borderWidth / 2,
						1 - borderWidth, 1 - borderWidth,
					);
				}
			});
		});
	};
	
	// Tetromino definitions with all rotations (like reference game)
	const tetrominoes = {
		T: {
			shapes: [
				[[0, 0, 0], [1, 1, 1], [0, 1, 0]],
				[[0, 1, 0], [1, 1, 0], [0, 1, 0]],
				[[0, 1, 0], [1, 1, 1], [0, 0, 0]],
				[[0, 1, 0], [0, 1, 1], [0, 1, 0]]
			]
		},
		L: {
			shapes: [
				[[0, 0, 2], [2, 2, 2], [0, 0, 0]],
				[[0, 2, 0], [0, 2, 0], [0, 2, 2]],
				[[0, 0, 0], [2, 2, 2], [2, 0, 0]],
				[[2, 2, 0], [0, 2, 0], [0, 2, 0]]
			]
		},
		O: {
			shapes: [
				[[3, 3], [3, 3]]
			]
		},
		S: {
			shapes: [
				[[0, 4, 4], [4, 4, 0], [0, 0, 0]],
				[[0, 4, 0], [0, 4, 4], [0, 0, 4]]
			]
		},
		I: {
			shapes: [
				[[0, 0, 0, 0], [5, 5, 5, 5], [0, 0, 0, 0], [0, 0, 0, 0]],
				[[0, 0, 5, 0], [0, 0, 5, 0], [0, 0, 5, 0], [0, 0, 5, 0]]
			]
		},
		J: {
			shapes: [
				[[6, 0, 0], [6, 6, 6], [0, 0, 0]],
				[[0, 6, 6], [0, 6, 0], [0, 6, 0]],
				[[0, 0, 0], [6, 6, 6], [0, 0, 6]],
				[[0, 6, 0], [0, 6, 0], [6, 6, 0]]
			]
		},
		Z: {
			shapes: [
				[[7, 7, 0], [0, 7, 7], [0, 0, 0]],
				[[0, 0, 7], [0, 7, 7], [0, 7, 0]]
			]
		}
	};

	const createPiece = type => {
		const pieceData = tetrominoes[type];
		if (pieceData && pieceData.shapes && pieceData.shapes.length > 0) {
			return pieceData.shapes[0]; // Return first rotation
		}
		return null;
	};
	
	const play = (timestamp = 0) => {
		if (gameOver) return; // Stop game loop when game is over
		
		const elapsed = timestamp - lastTimestamp;
		lastTimestamp = timestamp;
		dropCounter += elapsed;
		if (dropCounter > dropInterval) {
			playerDrop();
		}
		draw();
		requestAnimationFrame(play);
	};
	
	const playerMove = (direction) => {
		player.pos.x += direction;
		if (collide(arena, player) === true) {
			player.pos.x -= direction;
		}
	};
	
	const playerDrop = () => {
		player.pos.y++;
		if (collide(arena, player) === true) {
			player.pos.y--;
			playSound('drop');
			merge(arena, player);
			playerReset();
			arenaSweep();
			updateScore();
			drawNextPiece();
		}
		dropCounter = 0;
	};
	
	// Enhanced down movement functions
	let downTimeout = null;
	
	const startDownMovement = () => {
		if (isDownPressed) return;
		isDownPressed = true;
		
		// First immediate drop on click
		playerDrop();
		
		// Start continuous movement after a short delay (hold detection)
		downTimeout = setTimeout(() => {
			if (isDownPressed) {
				downInterval = setInterval(() => {
					if (isDownPressed) {
						playerDrop();
					}
				}, 50); // Fast continuous drop when holding
			}
		}, 200); // 200ms delay before continuous movement starts
	};
	
	const stopDownMovement = () => {
		isDownPressed = false;
		
		// Clear the timeout for hold detection
		if (downTimeout) {
			clearTimeout(downTimeout);
			downTimeout = null;
		}
		
		// Clear the continuous movement interval
		if (downInterval) {
			clearInterval(downInterval);
			downInterval = null;
		}
	};
	
	const playerRotate = direction => {
		if (!player.type) return false;
		
		const pieceData = tetrominoes[player.type];
		if (!pieceData || !pieceData.shapes) return false;
		
		const currentRotation = player.rotation;
		const nextRotation = direction > 0 
			? (currentRotation + 1) % pieceData.shapes.length
			: (currentRotation - 1 + pieceData.shapes.length) % pieceData.shapes.length;
		
		const rotatedShape = pieceData.shapes[nextRotation];
		if (!rotatedShape) return false;
		
		// Store original state
		const originalMatrix = player.matrix;
		const originalX = player.pos.x;
		const originalY = player.pos.y;
		
		// Try basic rotation first
		player.matrix = rotatedShape;
		if (!collide(arena, player)) {
			player.rotation = nextRotation;
			playSound('rotate');
			console.log(`${player.type} piece rotated to state ${nextRotation}/${pieceData.shapes.length - 1}`);
			return true;
		}
		
		// Enhanced wall kick attempts - same as reference game
		const kicks = [[-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0], [-1, -1], [1, -1]];
		
		for (const kick of kicks) {
			player.pos.x = originalX + kick[0];
			player.pos.y = originalY + kick[1];
			
			if (!collide(arena, player)) {
				player.rotation = nextRotation;
				playSound('rotate');
				console.log(`${player.type} piece rotated to state ${nextRotation}/${pieceData.shapes.length - 1} (with wall kick)`);
				return true;
			}
		}
		
		// Rotation failed, restore original state
		player.matrix = originalMatrix;
		player.pos.x = originalX;
		player.pos.y = originalY;
		return false;
	};
	
	const nextPiecePos = () => {
		return {
			x: Math.floor(nextPieceArena[0].length / 2) - Math.floor(nextPiece.matrix[0].length / 2),
			y: Math.floor(nextPieceArena.length / 2) - Math.floor(nextPiece.matrix.length / 2),
		};
	};
	
	const playerReset = () => {
		const piece = nextPiece.matrix ? nextPiece : getRandomPiece();
		player.matrix = piece.matrix;
		player.type = piece.type;
		player.rotation = 0;
		player.pos = {
			x: Math.floor(arena[0].length / 2) - Math.floor(player.matrix[0].length / 2),
			y: 0,
		};
		
		const newPiece = getRandomPiece();
		nextPiece.matrix = newPiece.matrix;
		nextPiece.type = newPiece.type;
		nextPiece.pos = nextPiecePos();
		
		if (collide(arena, player) === true) {
			triggerGameOver();
		}
	};
	
	
	const arenaSweep = () => {
		let rowCount = 1;
		let linesCleared = 0;
		outer :for (let y = arena.length - 1; y > 0; y--) {
			for (let x = 0; x < arena[y].length; x++) {
				if (arena[y][x] === 0) {
					continue outer;
				}
			}
			arena.unshift(arena.splice(y, 1)[0].fill(0));
			y++;
			linesCleared++;
			player.score += rowCount * 10 * player.level; // Level multiplier for score
			rowCount *= 2;
		}
		
		if (linesCleared > 0) {
			player.lines += linesCleared;
			playSound('line');
			updateLevel();
			console.log(`Lines cleared: ${linesCleared}, Total lines: ${player.lines}`);
		}
	};
	
	const updateScore = () => {
		score.innerText = player.score;
		document.getElementById('level').innerText = player.level;
	};
	
	const updateLevel = () => {
		const newLevel = Math.floor(player.lines / 10) + 1;
		if (newLevel !== player.level) {
			player.level = newLevel;
			// Increase speed with each level - faster drop interval
			dropInterval = Math.max(50, 1000 - (player.level - 1) * 100);
			console.log(`Level up! Level ${player.level}, Speed: ${dropInterval}ms`);
		}
	};
	
	const triggerGameOver = () => {
		gameOver = true;
		playSound('end');
		
		// Stop any continuous movement
		stopDownMovement();
		
		// Show blur overlay with final score
		const overlay = document.getElementById('game-over-overlay');
		const finalScore = document.getElementById('final-score');
		
		finalScore.textContent = `Score: ${player.score}`;
		overlay.style.display = 'flex';
		
		// Send message to parent window immediately after showing overlay
		setTimeout(() => {
			console.log('Sending GAME_OVER message to parent:', { type: "GAME_OVER", score: player.score });
			window.parent.postMessage({ type: "GAME_OVER", score: player.score }, "*");
		}, 100); // Small delay to ensure overlay is visible
	};
	
	const onKeyDown = evt => {
		if (gameOver) return; // Prevent controls when game is over
		evt.preventDefault();
		switch (evt.key) {
			case controls.ArrowRight:
			case controls.D:
			case controls.d:
				playerMove(1);
				break;
			case controls.ArrowLeft:
			case controls.a:
			case controls.A:
				playerMove(-1);
				break;
			case controls.ArrowDown:
			case controls.s:
			case controls.S:
				startDownMovement();
				break;
			case controls.q:
			case controls.Q:
				playerRotate(-1);
				break;
			case controls.e:
			case controls.E:
				playerRotate(1);
				break;
		}
	};
	
	const onKeyUp = evt => {
		switch (evt.key) {
			case controls.ArrowDown:
			case controls.s:
			case controls.S:
				stopDownMovement();
				break;
		}
	};
	
	const drawNextPiece = () => {
		merge(nextPieceArena, nextPiece);
	};
	
	// Touch control setup for mobile
	const setupTouchControls = () => {
		const moveLeftBtn = document.getElementById('move-left');
		const moveRightBtn = document.getElementById('move-right');
		const moveDownBtn = document.getElementById('move-down');
		const rotateLeftBtn = document.getElementById('rotate-left');
		const rotateRightBtn = document.getElementById('rotate-right');
		
		// Simplified button setup for reliable functionality
		const setupButton = (button, action) => {
			if (!button) {
				console.log('Button not found!');
				return;
			}
			
			console.log('Setting up button:', button.id);
			
			// Apply touch styling
			button.style.touchAction = 'manipulation';
			button.style.userSelect = 'none';
			button.style.webkitUserSelect = 'none';
			button.style.webkitTouchCallout = 'none';
			
			const handleAction = (e) => {
				e.preventDefault();
				e.stopPropagation();
				console.log('Button clicked:', button.id);
				action();
			};
			
			// Simplified event listeners - focus on what works
			button.addEventListener('click', handleAction, { passive: false });
			button.addEventListener('touchstart', handleAction, { passive: false, capture: true });
			button.addEventListener('mousedown', handleAction, { passive: false });
		};
		
		setupButton(moveLeftBtn, () => {
			if (!gameOver) playerMove(-1);
		});
		setupButton(moveRightBtn, () => {
			if (!gameOver) playerMove(1);
		});
		
		// Special setup for down button with hold functionality
		if (moveDownBtn) {
			moveDownBtn.style.touchAction = 'manipulation';
			moveDownBtn.style.userSelect = 'none';
			
			const startDown = (e) => {
				e.preventDefault();
				e.stopPropagation();
				if (!gameOver) {
					console.log('Down button pressed - starting movement');
					startDownMovement();
				}
			};
			
			const stopDown = (e) => {
				e.preventDefault();
				e.stopPropagation();
				console.log('Down button released - stopping movement');
				stopDownMovement();
			};
			
			// Touch events for hold functionality
			moveDownBtn.addEventListener('touchstart', startDown, { passive: false, capture: true });
			moveDownBtn.addEventListener('touchend', stopDown, { passive: false, capture: true });
			moveDownBtn.addEventListener('touchcancel', stopDown, { passive: false, capture: true });
			
			// Mouse events for desktop
			moveDownBtn.addEventListener('mousedown', startDown, { passive: false });
			moveDownBtn.addEventListener('mouseup', stopDown, { passive: false });
			moveDownBtn.addEventListener('mouseleave', stopDown, { passive: false });
		}
		
		// Left rotation button - exact functionality of Q key
		setupButton(rotateLeftBtn, () => {
			if (!gameOver) {
				console.log('Left rotation button pressed - calling playerRotate(-1)');
				playerRotate(-1);
			}
		});
		
		// Right rotation button - exact functionality of E key
		setupButton(rotateRightBtn, () => {
			if (!gameOver) {
				console.log('Right rotation button pressed - calling playerRotate(1)');
				playerRotate(1);
			}
		});
	};
	
	// Prevent canvas touch interference
	const preventCanvasTouch = () => {
		[canvas, nextPieceCanvas].forEach(canvasElement => {
			canvasElement.addEventListener('touchstart', (e) => {
				e.preventDefault();
				e.stopPropagation();
			}, { passive: false, capture: true });
			
			canvasElement.addEventListener('touchmove', (e) => {
				e.preventDefault();
				e.stopPropagation();
			}, { passive: false, capture: true });
			
			canvasElement.addEventListener('touchend', (e) => {
				e.preventDefault();
				e.stopPropagation();
			}, { passive: false, capture: true });
		});
	};
	
	window.addEventListener('keydown', onKeyDown);
	window.addEventListener('keyup', onKeyUp);
	
	// Initialize audio system
	initAudio();
	
	// Initialize touch controls for mobile
	setupTouchControls();
	preventCanvasTouch();
	
	mainGameContext.scale(20, 20);
	nextPieceContext.scale(20, 20);
	
	const arena        = createMatrix(12, 20);
	let nextPieceArena = createMatrix(8, 8);
	
	const initialPiece = getRandomPiece();
	player.matrix = initialPiece.matrix;
	player.type = initialPiece.type;
	player.rotation = 0;
	
	const initialNextPiece = getRandomPiece();
	nextPiece.matrix = initialNextPiece.matrix;
	nextPiece.type = initialNextPiece.type;
	nextPiece.pos = nextPiecePos();
	
	drawNextPiece();
	
	play();
});