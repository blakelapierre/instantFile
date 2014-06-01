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

 // peer.connect();


  // var streams = [],
  //     channels = [];

  // var peer = {
  //   id: id,
  //   channels: channels,
  //   streams: streams,
  //   connect: function() { 
  //     peer.peerConnection = createConnection(channels);
  //   },
  //   createChannel: function(label, options, handlers) {
  //     var channel = peer.peerConnection.createDataChannel(label, options);

  //     attachToChannel(channels, channel, handlers);

  //     return channel;
  //   }
  // };

  // function createConnection(channels) {
  //   var connection = new RTCPeerConnection({
  //     iceServers: [{url: 'stun:stun.l.google.com:19302'}]
  //   });
    
  //   connection.onnegotiationneeded = function(event) {
  //     sendOffer();
  //     fire ('peer negotiation_needed', peer, event);
  //   };

  //   connection.onicecandidate = function(event) {
  //     var candidate = event.candidate;

  //     if (candidate) {
  //       emit('ice_candidate', {
  //         peerID: id,
  //         label: candidate.sdpMLineIndex,
  //         candidate: candidate.candidate
  //       });

  //       fire('peer ice_candidate', peer, candidate);
  //     }
  //   };

  //   connection.addEventListener('icecandidate', function(e) {
  //     console.log('###############', e);
  //   })

  //   connection.onsignalingstatechange = function(event) {
  //     fire('peer signaling_state_change', peer, event);
  //   };

  //   connection.onaddstream = function(event) {
  //     fire('peer add_stream', peer, event);
  //   };

  //   connection.onremovestream = function(event) {
  //     fire('peer remove_stream', peer, event);
  //   };

  //   connection.oniceconnectionstatechange = function(event) {
  //     fire('peer ice_connection_state_change', peer, event);
  //   };

  //   connection.ondatachannel = function(event) {
  //     var channel = event.channel;
      
  //     // Override these functions when you get passed 'handlers'
  //     var handlers = {
  //       open: function() {},
  //       close: function() {},
  //       message: function(message) {console.log(message);},
  //       error: function(error) {}
  //     };

  //     attachToChannel(channels, channel, handlers);

  //     fire('peer data_channel connected', peer, channel, handlers);
  //   };

  //   return connection;
  // };

  function attachToChannel(channels, channel, handlers) {
    var label = channel.label;

    function call(name, arg1, arg2) {
      (handlers[name] || function () {})(arg1, arg2);
    };

    channel.addEventListener('open', function() {
      call('open', channel);
      fire('peer data_channel open', peer, channel);
    });

    channel.addEventListener('close', function() {
      _.remove(channels, function(c) { return c.label === label; });
      delete channels[label];

      call('close', channel);
      fire('peer data_channel close', peer, channel);
    });

    channel.addEventListener('message', function(message) {
      call('message', channel, message.data);
      fire('peer data_channel message', peer, channel, message);
    });

    channel.addEventListener('error', function(error) {
      call('error', channel, error);
      fire('peer data_channel error', peer, channel, error);
    });

    channels.push(channel);
    channels[label] = channel;

    return channel;
  };

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
          fire('peer ice_candidate', peer, candidate);
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

      socket.on('peer list', function(data) {
        _.each(data.peerIDs, addPeer);
        fire('peer list', data.roomName, data.peerIDs);
      });

      socket.on('peer join', function(id) {
        addPeer(id);
      });

      socket.on('peer leave', function(id) {
        removePeerByID(id);
      });

      socket.on('peer ice_candidate', function(data) {
        addIceCandidate(data.peerID, data);
      });

      socket.on('peer offer', function(data) {
        sendAnswer(data.peerID, data.offer);
      });

      socket.on('peer answer', function(data) {
        receiveAnswer(data.peerID, data.answer);
      });

      fire('ready', myID);
    });

    socket.on('disconnect', function() {

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