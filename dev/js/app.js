(function(){

  "use strict";

  angular.module("noughts", [])

  .config(function($httpProvider, $logProvider) {
    $httpProvider.defaults.headers.post["Content-Type"] = "application/json";
    $logProvider.debugEnabled(true);
  })


  .directive("ngNoughtsGameboard", function($log){

    return {
      replace: true,
      restrict: "A",
      scope: {},
      templateUrl: "partials/nc-board.html",

      link: function(scope, el) {

        // content of all the squares indexed 0 to 8 from top left
        scope.content = [null, null, null, null, null, null, null, null, null];

        // callback function passed to each square as a reference
        scope.clickSquare = function(squareId){
          $log.debug("clicked square " + squareId);
          scope.content[squareId] = "x";
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
        symbol: "=ngVal",
        callback: "="
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
  });




}());
