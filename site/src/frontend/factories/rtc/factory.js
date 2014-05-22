var webRTC = require('webrtc.io');

module.exports = ['$location', function($location) {
  function launchCommandCenter(room, callback) {
    console.log(room);

    var url = 'wss://' + window.location.host;

    // need to handle subsequent calls of this function correctly
    webRTC.connect(url, room);

    webRTC.on('connections', function() {
      if (callback) callback(webRTC._me);
    });
  };

  function requestFile(peerConnectionID, fileName) {
    var channel = rtc.dataChannels[peerConnectionID];

    if (channel) {
      channel.send(fileName);
    }
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

      console.log(channel);

      function sendChunk() {
        for (var i = 0; i < iterations; i++) {
          var now = new Date().getTime(),
              size = Math.min(chunkSize, buffer.byteLength - offset),
              chunk = buffer.slice(offset, offset + size);

          try {
            channel.send(chunk);

            offset += size;
            backoff = 0;

            stats.transferred = offset;
            stats.speed = offset / (now - startTime) * 1000;  
            stats.progress = stats.transferred / stats.total;
            stats.backoff = backoff;

            if (iterations < 10) iterations++;
          } catch(e) {
            backoff += 100;
            stats.backoff = backoff;
            
            iterations--;
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

  return {
    launchCommandCenter: launchCommandCenter,
    requestFile: requestFile,
    sendFile: sendFile,
    roomManager: webRTC
  }
}];