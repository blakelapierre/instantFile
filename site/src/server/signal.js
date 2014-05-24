// based off of webrtc.io

var _ = require('lodash'),
    uuid = require('node-uuid');

function HashList(idProperty) {
  var list = [],
      hash = {};

  if (idProperty) {
    this.push = function(obj) {
      list.push(obj);
      hash[obj[idProperty]] = {
        id: obj[idProperty],
        index: list.length - 1,
        obj: obj
      };
    };
  }
  else {
    this.push = function(id, obj) {
      list.push(obj);
      hash[id] = {
        id: id,
        index: list.length - 1,
        obj: obj
      };
    };
  }

  this.removeObject = function(obj) {
    var hObj = hash[obj.id];

    list.splice(hObj.index, 1);
    delete hash[obj.id];
  };

  this.removeByID = function(id) {
    var hObj = hash[id];

    list.splice(hObj.index, 1);
    delete hash[id];
  };

  this.length = function() {
    return list.length;
  };

  this.getByID = function(id) {
    var record = hash[id];
    return record ? record.obj : null;
  };

  this.asList = function() {
    return list;
  };

  this.asHash = function() {
    return hash;
  };
};

module.exports = function(io) {
  var rooms = new HashList(),
      sockets = new HashList('id');


  function joinRoom(socket, roomName) {
    var room = rooms.getByID(roomName);

    if (room == null) {
      room = new HashList('id');
      rooms.push(roomName, room);
    }

    _.each(room.asList(), function(peerSocket) {
      peerSocket.emit('peer join', socket.id);
    });

    socket.emit('peer list', {
      peerIDs: _.pluck(room.asList(), 'id')
    });

    room.push(socket);

    socket.rooms.push(roomName);
  };

  function leaveRoom(socket, roomName) {
    var room = rooms.getByID(roomName) || [];

    room.removeObject(socket);

    _.remove(socket.rooms, function(r) { return r === roomName; });

    _.each(room.asList(), function(peerSocket) {
      console.log(peerSocket);
      peerSocket.emit('peer leave', socket.id);
    })

    if (room.length == 0) rooms.removeByID(roomName);
  };

  io.set('log level', 0);

  io.sockets.on('connection', function(socket) {
    //socket.peerID = uuid.v4();
    socket.emit('your_id', socket.id);

    socket.rooms = [];

    sockets.push(socket);

    socket.on('ice_candidate', function(data) {
      var peerSocket = sockets.getByID(data.peerID);

      if (peerSocket) {
        peerSocket.emit('peer ice_candidate', {
          label: data.label,
          candidate: data.candidate,
          peerID: socket.id
        });
      }
    });

    socket.on('peer offer', function(data) {
      var peerSocket = sockets.getByID(data.peerID);

      if (peerSocket) {
        peerSocket.emit('peer offer', {
          offer: data.offer,
          peerID: socket.id
        })
      }
    });

    socket.on('peer answer', function(data) {
      var peerSocket = sockets.getByID(data.peerID);

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

      sockets.removeObject(socket);
    });
  });

  return {
    rooms: rooms,
    sockets: sockets
  };
};