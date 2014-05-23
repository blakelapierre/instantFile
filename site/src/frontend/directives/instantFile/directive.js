module.exports = function instantFileDirective() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    controller: ['$scope', '$location', 'host', 'rtc2', function($scope, $location, host, rtc2) {
      $scope.activateInstantFile = function() {
        var path = $location.path();
        if (path == '/' || path == '') $scope.promptForFile();
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
        var signal = rtc2.connectToSignal('//' + window.location.host);
        signal.on('ready', function(handle) {
          console.log('ready');
          $location.path(handle);
          $scope.$digest();
        });
      
      };
    }]
  };
};