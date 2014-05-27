Peer
  id
  streams
  channels

var _ = require('lodash');

module.exports = function Peer(id, emit, fire) {
  var channels = [],
      streams = [];

  _.extend(this, {
    id: id,
    channels: channels,
    streams: streams
  });
};

function createConnection(peer, emit, fire) {
  var connection = new RTCPeerConnection({
    iceServers: [{url: 'stun:stun.l.google.com:19302'}]
  });
  
  connection.onnegotiationneeded = function() {
    sendOffer();
  };

  connection.onicecandidate = function(event) {
    var candidate = event.candidate;

    if (candidate) {
      emit('ice_candidate', {
        peerID: id,
        label: candidate.sdpMLineIndex,
        candidate: candidate.candidate
      });

      fire('peer ice_candidate', peer, candidate);
    }
  };

  connection.onsignalingstatechange = function(event) {
    console.log(event);
    fire('peer signaling_state_change', peer, event);
  };

  connection.onaddstream = function() {
    fire('peer add_')
  };

  connection.onremovestream = function() {

  };

  connection.oniceconnectionstatechange = function() {

  };

  connection.ondatachannel = function(event) {
    var channel = event.channel;
    
    // Override these functions when you get passed 'handlers'
    var handlers = {
      open: function() {},
      close: function() {},
      message: function(message) {console.log(message);},
      error: function(error) {}
    };

    attachToChannel(channel, handlers);

    fire('peer data_channel connected', peer, channel, handlers);
  };

  return connection;
};

function sendOffer() {
  var connection = peer.peerConnection;

  connection.createOffer(function(offer) {
    connection.setLocalDescription(offer, function() {
      emit('peer offer', {
        peerID: id,
        offer: connection.localDescription
      });
      fire('peer send offer', peer, offer);
    }, function(err) {
      fire('peer error set_local_description', peer, err, offer);
    });
  }, function(err) {
    fire('peer error create offer', peer, err)
  })
};