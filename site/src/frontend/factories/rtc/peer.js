import {Channel} from './channel';

var _ = require('lodash');


var RTCPeerConnection = (window.PeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);

var iceServers = [{url: 'stun:stun.l.google.com:19302'}];

var CONNECTION_EVENTS = ['negotiation_needed', 'ice_candidate', 'signaling_state_change', 
                         'add_stream', 'remove_stream', 'ice_connection_state_change',
                         'data_channel'];

class Peer {
  constructor(id, connectionListeners) {
    this._id = id;
    this._channels = [];
    this._historicalChannels = [];
    this._streams = [];
    this._events = {};
    this._connectionListeners = connectionListeners;

    this._nextChannelID = 0;
  }

  connect(onConnect) {
    var connection = new RTCPeerConnection({
      iceServers: [{url: 'stun:stun.l.google.com:19302'}]
    });

    _.each(this._connectionListeners, 
      (listener, eventName) => connection.addEventListener(eventName.replace(/\_/g, ''), listener));

    connection.addEventListener('datachannel', 
      event => {
        console.log('****datachannel', event);
        this._addChannel(new Channel(this, event.channel, { }));
      });
  
    if (onConnect) {
      var connectWatcher = event => {
        if (connection.iceConnectionState == 'connected' 
          || connection.iceConnectionState == 'completed') {
          onConnect(this);
          connection.removeEventListener('iceconnectionstatechange', connectWatcher);
        }
      };

      connection.addEventListener('iceconnectionstatechange', connectWatcher);
    }

    this._connection = connection;
  }

  addChannel(label, options, channelListeners) {
    label = label || ('data-channel-' + this._nextChannelID++);

    return this._addChannel(new Channel(this, this.connection.createDataChannel(label, options), channelListeners));
  }

  removeChannel(label) {
    var removed = _.remove(this._channels, function(c) { return c.label === label; })
    if (removed.length > 0) _.each(removed, (channel) => {
      this._historicalChannels.push(channel);
      this.fire('channel removed', channel);
    });
  }

  addStream() {

  }

  close() {
    if (this.connection) this.connection.close();
  }

  get id() { return this._id; }
  get streams() { return this._streams; }
  get channels() { return this._channels; }

  channel(label) { return _.find(this._channels, {'label': label}); }

  get historicalChannels() { return this._historicalChannels; }

  // Do we want to expose this?!
  get connection() { return this._connection; }

  _addChannel(channel) {
    channel.on({
      'close': () => this.removeChannel(channel.label)
    });

    this._channels.push(channel);

    this.fire('channel added', channel);

    return channel;
  }

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