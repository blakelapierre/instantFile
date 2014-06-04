// Returns a map of handlers to be applied to a Channel
// 
// This accepts files transferred using `fileServeHandlers`

module.exports = ['$sce', function fileReceiveHandlers($sce) {
  return function(room, progressFn) {
    var messageHandler = receiveHeader;

    function receiveHeader(channel, message) {
      var parts = message.toString().split(';');

      if (parts.length != 3) throw Error('Got bad file transfer header');

      var byteLength = parseInt(parts[0]),
          name = parts[1],
          type = parts[2];

      var transfer = channel.transfer = {
        byteLength: byteLength,
        name: name,
        type: type,
        transferred: 0,
        speed: 0,
        position: 0,
        buffers: new Array(Math.ceil(byteLength / (64 * 1024))),
        pieceCount: 0,
        streamPiece: 0,
        start: new Date().getTime()
      };

      if (/video\/.*/.test(transfer.type)) {
        var mediaSource = new MediaSource();

        transfer.mediaSource = mediaSource;

        console.log(transfer.mediaSource);

        transfer.src = $sce.trustAsResourceUrl(window.URL.createObjectURL(mediaSource));

        mediaSource.addEventListener('sourceopen', function() {
          var receiver = mediaSource.addSourceBuffer(transfer.type + '; codecs="vorbis,vp8"');
          transfer.receiver = receiver;
          console.log(transfer.src);

          receiver.addEventListener('updateend', function(event) {
            var sourceBuffer = event.target;

            if (transfer.pieceCount > transfer.streamPiece + 1) sourceBuffer.appendBuffer(transfer.buffers[transfer.streamPiece++]);
          });

          if (transfer.pieceCount > 0) receiver.appendBuffer(transfer.buffers[transfer.streamPiece++]);
        });
      }
      
      messageHandler = createReceiveData(transfer); // Here we pass control of the rest of the transfer to receiveData

      return transfer;
    };

    function createReceiveData(transfer) {
      return function receiveData(channel, message) {
        var now = new Date().getTime();

        transfer.buffers[transfer.pieceCount++] = message;

        transfer.position += message.byteLength || message.size; // Firefox uses 'size'

        transfer.transferred = transfer.position;
        transfer.total = transfer.byteLength;
        transfer.progress = transfer.transferred / transfer.total;
        transfer.speed = transfer.position / (now - transfer.start) * 1000;

        if (transfer.receiver && !transfer.receiver.updating && transfer.pieceCount > transfer.streamPiece + 1) transfer.receiver.appendBuffer(transfer.buffers[transfer.streamPiece++]);

        if (transfer.position == transfer.byteLength) {
          var blob = new Blob(transfer.buffers, {type: transfer.type});
          blob.name = transfer.name;

          transfer.file = blob;
        }

        return transfer;
      };
    };

    return {
      open: (channel) => channel.channel.send(room),
      message: (channel, event) => {
        var transfer = messageHandler(channel, event.data);
        if (progressFn) progressFn(transfer);
      }
    };
  };
}];