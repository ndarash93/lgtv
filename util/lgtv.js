let pairing = require('./pairing.json');
pairing['client-key'] = process.env.CLIENTKEY;

module.exports = function makeLGTV(WebSocket, lgtvEmitter) {


  const cidPrefix = ('0000000' + (Math.floor(Math.random() * 0xFFFFFFFF).toString(16))).slice(-8);
  let cidCount = 0;
  function getCid() {
    return cidPrefix + ('000' + (cidCount++).toString(16)).slice(-4);
  }
  const socket = new WebSocket(`ws://${process.env.TV_URL}:${process.env.TV_PORT}`);

  socket.on('close', function () {
    lgtvEmitter.emit('close');
    //console.log('LGTV Socket Closed')
    lgtvEmitter.removeListener('command', commandHandler)
    lgtvEmitter.removeListener('register', registerHandler);
  })

  socket.on('open', function () {
    cidCount = 0;
    //console.log('TV Open')
    lgtvEmitter.emit('open');
    clearTimeout(connectionTimer);
  });

  socket.on('error', function (error) {
    clearTimeout(connectionTimer);
    socket.close();
  });

  socket.on('message', function (data) {
    const dataJSON = JSON.parse(data.toString('utf-8'));
    if (dataJSON.type === 'registered') {
      lgtvEmitter.emit('registered');
    } else if (dataJSON.type === 'response') {
      lgtvEmitter.emit(dataJSON.id, dataJSON);
      //console.log(dataJSON.id)
    }
  });

  function commandHandler({ command, payload = {} }) {
    let uri;
    let tempPayload = payload;
    const specialURI = 'ssap://com.webos.service.networkinput/getPointerInputSocket';
    let specialCommand;
    //console.log('LGTV: ' + command)
    switch (command) {
      case 'mute':
        uri = 'ssap://audio/setMute';
        tempPayload = { mute: true }
        break;
      case 'unmute':
        'ssap://audio/setMute';
        tempPayload = { mute: false }
        break;
      case 'volumeUp':
        uri = 'ssap://audio/volumeUp';
        break;
      case 'volumeDown':
        uri = 'ssap://audio/volumeDown';
        break;
      case 'getVolume':
        uri = 'ssap://audio/getVolume';
        break;
      case 'setVolume':
        uri = 'ssap://audio/setVolume';
        tempPayload = { volume: 12 };
        break;
      case 'getVolume':
        uri = 'ssap://audio/setVolume';
        tempPayload = { volume: 12 };
        break;
      case 'play':
        uri = 'ssap://media.controls/play';
        break;
      case 'pause':
        uri = 'ssap://media.controls/pause';
        break;
      case 'fastForward':
        uri = 'ssap://media.controls/fastForward';
        break;
      case 'rewind':
        uri = 'ssap://media.controls/rewind';
      case 'netflix':
        uri = 'ssap://system.launcher/launch';
        tempPayload = { id: 'netflix' };
        break;
      case 'hulu':
        uri = 'ssap://system.launcher/launch';
        tempPayload = { id: 'hulu' };
        break;
      case 'disney':
        uri = 'ssap://system.launcher/launch';
        tempPayload = { id: 'disney' };
        break;
      case 'enter':
        uri = 'ssap://com.webos.service.ime/sendEnterKey';
        break;
      case 'delete':
        uri = 'ssap://com.webos.service.ime/deleteCharacters';
      case 'power':
        uri = 'ssap://system/turnOff';
        break;
      case 'select':
        uri = specialURI;
        specialCommand = 'ENTER';
        break;
      case 'up':
        uri = specialURI;
        specialCommand = 'UP';
        break;
      case 'down':
        uri = specialURI;
        specialCommand = 'DOWN';
        break;
      case 'left':
        uri = specialURI;
        specialCommand = 'LEFT';
        break;
      case 'right':
        uri = specialURI;
        specialCommand = 'RIGHT';
        break;
      case 'back':
        uri = specialURI;
        specialCommand = 'BACK';
        break;
      case 'home':
        uri = specialURI;
        specialCommand = 'HOME';
    }
    const commandJSON = {
      id: getCid(),
      type: 'request',
      uri: uri,
      payload: tempPayload
    }
    const commandTimeout = setTimeout(function () {
      //lgtvEmitter.emit('close', commandJSON)
      socket.close()
      //console.log('Error produced by', commandJSON);
    }, 1000);
    //console.log(`CommandJSON: ${commandJSON.id}`)
    lgtvEmitter.once(commandJSON.id, function (data) {
      clearTimeout(commandTimeout)
      //console.log(`data: ${JSON.stringify(data)}, command: ${command}`)
      lgtvEmitter.emit('lg->client', { response: command });
      if(command === 'power'){
        socket.close();
      }
      if (data.payload.socketPath) {
        //console.log(`Special Request: ${data.payload.socketPath}`)
        const specialSocket = new WebSocket(data.payload.socketPath);
        specialSocket.on('open', function () {
          //console.log('Special Response')
          specialSocket.send(`type:button\nname:${specialCommand}\n\n`)
          specialSocket.close();
        })
      }
    })
    socket.send(JSON.stringify(commandJSON));
  }

  function registerHandler() {
    cidCount = 0;
    socket.send(JSON.stringify({
      id: getCid(),
      type: 'register',
      uri: undefined,
      payload: pairing
    })
    )
  }

  lgtvEmitter.on('command', commandHandler);
  lgtvEmitter.on('register', registerHandler);

  const connectionTimer = setTimeout(function () {
    socket.close();
    lgtvEmitter.emit('close')
    throw new Error('WebSocket connection timed out');
  }, 3000);
}