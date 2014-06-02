// Coordinates your peers. Sets up connections, streams, and channels.
// Based on webrtc.io

import {Peer} from './peer';

var _ = require('lodash'),
    io = require('socket.io');

var RTCPeerConnection = (window.PeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
var URL = (window.URL || window.webkitURL || window.msURL || window.oURL);
var getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
var RTCIceCandidate = (window.mozRTCIceCandidate || window.RTCIceCandidate);
var RTCSessionDescription = (window.mozRTCSessionDescription || window.RTCSessionDescription); // order is very important: "RTCSessionDescription" defined in Nighly but useless

/*
+  Event Handling
*/
var events = {};
function on(event, listener) {
  if (typeof event == 'object') {
    for (var eventName in event) on(eventName, event[eventName]);
    return;
  }

  events[event] = events[event] || [];
  events[event].push(listener);
};

function off(event, listener) {
  if (typeof event == 'object') {
    for (var eventName in event) off(eventName, event[eventName]);
    return;
  }

  var listeners = events[event];
  if (listeners && listeners.length > 0) {
    for (var i = listeners.length - 1; i >= 0; i++) {
      if (listeners[i] === listener) {
        listeners.splice(i, 1);
      }
    }
    if (listeners.length == 0) delete events[event];
  }
};

function fire(event) {
  var listeners = events[event] || [],
      args = Array.prototype.slice.call(arguments, 1);

  for (var i = 0; i < listeners.length; i++) {
    listeners[i].apply(null, args);
  }
};
/*
-  Event Handling
*/

function createPeer(id, emit, fire) {
  var peer = new Peer(id, {
    negotiation_needed: (e) => {
      sendOffer();
      fire('peer negotiation_needed', peer, e);
    },
    ice_candidate: (e) => {
      var candidate = e.candidate;

      if (candidate) {
        emit('ice_candidate', {
          peerID: id,
          label: candidate.sdpMLineIndex,
          candidate: candidate.candidate
        });

        fire('peer ice_candidate', peer, candidate);
      }
    },
    signaling_state_change: (e) => {
      fire('peer signaling_state_change', peer, e);
    },
    ice_connection_state_change: (e) => fire('peer ice_connection_state_change', peer, e),
    add_stream: (e) => fire('peer add_stream', peer, e),
    remove_stream: (e) => fire('peer remove_stream', peer, e),
    data_channel: (e) => {
      var channel = e.channel;

      fire('peer data_channel connected', peer, channel);
    }
  });


  function sendOffer() {
    var connection = peer.connection;

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

  return peer;
};

/*
+  Signalling
*/
function connectToSignal(server, onReady) {
  console.log('connecting to', server);
  var socket = io(server);

  function emit(event, data) { console.log('emitting', event, data); socket.emit(event, data); };

  socket.on('error', function() {
    console.log('error', arguments);
  });

  socket.on('connect', function() {
    socket.on('your_id', function(myID) {
      console.log('your_id');
      var peers = [],
          peersHash = {};

      signal.myID = myID;

      function getPeer(id) {
        return peersHash[id];
      };

      function addPeer(id) {
        var peer = createPeer(id, emit, fire);
        peers.push(peer);
        peersHash[id] = peer;
        
        fire('peer added', peer);
      };

      function removePeerByID(id) {
        var peer = getPeer(id);
        peer.close();
        _.remove(peers, function(peer) { return peer.id === id; });
        delete peersHash[id];
        fire('peer removed', peer);
      };

      function addIceCandidate(peerID, candidate) {
        var peer = getPeer(peerID),
            connection = peer.connection;

        connection.addIceCandidate(new RTCIceCandidate(candidate), function() {
          fire('peer ice_candidate accepted', peer, candidate);
        }, function(err) {
          fire('peer error ice_candidate', peer, err, candidate);
        });
      };

      function receiveAnswer(peerID, answer) {
        var peer = getPeer(peerID),
            connection = peer.connection;

        connection.setRemoteDescription(new RTCSessionDescription(answer));
        fire('peer receive answer', peer, answer);
      };

      function sendAnswer(peerID, offer) {
        var peer = getPeer(peerID),
            connection = peer.connection;

        if (connection == null) {
          peer.connect();
          connection = peer.connection;
        }      
        
        connection.setRemoteDescription(new RTCSessionDescription(offer), function() {
          connection.createAnswer(function(answer) {
            connection.setLocalDescription(answer, function() {
              emit('peer answer', {
                peerID: peerID,
                answer: answer
              });
              fire('peer send answer', peer, answer);
            }, function(err) {
              fire('peer error set_local_description', peer, err, answer);
            });
          }, function(err) {
            fire('peer error send answer', peer, err, offer);
          });
        }, function(err) {
          fire('peer error set_remote_description', peer, err, offer);
        });
        fire('peer receive offer', peer, offer);
      };

      _.each({
        'peer list': (data) => _.each(data.peerIDs, addPeer),
        'peer join': (id) => addPeer(id),
        'peer leave': (id) => removePeerByID(id),
        'peer ice_candidate': (data) => addIceCandidate(data.peerID, data),
        'peer offer': (data) => sendAnswer(data.peerID, data.offer),
        'peer answer': (data) => receiveAnswer(data.peerID, data.answer)
      }, (handler, name) => socket.on(name, function() {
        handler.apply(this, arguments);
        fire(name, ...arguments);
      }));

      fire('ready', myID);
    });
  });

  function joinRoom(roomName) {
    emit('room join', roomName);
  };

  function leaveRoom(roomName) {
    emit('room leave', roomName);
  };

  var signal = {
    on: on,
    off: off,
    joinRoom: joinRoom,
    leaveRoom: leaveRoom
  };

  return signal;
};
/*
-  Signalling
*/

module.exports = function() {
  var signal;

  return {
    connectToSignal: function(server) {
      if (signal == null) signal = connectToSignal(server);
      return signal;
    }
  };
};