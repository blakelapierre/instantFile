var _ = require('lodash');

module.exports = function commandCenterDirective() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    controller: ['$scope', '$location', 'host', 'rtc', 'rtc2', function($scope, $location, host, rtc, rtc2) {
      var room = $location.path().substr(1),
          roomManager = {},
          signal = rtc2.connectToSignal('//' + window.location.host);

      $scope.peers = [];

      signal.joinRoom(room);

      signal.on({
        'peer added': function(peer) {
          console.log(peer);
          $scope.peers.push(peer);
          console.log(signal.myID, room);
          if (signal.myID == room) {
            peer.connect();
            var channel = peer.createChannel('instafile.io', {}, {
              open: function() {
                console.log('open');
                channel.send('test');
              }
            });
          }
          $scope.$apply();
        },
        'peer removed': function(peer) {
          console.log('peer removed');
          _.remove($scope.peers, function(p) { return p == peer; });
          $scope.$apply();
        },
        'peer ice_candidate': function(peer, candidate) {
        },
        'peer receive offer': function(peer, offer) {
          console.log('peer receive offer', peer, offer);
        },
        'peer receive answer': function(peer, answer) {
          console.log('peer receive answer');
        },
        'peer send offer': function(peer, offer) {
        },
        'peer send answer': function(peer, offer) {
          console.log('peer send answer');
        },
        'peer signaling_state_change': function(peer, event) {
          console.log('peer signaling_state_change', arguments);
        },
        'peer data_channel connected': function(peer, channel, handlers) {
          console.log('peer data_channel connected', peer, channel, handlers);
        },
        'peer error send offer': function(peer, error, offer) {
          console.log('peer error send offer', error);
        },
        'peer error send answer': function(peer, error, answer) {
          console.log('peer error send answer', error);
        },
        'peer error set_remote_description': function(peer, error) {
          console.log('peer error set_remote_description', error);
        }
      });

      $scope.transfers = [];
      $scope.file = host.file;

      if (host.file) {

      }
      else {
      }

      // roomManager.on('connections', function(connections) {
      //   console.log(connections);
      //   if (connections.length == 0) {
      //     // $location.path('/');
      //     // $scope.$apply();
      //     return;
      //   }
      //   $scope.connections = connections;
      //   roomManager.fire('ready');
      //   $scope.$apply();
      // });

      // roomManager.on('new connection', function(data) {
      //   console.log('new connection');
      //   $scope.connections = roomManager.connections;
      //   console.log($scope.connections);
      //   $scope.$apply();
      // });

      // roomManager.on('disconnect stream', function(data) {
      //   console.log('disconnected', data);
      //   $scope.$apply();
      // });

      // var channelManager = {};
      // if (host.file) {
      //   roomManager.on('data stream data', function(connection, channel, message) {
      //     if (message == room) {
      //       var transfer = rtc.sendFile(channel, host.file, function(stats) {
      //         $scope.$apply(); // throttle this
      //       });
            
      //       transfer.id = channel.id;

      //       $scope.transfers.push(transfer);
      //     }
      //   });

      //   roomManager.on('data stream close', function(channel) {
      //     console.log('close', channel);
      //     _.remove($scope.transfers, function(transfer) {
      //       return transfer.id === channel.id;
      //     });
      //   });
      // }
      // else {
      //   signal.joinRoom(room);

      //   roomManager.on('data stream open', function(channel) {
      //     console.log('open', channel);
      //     channel.send(room);
      //   });

      //   var queueApply = _.throttle(function() {
      //     $scope.$apply();
      //   }, 100);

      //   roomManager.on('data stream data', function(connection, channel, message) {
      //     var incoming = channelManager[connection];
      //     if (incoming) {
      //       var now = new Date().getTime(),
      //           stats = incoming.stats;

      //       incoming.buffers.push(message);

      //       incoming.position += message.byteLength || message.size; // Firefox uses 'size'

      //       stats.transferred = incoming.position;
      //       stats.total = incoming.byteLength;
      //       stats.progress = stats.transferred / stats.total;
      //       stats.speed = incoming.position / (now - incoming.start) * 1000;
      
      //       if (incoming.position == incoming.byteLength) {
      //         var blob = new Blob(incoming.buffers, {type: incoming.type});

      //         $scope.file = blob;

      //         var a = document.createElement('a');
      //         document.body.appendChild(a); // Firefox apparently needs this
      //         a.href = window.URL.createObjectURL(blob);
      //         a.download = incoming.name;
      //         a.click();
      //         a.remove();
      //       }
      //     }
      //     else {
      //       var parts = message.toString().split(';'),
      //           byteLength = parseInt(parts[0]),
      //           name = parts[1],
      //           type = parts[2];

      //       if (parts.length == 3) {

      //         var stats = {
      //           transferred: 0,
      //           total: byteLength,
      //           speed: 0
      //         };

      //         $scope.transfers.push(stats);

      //         channelManager[connection] = {
      //           byteLength: byteLength,
      //           name: name,
      //           type: type,
      //           stats: stats,
      //           position: 0,
      //           buffers: [],
      //           start: new Date().getTime()
      //         };
      //       }
      //     }

      //     queueApply();
      //   });
      // }
    }]
  };
};