module.exports = function commandCenterDirective() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    controller: ['$scope', '$location', 'host', 'rtc', function($scope, $location, host, rtc) {

      var room = $location.hash();

      rtc.joinRoom(room, function(roomManager) {
        roomManager.on('connections', function(connections) {
          console.log('connections', connections);
        });

        roomManager.on('new connection', function(connectionID) {
          console.log('new connection', connectionID);
        });
      });

      $scope.file = host.file;
    }]
  };
};