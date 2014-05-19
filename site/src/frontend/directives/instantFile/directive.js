module.exports = function instantFileDirective() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    controller: ['$scope', '$location', 'host', function($scope, $location, host) {
      $scope.selectFile = function() {
        var input = document.createElement('input');
        input.type = 'file';

        angular.element(input).bind('change', function(e) {
          host.file = e.target.files[0];
          $location.path(host.file.name);

          $scope.$digest(); // Necessary for $location.path to actually do something
        });

        input.click();
      };

      $scope.$watch('droppedFile', function(droppedFile) {
        host.file = droppedFile;
        
        if (droppedFile) {
          $location.path(host.file.name);
        }
      });
    }]
  };
};