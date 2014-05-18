var webRTC = require('webrtc.io');

module.exports = ['$location', function($location) {
  function joinRoom(room, callback) {
    console.log(room);

    var url = 'ws://' + $location.host() + ':2776';

    // need to handle subsequent calls of this function correctly
    webRTC.connect(url, room);

    callback(webRTC);
  };

  function requestFile(peerConnectionID, fileName) {
    var channel = rtc.dataChannels[peerConnectionID];
    console.log('Requesting', fileName, 'on', peerConnectionID, rtc.dataChannels);  

    if (channel) {
      channel.send(fileName);
    }
  };

  function sendFile(channel, file) {
    var chunkSize = 64 * 1024,
        reader = new FileReader();

    reader.onload = function(e) {
      var result = e.target.result;

      channel.send(result.byteLength + ';' + file.name + ';' + file.type);

      var offset = 0,
          backoff = 0,
          startTime = new Date().getTime();
      var sendChunk = function() {
        if (offset == result.byteLength) return;

        var now = new Date().getTime();

        for (var i = 0; i < 10; i++) {
          var size = Math.min(offset + chunkSize, result.byteLength),
              chunk = result.slice(offset, size);
          try {
            channel.send(chunk);
            offset += chunkSize;
            $rootScope.upSpeed = offset / (now - startTime) / 1000;  
          } catch(e) {
            setTimeout(sendChunk, backoff);
            backoff += 100;
          }

          if (offset < result.byteLength) setTimeout(sendChunk, 0);
        }
      };
      sendChunk();
    };

    reader.readAsArrayBuffer(file);
  };

  return {
    joinRoom: joinRoom,
    requestFile: requestFile,
    sendFile: sendFile
  }
}];