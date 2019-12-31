(function(){

  "use strict";

  angular.module("mlengine", ["constants"])

  .factory("ComputerPlayer", function($timeout, $log, $rootScope, constants) {

    var self,
    gameStateRef,
    moveNumber = 1,
    thisGameHistory = [],
    allHistory = {};

    var settings = {
      startingMoves: 5, // total number of weighting states distributed between all options, e.g. two options with equal weight would be 50,50
      winReward: 4,
      loseReward: -2,
      drawReward: 1,
      useGridRotations: false,
    };

    function init(_gameStateRef, _settingsOverride){
      gameStateRef = _gameStateRef;

      // if settings passed then overwrite the defauls
      if(_settingsOverride){
        for (var key in _settingsOverride) {
          if (_settingsOverride.hasOwnProperty(key) && settings.hasOwnProperty(key)) {
            settings[key] = _settingsOverride[key];
          }
        }
      }

      $rootScope.$on("turn_notify", _onTurnNotify);
      $rootScope.$on("game_end_event", _onGameEnd);
      $rootScope.$on("resetgame", function(){
        thisGameHistory = [];
      });

    }


    function _onGameEnd(e, params){

      var reward = 0;
      switch(params.winner){
        case constants.PLAYER_HUMAN:
        reward = settings.loseReward;
        break;

        case constants.PLAYER_COMPUTER:
        reward = settings.winReward;
        break;

        case constants.STATE_DRAW:
        reward = settings.drawReward;
        break;
      }

      // iterate thisGameHistory and update the moveWeightings
      // we 'add' (this can be negative) the reward to the positionId that was the move made
      thisGameHistory.forEach(function(move){
        move.moveWeighting[move.positionId] += reward;

        move.moveWeighting[move.positionId] = Math.max(0, move.moveWeighting[move.positionId]);

        var stateKey = move.stateKey;
        delete move.stateKey;
        delete move.positionId;
        delete move.available;
        // copy to the more permanent history
        allHistory[stateKey] = angular.copy(move);
      });

      $log.debug("allHistory:", allHistory);

    }


    function _onTurnNotify(e, params){

      // ignore unless it's my go
      if(!params || params.turn !== constants.PLAYER_COMPUTER){
        return;
      }

      $log.debug("[computer] It’s my turn");
      $timeout(_takeTurn, 500);

    }


    function _takeTurn(){
      var gameStatus = gameStateRef.getGameStatus();

      // should never happen
      if(!gameStatus.gameActive || gameStatus.winner){
        return $log.warn("I'm not going because the game is complete");
      }


      // - - figure out my move - -
      var board = _getBoard(gameStatus.squares);
      var available = _getAvailablePlaces(board);
      var positionId;

      // no learning required when only one space to move into
      if(available.length === 1){
        positionId = available[0];
      } else {

        var myMoveObject = _getMoveAsObject(board, available);

        thisGameHistory.push(myMoveObject);
        positionId = myMoveObject.positionId;

      }

      gameStateRef.playInSquare(constants.PLAYER_COMPUTER, positionId);
    }



    function _getMoveAsObject(board, available){

      var output = {};

      if(settings.useGridRotations){
        throw("useGridRotations not implemented");
        // for each grid rotation check if allHistory[_that_state_key_] exists
      } else {
        output.stateKey = board.join("");
        if(allHistory[output.stateKey]){
          output.moveWeighting = allHistory[output.stateKey].moveWeighting;
        } else {
          output.moveWeighting = _makeNewMoveWeighting(available);
        }
      }

      output.positionId =_getPositionFromWeighting(output.moveWeighting);
      output.available = available;
      return output;
    }



    function _makeNewMoveWeighting(available){
      var output = {};
      available.forEach(function(positionId){
        output[positionId] = settings.startingMoves;
      });

      return output;
    }


    function _getPositionFromWeighting(moveWeighting){

      // get the total length of chances array needed
      var chanceCount = 0;
      for (var key in moveWeighting) {
        if (moveWeighting.hasOwnProperty(key)){
          chanceCount += moveWeighting[key];
        }
      }

      // make an empty array then fill it according to weightings
      var allChances = new Array(chanceCount);

      var position = 0;
      for (key in moveWeighting) {
        if (moveWeighting.hasOwnProperty(key)){

          var valToFill = parseInt(key);
          var startIndex = position;
          var endIndex = position + moveWeighting[key];
          allChances = allChances.fill(valToFill, startIndex, endIndex);
          position += parseInt(moveWeighting[key]);
        }
      }

      $log.debug("moveWeighting = ",moveWeighting);
      // $log.debug("allChances = ",allChances)

      // pick a random value from, the allChances array
      // (this array can now be discarded)
      return allChances[Math.floor(Math.random() * allChances.length)];
    }



    function _getBoard(squares){
      return squares.map(function(square){
        return square.val;
      });
    }


    function _getAvailablePlaces(board){
      var available = [];
      for(var i=0; i<board.length; i++){
        if(board[i] === 0){
          available.push(i);
        }
      }
      return available;
    }




    return {
      init: init
    };
  });


}());
