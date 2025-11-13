function Building(){
  this.points = 0;
  this.windows = [];

  this.createBuilding = function(){
    for(i = 0; i < 4; i++){
        for(j = 0; j< 5; j++){
          var window = new Window (i,j);
          this.windows.push(window);
        }
      }
  };


  this.selectWindow = function(column, row){
    if(row == undefined){
      row = Math.floor(Math.random()*4);
    }
    for(i=0; i < this.windows.length; i++){
      if(this.windows[i].column == column && this.windows[i].row == row){
        return this.windows[i];
      }
    }
  };


  this.windowsInColumn = function(column){
    var totalHealth = 0;
    for(i=0; i < this.windows.length; i++){
      if(this.windows[i].column == column){
        totalHealth += this.windows[i].health;
      }
    }
    return totalHealth;
  };

  this.calculatePoints = function(){
    var totalPoints = 0;
    for(i=0; i < this.windows.length; i++){
        totalPoints += this.windows[i].health;
    }
    return totalPoints;

  };

}


// ================ Window Class ================ //

function Window(row, column){
  this.health = 2;
  this.row = row;
  this.column = column;
  this.isFixer = "out";

  this.receiveDamage = function(){
    if(this.health > 0){
      this.health--;
    }

  };

  this.receiveHealth = function(){
    if(this.health == 1){
      this.health++;
    }
  };

  this.addFixer = function(){
    this.isFixer = "in";
  };

  this.removeFixer = function(){
    this.isFixer = "out";
  };

  this.testHealth = function(){
    switch(this.health){
      case 1:
        $('.window').removeAttr("data-state");
        $('.window').attr("data-state", "broken");
        break;

      case 0:
        $('.window').removeAttr("data-state");
        $('.window').attr("data-state", "over");
        break;
    }
  };

}
