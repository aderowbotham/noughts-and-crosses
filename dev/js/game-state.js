(function(){

  "use strict";

  angular.module("noughts")

  .factory("GameState", function($log, $rootScope, constants, localStorageService) {

    var self,
    stateStorageId,
    game,
    players = {
      o: constants.PLAYER_HUMAN,
      x: constants.PLAYER_COMPUTER
    };


    function init(gameId){
      stateStorageId = gameId + ".gamestate";

      if(localStorageService.get(stateStorageId)){
        self = localStorageService.get(stateStorageId);
      } else {
        self = {
          gameCounter: 0,
          allGamesOutcome: [],
          computerWins: 0,
          humanWins: 0,
          draws: 0
        };
        localStorageService.set(stateStorageId, self);
      }

      reset();
    }


    function hardReset(){

      self = {
        gameCounter: 0,
        allGamesOutcome: [],
        computerWins: 0,
        humanWins: 0,
        draws: 0
      };
      localStorageService.set(stateStorageId, self);
      $rootScope.$broadcast("hard_reset");

      reset();
    }


    function loadPlayer(){
      self = {
        gameCounter: 0,
        allGamesOutcome: [],
        computerWins: 0,
        humanWins: 0,
        draws: 0
      };
      localStorageService.set(stateStorageId, self);
      $rootScope.$broadcast("load_trained_player");
      reset();

    }


    function reset(){
      game = {
        turn: constants.PLAYER_COMPUTER,
        turnSymbol: _getSymbolForPlayer(constants.PLAYER_COMPUTER),
        squares: [{val: 0, win: false}, {val: 0, win: false}, {val: 0, win: false}, {val: 0, win: false}, {val: 0, win: false}, {val: 0, win: false}, {val: 0, win: false}, {val: 0, win: false}, {val: 0, win: false}],
        winner: null,
        gameActive: true
      };

      self.gameCounter ++;
      $rootScope.$broadcast("reset_game");
    }



    // players object uses the players' symbols ('x' or 'o') as the key
    // find the matching value and then return the corresponding key
    function _getSymbolForPlayer(playerType){
      for (var key in players) {
        if (players.hasOwnProperty(key) && players[key] === playerType) {
          return key;
        }
      }
      // return blank for a draw (neither player matched)
      return "";
    }



    function _getIsGameActive(){
      if(game.winner){
        return false;
      }
      for(var i = 0; i  < game.squares.length; i++){
        if(game.squares[i].val === 0){
          return true;
        }
      }
      return false;
    }



    // check any set of three squares (pass horizontal, vertical or diagonal lines)
    function _checkLine(ids){
      var squares = game.squares;
      // if the first value is not zero and all are the same then there is a winning row
      if(squares[ids[0]].val !== 0 && squares[ids[0]].val === squares[ids[1]].val && squares[ids[1]].val === squares[ids[2]].val){

        // return 'x' or 'o'
        return squares[ids[0]].val;
      }

      return null;
    }



    function _checkForWinner(){

      var winningSymbol;

      // check rows
      var rows = [[0, 1, 2], [3, 4, 5], [6, 7, 8]];
      for(var row = 0; row < 3; row++){
        winningSymbol = _checkLine(rows[row]);
        if(winningSymbol){
          game.squares[rows[row][0]].win = true;
          game.squares[rows[row][1]].win = true;
          game.squares[rows[row][2]].win = true;
          return players[winningSymbol];
        }
      }


      // check columns
      var cols = [[0, 3, 6], [1, 4, 7], [2, 5, 8]];
      for(var col = 0; col < 3; col++){
        winningSymbol = _checkLine(cols[col]);
        if(winningSymbol){
          game.squares[cols[col][0]].win = true;
          game.squares[cols[col][1]].win = true;
          game.squares[cols[col][2]].win = true;
          return players[winningSymbol];
        }
      }

      // check diagonals
      var diags = [[0, 4, 8], [2, 4, 6]];
      for(var diag = 0; diag < 2; diag++){
        winningSymbol = _checkLine(diags[diag]);
        if(winningSymbol){
          game.squares[diags[diag][0]].win = true;
          game.squares[diags[diag][1]].win = true;
          game.squares[diags[diag][2]].win = true;
          return players[winningSymbol];
        }
      }

      return null;
    }




    function playInSquare(playerType, squareId){

      if(!game.gameActive){
        return;
      }

      if(playerType !== game.turn){
        return $log.warn("It is not " + playerType + "'s turn");
      }

      if(game.squares[squareId].val){
        $rootScope.$broadcast("turn_notify", {turn: game.turn});
        return $log.warn("That position (" + squareId + ") is taken");
      }

      var symbol = _getSymbolForPlayer(playerType);

      game.squares[squareId].val = symbol;

      game.winner = _checkForWinner();
      game.gameActive = _getIsGameActive();

      // toggle whose turn it is if the game is active, or set the turn to null
      game.turn = game.gameActive ? ((game.turn === constants.PLAYER_COMPUTER) ? constants.PLAYER_HUMAN : constants.PLAYER_COMPUTER) : null;
      game.turnSymbol  = _getSymbolForPlayer(game.turn);
      if(game.gameActive){
        $rootScope.$broadcast("turn_notify", {turn: game.turn});
      } else {
        $rootScope.$broadcast("game_end_event", { winner: game.winner || constants.STATE_DRAW });
        self.allGamesOutcome.push(game.winner || constants.STATE_DRAW );
        if(game.winner === constants.PLAYER_COMPUTER){
          self.computerWins ++;
        } else if(game.winner === constants.PLAYER_HUMAN){
          self.humanWins ++;
        } else {
          self.draws ++;
        }

        localStorageService.set(stateStorageId, self);

      }

    }


    return {
      playInSquare: playInSquare,
      init: init,
      getCurrentPlayer: function(){
        return game.turn;
      },
      getSquares: function(){
        return game.squares;
      },
      getGameStatus: function(){
        return game;
      },
      getStatus: function(){
        return self;
      },
      reset: reset,
      hardReset: hardReset,
      loadPlayer: loadPlayer
    };
  });


}());
