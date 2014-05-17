var webRTC = require('webrtc.io');

module.exports = function commandCenterDirective() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    controller: ['$scope', '$location', 'host', 'rtc', function($scope, $location, host, rtc) {

      var room = $location.hash();

      rtc.joinRoom(room)

      $scope.file = host.file;
    }]
  };
};