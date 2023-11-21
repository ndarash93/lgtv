module.exports = function makeServer(WebSocket, clientEmitter) {
  const server = new WebSocket.Server({ port: (process.env.DEBUG === 'true' ? 8002 : process.env.WS_PORT) });
  server.on('connection', (ws) => {
    clientEmitter.emit('connect');

    ws.on('message', function(message){
      messageData = JSON.parse(message)
      clientEmitter.emit('client->lg', {
        type: 'command',
        command: messageData.body.command,
        payload: messageData.body.payload
      })
    });

    function responseHandler(response) {
      ws.send(JSON.stringify({
        type: 'response',
        response: response.response
      }))
    }

    function statusHandler(status) {
      ws.send(JSON.stringify({
        type: 'status',
        status: status
      }))
    }

    clientEmitter.on('response', responseHandler);
    clientEmitter.on('status', statusHandler);
    ws.on('close', function(){
      clientEmitter.emit('close')  // TODO add client identifiers
      clientEmitter.removeListener('response', responseHandler);
      clientEmitter.removeListener('status', statusHandler);
    });
  })
}
