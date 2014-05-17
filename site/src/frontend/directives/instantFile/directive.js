module.exports = function instantFileDirective() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    link: function($scope, element, attributes) {

    },
    controller: ['$scope', '$location', 'host', function($scope, $location, host) {
      $scope.$watch('droppedFile', function(droppedFile) {
        host.file = droppedFile;
        
        if (droppedFile) {
          $location.path(droppedFile.name);
        }
      });
    }]
  };
};