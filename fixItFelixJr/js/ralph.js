function Ralph(){
  this.column = 3;


  this.moveRalph = function(){
    var random = Math.floor(Math.random()*2);
      if(random && this.column > 0){
        this.column--;
      } else if(!random && this.column < 4){
        this.column++;
      }else{
        this.moveRalph();
      }
  };

  


}
