console.clear();
var Stage = /** @class */ (function () {
  function Stage() {
    // container
    var _this = this;
    this.render = function () {
      this.renderer.render(this.scene, this.camera);
    };
    this.add = function (elem) {
      this.scene.add(elem);
    };
    this.remove = function (elem) {
      this.scene.remove(elem);
    };
    this.container = document.getElementById("game");
    // renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor("#D0CBC7", 1);
    this.container.appendChild(this.renderer.domElement);
    // scene
    this.scene = new THREE.Scene();
    // camera
    var aspect = window.innerWidth / window.innerHeight;
    var d = 20;
    this.camera = new THREE.OrthographicCamera(
      -d * aspect,
      d * aspect,
      d,
      -d,
      -100,
      1000
    );
    this.camera.position.x = 2;
    this.camera.position.y = 2;
    this.camera.position.z = 2;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    //light
    this.light = new THREE.DirectionalLight(0xffffff, 0.5);
    this.light.position.set(0, 499, 0);
    this.scene.add(this.light);
    this.softLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.softLight);
    window.addEventListener("resize", function () {
      return _this.onResize();
    });
    this.onResize();
  }
  Stage.prototype.setCamera = function (y, speed) {
    if (speed === void 0) {
      speed = 0.3;
    }
    TweenLite.to(this.camera.position, speed, {
      y: y + 4,
      ease: Power1.easeInOut,
    });
    TweenLite.to(this.camera.lookAt, speed, { y: y, ease: Power1.easeInOut });
  };
  Stage.prototype.onResize = function () {
    var viewSize = 30;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.left = window.innerWidth / -viewSize;
    this.camera.right = window.innerWidth / viewSize;
    this.camera.top = window.innerHeight / viewSize;
    this.camera.bottom = window.innerHeight / -viewSize;
    this.camera.updateProjectionMatrix();
  };
  return Stage;
})();
var Block = /** @class */ (function () {
  function Block(block) {
    // set size and position
    this.STATES = { ACTIVE: "active", STOPPED: "stopped", MISSED: "missed" };
    this.MOVE_AMOUNT = 12;
    this.dimension = { width: 0, height: 0, depth: 0 };
    this.position = { x: 0, y: 0, z: 0 };
    this.targetBlock = block;
    this.index = (this.targetBlock ? this.targetBlock.index : 0) + 1;
    this.workingPlane = this.index % 2 ? "x" : "z";
    this.workingDimension = this.index % 2 ? "width" : "depth";
    // set the dimensions from the target block, or defaults.
    this.dimension.width = this.targetBlock
      ? this.targetBlock.dimension.width
      : 10;
    this.dimension.height = this.targetBlock
      ? this.targetBlock.dimension.height
      : 2;
    this.dimension.depth = this.targetBlock
      ? this.targetBlock.dimension.depth
      : 10;
    this.position.x = this.targetBlock ? this.targetBlock.position.x : 0;
    this.position.y = this.dimension.height * this.index;
    this.position.z = this.targetBlock ? this.targetBlock.position.z : 0;
    this.colorOffset = this.targetBlock
      ? this.targetBlock.colorOffset
      : Math.round(Math.random() * 100);
    // set color
    if (!this.targetBlock) {
      this.color = 0x333344;
    } else {
      var offset = this.index + this.colorOffset;
      var r = Math.sin(0.3 * offset) * 55 + 200;
      var g = Math.sin(0.3 * offset + 2) * 55 + 200;
      var b = Math.sin(0.3 * offset + 4) * 55 + 200;
      this.color = new THREE.Color(r / 255, g / 255, b / 255);
    }
    // state
    this.state = this.index > 1 ? this.STATES.ACTIVE : this.STATES.STOPPED;
    // set direction
    this.speed = -0.1 - this.index * 0.005;
    if (this.speed < -4) this.speed = -4;
    this.direction = this.speed;
    // create block
    var geometry = new THREE.BoxGeometry(
      this.dimension.width,
      this.dimension.height,
      this.dimension.depth
    );
    geometry.applyMatrix(
      new THREE.Matrix4().makeTranslation(
        this.dimension.width / 2,
        this.dimension.height / 2,
        this.dimension.depth / 2
      )
    );
    this.material = new THREE.MeshToonMaterial({
      color: this.color,
      shading: THREE.FlatShading,
    });
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.set(
      this.position.x,
      this.position.y + (this.state == this.STATES.ACTIVE ? 0 : 0),
      this.position.z
    );
    if (this.state == this.STATES.ACTIVE) {
      this.position[this.workingPlane] =
        Math.random() > 0.5 ? -this.MOVE_AMOUNT : this.MOVE_AMOUNT;
    }
  }
  Block.prototype.reverseDirection = function () {
    this.direction = this.direction > 0 ? this.speed : Math.abs(this.speed);
  };
  Block.prototype.place = function () {
    this.state = this.STATES.STOPPED;
    var overlap =
      this.targetBlock.dimension[this.workingDimension] -
      Math.abs(
        this.position[this.workingPlane] -
          this.targetBlock.position[this.workingPlane]
      );
    var blocksToReturn = {
      plane: this.workingPlane,
      direction: this.direction,
    };
    if (this.dimension[this.workingDimension] - overlap < 0.3) {
      overlap = this.dimension[this.workingDimension];
      blocksToReturn.bonus = true;
      this.position.x = this.targetBlock.position.x;
      this.position.z = this.targetBlock.position.z;
      this.dimension.width = this.targetBlock.dimension.width;
      this.dimension.depth = this.targetBlock.dimension.depth;
    }
    if (overlap > 0) {
      var choppedDimensions = {
        width: this.dimension.width,
        height: this.dimension.height,
        depth: this.dimension.depth,
      };
      choppedDimensions[this.workingDimension] -= overlap;
      this.dimension[this.workingDimension] = overlap;
      var placedGeometry = new THREE.BoxGeometry(
        this.dimension.width,
        this.dimension.height,
        this.dimension.depth
      );
      placedGeometry.applyMatrix(
        new THREE.Matrix4().makeTranslation(
          this.dimension.width / 2,
          this.dimension.height / 2,
          this.dimension.depth / 2
        )
      );
      var placedMesh = new THREE.Mesh(placedGeometry, this.material);
      var choppedGeometry = new THREE.BoxGeometry(
        choppedDimensions.width,
        choppedDimensions.height,
        choppedDimensions.depth
      );
      choppedGeometry.applyMatrix(
        new THREE.Matrix4().makeTranslation(
          choppedDimensions.width / 2,
          choppedDimensions.height / 2,
          choppedDimensions.depth / 2
        )
      );
      var choppedMesh = new THREE.Mesh(choppedGeometry, this.material);
      var choppedPosition = {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z,
      };
      if (
        this.position[this.workingPlane] <
        this.targetBlock.position[this.workingPlane]
      ) {
        this.position[this.workingPlane] = this.targetBlock.position[
          this.workingPlane
        ];
      } else {
        choppedPosition[this.workingPlane] += overlap;
      }
      placedMesh.position.set(
        this.position.x,
        this.position.y,
        this.position.z
      );
      choppedMesh.position.set(
        choppedPosition.x,
        choppedPosition.y,
        choppedPosition.z
      );
      blocksToReturn.placed = placedMesh;
      if (!blocksToReturn.bonus) blocksToReturn.chopped = choppedMesh;
    } else {
      this.state = this.STATES.MISSED;
    }
    this.dimension[this.workingDimension] = overlap;
    return blocksToReturn;
  };
  Block.prototype.tick = function () {
    if (this.state == this.STATES.ACTIVE) {
      var value = this.position[this.workingPlane];
      if (value > this.MOVE_AMOUNT || value < -this.MOVE_AMOUNT)
        this.reverseDirection();
      this.position[this.workingPlane] += this.direction;
      this.mesh.position[this.workingPlane] = this.position[this.workingPlane];
    }
  };
  return Block;
})();
var Game = /** @class */ (function () {
  function Game() {
    var _this = this;
    this.STATES = {
      LOADING: "loading",
      PLAYING: "playing",
      READY: "ready",
      ENDED: "ended",
      RESETTING: "resetting",
    };
    this.blocks = [];
    this.state = this.STATES.LOADING;
    this.stage = new Stage();
    this.mainContainer = document.getElementById("container");
    this.scoreContainer = document.getElementById("score");
    this.blocksCountContainer = document.getElementById("blocks-count");
    this.timerContainer = document.getElementById("timer");
    this.instructions = document.getElementById("instructions");
    this.perfectIndicator = document.getElementById("perfect-indicator");
    this.score = 0;
    this.timeRemaining = 120; // 2 minutes in seconds
    this.timerInterval = null;
    this.scoreContainer.innerHTML = "Score: 0";
    this.blocksCountContainer.innerHTML = "Blocks: 0";
    this.timerContainer.innerHTML = "Time: 2:00";
    this.newBlocks = new THREE.Group();
    this.placedBlocks = new THREE.Group();
    this.choppedBlocks = new THREE.Group();
    this.stage.add(this.newBlocks);
    this.stage.add(this.placedBlocks);
    this.stage.add(this.choppedBlocks);
    this.addBlock();
    this.tick();
    // Auto-start the game
    setTimeout(function() {
      _this.startGame();
    }, 500);
    document.addEventListener("keydown", function (e) {
      if (e.keyCode == 32) _this.onAction();
    });
    document.addEventListener("click", function (e) {
      _this.onAction();
    });
    document.addEventListener("touchstart", function (e) {
      e.preventDefault();
      // this.onAction();
      // ☝️ this triggers after click on android so you
      // insta-lose, will figure it out later.
    });
  }
  Game.prototype.updateState = function (newState) {
    for (var key in this.STATES)
      this.mainContainer.classList.remove(this.STATES[key]);
    this.mainContainer.classList.add(newState);
    this.state = newState;
  };
  Game.prototype.onAction = function () {
    switch (this.state) {
      case this.STATES.PLAYING:
        this.placeBlock();
        break;
      case this.STATES.ENDED:
        // No restart - game over is final
        break;
    }
  };
  Game.prototype.startGame = function () {
    var _this = this;
    if (this.state != this.STATES.PLAYING) {
      this.score = 0;
      this.timeRemaining = 120;
      this.scoreContainer.innerHTML = "Score: 0";
      this.blocksCountContainer.innerHTML = "Blocks: 0";
      this.timerContainer.innerHTML = "Time: 2:00";
      this.updateState(this.STATES.PLAYING);
      this.addBlock();
      // Start timer countdown
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(function() {
        _this.timeRemaining--;
        var minutes = Math.floor(_this.timeRemaining / 60);
        var seconds = _this.timeRemaining % 60;
        _this.timerContainer.innerHTML = "Time: " + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
        if (_this.timeRemaining <= 0) {
          clearInterval(_this.timerInterval);
          _this.endGame();
        }
      }, 1000);
    }
  };
  Game.prototype.restartGame = function () {
    var _this = this;
    this.updateState(this.STATES.RESETTING);
    var oldBlocks = this.placedBlocks.children;
    var removeSpeed = 0.2;
    var delayAmount = 0.02;
    var _loop_1 = function (i) {
      TweenLite.to(oldBlocks[i].scale, removeSpeed, {
        x: 0,
        y: 0,
        z: 0,
        delay: (oldBlocks.length - i) * delayAmount,
        ease: Power1.easeIn,
        onComplete: function () {
          return _this.placedBlocks.remove(oldBlocks[i]);
        },
      });
      TweenLite.to(oldBlocks[i].rotation, removeSpeed, {
        y: 0.5,
        delay: (oldBlocks.length - i) * delayAmount,
        ease: Power1.easeIn,
      });
    };
    for (var i = 0; i < oldBlocks.length; i++) {
      _loop_1(i);
    }
    var cameraMoveSpeed = removeSpeed * 2 + oldBlocks.length * delayAmount;
    this.stage.setCamera(2, cameraMoveSpeed);
    var countdown = { value: this.blocks.length - 1 };
    TweenLite.to(countdown, cameraMoveSpeed, {
      value: 0,
      onUpdate: function () {
        _this.scoreContainer.innerHTML = String(Math.round(countdown.value));
      },
    });
    this.blocks = this.blocks.slice(0, 1);
    setTimeout(function () {
      _this.startGame();
    }, cameraMoveSpeed * 1000);
  };
  Game.prototype.placeBlock = function () {
    var _this = this;
    var currentBlock = this.blocks[this.blocks.length - 1];
    var newBlocks = currentBlock.place();
    this.newBlocks.remove(currentBlock.mesh);
    if (newBlocks.placed) this.placedBlocks.add(newBlocks.placed);
    
    // Update score based on placement
    if (newBlocks.bonus) {
      // Perfect placement
      this.score += 30;
      
      // Subtle perfect fit feedback animation
      var originalY = newBlocks.placed.position.y;
      TweenLite.fromTo(newBlocks.placed.position, 0.12, 
        { y: originalY },
        { y: originalY + 0.15, ease: Power1.easeOut,
          onComplete: function() {
            TweenLite.to(newBlocks.placed.position, 0.12, {
              y: originalY,
              ease: Bounce.easeOut
            });
          }
        }
      );
      
      // Brief color flash to green/bright to indicate success
      var originalColor = newBlocks.placed.material.color.clone();
      TweenLite.to(newBlocks.placed.material.color, 0.15, {
        r: Math.min(originalColor.r + 0.2, 1),
        g: Math.min(originalColor.g + 0.3, 1),
        b: Math.min(originalColor.b + 0.2, 1),
        yoyo: true,
        repeat: 1,
        ease: Power1.easeInOut
      });
      
      // Show "PERFECT!" text indicator
      TweenLite.fromTo(_this.perfectIndicator, 0.2, 
        { opacity: 0, scale: 0, transform: "translate(-50%, -50%) scale(0)" },
        { opacity: 1, scale: 1, transform: "translate(-50%, -50%) scale(1)", ease: Back.easeOut.config(1.7) }
      );
      TweenLite.to(_this.perfectIndicator, 0.2, {
        opacity: 0,
        scale: 0.8,
        transform: "translate(-50%, -50%) scale(0.8)",
        ease: Power1.easeIn,
        delay: 0.5
      });
    } else {
      // Normal placement
      this.score += 10;
    }
    this.scoreContainer.innerHTML = "Score: " + this.score;
    
    if (newBlocks.chopped) {
      this.choppedBlocks.add(newBlocks.chopped);
      var positionParams = {
        y: "-=30",
        ease: Power1.easeIn,
        onComplete: function () {
          return _this.choppedBlocks.remove(newBlocks.chopped);
        },
      };
      var rotateRandomness = 10;
      var rotationParams = {
        delay: 0.05,
        x:
          newBlocks.plane == "z"
            ? Math.random() * rotateRandomness - rotateRandomness / 2
            : 0.1,
        z:
          newBlocks.plane == "x"
            ? Math.random() * rotateRandomness - rotateRandomness / 2
            : 0.1,
        y: Math.random() * 0.1,
      };
      if (
        newBlocks.chopped.position[newBlocks.plane] >
        newBlocks.placed.position[newBlocks.plane]
      ) {
        positionParams[newBlocks.plane] =
          "+=" + 40 * Math.abs(newBlocks.direction);
      } else {
        positionParams[newBlocks.plane] =
          "-=" + 40 * Math.abs(newBlocks.direction);
      }
      TweenLite.to(newBlocks.chopped.position, 1, positionParams);
      TweenLite.to(newBlocks.chopped.rotation, 1, rotationParams);
    }
    this.addBlock();
  };
  Game.prototype.addBlock = function () {
    var lastBlock = this.blocks[this.blocks.length - 1];
    if (lastBlock && lastBlock.state == lastBlock.STATES.MISSED) {
      return this.endGame();
    }
    this.blocksCountContainer.innerHTML = "Blocks: " + String(this.blocks.length - 1);
    var newKidOnTheBlock = new Block(lastBlock);
    this.newBlocks.add(newKidOnTheBlock.mesh);
    this.blocks.push(newKidOnTheBlock);
    this.stage.setCamera(this.blocks.length * 2);
    if (this.blocks.length >= 5) this.instructions.classList.add("hide");
  };
  Game.prototype.endGame = function () {
    // Stop the timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    // Update state to ended
    this.updateState(this.STATES.ENDED);
    
    // Apply blur effect to the game container
    var gameDiv = document.getElementById("game");
    gameDiv.style.filter = "blur(5px)";
    gameDiv.style.transition = "filter 0.5s ease";
    
    // Send postMessage to parent window
    window.parent.postMessage({ type: "GAME_OVER", score: this.score }, "*");
  };
  Game.prototype.tick = function () {
    var _this = this;
    if (this.state !== this.STATES.ENDED) {
      this.blocks[this.blocks.length - 1].tick();
    }
    this.stage.render();
    requestAnimationFrame(function () {
      _this.tick();
    });
  };
  return Game;
})();
var game = new Game();
