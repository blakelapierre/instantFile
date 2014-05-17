var webRTC = require('webrtc.io');

module.exports = function commandCenterDirective() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    controller: ['$scope', '$location', 'host', function($scope, $location, host) {

      var room = $location.hash(),
          url = 'ws://' + $location.host() + ':2776';

      webRTC.connect(url, room);

      console.dir(webRTC);

      var droppedFile = host.droppedFile;

      $scope.file = droppedFile;
    }]
  };
};