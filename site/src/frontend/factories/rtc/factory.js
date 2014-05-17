var webRTC = require('webrtc.io');

module.exports = ['$location', function($location) {
  function joinRoom(room, callback) {
    console.log(room);

    var url = 'ws://' + $location.host() + ':2776';

    // need to handle subsequent calls of this function correctly
    webRTC.connect(url, room);

    callback(webRTC);
  };

  return {
    joinRoom: joinRoom
  }
}];