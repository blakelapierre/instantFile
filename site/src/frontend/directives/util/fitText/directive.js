var fitText = require('fitText');

module.exports = function() {
  return {
    restrict: 'A',
    link: function($scope, element, attributes) {
      fitText(element);
    }
  };
};