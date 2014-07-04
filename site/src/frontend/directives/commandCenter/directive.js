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
                  'chatServeHandlers',
                  'chatReceiveHandlers',
      function($scope, $location, host, rtc, fileServeHandlers, fileReceiveHandlers, chatServeHandlers, chatReceiveHandlers) {

      var room = $location.path().substr(1),
          roomManager = {},
          // Don't want this (should be a single call that handles this case)
          signal = rtc.existingSignal() || rtc.connectToSignal('https://' + window.location.host);


      $scope.peers = [];
      $scope.connectedPeers = [];
      $scope.oldPeers = [];

      $scope.chat = [];

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
            //'peer ice_candidate': ifHost(() => $scope.addBlastDoorsMessage('ICE Candidate Received')),
            'peer receive offer': ifHost(() => $scope.addBlastDoorsMessage('Offer Received')),
            'peer receive answer': ifHost(() => $scope.addBlastDoorsMessage('Answer Received')),
            'peer send answer': ifHost(() => $scope.addBlastDoorsMessage('Answer Sent')),
            //'peer signaling_state_change': ifHost((peer) => $scope.addBlastDoorsMessage('Signaling: ' + peer.connection.signalingState)),
            'peer ice_connection_state_change': ifHost((peer) => {
              var state = peer.connection.iceConnectionState;
              $scope.addBlastDoorsMessage('ICE: ' + state);
              if (state == 'connected') {
                setTimeout(function() {
                  $scope.openBlastDoors();
                  $scope.$apply();
                }, 1000);
              }
            }),

            'peer ice_candidate accepted': (peer, candidate) => console.log('candidate accepted', peer, candidate),

            'peer error set_local_description': (peer, error, offer) => console.log('peer error set_local_description', peer, error, offer),
            'peer error create offer': (peer, error) => console.log('peer error create offer', peer, error),
            'peer error ice_candidate': (peer, error, candidate) => console.log('peer error ice_candidate', peer, error, candidate),
            'peer error send answer': (peer, error, offer) => console.log('peer error send answer', peer, error, offer),
            'peer error set_remote_description': (peer, error, offer) => console.log('peer error set_remote_description', peer, error, offer)
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
            peer.connect()
              .then(
                peer => {
                  //Terrible placement. Fix this please
                  var chatServer = chatServeHandlers($scope.peers, (channel, message) => {
                    console.log(message);
                    $scope.chat.push(message);
                    if ($scope.chat.length > 10) $scope.chat.splice(0, 1);
                    $scope.$apply();
                  });

                  if ($scope.sendChat == null) {
                    $scope.sendChat = message => {
                      message = {peerID: room, message: message};
                      chatServer.sendMessageToAll(message);
                      $scope.chat.push(message);
                      if ($scope.chat.length > 10) $scope.chat.splice(0, 1);
                    };
                  }

                  var chatChannel = peer.addChannel('chat', {}, chatServer.handlers);

                  chatChannel.on('open', function() {
                    _.each($scope.chat, (message) => {
                      chatServer.sendMessage(peer, message);
                    });
                  });
                },
                error => console.log(error));

            $scope.connectedPeers.push(peer); // Is this the best spot to put this? Note, we aren't even guaranteed to be able to connect to the Peer at this point
            var channel = peer.addChannel('instafile.io', {}, fileServeHandlers($scope, host, room, (transfer) => {
              channel.transfer = transfer;
              $scope.currentTransfer = transfer;
            }));
          }

          if (peer.id == room) {
            $scope.addBlastDoorsMessage('Peer Alive.........Connecting');

            peer.on({
              'channel added': (channel) => {
                console.log('channel added', channel);
                if (channel.label == 'instafile.io') {
                  channel.on(fileReceiveHandlers(room, (transfer) => {
                    $scope.file = transfer.file;
                    $scope.isTransferring = transfer.progress < 1;
                    $scope.currentTransfer = transfer;
                    channel.transfer = transfer;
                    queueApply();
                  }));
                }
                else if (channel.label == 'chat') {
                  var chatClient = chatReceiveHandlers((channel, message) => {
                    console.log(message);
                    $scope.chat.push(message);
                    if ($scope.chat.length > 10) $scope.chat.splice(0, 1);
                    $scope.$apply();
                  });

                  channel.on(chatClient.handlers);

                  $scope.sendChat = message => channel.sendJSON({peerID: signal.myID, message: message});

                  peer.chatChannel = channel;
                }
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
        'peer receive offer': (peer, offer) => {
          peer.status = 'Received Offer';
          $scope.$apply();
        },
        'peer receive answer': (peer, answer) => console.log('peer receive answer', peer, answer),
        'peer send offer': (peer, offer) => console.log('peer send offer', peer, offer),
        'peer send answer': (peer, answer) => console.log('peer send answer', peer, answer),
        'peer signaling_state_change': (peer, event) => {
          $scope.signalingState = peer.connection.signalingState;
          $scope.$apply();
        },
        'peer ice_connection_state_change': (peer, event) => {
          console.log('ice_state', event);
          $scope.iceConnectionState = peer.connection.iceConnectionState;
          $scope.$apply();
        },
        'peer data_channel connected': (peer, channel, handlers) => { },
        'peer ice_candidate accepted': (peer, candidate) => console.log('candidate accepted', peer, candidate),

        'peer error set_local_description': (peer, error, offer) => console.log('peer error set_local_description', peer, error, offer),
        'peer error create offer': (peer, error) => console.log('peer error create offer', peer, error),
        'peer error ice_candidate': (peer, error, candidate) => console.log('peer error ice_candidate', peer, error, candidate),
        'peer error send answer': (peer, error, offer) => console.log('peer error send answer', peer, error, offer),
        'peer error set_remote_description': (peer, error, offer) => console.log('peer error set_remote_description', peer, error, offer)
      });

      $scope.transfers = [];
      $scope.file = host.file;
    }]
  };
};