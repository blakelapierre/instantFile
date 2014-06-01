import {Channel} from './channel';

import {_} from 'lodash';

var RTCPeerConnection = (window.PeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);


var iceServers = [{url: 'stun:stun.l.google.com:19302'}];

var CONNECTION_EVENTS = ['negotiation_needed', 'ice_candidate', 'signaling_state_change', 
                         'add_stream', 'remove_stream', 'ice_connection_state_change',
                         'data_channel'];

class Peer {
  constructor(id, connectionListeners) {
    this._id = id;
    this._channels = [];
    this._streams = [];
    this._events = {};
    this._connectionListeners = connectionListeners;
  }

  connect() {
    var connection = new RTCPeerConnection({
      iceServers: [{url: 'stun:stun.l.google.com:19302'}]
    });

    _.each(this._connectionListeners, 
      (listener, eventName) => connection.addEventListener(eventName.replace(/\_/g, ''), listener));

    connection.addEventListener('datachannel', (event) => {
      var channel = new Channel(this, event.channel, {
        'close': () => _.remove(this._channels, function(c) { return c.label === label; })
      });

      this._channels.push(channel);

      this.fire('channel added', channel);
    });
  
    this._connection = connection;
  }

  addChannel(label, options, channelListeners) {
    var channel = new Channel(this, this.connection.createDataChannel(label, options), channelListeners);

    channel.on({
      'close': () => _.remove(this._channels, function(c) { return c.label === label; })
    });

    this._channels.push(channel);

    this.fire('channel added', channel);

    return channel;
  }

  addStream() {

  }

  close() {
    if (this.connection) this.connection.close();
  }

  get id() { return this._id; }
  get streams() { return this._streams; }
  get channels() { return this._channels; }

  // Do we want to expose this?!
  get connection() { return this._connection; }

  /*
  +  Event Handling
  */
  on(event, listener) {
    var events = this._events;

    if (typeof event == 'object') {
      for (var eventName in event) this.on(eventName, event[eventName]);
      return;
    }

    if (this.peerConnection && CONNECTION_EVENTS.indexOf(event) != -1) {
      this.peerConnection.addEventListener(event.replace(/_/g, ''), listener);
      return;
    }

    events[event] = events[event] || [];
    events[event].push(listener);

    this._events = events;
  }

  off(event, listener) {
    var events = this._events;

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
  }

  fire(event) {
    var events = this._events = this._events || {};

    var listeners = events[event] || [],
        args = Array.prototype.slice.call(arguments, 1);

    for (var i = 0; i < listeners.length; i++) {
      listeners[i].apply(null, args);
    }
  }
  /*
  -  Event Handling
  */
}

export {Peer};