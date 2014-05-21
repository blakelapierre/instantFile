module.exports = function(config, callback) {
  var path = require('path'),
      express = require('express'),
      webRTC = require('./lib/webrtc.io'),
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
      rooms: roomCount,
      r: rtcManager.rtc.rooms
    });
  });

  router.get('/3B4B24D2B37E1F30CCA3BDC11FBD9E7D.txt', function(req, res) {
    res.set('Content-Type', 'text/plain');
    res.send(200, '869E9770D6D5C3A312067A953FE3C4DC7A3B58CC\ncomodoca.com');
  });

  app.use('/', router);

  callback(webserver, rtcManager);
};