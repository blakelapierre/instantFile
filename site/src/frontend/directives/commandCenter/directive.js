module.exports = function commandCenterDirective() {
  return {
    restrict: 'E',
    template: require('./template.html'),
    controller: ['$scope', '$location', 'host', 'rtc', function($scope, $location, host, rtc) {

      var room = $location.path();

      $scope.transfers = [];
      rtc.joinRoom(room, function(roomManager) {

        roomManager.on('connections', function(connections) {
          console.log('connections', connections);
          roomManager.fire('ready');
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
            console.log('channel', channel);
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

console.log(incoming.mediaSource, incoming.mediaSource.activeSourceBuffers);
              if (incoming.mediaSource && incoming.mediaSource.activeSourceBuffers.length > 0) {
                incoming.mediaSource.activeSourceBuffers[0].appendBuffer(message);
              }
        
              if (incoming.position == incoming.byteLength) {
                if (incoming.mediaSource) incoming.mediaSource.endOfStream();
                var blob = new Blob(incoming.buffers, {type: incoming.type});

                //$scope.file = blob;

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

              console.log('Incoming', type, 'file of byteLength', byteLength, '!', message);

              var buffers = [];

              var mediaSource;
              if (type && type.indexOf('video') == 0) {
                mediaSource = new MediaSource();
                mediaSource.addEventListener('sourceopen', function() {
                  console.log('mediaSource open!');
                  mediaSource.sourceBuffer = mediaSource.addSourceBuffer('video/mpeg4-generic;'); // type + '; codecs="avc1.bullshit"'
                  //for (var i = 0; i < buffers.length; i++) mediaSource.sourceBuffer.appendBuffer(buffers[i]);
                });
                mediaSource.type = type;
                $scope.file = mediaSource;
              }

              channelManager[channel] = {
                byteLength: byteLength,
                name: name,
                type: 'video/mpeg4-generic', //type,
                stats: stats,
                position: 0,
                buffers: buffers,
                mediaSource: mediaSource,
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