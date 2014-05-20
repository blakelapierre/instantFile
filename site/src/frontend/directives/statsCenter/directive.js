module.exports = function() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    scope: {
      file: '=',
      transfers: '=',
      connections: '='
    },
    controller: ['$scope', 'host', function($scope, host) {
      if (host.file) $scope.showUrl = true;

      $scope.currentUrl = window.location.toString();
    }]
  };
};