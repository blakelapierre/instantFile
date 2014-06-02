module.exports = function() {
  var fileBuffers = {};

  return function getFileBuffer(file, callback) {
    var container = fileBuffers[file];
    if (container == null) {
      var reader = new FileReader();
      
      container = fileBuffers[file] = {
        referenceCount: 0
      };

      container.bufferPromise = new Promise(function(resolve, reject) {
        reader.onload = function(e) {
          var buffer = e.target.result;
          container.buffer = buffer;
          resolve(buffer);
        };

        // todo: error handling?

        reader.readAsArrayBuffer(file);
      });
    }

    container.referenceCount++;

    container.bufferPromise.then(() => callback(container.buffer));

    return () => {
      container.referenceCount--;
      if (container.referenceCount == 0) delete fileBuffers[file];
    };
  };
};