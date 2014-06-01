
import {_} from 'lodash';

var CHANNEL_EVENTS = ['open', 'close', 'message', 'error'];

class Channel {
  constructor(peer, channel, channelListeners) {
    this._channel = channel;
    this._peer = peer;

    this.on(channelListeners);
  }

  send(data) { this._channel.send(data); }

  get channel() { return this._channel; }
  get peer()    { return this._peer; }

  get readyState() { return this._channel.readyState; }

  /*
  +  Event Handling
  */
  on(event, listener) {
    if (typeof event == 'object') {
      for (var eventName in event) this.on(eventName, event[eventName]);
      return;
    }

    this.channel.addEventListener(event, (event) => listener(this, event));
  }
  /*
  -  Event Handling
  */
}

export {Channel};