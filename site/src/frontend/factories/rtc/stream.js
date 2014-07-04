class Stream {
  constructor(peer, stream, streamListeners) {
    this._peer = peer;
    this._stream = stream;
    this._id = stream.id;

    // this.on(streamListeners);
  }

  get stream() { return this._stream; }
  get id() { return this._id; }
  get peer() { return this._peer; }

  // /*
  // +  Event Handling
  // */
  // on(event, listener) {
  //   if (typeof event == 'object') {
  //     for (var eventName in event) this.on(eventName, event[eventName]);
  //     return;
  //   }

  //   this.stream.addEventListener(event, event => listener(this, event));

  //   return this;
  // }
  // /*
  // -  Event Handling
  // */
}

export {Stream}