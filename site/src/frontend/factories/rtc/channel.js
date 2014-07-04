class Channel {
  constructor(peer, channel, channelListeners) {
    this._channel = channel;
    this._peer = peer;

    this.on(channelListeners || {});
  }

  send(data) { this._channel.send(data); }
  sendJSON(data) { this._channel.send(JSON.stringify(data)); }

  get label() { return this._channel.label; }
  get channel() { return this._channel; }
  get peer() { return this._peer; }

  /*
  +  Event Handling
  */
  on(event, listener) {
    if (typeof event == 'object') {
      for (var eventName in event) this.on(eventName, event[eventName]);
      return;
    }

    this.channel.addEventListener(event, event => listener(this, event));

    return this;
  }
  /*
  -  Event Handling
  */
}

export {Channel};