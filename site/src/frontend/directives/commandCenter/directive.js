module.exports = function commandCenterDirective() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    controller: ['$scope', '$location', 'host', 'rtc', function($scope, $location, host, rtc) {

      var room = $location.path();

      $scope.transfers = [];
console.log('joining', room);
      rtc.joinRoom(room, function(roomManager) {
        console.dir(roomManager);


        roomManager.on('connections', function(connections) {
          console.log('connections', connections);
          roomManager.fire('ready');
          // for (var i = 0; i < connections.length; i++) {
          //   var connection = connections[i];
          //   roomManager.createDataChannel(connection, 'fileTransfer');
          //   // rtc.requestFile(channel, room);
          // }
        });

        roomManager.on('new connection', function(connectionID) {
          console.log('new connection', connectionID);
        });

        var channelManager = {};
        if (host.file) {
          roomManager.on('data stream data', function(channel, message) {
            console.log('message', message);  
            if (message == room) {
              $scope.sendStats = rtc.sendFile(channel, host.file, function(stats) {
                $scope.sendStats = stats;
                $scope.$apply();
              });
            }
          });
        }
        else {
          roomManager.on('data stream open', function(channel) {
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
              stats.downSpeed = incoming.position / (now - incoming.start) / 1000;

              console.log(stats);
        
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

              console.log('Incoming', type, 'file of byteLength', byteLength, '!');

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
      });

      $scope.file = host.file;
    }]
  };
};