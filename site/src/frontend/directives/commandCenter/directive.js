module.exports = function commandCenterDirective() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    controller: ['$scope', '$location', 'host', 'rtc', function($scope, $location, host, rtc) {

      var room = $location.path().substr(1),
          roomManager = rtc.roomManager;

      $scope.transfers = [];
      $scope.file = host.file;

      roomManager.on('connections', function(connections) {
        console.log(connections);
        $scope.connections = connections;
        roomManager.fire('ready');
        $scope.$digest();
      });

      roomManager.on('new connection', function(data) {
        console.log('new connection');
        $scope.connections = roomManager.connections;
        console.log($scope.connections);
        $scope.$digest();
      });

      roomManager.on('disconnect stream', function(data) {
        console.log('disconnected', data);
        $scope.$apply();
      });

      var channelManager = {};
      if (host.file) {
        roomManager.on('data stream data', function(channel, message) {
          if (message == room) {
            $scope.sendStats = rtc.sendFile(channel, host.file, function(stats) {
              $scope.sendStats = stats;
              $scope.$apply();
            });
          }
        });
      }
      else {
        rtc.launchCommandCenter(room, function(handle) {
          console.log('connected, your handle', handle, rtc);
          rtc.requestFile(room, room);
        });

        roomManager.on('data stream open', function(channel) {
          console.log(channel);
          channel.send(room);
        });

        roomManager.on('data stream data', function(channel, message) {
          
          var incoming = channelManager[channel];
          if (incoming) {
            var now = new Date().getTime(),
                stats = incoming.stats;

            incoming.buffers.push(message);

            incoming.position += message.byteLength || message.size; // Firefox uses 'size'

            stats.received = incoming.position;
            stats.total = incoming.byteLength;
            stats.downSpeed = incoming.position / (now - incoming.start) * 1000;
      
            if (incoming.position == incoming.byteLength) {
              var blob = new Blob(incoming.buffers, {type: incoming.type});

              $scope.file = blob;

              var a = document.createElement('a');
              document.body.appendChild(a); // Firefox apparently needs this
              a.href = window.URL.createObjectURL(blob);
              a.download = incoming.name;
              a.click();
              a.remove();
            }
          }
          else {
            var parts = message.toString().split(';'),
                byteLength = parseInt(parts[0]),
                name = parts[1],
                type = parts[2];

            var stats = {
              received: 0,
              total: byteLength,
              downSpeed: 0
            };

            $scope.transfers.push(stats);

            channelManager[channel] = {
              byteLength: byteLength,
              name: name,
              type: type,
              stats: stats,
              position: 0,
              buffers: [],
              start: new Date().getTime()
            };
          }
          $scope.$apply();
        });
      }
    }]
  };
};