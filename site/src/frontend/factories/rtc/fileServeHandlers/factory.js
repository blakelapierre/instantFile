import {_} from 'lodash';

module.exports = ['getFileBuffer', function fileServeHandlers(getFileBuffer) {
  function sendFile(channel, file, progress) {
    var chunkSize = 64 * 1024,
        reader = new FileReader(),
        transfer = channel.transfer = {};

    var doneWithFile = getFileBuffer(file, function(buffer) {
      channel.send(buffer.byteLength + ';' + file.name + ';' + file.type);

      var byteLength = buffer.byteLength,
          offset = 0,
          backoff = 0,
          lastIterations = 1,
          startTime = new Date().getTime(),
          maxBufferAmount = Number.POSITIVE_INFINITY;

      transfer.startTime = startTime;
      transfer.transferred = 0;
      transfer.total = byteLength;
      transfer.speed = 0;

      console.log(channel);

      function send() {
        if (channel.readyState != 'open') return;

        var buffered = channel.bufferedAmount;

        // I'm not sure lastIterations really does what I originally thought it would do.
        var toSend = Math.min(lastIterations * chunkSize, maxBufferAmount) - buffered;

        var iterations = Math.ceil(toSend / chunkSize);

        var now = new Date().getTime();
        // Is there a better way to do this then to just run some
        // arbitrary number of iterations each round?
        // Maybe watch the socket's buffer size?
        for (var i = 0; i < iterations; i++) {
          var size = Math.min(chunkSize, byteLength - offset);

          if (size > 0) {
            var chunk = buffer.slice(offset, offset + size);

            try {
              channel.send(chunk);

              offset += size;
              backoff = 0;
            } catch(e) {
              console.log(e);
              backoff += 100;
              
              maxBufferAmount = buffered;

              if (maxBufferAmount == 0) maxBufferAmount = Number.POSITIVE_INFINITY;

              lastIterations--;
              break; // get me out of this for loop!
            }
          }
        }

        if (backoff == 0) lastIterations++;

        var transferred = offset - buffered;

        transfer.transferred = transferred;
        transfer.progress = transferred / transfer.total;
        transfer.backoff = backoff;
        transfer.lastSend = now;
        transfer.buffered = buffered;
        transfer.maxBuffered = maxBufferAmount;

        if (progress) progress(transfer);

        if (transferred < byteLength) {
          if (backoff > 0) setTimeout(send, backoff);
          else setTimeout(send, 0);
        }
      };

      send();
    });

    return transfer;
  };

  return function($scope, host, room) {
    var queueApply = _.throttle(function() {
      $scope.$apply();
    }, 100);

    return {
      open: function(channel) { },
      close: function(channel) { },
      message: function(channel, event) {
        var message = event.data;

        if (message == room) {
          var measurements = [{
            time: new Date().getTime(),
            transferred: 0
          }];

          channel.transfer = sendFile(channel.channel, host.file, function(transfer) {
            var lastMeasurement = measurements[0],
                changed = transfer.transferred > lastMeasurement.transferred;

            if (changed) {
              var measurement = {
                time: transfer.lastSend,
                transferred: transfer.transferred
              };
              measurements.unshift(measurement);

              var cutoff = measurement.time - 1000, // One second
                  oldest = measurements[measurements.length - 1],
                  secondOldest = oldest;

              while (measurements.length > 2 && cutoff > secondOldest.time) {
                oldest = secondOldest;
                secondOldest = measurements.pop();
              }

              var dt = measurement.time - oldest.time,
                  speed = 1000 * (measurement.transferred - oldest.transferred) / dt;

              transfer.speed = speed;
            }

            queueApply();
          });
        }
      },
      error: function(channel, error) {}
    };
  };
}];
