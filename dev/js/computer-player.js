(function(){

  "use strict";

  angular.module("mlengine", ["constants"])

  .factory("ComputerPlayer", function($timeout, $log, $rootScope, $window, $http, constants, localStorageService, MirrorsService) {


    var gameStateRef,
      thisGameHistory = [],
      allHistory,
      historyStorageId,
      moveNumber;


    var settings = {
      startingBoxMoves: 4, // equivalent to number of coloured beads in the first box - we provide one less for 2nd, 3rd and 4th move boxes
      winReward: 3,
      loseReward: -1,
      drawReward: 1,
      mirrorSettings: null,
    };


    function init(_gameStateRef, _settingsOverride, gameId){
      gameStateRef = _gameStateRef;
      historyStorageId = gameId + ".allHistory";
      moveNumber = 1;

      // if settings passed then overwrite the defauls
      if(_settingsOverride){
        for (var key in _settingsOverride) {
          if (_settingsOverride.hasOwnProperty(key) && settings.hasOwnProperty(key)) {
            settings[key] = _settingsOverride[key];
          }
        }
      }

      if(localStorageService.get(historyStorageId)){
        allHistory = localStorageService.get(historyStorageId);
      } else {
        allHistory = {};
        localStorageService.set(historyStorageId, allHistory);
      }

      $rootScope.$on("turn_notify", _onTurnNotify);
      $rootScope.$on("game_end_event", _onGameEnd);
      $rootScope.$on("hard_reset", _onHardReset);
      $rootScope.$on("load_trained_player", _doLoadTrained);
      $rootScope.$on("reset_game", function(){
        moveNumber = 1;
        thisGameHistory = [];
      });
    }


    function _onHardReset(){

      allHistory = {};
      localStorageService.set(historyStorageId, allHistory);
      $window.alert("Computer player reset to beginner");
    }


    function _doLoadTrained(){
      allHistory = {};
      $http.get("trained.json")
      .then(
        function success(response){

          if(!response || !response.data){
            return $window.alert("Unexpected data, failed to load player");
          }

          allHistory = response.data;
          localStorageService.set(historyStorageId, allHistory);

          $window.alert("Trained player loaded");
        },
        function error(response){
          $window.alert("Unable to load player data ");
        }
      );


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
        // delete move.available;
        // copy to the more permanent history
        allHistory[stateKey] = angular.copy(move.moveWeighting);
        localStorageService.set(historyStorageId, allHistory);
      });

      // $log.debug("allHistory:", allHistory);

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

      // get flat array of all states
      var stateArray = gameStatus.squares.map(function(square){
        return square.val;
      });

      var available = _getAvailablePlaces(stateArray);
      var positionId;

      // no learning required when only one space to move into
      if(available.length === 1){
        positionId = available[0];
      } else {

        var myMoveObject = _getMoveAsObject(stateArray, available);

        // $log.debug("myMoveObject = ",myMoveObject)

        // catch situation where computer cannot move
        // note this should not be possible due to reset mechanism in _getMoveAsObject()
        if(myMoveObject.positionId === null){
          return $log.warn("Computer cannot move");
        }

        // position ID to move in
        positionId = angular.copy(myMoveObject.positionId);

        // if we are using a mirrored state we need to process it
        // and set positionIdHistoryRef as the positionId
        if(myMoveObject.useMirrorFromHistory){
          myMoveObject.positionId = myMoveObject.positionIdHistoryRef;
          delete myMoveObject.positionIdHistoryRef;
        }
        delete myMoveObject.useMirrorFromHistory;

        thisGameHistory.push(myMoveObject);
      }

      gameStateRef.playInSquare(constants.PLAYER_COMPUTER, positionId);

      moveNumber++;
    }



    function _getMoveAsObject(stateArray, available){

      // 1. check for exact match of statekey in allHistory
      // 2. if no match found then get all possible unique board configurations as rotations
      //   2a. For each rotation check for a match in allHistory
      //   If found then:
      //     - Get the board weighting from the history match
      //     - Unrotate the board weighting (using the metadata linked to the matching rotation) and use this to determine the move
      //     - *Important* - rather than store the new (unrotated) moveWeighting, at the end of the game we want to update the existing one in the history
      // 3. Failing no match then generate a new (default) set of moveWeightings to store against the stateKey of this board

      var i,
      output = {},
      mirrorFromHistory = null,
      activeMirror = null,
      moveWeighting = null,
      rotationMoveWeighting = null;

      output.stateKey = stateArray.join("");
      output.useMirrorFromHistory = false;

      if(allHistory[output.stateKey]){
        moveWeighting = allHistory[output.stateKey];

      } else {

        // look for mirrors
        if(settings.mirrorSettings !== null){

          var stateKeyMirrors = MirrorsService.getMirrors(stateArray, settings.mirrorSettings);

          for(i = 0; i < stateKeyMirrors.length; i++){
            if(allHistory[stateKeyMirrors[i].stateKey]){
              mirrorFromHistory = allHistory[stateKeyMirrors[i].stateKey];
              activeMirror = stateKeyMirrors[i];
              // swap the actual stateKey with the stateKey of the matching mirror
              output.stateKey = activeMirror.stateKey;
              break;
            }
          }

          if(mirrorFromHistory){

            output.useMirrorFromHistory = true;

            // @TODO get weighting of move in history, then apply reverse rotation / flip to get back to current stateArray
            // then we can apply this moveWeighting to *our* stateArray

            if(activeMirror.rotate || activeMirror.flip_h){
              var stateArrayFromMoveWeightings = _convertWeightingsObjectToStateArray(mirrorFromHistory, settings.mirrorSettings.grid);
              var unrotatedStateArray = MirrorsService.revertMirror(stateArrayFromMoveWeightings, activeMirror.rotate, activeMirror.flip_h, settings.mirrorSettings);

               // add moveWeighting to *use* in our game
               moveWeighting = _convertStateArrayToWeightingsObject(unrotatedStateArray, settings.mirrorSettings.grid);
               // also add the moveWeighting from history which we will later need to update at the end of the game
               rotationMoveWeighting = mirrorFromHistory;

            } else {
              $log.warn("! Found mirror in history with no transformations; this should never happen becasue it should have already been matched by allHistory[output.stateKey]");
              moveWeighting = mirrorFromHistory;
            }

            // $log.debug("- - We have seen this state before: ", mirrorFromHistory)
          }

        }

        // if no moveWeighting was found then generate a new one
        if(!moveWeighting){
          moveWeighting = _makeNewMoveWeighting(available);
        }

      } // end else if not found in history




      // position to move in
      output.positionId =_choosePositionFromWeighting(moveWeighting);

      // @TODO (if using a mirrorFromHistory) also work out and store a copy of positionId in the reference of the rotation we used to make the move

      // if all move weightings reached zero no position would be available
      // so in this case we reset this state
      if(output.positionId === null){
        $log.warn("History for this state reached a 'no moves available' state so was reset");
        // moveWeighting = _makeNewMoveWeighting(available);
        moveWeighting = _resetMoveWeighting(moveWeighting);

        // also reset the rotationMoveWeighting (if a rotation was matched in all history)
        if(mirrorFromHistory){
          rotationMoveWeighting = _resetMoveWeighting(rotationMoveWeighting);
        }

        output.positionId =_choosePositionFromWeighting(moveWeighting);
      }

      // set either the actual or the mirror's moveWeighting in the output
      // as this will now only be needed for history recording purposes
      output.moveWeighting = mirrorFromHistory ? rotationMoveWeighting : moveWeighting;

      // we also need to store the ROTATED version of the positionId for the purpose of updating the weighting at the end of the game
      // i.e. we might have moved in the top left corner but based on a moveWeighting of a rotation where that was the bottom right corner
      // so at the end of the game for the purposes of the history it would be as if we moved in the bottom right corner this move
      if(mirrorFromHistory){

        // get rotated positionId
        var tempStateArray = new Array(stateArray.length).fill(null);
        tempStateArray[output.positionId] = 1;
        tempStateArray = MirrorsService.applyMirror(tempStateArray, activeMirror.rotate, activeMirror.flip_h, settings.mirrorSettings);

        // get the rotated positionId (only index in the array with a 1, rest are null)
        for(i = 0; i < tempStateArray.length; i++){
          if(tempStateArray[i] === 1){
            output.positionIdHistoryRef = i;
            break;
          }
        }

        // new Array(stateArrayLength).fill(null);
        // output.positionIdHistoryRef =
      }

      // @NOTE we don't need require the available array because this is encoded in the moveWeighting
      // namely - the moveWeighting only contains keys for available positions
      // output.available = available;
      return output;
    }



    // converts the weightings object (which might have gaps) to a flat array the size of the board,
    // with null values where there are no weightings - i.e. in the positions where it is not possible to move
    function _convertWeightingsObjectToStateArray(moveWeightingObject, grid){

      var stateArrayLength = grid[0] * grid[1];

      // create blank array filled with nulls
      var output = new Array(stateArrayLength).fill(null);

      // populate array with any existing keys in the moveWeightingObject object
      for (var key in moveWeightingObject) {
        if (moveWeightingObject.hasOwnProperty(key)){
          output[key] = moveWeightingObject[key];
        }
      }
      return output;
    }


    // does the reverse of _convertWeightingsObjectToStateArray
    function _convertStateArrayToWeightingsObject(stateArray, grid){
      var moveWeightingObject = {};
      for(var i = 0; i < stateArray.length; i++){
        if(stateArray[i] !== null){
          moveWeightingObject[i] = stateArray[i];
        }
      }
      return moveWeightingObject;
    }


    function _makeNewMoveWeighting(available){
      var output = {};
      available.forEach(function(positionId){
        output[positionId] = settings.startingBoxMoves - (moveNumber - 1);
      });

      return output;
    }


    // for a given moveWeighting, which only has keys and values for available positions,
    // reset the weighting to the startingBoxMoves value
    function _resetMoveWeighting(moveWeighting){
      for (var key in moveWeighting) {
        if (moveWeighting.hasOwnProperty(key)){
          moveWeighting[key] = settings.startingBoxMoves - (moveNumber - 1);
        }
      }
      return moveWeighting;
    }


    function _choosePositionFromWeighting(moveWeighting){

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

      if(!allChances.length){
        return null;
      }

      // pick a random value from, the allChances array
      // (this array can now be discarded)
      return allChances[Math.floor(Math.random() * allChances.length)];
    }



    function _getAvailablePlaces(stateArray){
      var available = [];
      for(var i=0; i<stateArray.length; i++){
        if(stateArray[i] === 0){
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
