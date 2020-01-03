(function(){

  "use strict";

  angular.module("mlengine")

  .service("MirrorsService", function($log) {


    function _boardArrayToStateKey(array2d){
      var stateKey = "";
      array2d.forEach(function(row){
        stateKey += row.join("");
      });
      return stateKey;
    }


    function _boardArrayToStateArray(array2d){
      var output = [];
      array2d.forEach(function(row){
        row.forEach(function(el){
          output.push(el);
        });
      });
      return output;
    }


    // rotate 90º clockwise
    // logic via https://stackoverflow.com/questions/42581128/how-to-rotate-non-square-two-dimensional-array-twice-to-have-all-possible-rotati
    function _rotateBoardClockwise(board){
      var outputBoard = [];
      board.forEach(function (a, i, aa) {
        a.forEach(function (b, j, bb) {
          outputBoard[j] = outputBoard[j] || [];
          outputBoard[j][aa.length - i - 1] = b;
        });
      });
      return outputBoard;
    }


    // rotate 90º anticlockwise
    function _rotateBoardAntiClockwise(board) {
      var outputBoard = [];
      board.forEach(function (a, i, aa) {
        a.forEach(function (b, j, bb) {
          outputBoard[bb.length - j - 1] = outputBoard[bb.length - j - 1] || [];
          outputBoard[bb.length - j - 1][i] = b;
        });
      });
      return outputBoard;
    }


    // flip horizontal
    // logic via https://stackoverflow.com/questions/42581128/how-to-rotate-non-square-two-dimensional-array-twice-to-have-all-possible-rotati
    function _flipHBoard(board){
      var outputBoard = [];
      board.forEach(function (row) {
        outputBoard.push(row.reverse());
      });
      return outputBoard;
    }


    function _validateSettings(stateArray, settings){
      if(!settings.grid || !settings.grid.length || settings.grid.length !=2){
        throw "[MirrorsService] 2D grid dimensions array must be provided to use mirrors";
      }

      // rows must equal cols to use rotate
      if(settings.rotate && settings.grid[0] !== settings.grid[1]){
        throw "[MirrorsService] Rotation is only possible for square layouts";
      }

      // width x height must equal length of input state array
      if(settings.grid[0] * settings.grid[1] !== stateArray.length){
        throw "[MirrorsService] Grid dimensions do not correspond to the board input length";
      }

      return true;
    }


    // makes a 2D board array from the 1D state array, using the numCols value to break rows
    function _makeBoardArrayFromStateArray(stateArray, numCols){
      var boardArray = [[]];
      var colIndex = 0;
      for(var i = 0; i < stateArray.length; i++){
        if(colIndex === numCols){
          // add a new row
          boardArray.push([]);
          colIndex = 0;
        }
        // add col to row
        var thisRow = boardArray[boardArray.length-1];
        thisRow.push(stateArray[i]);
        colIndex++;
      }
      return boardArray;
    }


    // returns all mirrors of supplied board configuration (equivalent game states, rotated, and / or reflected horizontally)
    // includes the original
    // duplicates are filtered out
    // returns an array of objects contianing stateKeys for the purposes of looking them up in the state history
    // rotations are clockwise
    this.getMirrors = function(stateArray, settings){

      if(!_validateSettings(stateArray, settings)){
        return; // an error will have been thrown
      }

      // make 2D board array from the 1D 'stateArray' input
      // @NOTE settings.grid[1] is number of columns
      var boardArray = _makeBoardArrayFromStateArray(stateArray, settings.grid[1]);

      // output
      var allMirrors = [{
        flip_h: false,
        rotate: 0,
        stateKey: _boardArrayToStateKey(boardArray)
      }];

      var counter;
      var workingBoard = angular.copy(boardArray);

      // add rotations
      if(settings.rotate){
        counter = 1;
        while(counter < 4){

          workingBoard = _rotateBoardClockwise(workingBoard);
          allMirrors.push({
            flip_h: false,
            rotate: counter * 90,
            stateKey: _boardArrayToStateKey(workingBoard)
          });
          counter ++;
        }
      }

      // flip original horizontally
      if(settings.flip_h){
        // go back to original board
        workingBoard = _flipHBoard(angular.copy(boardArray));

        allMirrors.push({
          flip_h: true,
          rotate: 0,
          stateKey: _boardArrayToStateKey(workingBoard)
        });
      }

      // add rotations to flipped board
      if(settings.rotate){
        counter = 1;
        while(counter < 4){

          workingBoard = _rotateBoardClockwise(workingBoard);
          allMirrors.push({
            flip_h: true,
            rotate: counter * 90,
            stateKey: _boardArrayToStateKey(workingBoard)
          });
          counter ++;
        }
      }

      var uniqueMirrors = [];

      allMirrors.forEach(function(mirrorObj){
        if(uniqueMirrors.map(function(mirror){
          return mirror.stateKey;
        }).indexOf(mirrorObj.stateKey) === -1){
          uniqueMirrors.push(mirrorObj);
        }
      });

      return uniqueMirrors;
    };



    this.applyMirror = function(stateArray, rotate, flip_h, settings){

      if(!_validateSettings(stateArray, settings)){
        return; // an error will have been thrown
      }

      // @NOTE we must flip horizontal first and then rotate (clockwise) last
      // see https://docs.google.com/spreadsheets/d/1DLHyyJEr0kAwz1FuHgTp8qwTDTVKlbD5xA9Er7rEMEs/edit?usp=sharing

      // make 2D board array from the 1D 'stateArray' input
      // @NOTE settings.grid[1] is number of columns
      var boardArray = _makeBoardArrayFromStateArray(stateArray, settings.grid[1]);

      if(flip_h){
        boardArray = _flipHBoard(boardArray);
      }

      if(rotate){
        var rotated = 0;
        while(rotated < rotate){
          boardArray = _rotateBoardClockwise(boardArray);
          rotated += 90;
        }
      }

      return _boardArrayToStateArray(boardArray);
    };



    this.revertMirror = function(mirroredStateArray, rotate, flip_h, settings){

      if(!_validateSettings(mirroredStateArray, settings)){
        return; // an error will have been thrown
      }


      // @NOTE we must rotate first (anticlockwise) and then flip horizontal last
      // see https://docs.google.com/spreadsheets/d/1DLHyyJEr0kAwz1FuHgTp8qwTDTVKlbD5xA9Er7rEMEs/edit?usp=sharing

      // make 2D board array from the 1D 'stateArray' input
      // @NOTE settings.grid[1] is number of columns
      var boardArray = _makeBoardArrayFromStateArray(mirroredStateArray, settings.grid[1]);

      if(rotate){
        var rotated = 0;
        while(rotated < rotate){
          boardArray = _rotateBoardAntiClockwise(boardArray);
          rotated += 90;
        }
      }

      if(flip_h){
        boardArray = _flipHBoard(boardArray);
      }

      return _boardArrayToStateArray(boardArray);
    };
  });


}());
