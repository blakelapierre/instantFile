var http = require('request'),
    fs = require('fs'),
    path = require('path'),
    server = require('./server/server');

function startServer (config, callback) {
  getPublicAddress(function(address) {
    console.log('Got address...', address);

    fs.writeFileSync('public_address', address);

    config.publicAddress = address;

    server(config, callback);
  });
};

function getPublicAddress (deliver) {
  console.log('determining public ip address...');

  if (fs.existsSync('public_address')) {
    deliver(fs.readFileSync('public_address').toString());
    return;
  }

  http.get('http://fugal.net/ip.cgi', function(error, res, body) {

    console.log(arguments);

    if (res.statusCode != 200) {
        throw new Error('non-OK status: ' + res.statusCode);
    }

    deliver(body.trim());

  }).on('error', function(err) { throw err; });
};

module.exports = startServer;

startServer({
  port: 2777,
  httpPort: 2778,
  rtcport: 2776,
  serverRoot: __dirname,
  repoLocation: path.join(__dirname, './../../'),
  distRoot: path.join(__dirname, './../dist'),
  key: fs.readFileSync(path.join(__dirname, './server/cert/instafile.io.key')),
  cert: fs.readFileSync(path.join(__dirname, './server/cert/instafile.io.cert'))
}, function(webserver, io, rtc) { });