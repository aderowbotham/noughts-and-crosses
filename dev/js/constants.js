(function(){

  "use strict";

  angular.module("constants", [])
  .constant("ERRORS", {
    FOO: "error_foo"
  })
  .constant("constants", {
    PLAYER_HUMAN: "Human",
    PLAYER_COMPUTER: "Computer"
  });

}());
