import {_} from 'lodash';

var iceServers = [{url: 'stun:stun.l.google.com:19302'}];

class Peer {
  constructor(id) {
    this._id = id;
    this._streams = [];
    this._channels = [];
  }

  connect() {
    this.peerConnection = (function createConnection() {
      var connection = new RTCPeerConnection({
        iceServers: iceServers
      });

      return connection;
    })();
  }

  createChannel(label, options, handlers) {

  }

  get id() { return this._id; }
  get streams() { return this._streams; }
  get channels() { return this._channels; }
}

export {Peer};