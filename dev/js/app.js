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

  .directive("ngNoughtsGameboard", function($log, constants, GameState){

    return {
      replace: true,
      restrict: "A",
      scope: {},
      templateUrl: "partials/nc-board.html",

      link: function(scope, el) {

        // content of all the squares indexed 0 to 8 from top left
        scope.squares = GameState.getSquares();

        scope.status = GameState.getStatus();

        // callback function passed to each square as a reference
        // scope.clickSquare = function(squareId){
        //   $log.debug("clicked square " + squareId);
        //   scope.content[squareId] = "x";
        // };

        scope.clickSquare = function(squareId){

          var currentPlayer = GameState.getCurrentPlayer();

          GameState.clickSquare(currentPlayer, squareId);
        };


        scope.resetGame = function(){
          GameState.reset();
          scope.squares = GameState.getSquares();
          scope.status = GameState.getStatus();
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
  });




}());
