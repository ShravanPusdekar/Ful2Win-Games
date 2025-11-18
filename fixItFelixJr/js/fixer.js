function Fixer(){
  this.row = 3;
  this.column = 2;
  this.onGround = true;
  this.life = 3;

  this.goUp = function(){
    if(this.onGround){
      this.onGround = false;
      this.row = 3;
    } else if(this.row > 0){
      this.row--;
    }
  };

  this.goDown = function(){
    if(this.onGround){
      return;
    }
    if(this.row === 3){
      this.onGround = true;
    } else {
      this.row++;
    }
  };

  this.goLeft = function(){
    if(this.onGround){ return; }
    if(this.column > 0){
      this.column--;

    }
  };

  this.goRight = function(){
    if(this.onGround){ return; }
    if(this.column < 4){
      this.column++;
    }
  };

  this.fixing = function(){
      var $f = $('.fixer');
      $f.removeClass('walking_left walking_right nofixing').addClass('fixing');
      setTimeout(function(){ $f.removeClass('fixing').addClass('nofixing'); }, 250);
  };

  this.walking_right = function(){
    var $f = $('.fixer');
    $f.removeClass('walking_left fixing nofixing').addClass('walking_right');
  };

  this.walking_left = function(){
      var $f = $('.fixer');
      $f.removeClass('walking_right fixing nofixing').addClass('walking_left');
  };

  this.hit = function(){
      var $f = $('.fixer');
      $f.addClass('hit');
      setTimeout(function(){ $f.removeClass('hit'); }, 320);
  };

}
