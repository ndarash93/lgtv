module.exports = function makeServer(WebSocket, clientEmitter, status) {
  const server = new WebSocket.Server({ port: 8080 });
  server.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
      messageData = JSON.parse(message)
      clientEmitter.emit('status');
      clientEmitter.emit('client->lg', {
        type: 'command',
        command: messageData.body.command,
        payload: messageData.body.payload
      })
    });

    clientEmitter.on('response', function (response) {
      ws.send(JSON.stringify({
        type: 'response',
        response: response.response
      }))
    })

    clientEmitter.on('status', function () {
      ws.send(JSON.stringify({
        type: 'status',
        status: status
      }));
    })

    ws.on('close', () => {
      clientEmitter.emit('close')  // TODO add client identifiers
    });
  });

}