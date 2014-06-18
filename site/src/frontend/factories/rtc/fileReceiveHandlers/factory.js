// Returns a map of handlers to be applied to a Channel
// 
// This accepts files transferred using `fileServeHandlers`

var _ = require('lodash');

function on(obj, listeners) {
  for (var eventName in listeners) {
    obj.addEventListener(eventName, listeners[eventName]);
  }
}

module.exports = ['$sce', function fileReceiveHandlers($sce) {
  return function(room, progressFn) {
    var messageHandler = receiveHeader;

    function receiveHeader(channel, message) {
      var header = JSON.parse(message);

      console.log('Received File Transfer Header:', header);

      var transfer = _.extend(header, {
        position: 0,
        buffers: new Array(Math.ceil(header.byteLength / header.chunkSize)),
        chunkCount: 0,
        streamChunk: 0,
        start: new Date().getTime()
      });
      
      messageHandler = createReceiveData(transfer); // Here we pass control of the rest of the transfer to receiveData

      return transfer;
    };

    function createReceiveData(transfer) {
      if (transfer.type == 'video/mp4') {
        var mediaSource = new MediaSource();

        on(mediaSource, {
          'sourceopen': event => {
            console.log('sourceopen', event);

            var sourceBuffer = mediaSource.addSourceBuffer(transfer.type + '; codecs="avc1.64001f, mp4a.40.2"');

            on(sourceBuffer, {
              'updatestart': event => console.log('updatestart', event),
              'update': event => console.log('update', event),
              'updateend': event => {
                console.log('updateend', event)

                if (transfer.streamChunk < transfer.chunkCount) {
                  try {
                    transfer.sourceBuffer.appendBuffer(transfer.buffers[transfer.streamChunk]);
                    transfer.streamChunk++;
                  }
                  catch (e) { console.log(e); }
                }
              },
              'error': event => console.log('error', event),
              'abort': event => console.log('abort', event)
            });

            sourceBuffer.addEventListener('updateend', function(event) {
              console.log('updateend');
              var sourceBuffer = event.target;

              if (transfer.streamChunk < transfer.chunkCount) sourceBuffer.appendBuffer(transfer.buffers[transfer.streamChunk++]);
            });

            transfer.sourceBuffer = sourceBuffer;

            if (transfer.chunkCount > 0 && transfer.streamChunk < transfer.chunkCount) {
              try {
                transfer.sourceBuffer.appendBuffer(transfer.buffers[transfer.streamChunk]);
                transfer.streamChunk++;
              }
              catch (e) { console.log(e); }
            }

            // var mp4 = new MP4Box();

            // Log.setLogLevel(5);

            // mp4.onError = error => {
            //   console.log(error);
            // };

            // mp4.onReady = info => {
            //   console.log('++mp4 info', info);

            //   mp4.onSegment = (id, user, buffer) => {
            //     console.log('got segment for ', id);
            //     transfer.sourceBuffer.appendBuffer(buffer);
            //   };

            //   mp4.setSegmentOptions(1, {}, {nbSamples: 50});

            //   var initSeg = mp4.initializeSegmentation();

            //   console.log(initSeg);
            // };

            // transfer.mp4 = mp4;
          },
          'sourceended': event => {
            console.log('sourceended', event);
          },
          'sourceclose': event => {
            console.log('sourceclose', event);
          }
        });

        transfer.mediaSource = mediaSource;
        transfer.src = $sce.trustAsResourceUrl(window.URL.createObjectURL(mediaSource));
      }

      // mp4.appendBuffer(buffer);
      // mp4.flush();

      return function receiveData(channel, message) {
        var now = new Date().getTime();

        transfer.buffers[transfer.chunkCount++] = message;

        transfer.position += message.byteLength || message.size; // Firefox uses 'size'

        transfer.transferred = transfer.position;
        transfer.total = transfer.byteLength;
        transfer.progress = transfer.transferred / transfer.total;
        transfer.speed = transfer.position / (now - transfer.start) * 1000;

        if (transfer.sourceBuffer) {
          if (!transfer.sourceBuffer.updating && transfer.streamChunk < transfer.chunkCount) {
            try {
              transfer.sourceBuffer.appendBuffer(transfer.buffers[transfer.streamChunk]);
              transfer.streamChunk++;
            }
            catch (e) { console.log(e); }
          }
        }

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