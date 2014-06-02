import {_} from 'lodash';

module.exports = function fileReceiveHandlers() {
  function receiveHeader(channel, message, queueApply) {
    var parts = message.toString().split(';');

    if (parts.length != 3) throw Error('Got bad file transfer header');

    var byteLength = parseInt(parts[0]),
        name = parts[1],
        type = parts[2];

    var stats = {
      transferred: 0,
      total: byteLength,
      speed: 0
    };

    var transfer = channel.transfer = {
      byteLength: byteLength,
      name: name,
      type: type,
      transferred: 0,
      speed: 0,
      position: 0,
      buffers: new Array(Math.ceil(byteLength / (64 * 1024))),
      messageCount: 0,
      start: new Date().getTime()
    };

    // Do we really want to be passing $scope in here? I would say: NO
    messageHandler = function(channel, message, queueApply, $scope) {
      var now = new Date().getTime();

      transfer.buffers[transfer.messageCount++] = message;

      transfer.position += message.byteLength || message.size; // Firefox uses 'size'

      transfer.transferred = transfer.position;
      transfer.total = transfer.byteLength;
      transfer.progress = transfer.transferred / transfer.total;
      transfer.speed = transfer.position / (now - transfer.start) * 1000;

      if (transfer.position == transfer.byteLength) {
        var blob = new Blob(transfer.buffers, {type: transfer.type});

        $scope.file = blob;

        // var a = document.createElement('a');
        // document.body.appendChild(a); // Firefox apparently needs this
        // a.href = window.URL.createObjectURL(blob);
        // a.download = transfer.name;
        // a.click();
        // a.remove();
      }

/* possible to use with unreliable transport 
      acknowledgedChunkSeq

      for (var seq = acknowledgedChunkSeq + 1; seq < chunkSeq; seq++) {
        missingChunks[seq] = seq;
      }
*/
      queueApply();
    };

    queueApply();
  }

  var messageHandler = receiveHeader;

  return function($scope, room) {
    var queueApply = _.throttle(function() {
      $scope.$apply();
    }, 100);

    return {
      open: (channel) => channel.channel.send(room),
      message: (channel, event) => messageHandler(channel, event.data, queueApply, $scope)
    };
  };
};