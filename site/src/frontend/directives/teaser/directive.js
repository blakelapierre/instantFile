module.exports = function() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    require: '^instantFile',
    link: function($scope, element, attributes, instantFile) {
      // maybe extract this out to a factory?
      setTimeout(function() {
        instantFile.openBlastDoors();
        $scope.$apply();
      }, 900);
    },
    controller: ['$scope', 'host', 'rtc', function($scope, host, rtc) {
      host.file = null;
      

      var signal = rtc.existingSignal();

      if (signal) {
        signal.leaveRooms();
      }
    }]
  }
};