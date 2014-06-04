module.exports = function(config, callback) {
  var https = require('https'),
      http = require('http'),
      path = require('path'),
      express = require('express'),
      io = require('socket.io'),
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
      socketIO = io(webserver);

  var signalStats = signal(socketIO);

  var router = express.Router();

  router.get('/stats', function(req, res) {
    res.json({
      sockets: signalStats.sockets.length(),
      rooms: signalStats.rooms.length()
    });
  });

  app.use('/', router);

  webserver.listen(config.port);
  redirectServer.listen(config.httpPort);

  callback(webserver, redirectServer, signal);
};