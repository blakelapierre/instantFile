module.exports = function(config, callback) {
  var https = require('https'),
      http = require('http'),
      path = require('path'),
      express = require('express'),
      webRTC = require('./lib/webrtc.io'),
      socketIO = require('socket.io'),
      signal = require('./signal'),
      app = express();

  var redirectServer = http.createServer(function requireHTTPS(req, res, next) {
    res.writeHead(302, {
      'Location': 'https://' + req.headers['host'] + req.url
    });
    res.end();
  });

  
  var serverRoot = config.serverRoot;

  app.use(express.static(path.join(serverRoot, '..', 'dist')));

  var sslOptions = {
        ca: config.ca,
        key: config.key,
        cert: config.cert
      },
      webserver = https.createServer(sslOptions, app),
      //rtcManager = webRTC.listen(webserver),
      io = socketIO.listen(webserver);
var rtcManager = {};
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

  app.use('/', router);

  signal(io);

  webserver.listen(config.port);
  redirectServer.listen(config.httpPort);

  callback(webserver, rtcManager, redirectServer);
};