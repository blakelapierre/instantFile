module.exports = function() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    scope: {
      peer: '='
    },
    controller: ['$scope', function($scope) {
    }]
  }
};