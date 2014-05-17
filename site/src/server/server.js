module.exports = function(config, callback) {
  var path = require('path'),
      express = require('express'),
      webRTC = require('webrtc.io'),
      app = express();

  
  var serverRoot = config.serverRoot;

  app.use(express.static(path.join(serverRoot, '..', 'dist')));

  var webserver = app.listen(config.port),
      rtcManager = webRTC.listen(config.rtcport);

  callback(webserver, rtcManager);
};