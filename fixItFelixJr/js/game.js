function Game(options){
  this.points = 0;
  this.timeLeft = 120;

  this.ralph = options.ralph;
  this.building = options.building;
  this.fixer = options.fixer;

  this.timeByMove = 700;



  this.loadGame = function(){
    this.building.createBuilding();
    this.printBuilding();
    this.assignControlsToKeys();

    this.createRalphSpace();
    this.printRalph();
    this.printFixer();

  };


/*================ Funciones de actualización =================*/


  this.updateBuilding = function(){
      this.printBuilding();
      this.printPoints();
  };


  this.updateRalph = function(){

    if(this.building.windowsInColumn(this.ralph.column)){
      this.printRalphWrecking();
      var targetWindow = this.building.selectWindow(this.ralph.column);
      var self = this;
      this.spawnBrick(this.ralph.column, function(){
        if(targetWindow && targetWindow.health){
          targetWindow.receiveDamage();
        }else{
          self.updateRalph();
        }
      });
    }

    var self = this;
    setTimeout(function(){
      self.printRalph();
    },400);

  };

  this.spawnBrick = function(column, onHit){
    try{
      var container = document.querySelector('.container');
      var board = document.querySelector('.gameboard');
      if(!container || !board){ if(onHit) onHit(); return; }
      var bw = 24, bh = 16;
      var startTop = 100; // ralphspace height
      var topH = 75; // terrace area height
      var buildingH = 367; // building height
      var boardLeft = (container.clientWidth - board.offsetWidth) / 2;
      var colW = board.offsetWidth / 5;
      var left = Math.round(boardLeft + column * colW + (colW/2) - (bw/2));
      var endTop = startTop + topH + buildingH - 10;

      var brick = document.createElement('div');
      brick.className = 'brick';
      brick.style.position = 'absolute';
      brick.style.width = bw + 'px';
      brick.style.height = bh + 'px';
      brick.style.left = left + 'px';
      brick.style.top = startTop + 'px';
      brick.style.background = '#a33';
      brick.style.border = '2px solid #611';
      brick.style.borderRadius = '3px';
      brick.style.zIndex = '9999';
      container.appendChild(brick);

      var duration = 500;
      var t0 = Date.now();
      var timer = setInterval(function(){
        var t = (Date.now() - t0) / duration; if(t >= 1) t = 1;
        brick.style.top = (startTop + (endTop - startTop) * t) + 'px';
        if(t === 1){
          clearInterval(timer);
          brick.remove();
          if(typeof onHit === 'function') onHit();
        }
      }, 16);
    }catch(e){ if(typeof onHit === 'function') onHit(); }
  };

/*================ Funciones de puntuación =================*/

this.assignPoints = function(){
  this.points = (this.building.calculatePoints()-15)*100;
};

this.printPoints = function(){
  this.assignPoints();
  $('.points').html(this.points);
};


/*================ Funciones de tiempo =================*/
this.discountTime = function(){
  this.timeLeft--;
};

this.printTime = function(){
  this.discountTime();
  $('.seconds').html(this.timeLeft);

};

/*================ Funciones de ralph =================*/

  this.createRalphSpace = function(){
    var ralphSpace = "";
    for(i = 0; i < 5; i++){
      ralphSpace += '<div class="ralphbox" data-column="' + i + '"></div>';
    }
    $('.ralphspace').prepend(ralphSpace);
  };



  this.printRalph = function(){
    var self = this;
    self.ralph.moveRalph();

    $('.ralphbox').each(function(){
      $(this).removeClass("ralph");
      $(this).removeClass("ralph-wrecking");
      if($(this).attr("data-column") == self.ralph.column){

        $(this).addClass("ralph");
      }
    });
  };

  this.printRalphWrecking = function(){
    var self = this;
    $('.ralphbox').each(function(){
      $(this).removeClass("ralph");
      $(this).removeClass("ralph-wrecking");
      if($(this).attr("data-column") == self.ralph.column){

        $(this).addClass("ralph-wrecking");
        //new buzz.sound("assets/sounds/crash.wav").setVolume(3).play();
        //new buzz.sound("assets/sounds/glass-break.wav").setVolume(20).play();

      }
    });
  };


/*================ Funciones del Fixer =================*/


  this.printFixer = function(){
    $('.fixer').remove();
    if(this.fixer.onGround){
      // clear any window fixer state visually
      $('.building .window').attr('data-fix','out');
      $('.fixerspace').empty().append('<div class="fixer nofixing"></div>');
    }else{
      this.building.selectWindow(this.fixer.column, this.fixer.row).addFixer();
      var selector = '.building .window[data-row="' + this.fixer.row + '"][data-column="' + this.fixer.column + '"]';
      $(selector).attr('data-fix','in').append('<div class="fixer nofixing"></div>');
    }
  };


  this.assignControlsToKeys = function(){
    $('body').on('keydown', function(e) {
      switch (e.keyCode) {
        case 87: // arrow up
          this.fixer.goUp();
          this.printFixer();
          this.fixer.walking_right();
          break;

        case 83: // arrow down
          this.fixer.goDown();
          this.printFixer();
          this.fixer.walking_right();
          break;

        case 65: // arrow left
          this.fixer.goLeft();
          this.printFixer();
          this.fixer.walking_left();
          break;

        case 68: // arrow right
          this.fixer.goRight();
          this.printFixer();
          this.fixer.walking_right();
          break;

        case 70:
          this.building.selectWindow(this.fixer.column, this.fixer.row).receiveHealth();
          this.fixer.fixing();
         break;

       case 80:
       if(this.intervalTime && this.intervalBuilding && this.intervalRalph){
         this.stop();
       }else{
         this.startGame();
       }
        break;

      }
    }.bind(this));
  };


/*================ Funciones del building =================*/


  this.printBuilding = function(){
    $('.building').empty();
    var buildingBody = "";
    for(i = 0; i < this.building.windows.length; i++){
      if(this.fixer.onGround || this.building.windows[i].row != this.fixer.row || this.building.windows[i].column != this.fixer.column){
        this.building.windows[i].removeFixer();
      }
      buildingBody += '<div class ="window" data-state="'+ this.building.windows[i].health +'" data-row="'+ this.building.windows[i].row +'" data-column="'+ this.building.windows[i].column +'" data-fix="'+ this.building.windows[i].isFixer +'"></div>';
    }
    $('.building').prepend(buildingBody);
    this.printFixer();

  };


/*================ Funciones de intervalos =================*/


  this.stop = function (){
      clearInterval(this.intervalTime);
      clearInterval(this.intervalBuilding);
      clearInterval(this.intervalRalph);

      this.intervalTime = undefined;
      this.intervalBuilding = undefined;
      this.intervalRalph = undefined;
  };

  this.startGame = function(){
    this.intervalTime = setInterval(function(){
      var self = this;
      if(self.timeLeft > 0 && this.points > 0){
        self.printTime();
      }else{
        self.stop();
        if(this.points <= 0){
          $('.gameover').css("display", "block");
        }else{
          $('.youwin').css("display", "block");
        }
      }
    }.bind(this),1000);

    this.intervalBuilding = setInterval(function(){
      var self = this;
      self.updateBuilding();
    }.bind(this),60);

    this.intervalRalph = setInterval(function(){
      var self = this;
      self.updateRalph(this.timeByMove);
    }.bind(this),this.timeByMove);
  };

}

$(document).ready(function(){
  options = {
    ralph: new Ralph(),
    building: new Building(),
    fixer : new Fixer(),
  };

  game = new Game(options);
  game.loadGame();

  game.startGame();

});
