var _ = require('lodash');

module.exports = function commandCenterDirective() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    require: '^instantFile',
    link: function($scope, element, attributes, instantFile) {
      $scope.addBlastDoorsMessage = instantFile.addBlastDoorsMessage;
      $scope.openBlastDoors = instantFile.openBlastDoors;
      $scope.closeBlastDoors = instantFile.closeBlastDoors;
    },
    controller: ['$scope', '$location', 'host', 'rtc', function($scope, $location, host, rtc) {
      var room = $location.path().substr(1),
          roomManager = {},
          signal = rtc.connectToSignal('//' + window.location.host);

  
      $scope.peers = [];
      $scope.connectedPeers = [];
      $scope.oldPeers = [];

      $scope.signalingState = 'no peers';
      $scope.iceConnectionState = 'no peers';

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

      if (host.file == null) {
        (function attachBlastDoor() {
          var handlers = {
            'peer ice_candidate': function(peer, candidate) {
              if (peer.id == room) {
                //$scope.blastDoorMessages.push('ICE Candidate Received');
              }
              $scope.$apply();
            },
            'peer receive offer': function(peer, offer) {
              if (peer.id == room) {
                $scope.addBlastDoorsMessage('Offer Received');
              }
              $scope.$apply();
            },
            'peer receive answer': function(peer, answer) {
              if (peer.id == room) {
                $scope.addBlastDoorsMessage('Answer Received');
              }
              $scope.$apply();
            },
            'peer send answer': function(peer, offer) {
              if (peer.id == room) {
                $scope.addBlastDoorsMessage('Answer Sent');
              }
              $scope.$apply();
            },
            'peer signaling_state_change': function(peer, event) {
              if (peer.id == room) {
                var connection = peer.peerConnection;
                $scope.addBlastDoorsMessage('Signalling: ' + connection.signalingState + ', ICE: ' + connection.iceConnectionState);
              }
              $scope.$apply();
            },
            'peer ice_connection_state_change': function(peer, event) {
              if (peer.id == room) {
                var state = peer.peerConnection.iceConnectionState;
                $scope.addBlastDoorsMessage('ICE: ' + state);
                if (state == 'connected') {
                  setTimeout(function() {
                    $scope.openBlastDoors();
                    $scope.$apply();
                  }, 1000);
                }
              }
              $scope.$apply();
            }
          };
          signal.on(handlers);
        })();
      }

      signal.on({
        'peer list': function(roomName, peerIDs) {
          if (signal.myID != room && roomName == room) {
            if (peerIDs.indexOf(room) == -1) {
              $scope.addBlastDoorsMessage('Sorry, the host has left.');
              $scope.addBlastDoorsMessage('Taking you to front page.');
              $scope.openBlastDoors();
              $location.path('/');
              $scope.$apply();
            }
          }
        },
        'peer added': function(peer) {
          console.log(peer);
          $scope.peers.push(peer);

          if (signal.myID == room) {
            peer.connect();
            $scope.connectedPeers.push(peer); // Is this the best spot to put this? Note, we aren't even guaranteed to be able to connect to the Peer at this point
            var channel = peer.createChannel('instafile.io', {}, fileServeHandlers());
          }

          if (peer.id == room) {
            $scope.addBlastDoorsMessage('Peer Alive.........Connecting');
          }

          $scope.$apply();
        },
        'peer removed': function(peer) {
          console.log('peer removed', peer);
          $scope.oldPeers.push(peer);
          _.remove($scope.peers, function(p) { return p == peer; });
          _.remove($scope.connectedPeers, function(p) { return p == peer; });
          $scope.$apply();
        },
        'peer ice_candidate': function(peer, candidate) {
          console.log('peer ice_candidate', peer, candidate);
        },
        'peer receive offer': function(peer, offer) {
          console.log('peer receive offer', peer, offer);
          peer.status = 'Received Offer';
          $scope.$apply();
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
          $scope.signalingState = peer.peerConnection.signalingState;
          $scope.$apply();
        },
        'peer ice_connection_state_change': function(peer, event) {
          $scope.iceConnectionState = peer.peerConnection.iceConnectionState;
          $scope.$apply();
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


/* possible to use with unreliable transport 
          acknowledgedChunkSeq

          for (var seq = acknowledgedChunkSeq + 1; seq < chunkSeq; seq++) {
            missingChunks[seq] = seq;
          }
*/
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

            // Is there a better way to do this then to just run some
            // arbitrary number of iterations each round?
            // Maybe watch the socket's buffer size?
            for (var i = 0; i < iterations; i++) {
              var now = new Date().getTime(),
                  size = Math.min(chunkSize, buffer.byteLength - offset);

              if (size > 0) {
                var chunk = buffer.slice(offset, offset + size);

                try {
                  channel.send(chunk);

                  offset += size;
                  backoff = 0;

                  if (iterations < 100) iterations++;
                } catch(e) {
                  backoff += 100;
                  stats.backoff = backoff;
                  
                  if (iterations > 1) iterations--;
                  break; // get me out of this for loop!
                }
              }

              stats.transferred = offset - channel.bufferedAmount;
              stats.speed = offset / (now - startTime) * 1000;  
              stats.progress = stats.transferred / stats.total;
              stats.backoff = backoff;

              if (stats.progress >= 1) {
                progress(stats)
                return;
              }
            }

            if (progress) progress(stats);

            if (stats.transferred < buffer.byteLength) setTimeout(sendChunk, backoff);
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