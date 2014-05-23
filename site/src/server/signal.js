// based off of webrtc.io

var _ = require('lodash'),
    uuid = require('node-uuid');

module.exports = function(io) {
  var rooms = {},
      sockets = {},
      roomCount = 0,
      socketCount = 0;


  function joinRoom(socket, roomName) {
    var room = rooms[roomName];
console.log(socket.id, 'join', roomName);
    if (room == null) {
      room = [];
      roomCount++;
      rooms[roomName] = room;  
    }

    _.each(room, function(peerSocket) {
      peerSocket.emit('peer join', socket.id);
    });

    socket.emit('peer list', {
      peerIDs: _.pluck(room, 'id')
    });

    room.push(socket);

    socket.rooms.push(roomName);
  };

  function leaveRoom(socket, roomName) {
    var room = rooms[roomName] || [];

    _.remove(room, function(s) { return s == socket; });

    _.remove(socket.rooms, function(r) { return r === roomName; });

    _.each(room, function(peerSocket) {
      peerSocket.emit('peer leave', socket.id);
    })

    if (room.length == 0) delete rooms[roomName];
  };

  io.set('log level', 0);

  io.sockets.on('connection', function(socket) {
    socketCount++; 
    
    //socket.peerID = uuid.v4();
    socket.emit('your_id', socket.id);
    console.log('new connection', socket.id);

    socket.rooms = [];

    sockets[socket.id] = socket;

    socket.on('ice_candidate', function(data) {
      var peerSocket = sockets[data.peerID];

      if (peerSocket) {
        peerSocket.emit('peer ice_candidate', {
          label: data.label,
          candidate: data.candidate,
          peerID: socket.id
        });
      }
    });

    socket.on('peer offer', function(data) {
      var peerSocket = sockets[data.peerID];

      if (peerSocket) {
        peerSocket.emit('peer offer', {
          offer: data.offer,
          peerID: socket.id
        })
      }
    });

    socket.on('peer answer', function(data) {
      var peerSocket = sockets[data.peerID];

      if (peerSocket) {
        peerSocket.emit('peer answer', {
          answer: data.answer,
          peerID: socket.id
        });
      }
    });

    socket.on('room join', function(roomName) {
      joinRoom(socket, roomName);
    });

    socket.on('room leave', function(roomName) {
      leaveRoom(socket, roomName);
    });

    socket.on('disconnect', function() {
      _.each(socket.rooms, function(roomName) {
        leaveRoom(socket, roomName);
      });

      delete sockets[socket.id];
    });
  });
};