(function(){

  "use strict";

  angular.module("noughts", [])

  .config(function($httpProvider, $logProvider) {
    $httpProvider.defaults.headers.post["Content-Type"] = "application/json";
    $logProvider.debugEnabled(true);
  })

  .constant("FOO", "bar")

  .directive("ngNoughts", function($log, FOO){

    return {
      restrict: "A",

      link: function(scope) {
        $log.debug("linked ngNoughts directive");

        scope.test = "test var FOO = " + FOO;
      }

    };

  });

}());
