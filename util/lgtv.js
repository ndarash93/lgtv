module.exports = function makeLGTV(WebSocket, lgtvEmitter, turnOn, status) {
  const cidPrefix = ('0000000' + (Math.floor(Math.random() * 0xFFFFFFFF).toString(16))).slice(-8);
  let pairing = require('./pairing.json');
  pairing['client-key'] = process.env.CLIENTKEY;
  let cidCount = 0;
  let isRegistered = false;
  let isOpen = false;

  function getCid() {
    return cidPrefix + ('000' + (cidCount++).toString(16)).slice(-4);
  }

  const connectionTimeout = 3000; // 5 seconds, for example

  // Create a Promise-based function to establish the WebSocket connection with a timeout
  function connectWithTimeout(timeout) {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(`ws://${process.env.TV_URL}:${process.env.TV_PORT}`);

      socket.on('close', function () {
        cidCount = 0;
        lgtvEmitter.emit('close');
        console.log('Socket Closed')
      })

      socket.on('open', () => {
        console.log('TV Open')
        clearTimeout(connectionTimer); // Connection succeeded, so clear the timeout
        resolve(socket); // Resolve the Promise with the WebSocket instance
      });

      socket.on('error', (error) => {
        clearTimeout(connectionTimer); // Clear the timeout on error
        socket.close(); // Close the WebSocket connection
        reject(error); // Reject the Promise with the error
      });

      const connectionTimer = setTimeout(() => {
        socket.close(); // Close the WebSocket connection on timeout
        lgtvEmitter.emit('noconnect')
        reject(new Error('WebSocket connection timed out'));
      }, timeout);
    });
  }

  connectWithTimeout(connectionTimeout)
    .then((socket) => {
      console.log('Connected to WebSocket');
      // You can now use the WebSocket instance for communication
      //isOpen = true;
      socket.send(JSON.stringify({
        id: getCid(),
        type: 'register',
        uri: undefined,
        payload: pairing
      })
      )
      //'register', undefined, pairing);
      lgtvEmitter.emit('open');



      socket.on('message', function (data) {
        dataString = data.toString('utf-8');
        dataJSON = JSON.parse(dataString);
        //console.log(dataJSON)
        if (dataJSON.type === 'registered') {
          socket.emit('registered', dataJSON);
          lgtvEmitter.emit('registered');
        } else if (dataJSON.type === 'response') {
          socket.emit(dataJSON.id, dataJSON);
          console.log(dataJSON)
        }
      });

      lgtvEmitter.on('command', function ({ command, payload = {} }) {
        let uri;
        let tempPayload = payload;
        const specialURI = 'ssap://com.webos.service.networkinput/getPointerInputSocket';
        let specialCommand;
        console.log('LGTV: ' + command)
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
        console.log(`CommandJSON: ${commandJSON.id}`)
        socket.once(commandJSON.id, function (data) {
          console.log(`data: ${data}`)
          if (data.payload.socketPath) {
            console.log(`Special Request: ${data.payload.socketPath}`)
            const specialSocket = new WebSocket(data.payload.socketPath);
            specialSocket.on('open', function () {
              console.log('Special Response')
              specialSocket.send(`type:button\nname:${specialCommand}\n\n`)
              specialSocket.close();
            })
          }
        })
        //console.log(commandJSON)
        socket.send(JSON.stringify(commandJSON));
      })
    })
    .catch((error) => {
      console.error('WebSocket connection error:', error.message);
      //clientEmitter.emit('noconnect')
    }).finally(_ => {

    })
}