var MP4Box = require('mp4box.js');

function on(obj, listeners) {
  for (var eventName in listeners) {
    obj.addEventListener(eventName, listeners[eventName]);
  }
}

module.exports = () => {
  var mp4Cache = {};

  return (file, fileBuffer, listeners) => {
    var container = mp4Cache[file];

    if (container == null) {
      var mp4 = new MP4Box();

      Log.setLogLevel(Log.w);

      container = mp4Cache[file] = {
        referenceCount: 0
      };

      container.bufferPromise = new Promise((resolve, reject) => {
        console.log('starting promise');

        mp4.onError = reject;

        mp4.onReady = info => {
          console.log(info);

          var segments = [],
              numSamples = 10;

          mp4.onSegment = (id, user, buffer) => segments.push(buffer);

          mp4.onSegmentDone = (id, user) => {
            console.log('segment done');

            var blob = new Blob(segments, {type: file.type});
            blob.name = file.name;

            var reader = new FileReader();

            on(reader, {
              'error': e => console.log(e),
              'load': e => {
                var buffer = e.target.result;
                resolve(buffer);
              }
            });

            reader.readAsArrayBuffer(blob);

            mp4.onSegmentDone = null; // Hack, because we only want this to be called once!
          }

          mp4.setSegmentOptions(info.tracks[0].id, {}, {nbSamples: numSamples});

          segments.push(mp4.initializeSegmentation());
        };

        mp4.appendBuffer(fileBuffer);
        mp4.flush();
      });
    }

    container.referenceCount++;

    container
      .bufferPromise
      .then(
        buffer => listeners['load'](buffer),
        error => console.log('Error segmenting file', error, file));

    return () => {
      container.referenceCount--;
      if (container.referenceCount == 0) delete mp4Cache[file];
    }
  };
}