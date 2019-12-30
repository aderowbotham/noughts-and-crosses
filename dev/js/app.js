(function(){

  "use strict";

  angular.module("noughts", [])

  .config(function($httpProvider, $logProvider) {
    $httpProvider.defaults.headers.post["Content-Type"] = "application/json";
    $logProvider.debugEnabled(true);
  })

  // .constant("FOO", "bar")

  .directive("ngNoughtsGameboard", function($log){

    return {
      restrict: "A",
      scope: {},
      templateUrl: "partials/nc-board.html",


      link: function(scope, el) {

        scope.onResize = function(){
          scopeRef.containerHeight = $(".buy-panel").outerHeight(true);
        };

        // scope.test = "test var FOO = " + FOO;
      }

    };

  });
}());
