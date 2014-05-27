var bigText = require('bigText'),
    jQuery = require('jQuery');

module.exports = function() {
  return {
    restrict: 'A',
    link: function($scope, element, attributes) {
      console.log('bigtext', element);
      jQuery(element[0]).bigtext();
    }
  };
};