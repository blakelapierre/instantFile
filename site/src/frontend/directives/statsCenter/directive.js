module.exports = function() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    scope: {
      file: '=',
      transfers: '=',
      connections: '=',
      sendStats: '='
    },
    controller: ['$scope', 'host', function($scope, host) {
      if (host.file) {
        $scope.showUrl = true;
      }

      $scope.currentUrl = window.location.toString();

      $scope.$watch('sendStats', function(sendStats) {
        if (sendStats) $scope.showSendStats = true;
      });

      $scope.$watchCollection('connections', function(connections) {
        $scope.hasConnections = connections && connections.length > 0;
      });
    }]
  };
};