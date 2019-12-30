(function(){

  "use strict";

  angular.module("noughts")

  .factory("GameState", function($log, $rootScope, constants) {

    var self;
    var players = {
      o: constants.PLAYER_HUMAN,
      x: constants.PLAYER_COMPUTER
    };



    function reset(){
      self = {
        turn: constants.PLAYER_COMPUTER,
        turnSymbol: _getSymbolForPlayer(constants.PLAYER_COMPUTER),
        squares: [{val: null, win: false}, {val: null, win: false}, {val: null, win: false}, {val: null, win: false}, {val: null, win: false}, {val: null, win: false}, {val: null, win: false}, {val: null, win: false}, {val: null, win: false}],
        winner: null,
        gameActive: true
      };

      $rootScope.$broadcast("resetgame");
    }



    // players object uses the players' symbols ('x' or 'o') as the key
    // find the matching value and then return the corresponding key
    function _getSymbolForPlayer(playerType){
      for (var key in players) {
        if (players.hasOwnProperty(key) && players[key] === playerType) {
          return key;
        }
      }
      // error state, should never happen
      return "?";
    }



    function _getIsGameActive(){
      if(self.winner){
        return false;
      }
      for(var i = 0; i  < self.squares.length; i++){
        if(self.squares[i].val === null){
          return true;
        }
      }
      return false;
    }



    // check any set of three squares (pass horizontal, vertical or diagonal lines)
    function _checkLine(ids){
      var squares = self.squares;
      // if the first value is not null and all are the same then there is a winning row
      if(squares[ids[0]].val !== null && squares[ids[0]].val === squares[ids[1]].val && squares[ids[1]].val === squares[ids[2]].val){

        // return 'x' or 'o'
        return squares[ids[0]].val;
      }

      return null;
    }



    function _checkForWinner(){

      var matching;

      // check rows
      var rows = [[0, 1, 2], [3, 4, 5], [6, 7, 8]];
      for(var row = 0; row < 3; row++){
        matching = _checkLine(rows[row]);
        if(matching){
          self.squares[rows[row][0]].win = true;
          self.squares[rows[row][1]].win = true;
          self.squares[rows[row][2]].win = true;
          return players[matching];
        }
      }


      // check columns
      var cols = [[0, 3, 6], [1, 4, 7], [2, 5, 8]];
      for(var col = 0; col < 3; col++){
        matching = _checkLine(cols[col]);
        if(matching){
          self.squares[cols[col][0]].win = true;
          self.squares[cols[col][1]].win = true;
          self.squares[cols[col][2]].win = true;
          return players[matching];
        }
      }

      // check diagonals
      var diags = [[0, 4, 8], [2, 4, 6]];
      for(var diag = 0; diag < 2; diag++){
        matching = _checkLine(diags[diag]);
        if(matching){
          self.squares[diags[diag][0]].win = true;
          self.squares[diags[diag][1]].win = true;
          self.squares[diags[diag][2]].win = true;
          return players[matching];
        }
      }

      return null;
    }



    function init(){
      reset();
    }



    function playInSquare(playerType, squareId){

      if(!self.gameActive){
        return;
      }

      if(playerType !== self.turn){
        return $log.warn("It is not " + playerType + "'s turn");
      }

      if(self.squares[squareId].val){
        return $log.warn("That position is taken");
      }

      $log.debug(playerType + " clicked square " + squareId);

      var symbol = _getSymbolForPlayer(playerType);

      self.squares[squareId].val = symbol;

      self.winner = _checkForWinner();
      self.gameActive = _getIsGameActive();

      // toggle whose turn it is if the game is active, or set the turn to null
      self.turn = self.gameActive ? ((self.turn === constants.PLAYER_COMPUTER) ? constants.PLAYER_HUMAN : constants.PLAYER_COMPUTER) : null;
      self.turnSymbol  = _getSymbolForPlayer(self.turn);

    }



    return {
      playInSquare: playInSquare,
      init: init,
      getCurrentPlayer: function(){
        return self.turn;
      },
      getSquares: function(){
        return self.squares;
      },
      getStatus: function(){
        return self;
      },
      reset: reset
    };
  });


}());
