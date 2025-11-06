(function () {

	var canvas, ctx, tileSize = 30, bombCount = 40, board;

	var url_image = 'assets/img/minesweeper_graphs.png', content = document.getElementById('mineSweeper');

	var graphs = {};

	const resetButton = document.getElementById('resetGame');
	
	// Touch controls variables
	let touchStartTime = 0;
	let touchTimer = null;
	let lastTapTime = 0;
	let isLongPress = false;
	
	// Game timer and score variables
	let gameTimer = null;
	let timeRemaining = 120; // 2 minutes in seconds
	let currentScore = 0;
	let gridsCompleted = 0;
	let gameStarted = false;
	let gameEnded = false;
	const timerElement = document.getElementById('timer');
	const scoreElement = document.getElementById('score');
	const timerContainer = document.querySelector('.stat-item.timer');


	function createCanvas (w, h) {
		canvas = document.createElement('canvas');
		
		// Make canvas responsive
		const containerSize = Math.min(content.clientWidth, content.clientHeight);
		canvas.width  = containerSize;
		canvas.height = containerSize;
		tileSize = containerSize / 16; // Adjust tile size based on container
		
		canvas.textContent = 'Canvas not supported';

		content.appendChild(canvas);

		Sprite.prototype.canvasContext = ctx = canvas.getContext('2d');

		createSprites();

		board = fillBoard(16, 16);

		resetButton.addEventListener('click', _ => {
			board = fillBoard(16, 16);
			resetTimer();
			currentScore = 0;
			gridsCompleted = 0;
			scoreElement.textContent = currentScore;
			content.classList.remove('grid-complete');
			document.body.classList.remove('game-over');
		});

		// Mouse events
		canvas.addEventListener('click', onClickGame, false);
		canvas.addEventListener('dblclick', onDoubleClick, false);
		canvas.addEventListener('contextmenu', onRightClickGame, false);

		// Touch events
		canvas.addEventListener('touchstart', onTouchStart, { passive: false });
		canvas.addEventListener('touchend', onTouchEnd, { passive: false });
		canvas.addEventListener('touchmove', onTouchMove, { passive: false });
		
		// Handle window resize
		window.addEventListener('resize', handleResize);

		update();
	}
	
	function handleResize() {
		const containerSize = Math.min(content.clientWidth, content.clientHeight);
		canvas.width  = containerSize;
		canvas.height = containerSize;
		tileSize = containerSize / 16;
	}
	
	// Timer functions
	function startGameTimer() {
		if (gameStarted || gameEnded) return;
		gameStarted = true;
		
		gameTimer = setInterval(() => {
			if (gameEnded) {
				clearInterval(gameTimer);
				return;
			}
			
			timeRemaining--;
			updateTimerDisplay();
			
			// Warning at 30 seconds
			if (timeRemaining <= 30 && timeRemaining > 10) {
				timerContainer.classList.add('warning');
				timerContainer.classList.remove('danger');
			}
			// Danger at 10 seconds
			else if (timeRemaining <= 10) {
				timerContainer.classList.add('danger');
				timerContainer.classList.remove('warning');
			}
			
			// Time's up
			if (timeRemaining <= 0) {
				endGame();
			}
		}, 1000);
	}
	
	function updateTimerDisplay() {
		const minutes = Math.floor(timeRemaining / 60);
		const seconds = timeRemaining % 60;
		timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}
	
	function updateScore(points) {
		currentScore += points;
		scoreElement.textContent = currentScore;
	}
	
	function resetTimer() {
		if (gameTimer) {
			clearInterval(gameTimer);
		}
		timeRemaining = 120;
		gameStarted = false;
		gameEnded = false;
		updateTimerDisplay();
		timerContainer.classList.remove('warning', 'danger');
	}
	
	function endGame(reason = 'timeout') {
		gameEnded = true;
		clearInterval(gameTimer);
		
		// Blur the screen
		document.body.classList.add('game-over');
		
		// Send game over message to parent
		setTimeout(() => {
			window.parent.postMessage({ 
				type: "GAME_OVER", 
				score: currentScore 
			}, "*");
		}, 500);
	}



	function random (min = 0, max) {
		const args_len = arguments.length;

		return args_len < 2
			? Math.floor(Math.random() * min)
			: Math.floor(Math.random() * (max - min + 1) + min);
	}



	function createSprites () {
		graphs.covered   = new Sprite(image, 0, 0, 24, 24);
		graphs.emptyCell = new Sprite(image, 24, 0, 24, 24);
		graphs.bombFlag  = new Sprite(image, 48, 0, 24, 24);
		graphs.noBomb    = new Sprite(image, 72, 0, 24, 24);
		graphs.suspect   = new Sprite(image, 96, 0, 24, 24);
		graphs.hasBomb   = new Sprite(image, 120, 0, 24, 24);
		graphs.detonated = new Sprite(image, 144, 0, 24, 24);

		graphs.numbers = {};

		for (var n = 1, total = 8, starting = 168; n <= total; n++, starting += 24) {
			graphs.numbers['number' + n] = new Sprite(image, starting, 0, 24, 24);
		};
	}


	function fillBoard (w, h) {
		const matrix = Array.from({ length: h }, (col, y) => {
			return Array.from({ length: w }, (row, x) => {
				return new Cell(x, y, tileSize);
			});
		});

		return placeBombs(matrix);
	}


	
	function freeOptions (matrix) {
		var options = [];

		for (var i = 0, lenI = matrix.length; i < lenI; i++) {
			for (var j = 0, lenJ = matrix[i].length; j < lenJ; j++) {
				if (matrix[i][j].neighborsCount !== -1) {
					options.push([i, j]);
				}
			}
		}

		return options;
	}



	function placeBombs (matrix) {
		var options = freeOptions(matrix);

		while (bombCount > countBombs(matrix)) {
			var index = random(options.length), choice = options.splice(index, 1)[0];

			var cell = matrix[choice[0]][choice[1]];

			if (cell.neighborsCount === 0) {
				cell.neighborsCount = -1;
				cell.detonated = false;
			}
		}

		return placeIndicators(matrix);
	}


	function placeIndicators (matrix) {
		matrix.forEach((row, y) => {
			row.forEach((cell, x) => {
				if (cell.neighborsCount === -1) return;
				for (var i = -1, indicator = 0; i <= 1; i++) {
					if (!matrix[y + i]) continue;
					for (var j = -1; j <= 1; j++) {
						var neighborCell = matrix[y + i][x + j];
						if (!neighborCell || !i && !j) continue;
						if (neighborCell.neighborsCount === -1) {
							indicator++;
						}
					}
				}

				cell.neighborsCount = indicator;
			});
		});

		return matrix;
	}



	function countBombs (matrix) {		
		return matrix.reduce((acc, cur) => acc + cur.filter(cell => cell.neighborsCount < 0).length, 0);
	}


	function clearCanvas (newColor = '#fff') {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		drawRect(0, 0, canvas.width, canvas.height, newColor);
	}


	function drawRect (x, y, w, h, color) {
		ctx.fillStyle = color;
		ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
	}


	function draw () {
		clearCanvas();

		board.forEach(row => {
			row.forEach(cell => cell.draw(graphs, tileSize));
		});
	}


	function isFirstMove () {
		return !board.some(row => row.some(cell => !cell.covered));
	}

	function allClearedExceptBombs () {
		const coveredCells = board.length * board[0].length;

		const currentDiscovered = board.reduce((acc, cur) => acc + cur.filter(cell => cell.neighborsCount !== -1 && !cell.covered).length, 0);

		return coveredCells - bombCount === currentDiscovered;
	}


	function noBombDetonated () {
		return !board.some(row => row.some(cell => cell.detonated));
	}


	function getSelectedCell (posX, posY) {
		for (var y = 0, lenY = board.length; y < lenY; y++) {
			if (!(posY >= y * tileSize && posY <= y * tileSize + tileSize)) continue;
			for (var x = 0, lenX = board[y].length; x < lenX; x++) {
				if (posX >= x * tileSize && posX <= x * tileSize + tileSize) {
					return board[y][x];
				}
			}
		}
	}



	function ensureSafeStart (_el, x, y) {
		while (_el.neighborsCount === -1 && isFirstMove()) {
			board = fillBoard(16, 16);

			_el = getSelectedCell(x, y);
		}

		return _el;
	}



	function revealBombs (matrix, el) {
		matrix.forEach(row => {
			row.forEach(cell => {
				if (cell.neighborsCount === -1 && cell.flag) return;
				if (cell.neighborsCount === -1 && !cell.flag) {
					cell.covered = false;
					cell.detonated = (cell === el); // This cell was detonated
				}
				if (cell.neighborsCount >= 0 && cell.flag) {
					cell.covered = false;
				}
			});
		});
	}



	function checkVictory () {
		if (allClearedExceptBombs() && !gameEnded) {
			// Calculate bonus points based on time remaining
			const timeBonus = Math.floor(timeRemaining * 10);
			const completionBonus = 500;
			const totalBonus = completionBonus + timeBonus;
			
			gridsCompleted++;
			updateScore(totalBonus);
			
			// Show completion animation
			content.classList.add('grid-complete');
			
			setTimeout(function () {
				content.classList.remove('grid-complete');
				
				// Load new grid
				board = fillBoard(16, 16);
			}, 1000);
		}
	}



	function onClickGame (event) {
		event.preventDefault();
		
		if (gameEnded) return;
		
		// Start timer on first click
		if (!gameStarted) {
			startGameTimer();
		}
		
		var mouseX = (event.pageX || event.clientX) - content.offsetLeft;
		var mouseY = (event.pageY || event.clientY) - content.offsetTop;

		var _el = ensureSafeStart(getSelectedCell(mouseX, mouseY), mouseX, mouseY);

		if (_el.covered && !_el.flag && !_el.suspect && noBombDetonated() && !allClearedExceptBombs()) {
			if (_el.neighborsCount === -1) {
				revealBombs(board, _el);
				endGame('mine');
				return;
			}

			_el.revealIt(board);
			
			// Award points for revealing cells
			updateScore(10);

			checkVictory();
		}
	}



	function onDoubleClick (event) {
		event.preventDefault();
		
		if (gameEnded) return;
		
		var mouseX = (event.clientX || event.pageX) - content.offsetLeft;
		var mouseY = (event.clientY || event.pageY) - content.offsetTop;

		var _el = getSelectedCell(mouseX, mouseY);

		if (!_el.covered && !_el.flag && !_el.suspect && noBombDetonated() && !allClearedExceptBombs()) {
			for (var y = -1, howMany = 0; y <= 1; y++) {
				if (!board[_el.y + y]) continue;
				for (var x = -1; x <= 1; x++) {
					var neighborCell = board[_el.y + y][_el.x + x];
					if (!neighborCell || !y && !x) continue;
					if (neighborCell.flag === 'bombFlag') howMany++;
				}
			}

			if (howMany === _el.neighborsCount) {
				clearAround(_el, board);
				
				checkVictory();
			}

		}
	}



	function clearAround (el, matrix) {
		for (var i = -1; i <= 1; i++) {
			if (!matrix[el.y + i]) continue;
			for (var j = -1; j <= 1; j++) {
				var neighbor = matrix[el.y + i][el.x + j];
				if (!neighbor || neighbor.flag === 'bombFlag') continue;
				if (neighbor.neighborsCount === -1) {
					return revealBombs(matrix, neighbor);
				}

				neighbor.revealIt(matrix);
			}
		}
	}



	function onRightClickGame (event) {
		event.preventDefault();
		var mouseX = (event.clientX || event.pageX) - content.offsetLeft;
		var mouseY = (event.clientY || event.pageY) - content.offsetTop;

		var _el = getSelectedCell(mouseX, mouseY);

		if (_el.covered && noBombDetonated() && !allClearedExceptBombs()) {
			_el.flag = !_el.flag ? 'bombFlag' : (_el.flag === 'bombFlag') ? 'suspect' : null;
		}
	}


	// Touch event handlers
	function getTouchPosition(touch) {
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		
		return {
			x: (touch.clientX - rect.left) * scaleX,
			y: (touch.clientY - rect.top) * scaleY
		};
	}

	function onTouchStart(event) {
		event.preventDefault();
		
		if (event.touches.length !== 1) return;
		
		const touch = event.touches[0];
		const pos = getTouchPosition(touch);
		
		touchStartTime = Date.now();
		isLongPress = false;
		
		// Long press for flag (500ms)
		touchTimer = setTimeout(() => {
			isLongPress = true;
			handleLongPress(pos.x, pos.y);
		}, 500);
	}

	function onTouchMove(event) {
		event.preventDefault();
		
		// Cancel long press if user moves finger
		if (touchTimer) {
			clearTimeout(touchTimer);
			touchTimer = null;
		}
	}

	function onTouchEnd(event) {
		event.preventDefault();
		
		if (touchTimer) {
			clearTimeout(touchTimer);
			touchTimer = null;
		}
		
		if (isLongPress) {
			isLongPress = false;
			return;
		}
		
		const touch = event.changedTouches[0];
		const pos = getTouchPosition(touch);
		const currentTime = Date.now();
		const timeSinceLastTap = currentTime - lastTapTime;
		
		// Double tap detection (within 300ms)
		if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
			handleDoubleTap(pos.x, pos.y);
			lastTapTime = 0;
		} else {
			// Single tap - reveal cell
			handleSingleTap(pos.x, pos.y);
			lastTapTime = currentTime;
		}
	}

	function handleSingleTap(x, y) {
		if (gameEnded) return;
		
		// Start timer on first tap
		if (!gameStarted) {
			startGameTimer();
		}
		
		var _el = ensureSafeStart(getSelectedCell(x, y), x, y);

		if (_el.covered && !_el.flag && !_el.suspect && noBombDetonated() && !allClearedExceptBombs()) {
			if (_el.neighborsCount === -1) {
				revealBombs(board, _el);
				endGame('mine');
				return;
			}

			_el.revealIt(board);
			updateScore(10);
			checkVictory();
		}
	}

	function handleLongPress(x, y) {
		var _el = getSelectedCell(x, y);

		if (_el && _el.covered && noBombDetonated() && !allClearedExceptBombs()) {
			_el.flag = !_el.flag ? 'bombFlag' : (_el.flag === 'bombFlag') ? 'suspect' : null;
			
			// Haptic feedback for mobile devices
			if (navigator.vibrate) {
				navigator.vibrate(50);
			}
		}
	}

	function handleDoubleTap(x, y) {
		if (gameEnded) return;
		
		var _el = getSelectedCell(x, y);

		if (_el && !_el.covered && !_el.flag && !_el.suspect && noBombDetonated() && !allClearedExceptBombs()) {
			var howMany = 0;
			
			for (var yOffset = -1; yOffset <= 1; yOffset++) {
				if (!board[_el.y + yOffset]) continue;
				for (var xOffset = -1; xOffset <= 1; xOffset++) {
					var neighborCell = board[_el.y + yOffset][_el.x + xOffset];
					if (!neighborCell || !yOffset && !xOffset) continue;
					if (neighborCell.flag === 'bombFlag') howMany++;
				}
			}

			if (howMany === _el.neighborsCount) {
				clearAround(_el, board);
				checkVictory();
			}
		}
	}


	function update (time = 0) {
		draw();

		requestAnimationFrame(update, canvas);
	}



	var image = new Image();
	image.src = url_image;
	image.onload = function () {
		// createSprites();
		createCanvas(480, 480);
	}
} ());
