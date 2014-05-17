var webRTC = require('webrtc.io');

module.exports = ['$location', function($location) {
  function joinRoom(room) {
    console.log(room);
    
    var url = 'ws://' + $location.host() + ':2776';

    // need to handle subsequent calls of this function correctly
    webRTC.connect(url, room);
  };

  return {
    joinRoom: joinRoom
  }
}];