module.exports = ['$sce', function commandCenterDirective($sce) {
  return {
    restrict: 'E',
    template: require('./template.html'),
    controller: ['$scope', 'host', function($scope, host) {
      var droppedFile = host.droppedFile;

      $scope.file = droppedFile;
    }]
  };
}];