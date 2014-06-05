module.exports = function() {

  function sendMessageToAll(peers, message) {
    _.each(peers, peer => sendMessage(peer, message));
  }

  function sendMessage(peer, message) {
    try {
      var chatChannel = peer.channel('chat');
      if (chatChannel) chatChannel.sendJSON(message);
    }
    catch (e) {
      console.log('Chat send error', e, chatChannel, message);
    }
  }

  function messageHandler(channel, message, peers, onMessage) {
    message = JSON.parse(message);

    sendMessageToAll(peers, message);

    onMessage(channel, message);
  }

  return function(peers, onMessage) {
    console.log('Initializing ChatServe');

    return {
      sendMessageToAll: message => sendMessageToAll(peers, message), 
      handlers: {
        open: channel => console.log('chat opened'),
        close: channel => {},
        error: (channel, error) => {},
        message: (channel, event) => messageHandler(channel, event.data, peers, onMessage)
      }
    }
  };
};