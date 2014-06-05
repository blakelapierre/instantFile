// based off of webrtc.io

var _ = require('lodash'),
    uuid = require('node-uuid');

function HashList(idProperty) {
  _.extend(this.prototype, {

  });
}

// A HashList stores data in both an array, and a dictionary/hashmap
// We do this 
function HashList(idProperty) {
  var list = [],
      hash = {};

  if (idProperty == '_self') {
    this.push = function(obj) {
      list.push(obj);
      hash[obj] = {
        id: obj,
        index: list.length - 1,
        obj: obj
      }
    };

    this.removeObject = function(obj) {
      this.removeByID(obj);
    };

    this.removeByID = function(id) {
      var hObj = hash[id];

      if (hObj == null) return;

      list.splice(hObj.index, 1);
      delete hash[id];

      var length = list.length;
      for (var i = hObj.index; i < length; i++) {
        hash[list[i]].index = i;
      }
    };
  }
  else if (idProperty) {
    this.push = function(obj) {
      list.push(obj);
      hash[obj[idProperty]] = {
        id: obj[idProperty],
        index: list.length - 1,
        obj: obj
      };
    };

    this.removeObject = function(obj) {
      var id = obj[idProperty];
      this.removeByID(id);
    };

    this.removeByID = function(id) {
      var hObj = hash[id];

      if (hObj == null) return;

      list.splice(hObj.index, 1);
      delete hash[id];

      var length = list.length;
      for (var i = hObj.index; i < length; i++) {
        hash[list[i][idProperty]].index = i;
      }
    };
  }
  else {
    throw Error('You must specify an id. Use "_self" to use the object itself.');
  }

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

  this.forEach = function(fn) {
    for (var i = 0; i < list.length; i++) {
      fn(list[i]);
    }
  }
};

module.exports = function(io) {
  var rooms = new HashList('_roomName'),
      sockets = new HashList('id');


  function joinRoom(socket, roomName) {
    var room = rooms.getByID(roomName);

    if (room == null) {
      room = new HashList('id');
      room._roomName = roomName;
      rooms.push(room);
    }

    room.forEach(function(peerSocket) {
      peerSocket.emit('peer join', socket.id);
    });

    socket.emit('peer list', {
      roomName: roomName,
      peerIDs: _.pluck(room.asList(), 'id')
    });

    room.push(socket);

    socket.rooms.push(roomName);
    console.log('join', roomName, socket.id);
  };

  function leaveRoom(socket, roomName) {
    console.log('leave', roomName, socket.id);
    var room = rooms.getByID(roomName);

    if (room == null) {
      console.log('Tried to leave non-existent room', roomName);
      return;
    }

    room.removeObject(socket);

    socket.rooms.removeByID(roomName);

    room.forEach(function(peerSocket) {
      peerSocket.emit('peer leave', socket.id);
    });

    if (room.length() == 0) rooms.removeByID(roomName);
  };

  io.sockets.on('connection', function(socket) {
    //socket.peerID = uuid.v4();
    socket.emit('your_id', socket.id);

    socket.rooms = new HashList('_self');

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
        });
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
      console.log('disconnect', socket.id);
      socket.rooms.forEach(function(roomName) {
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