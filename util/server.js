module.exports = function makeServer(WebSocket, clientEmitter) {
  const server = new WebSocket.Server({ port: 8080 });
  console.log('Test')
  server.on('connection', (ws) => {
    console.log('Client connected');
    clientEmitter.emit('connect');

    ws.on('message', (message) => {
      messageData = JSON.parse(message)
      console.log(`Received: ${messageData.body.command}`);
      ws.send(`Echo: ${message}`);
      clientEmitter.emit('command', {data: messageData.body.command})
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      clientEmitter.emit('close')  // TODO add client identifiers
    });
  });

}