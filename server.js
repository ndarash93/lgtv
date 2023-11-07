module.exports = function makeServer(WebSocket) {
  const server = new WebSocket.Server({ port: 8080 });
  console.log('Test')
  server.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
      messageData = JSON.parse(message)
      console.log(`Received: ${messageData.body.command}`);
      ws.send(`Echo: ${message}`);
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

}