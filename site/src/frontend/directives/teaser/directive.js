module.exports = function() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    controller: ['$scope', 'host', function($scope, host) {
      host.file = null;
    }]
  }
};