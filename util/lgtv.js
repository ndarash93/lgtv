module.exports = function makeLGTV(WebSocket, lgtvEmitter) {

  let pairing = require('./pairing.json');
  pairing['client-key'] = process.env.CLIENTKEY;
  const cidPrefix = ('0000000' + (Math.floor(Math.random() * 0xFFFFFFFF).toString(16))).slice(-8);
  let cidCount = 0;
  function getCid() {
    return cidPrefix + ('000' + (cidCount++).toString(16)).slice(-4);
  }

  function connectWithTimeout(timeout) {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(`ws://${process.env.TV_URL}:${process.env.TV_PORT}`);
           
      socket.on('close', function () {
        //cidCount = 0;
        lgtvEmitter.emit('close');
        console.log('Socket Closed')
      })

      socket.on('open', function() {
        cidCount = 0;
        console.log('TV Open')
        lgtvEmitter.emit('open');
        clearTimeout(connectionTimer);
        resolve(socket);
      });

      socket.on('error', function(error) {
        clearTimeout(connectionTimer);
        socket.close();
        reject(error);
      });

      const connectionTimer = setTimeout(function() {
        socket.close();
        lgtvEmitter.emit('timeout')
        reject(new Error('WebSocket connection timed out'));
      }, timeout);
    });
  }

  connectWithTimeout(3000)
    .then(function(socket) {
      console.log('Connected to WebSocket');
      socket.send(JSON.stringify({
        id: getCid(),
        type: 'register',
        uri: undefined,
        payload: pairing
      })
      )

      lgtvEmitter.on('register', function () {
        cidCount = 0;
        socket.send(JSON.stringify({
          id: getCid(),
          type: 'register',
          uri: undefined,
          payload: pairing
        })
        )
      })
      
      socket.on('message', function (data) {
        dataString = data.toString('utf-8');
        dataJSON = JSON.parse(dataString);
        if (dataJSON.type === 'registered') {
          socket.emit('registered', dataJSON);
          lgtvEmitter.emit('registered');
        } else if (dataJSON.type === 'response') {
          socket.emit(dataJSON.id, dataJSON);
          console.log(dataJSON.id)
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
          lgtvEmitter.emit('timeout', commandJSON)
          socket.close()
          console.log('Error produced by', commandJSON);
        }, 1000);
        console.log(`CommandJSON: ${commandJSON.id}`)
        socket.once(commandJSON.id, function (data) {
          clearTimeout(commandTimeout)
          console.log(`data: ${JSON.stringify(data)}, command: ${command}`)
          if (command === 'power') {
            socket.close();
            console.log("Turned Off");
          }
          lgtvEmitter.emit('lg->client', { response: command });
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
      })
    })
    .catch((error) => {
      console.error('WebSocket connection error:', error.message);
    }).finally(_ => {

    })
    
}