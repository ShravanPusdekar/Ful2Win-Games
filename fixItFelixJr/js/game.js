function Game(options){
  this.points = 0;
  this.score = 0;
  this.timeLeft = 120;

  this.ralph = options.ralph;
  this.building = options.building;
  this.fixer = options.fixer;

  this.timeByMove = 1200;
  this.lastFixAt = 0;



  this.loadGame = function(){
    this.building.createBuilding();
    this.printBuilding();
    this.printLives();
    this.assignControlsToKeys();

    this.createRalphSpace();
    this.printRalph();
    this.printFixer();

  };


/*================ Funciones de actualización =================*/


  this.updateBuilding = function(){
      this.printBuilding();
      this.printPoints();
      this.printLives();
  };


  this.updateRalph = function(){

    if(this.building.windowsInColumn(this.ralph.column)){
      this.printRalphWrecking();
      var targetWindow = this.building.selectWindow(this.ralph.column);
      var self = this;
      this.spawnBrick(this.ralph.column, targetWindow ? targetWindow.row : undefined, function(){
        if(targetWindow && targetWindow.health){
          var before = targetWindow.health;
          targetWindow.receiveDamage();
          return (before > 0 && targetWindow.health === 0);
        }else{
          self.updateRalph();
          return false;
        }
      });
    }

    var self = this;
    setTimeout(function(){
      self.printRalph();
    },400);

  };

  this.spawnBrick = function(column, row, onHit){
    try{
      var self = this;
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
      var buildingTop = startTop + topH;
      var endTop = buildingTop + buildingH - 10;
      var rH = buildingH / 4;
      var impactTop = (typeof row === 'number')
        ? Math.round(buildingTop + row * rH + (rH/2) - (bh/2))
        : endTop;

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

      var duration1 = 500;
      var t0 = Date.now();
      var timer = setInterval(function(){
        var t = (Date.now() - t0) / duration1; if(t >= 1) t = 1;
        brick.style.top = (startTop + (impactTop - startTop) * t) + 'px';
        if(t === 1){
          clearInterval(timer);
          var felixHit = (typeof row === 'number' && self && self.fixer && self.fixer.onGround === false && self.fixer.column === column && self.fixer.row === row);
          if(felixHit){
            if(self.fixer && typeof self.fixer.hit === 'function'){ self.fixer.hit(); }
            setTimeout(function(){
              if(typeof self.fixer.life === 'number' && self.fixer.life > 0){
                self.fixer.life--;
                if(typeof self.printLives === 'function'){ self.printLives(); }
                if(self.fixer.life <= 0){
                  if(typeof self.stop === 'function') self.stop();
                  try{ window.parent.postMessage({ type: "GAME_OVER", score: game.score }, "*"); }catch(e){}
                  var go = document.querySelector('.gameover');
                  if(go){ go.style.display = 'block'; }
                }
              }
            }, 320);
          }
          var broke = false;
          try{ broke = typeof onHit === 'function' ? !!onHit() : false; }catch(e){ broke = false; }
          if(broke || felixHit || impactTop === endTop){
            brick.remove();
          } else {
            var t1 = Date.now();
            var duration2 = 350;
            var timer2 = setInterval(function(){
              var tt = (Date.now() - t1) / duration2; if(tt >= 1) tt = 1;
              brick.style.top = (impactTop + (endTop - impactTop) * tt) + 'px';
              if(tt === 1){
                clearInterval(timer2);
                brick.remove();
              }
            }, 16);
          }
        }
      }, 16);
    }catch(e){ if(typeof onHit === 'function') onHit(); }
  };

/*================ Funciones de puntuación =================*/

this.assignPoints = function(){
  
};

this.printPoints = function(){
  this.score = this.points;
  $('.points').html(this.points);
};

this.printLives = function(){
  $('.lives').html(this.fixer.life);
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

  this.performFix = function(){
    if(this.fixer.onGround){ return; }
    var now = Date.now();
    if(now - this.lastFixAt < 220){ return; }
    var target = this.building.selectWindow(this.fixer.column, this.fixer.row);
    if(!target){ return; }
    var before = target.health;
    target.receiveHealth();
    this.fixer.fixing();
    this.lastFixAt = now;
    if(target.health !== before){
      this.points += 100;
      this.updateBuilding();
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
          if(e.repeat){ break; }
          this.performFix();
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
      if(self.timeLeft > 0 && self.fixer.life > 0){
        self.printTime();
      }else{
        self.stop();
        if(self.fixer.life <= 0){
          try{ window.parent.postMessage({ type: "GAME_OVER", score: game.score }, "*"); }catch(e){}
          $('.gameover').css("display", "block");
        }else{
          try{ window.parent.postMessage({ type: "GAME_OVER", score: game.score }, "*"); }catch(e){}
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
