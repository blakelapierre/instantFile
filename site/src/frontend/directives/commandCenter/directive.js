var _ = require('lodash');

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
        if (connections.length == 0) {
          // $location.path('/');
          // $scope.$apply();
          return;
        }
        $scope.connections = connections;
        roomManager.fire('ready');
        $scope.$apply();
      });

      roomManager.on('new connection', function(data) {
        console.log('new connection');
        $scope.connections = roomManager.connections;
        console.log($scope.connections);
        $scope.$apply();
      });

      roomManager.on('disconnect stream', function(data) {
        console.log('disconnected', data);
        $scope.$apply();
      });

      var channelManager = {};
      if (host.file) {
        roomManager.on('data stream data', function(connection, channel, message) {
          if (message == room) {
            var transfer = rtc.sendFile(channel, host.file, function(stats) {
              $scope.$apply(); // throttle this
            });
            
            transfer.id = channel.id;

            $scope.transfers.push(transfer);
          }
        });

        roomManager.on('data stream close', function(channel) {
          console.log('close', channel);
          _.remove($scope.transfers, function(transfer) {
            return transfer.id === channel.id;
          });
        });
      }
      else {
        roomManager.on('data stream open', function(channel) {
          console.log('open', channel);
          channel.send(room);
        });

        var queueApply = _.throttle(function() {
          $scope.$apply();
        }, 50);

        roomManager.on('data stream data', function(connection, channel, message) {
          var incoming = channelManager[connection];
          if (incoming) {
            var now = new Date().getTime(),
                stats = incoming.stats;

            incoming.buffers.push(message);

            incoming.position += message.byteLength || message.size; // Firefox uses 'size'

            stats.transferred = incoming.position;
            stats.total = incoming.byteLength;
            stats.progress = stats.transferred / stats.total;
            stats.speed = incoming.position / (now - incoming.start) * 1000;
      
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

            if (parts.length == 3) {

              var stats = {
                transferred: 0,
                total: byteLength,
                speed: 0
              };

              $scope.transfers.push(stats);

              channelManager[connection] = {
                byteLength: byteLength,
                name: name,
                type: type,
                stats: stats,
                position: 0,
                buffers: [],
                start: new Date().getTime()
              };
            }
          }

          queueApply();
        });

        rtc.launchCommandCenter(room, function(handle) {
          console.log('connected, your handle', handle, rtc);
          rtc.requestFile(room, room);
        });
      }
    }]
  };
};