var http = require('request'),
    fs = require('fs'),
    path = require('path'),
    server = require('./server/server'),
    grunt = require('grunt');

    console.log(grunt.config);

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
    if (res.statusCode != 200) {
        throw new Error('non-OK status: ' + res.statusCode);
    }

    deliver(body.trim());

  }).on('error', function(err) { throw err; });
};

module.exports = startServer;

var ca = [fs.readFileSync(path.join(__dirname, './server/cert/GandiStandardSSLCA.crt'))],
    key = fs.readFileSync('~/instafile.io.key'),
    cert = fs.readFileSync(path.join(__dirname, './server/cert/instafile.io.cert'));

var debug = process.argv[2] == 'debug';

if (debug) {
  ca = [];
  key = ['-----BEGIN RSA PRIVATE KEY-----',
        'MIIEogIBAAKCAQEArcUs8uVY6HPLB+nGIcqrcWthuj4ThWD9PLCt7+FNkEf5OaRt',
        'E42DQdWtfwlxUmMOgzWxOdeH+eMl7npkin/Uhu3RljWlH2qerORTwdVPlUfUnAdR',
        'OJUSmMFgjRfV9vmCQ8xJ2C8FETEYdBZPzoUeoV/Q/B2o91fG5bSIaHD69IIikKF1',
        '9o1IO6oDD7C5jqpeaq9Blj2A7G5XzXT3AuVLuBED6sXwhv3A1g5gTO+OXlycIWuR',
        'jceVH2G50NmmT7sDdSmzzMlxyDQkaTu99tLKDohEPB5jFN+xSyJGQEwrWoWL2yA3',
        'jEh1RPa/P6lwrdlnZ2T0LT/4SN/XdWscwsAnuwIDAQABAoIBAB2K9jddcp4igZQY',
        '1IyOLlOcFANb5mm4sZUN3KR5w3wSIHcCU2ENoBEjSNneOxvsp1z7VeQlloKPcbV3',
        'rXw2e2VtLULCYA5VTCDMuMitgVg53BWi0NYz0fOSfN2//ap9hP4Nz0gnxk7D8Apc',
        'eLj9vNVmutsCF+XlUHVhGgfXnXLQHVsiitrIPmOLJiqa7jfVufH7SeiaTLbutWlY',
        'IVhRHLH+ncjSoCdJhbaa2nltfOJSJh5mvsJ8m+NRar7NykFcX77mBAFkCxFlbS8E',
        '3xy14X8irctF/Z6e4U1Zf0MtWaUv0gQkPSftmUAasgIlUKirgO7UVPh8Fo+yqyqi',
        'C9ZtQ1ECgYEA2dxHnGP6oyN0gGskC+C9JR4hKFFrQI6st78InR/ertoqfxRpr//O',
        'QLtUT3Ije0amZKSv9OXGImEa2DS6ZyLlUFDLa8+Ko8hnxrXxUyuNnsgTaJYOhOTw',
        'g7Anx/owmuv77DlGPdSI/dBZuGtN7LmF6M7YSgUUZ7CjdqH6wMcvIl8CgYEAzDDu',
        'C9Badt8Z2o4ZgM/6glLqAXfS0YwLJBNxTFIU+PnDapyLAk+LeUzwiliRwQa7Tq40',
        'HjacKSzmYU5byZpTE/rswiTa5NmxSWzYOQmPAnI+tHPXU31CrNeGcyNOyDSapOro',
        '4VAzPT2n3msM6ynbVqfeU5BpWLi95dPqoJ/d0CUCgYAVgf+32s71qBxqSSmH2qoR',
        'rgXL+y3Bc9RtV3i8Olc7n+IuJY/BhlmQXm4WYchK9VCcAv40CTMkVb3Wtm3onLNS',
        '2Iccn6KqRLCqF3A5q8URdeMkohvQ1uE/vvZOcc62nLGEQqtCk2bq19TjtgQ9aJtl',
        'vnXv6Mx46CFbJuagfYmTtQKBgCW9cXILi3znFW84zmvphOKrkoa87+E9Ih4D3e/+',
        'R9QQzdaZonPF4gCEgP0BC8eCiAIt3oIrE8fkfZxEkGB9vpc1zKbBixe7SLJKhNhd',
        '9Om91esicg0DXNx3ZWlIgFouptqOdIaYfS/3glxwqs2YSesFUeleCqqUUrz04yvX',
        'AHdlAoGAXw5+xmEN+14ybhxdOUVySSulI55fj/G9xnP/qrXgQaQLYQBJk50eZObC',
        'xNwymY1WxKhiyQzr8Ym57dpmEsZUHwg8pGnfocue0cVpNANldHiz8PM0cwahq9vV',
        'JfKHtnrfhIY2QLgZ01lR5pGlZUzpEebMndOKE1aTQkW1i5TjZNQ=',
        '-----END RSA PRIVATE KEY-----'].join('\n');

cert = ['-----BEGIN CERTIFICATE-----',
        'MIICpDCCAYwCCQCFcd+JJc4mTzANBgkqhkiG9w0BAQUFADAUMRIwEAYDVQQDDAls',
        'b2NhbGhvc3QwHhcNMTQwNTIxMTEwMjM1WhcNNDExMDA1MTEwMjM1WjAUMRIwEAYD',
        'VQQDDAlsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCt',
        'xSzy5Vjoc8sH6cYhyqtxa2G6PhOFYP08sK3v4U2QR/k5pG0TjYNB1a1/CXFSYw6D',
        'NbE514f54yXuemSKf9SG7dGWNaUfap6s5FPB1U+VR9ScB1E4lRKYwWCNF9X2+YJD',
        'zEnYLwURMRh0Fk/OhR6hX9D8Haj3V8bltIhocPr0giKQoXX2jUg7qgMPsLmOql5q',
        'r0GWPYDsblfNdPcC5Uu4EQPqxfCG/cDWDmBM745eXJwha5GNx5UfYbnQ2aZPuwN1',
        'KbPMyXHINCRpO7320soOiEQ8HmMU37FLIkZATCtahYvbIDeMSHVE9r8/qXCt2Wdn',
        'ZPQtP/hI39d1axzCwCe7AgMBAAEwDQYJKoZIhvcNAQEFBQADggEBAHT0LZDeCneK',
        'cVpK8utgi5fCqI2Uk/TAcmIih6q3oSLFwZxvOK+k2jY3X2UKxOUNXn0MvLMyspIN',
        'UfFUPgWbvHZpxTVTINuIx2P0aYj/4u8IYeyIwLVyV2JKjuNKqbt3iUQh/kixqhxY',
        'BfA5Os9bozKnxGZxXzThyj2el3pyeIyJoQAxjkkVu5+6YJ4QduqjVKl+Mw/ghnRX',
        'LL3bT6BOQL0x2XmnxqzHDje/0WVqGYTZ7Ot7/Rl5Tra8d/virV3/VutdqCLoOdhz',
        'FmKiv3NhDPpGwrUuhNL3/LQNJQTunCgVDWpwXURCTGPZBEhKbOKxgijd4uiNEJIz',
        'PIvu7BkvcwU=',
        '-----END CERTIFICATE-----'].join('\n');
}

startServer({
  port: 2778,
  httpPort: 2777,
  rtcport: 2776,
  serverRoot: __dirname,
  repoLocation: path.join(__dirname, './../../'),
  distRoot: path.join(__dirname, './../dist'),
  ca: ca,
  key: key,
  cert: cert
}, function(webserver, redirectServer, signalServer) { });