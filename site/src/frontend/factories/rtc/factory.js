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
      console.log(channel);
    }
  };

  function sendFile(channel, file, progress) {
    var chunkSize = 64 * 1024,
        reader = new FileReader(),
        stats = {};

    reader.onload = function(e) {
      var buffer = e.target.result;

      channel.send(buffer.byteLength + ';' + file.name + ';' + file.type);

      var offset = 0,
          backoff = 0,
          startTime = new Date().getTime();

      stats.startTime = startTime;
      stats.sent = 0;
      stats.total = buffer.byteLength;
      stats.speed = 0;

      function sendChunk() {
        var now = new Date().getTime(),
            size = Math.min(chunkSize, buffer.byteLength - offset),
            chunk = buffer.slice(offset, offset + size);

        try {
          channel.send(chunk);
          offset += size;
          stats.sent = offset;
          stats.speed = offset / (now - startTime) / 1000;  

          backoff = 0;
          stats.backoff = backoff;

          if (offset < buffer.byteLength) setTimeout(sendChunk, 0);
        } catch(e) {
          console.log(e);
          if (offset < buffer.byteLength) setTimeout(sendChunk, backoff);
          backoff += 100;
          stats.backoff = backoff;
        }

        if (progress) progress(stats);
      };

      sendChunk();
    };

    reader.readAsArrayBuffer(file);

    return stats;
  };

  return {
    joinRoom: joinRoom,
    requestFile: requestFile,
    sendFile: sendFile
  }
}];