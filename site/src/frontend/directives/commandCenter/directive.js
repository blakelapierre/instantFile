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

      var queueApply = _.throttle(function() {
        $scope.$apply();
      }, 100);

      if (host.file == null) {
        (function attachBlastDoor() {
          function ifHost(fn) {
            return function(peer, ...rest) {
              if (peer.id == room) {
                fn(peer, ...rest);
                $scope.$apply();
              }
            };
          }

          var handlers = {
            'peer ice_candidate': ifHost(() => $scope.addBlastDoorsMessage('ICE Candidate Received')),
            'peer receive offer': ifHost(() => $scope.addBlastDoorsMessage('Offer Received')),
            'peer receive answer': ifHost(() => $scope.addBlastDoorsMessage('Answer Received')),
            'peer send answer': ifHost(() => $scope.addBlastDoorsMessage('Answer Sent')),
            'peer signaling_state_change': ifHost((peer) => {  
              var connection = peer.connection;
              $scope.addBlastDoorsMessage('Signaling: ' + connection.signalingState + ', ICE: ' + connection.iceConnectionState);
            }),
            'peer ice_connection_state_change': ifHost((peer) => {
              var state = peer.connection.iceConnectionState;
              $scope.addBlastDoorsMessage('ICE: ' + state);
              if (state == 'connected') {
                setTimeout(function() {
                  $scope.openBlastDoors();
                  $scope.$apply();
                }, 1000);
              }
            })
          };
          signal.on(handlers);
        })();
      }

      signal.on({
        'peer list': function(data) {
          var {roomName, peerIDs} = data;

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
                channel.on(fileReceiveHandlers(room, (transfer) => {
                  $scope.file = transfer.file;
                  queueApply();
                }));
              },
              'channel removed': (channel) => {
                $scope.$apply();
              }
            });
          }

          $scope.$apply();
        },
        'peer removed': (peer) => {
          $scope.oldPeers.push(peer);
          _.remove($scope.peers, function(p) { return p == peer; });
          _.remove($scope.connectedPeers, function(p) { return p == peer; });
          $scope.$apply();
        },
        'peer ice_candidate accepted': function(peer, candidate) {
        },
        'peer receive offer': (peer, offer) => {
          peer.status = 'Received Offer';
          $scope.$apply();
        },
        'peer receive answer': function(peer, answer) {
        },
        'peer send offer': function(peer, offer) {
        },
        'peer send answer': function(peer, offer) {
        },
        'peer signaling_state_change': (peer, event) => {
          $scope.signalingState = peer.connection.signalingState;
          $scope.$apply();
        },
        'peer ice_connection_state_change': (peer, event) => {
          $scope.iceConnectionState = peer.connection.iceConnectionState;
          $scope.$apply();
        },
        'peer data_channel connected': function(peer, channel, handlers) {
        },
        'peer error send offer': function(peer, error, offer) {
        },
        'peer error send answer': function(peer, error, answer) {
        },
        'peer error set_remote_description': function(peer, error) {
        }
      });

      $scope.transfers = [];
      $scope.file = host.file;
    }]
  };
};