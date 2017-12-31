var _ = require('lodash');

module.exports = ['getFileBuffer', function fileServeHandlers(getFileBuffer) {
  var messageHandler = receiveRequest;

  function createTakeMeasurement(measurements, queueApply) {
    return function takeMeasurement(transfer) {
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
    }
  }

  function receiveRequest(channel, message, host, room, queueApply) {
    if (message == room) {
      var measurements = [{
        time: new Date().getTime(),
        transferred: 0
      }];

      var doneWithFile = getFileBuffer(host.file, {
        'load': (buffer) => {
          channel.transfer = sendFile(channel.channel, host.file, buffer, createTakeMeasurement(measurements, queueApply));
        },
        'error': error => console.log(error)
      });
    }
  };

  function sendFile(channel, file, buffer, progress) {
    var chunkSize = 64 * 1024,
        transfer = {};

    channel.send(buffer.byteLength + ';' + file.name + ';' + file.type);

    var byteLength = buffer.byteLength,
        offset = 0,
        backoff = 0,
        lastIterations = 1,
        startTime = new Date().getTime(),
        maxBufferAmount = Number.POSITIVE_INFINITY;

    transfer.name = file.name;
    transfer.startTime = startTime;
    transfer.transferred = 0;
    transfer.total = byteLength;
    transfer.speed = 0;

    function send() {
      if (channel.readyState != 'open') return;

      // I'm not sure lastIterations really does what I originally thought it would do.
      var toSend = Math.min(lastIterations * chunkSize, maxBufferAmount) - channel.bufferedAmount;

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
            backoff = Math.min(1000, backoff + 100);

            maxBufferAmount = channel.bufferedAmount;

            if (maxBufferAmount == 0) maxBufferAmount = Number.POSITIVE_INFINITY;

            lastIterations = Math.max(1, lastIterations - 1);
            break; // get me out of this for loop!
          }
        }
      }

      if (backoff == 0) lastIterations++;

      var buffered = channel.bufferedAmount;

      var transferred = offset - buffered;

      Object.assign(transfer, {backoff, buffered, lastSend, maxBuffered, transferred, progress: transferred / transfer.total});

      // transfer.transferred = transferred;
      // transfer.progress = transferred / transfer.total;
      // transfer.backoff = backoff;
      // transfer.lastSend = now;
      // transfer.buffered = buffered;
      // transfer.maxBuffered = maxBufferAmount;

      if (progress) progress(transfer);

      if (transferred < byteLength) {
        if (backoff > 0) setTimeout(send, backoff);
        else setTimeout(send, 0);
      }
    };

    send();

    return transfer;
  };

  return function($scope, host, room) {
    var queueApply = _.throttle(function() {
      $scope.$apply();
    }, 100);

    return {
      open: (channel) => { },
      close: (channel) => { },
      error: (channel, error) => { },
      message: (channel, event) => {
        var transfer = messageHandler(channel, event.data, host, room, queueApply);
        $scope.$apply();
      }
    };
  };
}];
