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
    controller: [ '$scope',
                  '$location', 
                  'host', 
                  'rtc', 
                  'fileServeHandlers', 
                  'fileReceiveHandlers', 
      function($scope, $location, host, rtc, fileServeHandlers, fileReceiveHandlers) {

      var room = $location.path().substr(1),
          roomManager = {},
          signal = rtc.connectToSignal('https://' + window.location.host);

  
      $scope.peers = [];
      $scope.connectedPeers = [];
      $scope.oldPeers = [];

      $scope.signalingState = 'no peers';
      $scope.iceConnectionState = 'no peers';

      signal.joinRoom(room);

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
                var connection = peer.connection;
                $scope.addBlastDoorsMessage('Signalling: ' + connection.signalingState + ', ICE: ' + connection.iceConnectionState);
              }
              $scope.$apply();
            },
            'peer ice_connection_state_change': function(peer, event) {
              if (peer.id == room) {
                var state = peer.connection.iceConnectionState;
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
        'peer list': function(data) {
          var {roomName, peerIDs} = data;

          console.log('peer list');
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
            var channel = peer.addChannel('instafile.io', {}, fileServeHandlers($scope, host, room));
          }

          if (peer.id == room) {
            $scope.addBlastDoorsMessage('Peer Alive.........Connecting');

            peer.on({
              'channel added': (channel) => {
                console.log('channel added', channel);
                channel.on(fileReceiveHandlers($scope, room));
                $scope.$apply();
              },
              'channel removed': (channel) => {
                console.log('channel removed', channel);
                $scope.$apply();
              }
            });
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
        'peer ice_candidate accepted': function(peer, candidate) {
          console.log('peer ice_candidate accepted', peer, candidate);
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
          $scope.signalingState = peer.connection.signalingState;
          $scope.$apply();
        },
        'peer ice_connection_state_change': function(peer, event) {
          $scope.iceConnectionState = peer.connection.iceConnectionState;
          $scope.$apply();
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
    }]
  };
};