class Emitter {
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

export {Emitter};