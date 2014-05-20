module.exports = function instantFileDirective() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    controller: ['$scope', '$location', 'host', 'rtc', function($scope, $location, host, rtc) {
      $scope.activateInstantFile = function() {
        if (host.file == null) $scope.promptForFile();
      };

      $scope.promptForFile = function() {
        var input = document.createElement('input');
        input.type = 'file';

        angular.element(input).bind('change', function(e) {
          host.file = e.target.files[0];
          launchCommandCenter();
        });

        input.click();
      };

      $scope.$watch('droppedFile', function(droppedFile) {
        host.file = droppedFile;
        
        if (droppedFile) {
          launchCommandCenter();
        }
      });

      function launchCommandCenter() {
        rtc.launchCommandCenter(host, function(handle) {
          $location.path(handle);
          $scope.$digest();
        });
      }
    }]
  };
};