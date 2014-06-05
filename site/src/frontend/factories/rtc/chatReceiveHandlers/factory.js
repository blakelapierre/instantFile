module.exports = function() {

  return function(onMessage) {
    console.log('Initializing ChatReceive');
    
    return {
      handlers: {
        open: channel => console.log('chat open'),
        close: channel => { },
        error: (channel, error) => { },
        message: (channel, event) => onMessage(channel, JSON.parse(event.data))
      }
    }
  }
};