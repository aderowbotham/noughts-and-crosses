(function(){

  "use strict";

  angular.module("noughts", ["constants"])

  .config(function($httpProvider, $logProvider) {
    $httpProvider.defaults.headers.post["Content-Type"] = "application/json";
    $logProvider.debugEnabled(true);
  })

  .run(function($log, GameState){
    GameState.init();
  })

  .directive("ngNoughtsGameboard", function($log, $rootScope, constants, GameState){

    function _setBoard(scope){
        scope.squares = GameState.getSquares();
        scope.status = GameState.getStatus();
    }

    return {
      replace: true,
      restrict: "A",
      scope: {},
      templateUrl: "partials/nc-board.html",

      link: function(scope, el) {

        // content of all the squares indexed 0 to 8 from top left
        _setBoard(scope);
        $rootScope.$on("resetgame", function(){
          _setBoard(scope);
        });

        scope.clickSquare = function(squareId){
          var currentPlayer = GameState.getCurrentPlayer();
          GameState.clickSquare(currentPlayer, squareId);
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
        scope.status = GameState.getStatus();

        $rootScope.$on("resetgame", function(e, params){
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
  });




}());
