module.exports = function(config, callback) {
  var path = require('path'),
      express = require('express'),
      webRTC = require('webrtc.io'),
      app = express();

  
  var serverRoot = config.serverRoot;

  app.use(express.static(path.join(serverRoot, '..', 'dist')));

  var webserver = app.listen(config.port),
      rtcManager = webRTC.listen(config.rtcport);

  var router = express.Router();

  router.get('/stats', function(req, res) {
    var socketCount = 0,
        roomCount = 0;

    for (var socket in rtcManager.rtc.sockets) socketCount++;
    for (var room in rtcManager.rtc.rooms) roomCount++;

    res.json({
      sockets: socketCount,
      rooms: roomCount
    });
  });

  app.use('/', router);

  callback(webserver, rtcManager);
};