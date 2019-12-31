(function(){

  "use strict";

  angular.module("noughts", ["constants", "mlengine", "LocalStorageModule"])



  .config(function($httpProvider, $logProvider) {
    $httpProvider.defaults.headers.post["Content-Type"] = "application/json";
    $logProvider.debugEnabled(true);
  })



  .run(function($log, $rootScope, GameState, ComputerPlayer){
    GameState.init("noughts_v1");
    ComputerPlayer.init(GameState, { startingScores: 10 }, "noughts_v1");

    // notify the computer that it's its turn
    $rootScope.$broadcast("turn_notify", {turn: GameState.getGameStatus().turn});
  })



  .directive("ngNoughtsGameboard", function($log, $rootScope, constants, GameState){

    function _setBoard(scope){
      scope.squares = GameState.getSquares();
      scope.status = GameState.getGameStatus();
    }

    return {
      replace: true,
      restrict: "A",
      scope: {},
      templateUrl: "partials/nc-board.html",

      link: function(scope, el) {

        // content of all the squares indexed 0 to 8 from top left
        _setBoard(scope);
        $rootScope.$on("reset_game", function(){
          _setBoard(scope);
          $rootScope.$broadcast("turn_notify", {turn: GameState.getGameStatus().turn});
        });

        scope.clickSquare = function(squareId){
          GameState.playInSquare(constants.PLAYER_HUMAN, squareId);
        };
      }
    };
  })


  .directive("ngGameSquare", function($log){

    return {
      replace: true,
      restrict: "A",
      scope: {
        squareId: "@ngGameSquare",
        data: "=ngData",
        callback: "=",
        status: "=ngStatus"
      },
      templateUrl: "partials/nc-square.html",
      link: function(scope, el) {

        // ensure attribute is stored as a number
        scope.squareId = parseInt(scope.squareId);

        scope.displayVal = "";

        scope.$watch("data", function(nv){

          scope.displayVal = "";
          if(nv.val === "x"){
            scope.displayVal = "✕";
          } else if(nv.val === "o"){
            scope.displayVal = "◯";
          }

        }, true);

        // call callback function passing the ID
        scope.click = function(){
          scope.callback(scope.squareId);
        };
      }
    };
  })


  // non isolated scope
  .directive("ngGameStatusPanel", function($log, $rootScope, GameState){
    return {
      restrict: "A",
      link: function(scope){
        scope.game = GameState.getGameStatus();
        scope.status = GameState.getStatus();

        $rootScope.$on("reset_game", function(){
          scope.game = GameState.getGameStatus();
          scope.status = GameState.getStatus();
        });
      }
    };
  })


  .directive("resetButton", function($log, GameState){
    return {
      restrict: "C",
      link: function(scope){
        scope.resetGame = function(){
          GameState.reset();
        };

      }
    };
  })

  .directive("hardResetButton", function($log, $window, GameState){
    return {
      restrict: "C",
      link: function(scope){
        scope.hardResetGame = function(){
          if($window.confirm("Are you sure you want to reset the memory?")){
            GameState.hardReset();
          }
        };

      }
    };
  });


  angular.module("constants", [])
  .constant("ERRORS", {
    FOO: "error_foo"
  })
  .constant("constants", {
    PLAYER_HUMAN: "Human",
    PLAYER_COMPUTER: "Computer",
    STATE_DRAW: "draw"
  });




}());
