module.exports = function() {
  var fileBuffers = {};

  return function getFileBuffer(file, callback) {
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
};