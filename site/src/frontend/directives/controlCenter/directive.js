module.exports = function controlCenterDirective() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    controller: ['$scope', 'host', function($scope, host) {
      if (host.file) {
        $scope.showInfo = true;
      }
      $scope.currentUrl = window.location.toString();
    }]
  };
};