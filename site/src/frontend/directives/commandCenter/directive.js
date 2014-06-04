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

      $scope.isClient = host.file == null;
      $scope.isTransferring = false;

      signal.joinRoom(room);

      var queueApply = _.throttle(function() {
        $scope.$apply();
      }, 100);

      if ($scope.isClient) {
        (function attachBlastDoor() {

          // We are going to get these events for ALL peers
          // Here we are only interested the ones coming from the host of the room
          // This function filters those requests for us
          function ifHost(fn) {
            return function(peer, ...rest) {
              if (peer.id == room) {
                fn(peer, ...rest);
                $scope.$apply();
              }
            };
          }

          signal.on({
            'peer ice_candidate': ifHost(() => $scope.addBlastDoorsMessage('ICE Candidate Received')),
            'peer receive offer': ifHost(() => $scope.addBlastDoorsMessage('Offer Received')),
            'peer receive answer': ifHost(() => $scope.addBlastDoorsMessage('Answer Received')),
            'peer send answer': ifHost(() => $scope.addBlastDoorsMessage('Answer Sent')),
            'peer signaling_state_change': ifHost((peer) => $scope.addBlastDoorsMessage('Signaling: ' + peer.connection.signalingState)),
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
          });
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
          console.log('peer added');
          $scope.peers.push(peer);

          if (!$scope.isClient) {
            peer.connect();
            $scope.connectedPeers.push(peer); // Is this the best spot to put this? Note, we aren't even guaranteed to be able to connect to the Peer at this point
            var channel = peer.addChannel('instafile.io', {}, fileServeHandlers($scope, host, room, (transfer) => {
              $scope.currentTransfer = transfer;
            }));
          }

          if (peer.id == room) {
            $scope.addBlastDoorsMessage('Peer Alive.........Connecting');

            peer.on({
              'channel added': (channel) => {
                channel.on(fileReceiveHandlers(room, (transfer) => {
                  $scope.file = transfer.file;
                  $scope.streamSrc = transfer.src;
                  $scope.isTransferring = transfer.progress < 1;
                  $scope.currentTransfer = transfer;
                  queueApply();
                }));
              },
              'channel removed': (channel) => {
                console.log('!!!!! channel removed', channel);
                $scope.$apply();
              }
            });
          }

          $scope.$apply();
        },
        'peer removed': (peer) => {
          console.log('peer removed', peer);
          $scope.oldPeers.push(peer);
          _.remove($scope.peers, (p) => { return p == peer; });
          _.remove($scope.connectedPeers, (p) => { return p == peer; });
          $scope.$apply();
        },
        'peer ice_candidate accepted': (peer, candidate) => { },
        'peer receive offer': (peer, offer) => {
          peer.status = 'Received Offer';
          $scope.$apply();
        },
        'peer receive answer': (peer, answer) => { },
        'peer send offer': (peer, offer) => { },
        'peer send answer': (peer, offer) => { },
        'peer signaling_state_change': (peer, event) => {
          $scope.signalingState = peer.connection.signalingState;
          $scope.$apply();
        },
        'peer ice_connection_state_change': (peer, event) => {
          $scope.iceConnectionState = peer.connection.iceConnectionState;
          $scope.$apply();
        },
        'peer data_channel connected': (peer, channel, handlers) => { },
        'peer error send offer': (peer, error, offer) => { },
        'peer error send answer': (peer, error, answer) => { },
        'peer error set_remote_description': (peer, error) => { }
      });

      $scope.transfers = [];
      $scope.file = host.file;
    }]
  };
};