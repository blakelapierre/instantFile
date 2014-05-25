var _ = require('lodash');

module.exports = function commandCenterDirective() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    controller: ['$scope', '$location', 'host', 'rtc', function($scope, $location, host, rtc) {
      var room = $location.path().substr(1),
          roomManager = {},
          signal = rtc.connectToSignal('//' + window.location.host);

      $scope.blastDoorsOpen = false;

      $scope.blastDoorMessages = [
        'Establishing Real-Time Encrypted Peer-to-Peer Session'
      ];

      setTimeout(function() {
        $scope.blastDoorMessages.push('Received ICE Candidate');
        $scope.$apply();
      }, 500);

      setTimeout(function() {
        $scope.blastDoorMessages.push('Connection Established');
        $scope.blastDoorsOpen = true;
        $scope.expandCommandCenter = true;
        $scope.$apply();
      }, 1500);

      $scope.peers = [];

      signal.joinRoom(room);

      var fileServeHandlers = (function() {
        var stats;
        return {
          open: function(channel) {
            channel.send('test');
          },
          close: function(channel) {
            _.remove($scope.transfers, function(s) { return s == stats; });
            $scope.$apply();
          },
          message: function(channel, message) {
            if (message == room) {
              stats = sendFile(channel, host.file, function(stats) {
                $scope.$apply();
              });
              $scope.transfers.push(stats);
            }
          },
          error: function(channel, error) {}
        }
      });

      signal.on({
        'peer added': function(peer) {
          $scope.peers.push(peer);

          if (signal.myID == room) {
            peer.connect();
            var channel = peer.createChannel('instafile.io', {}, fileServeHandlers());
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
          peer.status = 'Received Offer';
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
          attachChannel(channel, handlers);
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

      function attachChannel(channel, handlers) {
        var queueApply = _.throttle(function() {
          $scope.$apply();
        }, 50);

        handlers.open = function(channel) {
          // Request file
          channel.send(room);
        };

        handlers.close = function(channel) {

        };

        handlers.message = function(channel, message) {
          var incoming = channel.transfer;
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

              // var a = document.createElement('a');
              // document.body.appendChild(a); // Firefox apparently needs this
              // a.href = window.URL.createObjectURL(blob);
              // a.download = incoming.name;
              // a.click();
              // a.remove();
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

              channel.transfer = {
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
        };

        handlers.error = function(channel, error) {

        };

        $scope.$apply();
      };

      var fileBuffers = {};
      function getFileBuffer(file, callback) {
        var buffer = fileBuffers[file];
        if (buffer) callback(buffer);
        else {
          var reader = new FileReader();
          
          reader.onload = function(e) {
            var buffer = e.target.result;

            fileBuffers[file] = buffer;
            callback(buffer);
          };

          reader.readAsArrayBuffer(file);
        }
      };

      function sendFile(channel, file, progress) {
        var chunkSize = 64 * 1024,
            reader = new FileReader(),
            stats = {};

        getFileBuffer(file, function(buffer) {
          channel.send(buffer.byteLength + ';' + file.name + ';' + file.type);

          var offset = 0,
              backoff = 0,
              iterations = 1,
              startTime = new Date().getTime();

          stats.startTime = startTime;
          stats.transferred = 0;
          stats.total = buffer.byteLength;
          stats.speed = 0;

          channel.transfer = {stats: stats}; // A workaround for now, do we really want this?

          console.log(channel);

          function sendChunk() {
            if (channel.readyState != 'open') return;

            for (var i = 0; i < iterations; i++) {
              var now = new Date().getTime(),
                  size = Math.min(chunkSize, buffer.byteLength - offset),
                  chunk = buffer.slice(offset, offset + size);

              try {
                channel.send(chunk);

                offset += size;
                backoff = 0;

                stats.transferred = offset - channel.bufferedAmount;
                stats.speed = offset / (now - startTime) * 1000;  
                stats.progress = stats.transferred / stats.total;
                stats.backoff = backoff;

                if (iterations < 10) iterations++;
              } catch(e) {
                backoff += 100;
                stats.backoff = backoff;
                
                if (iterations > 1) iterations--;
                break; // get me out of this for loop!
              }
              if (stats.progress >= 1) {
                progress(stats)
                return;
              }
            }

            if (progress) progress(stats);

            if (offset < buffer.byteLength) setTimeout(sendChunk, backoff);
          };

          sendChunk();
        });

        return stats;
      };

      $scope.transfers = [];
      $scope.file = host.file;
    }]
  };
};