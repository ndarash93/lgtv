module.exports = function makeLGTV(WebSocket, emitter) {
  const cidPrefix = ('0000000' + (Math.floor(Math.random() * 0xFFFFFFFF).toString(16))).slice(-8);
  //const socket = new WebSocket(`ws://${process.env.TV_URL}:${process.env.TV_PORT}`, { connectionTimeout: 2000 });
  let pairing = require('./pairing.json');
  pairing['client-key'] = process.env.CLIENTKEY;
  let cidCount = 0;
  let isRegistered = false;
  let isOpen = false;

  function getCid() {
    return cidPrefix + ('000' + (cidCount++).toString(16)).slice(-4);
  }

  const connectionTimeout = 1000; // 5 seconds, for example

  // Create a Promise-based function to establish the WebSocket connection with a timeout
  function connectWithTimeout(timeout) {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(`ws://${process.env.TV_URL}:${process.env.TV_PORT}`);

      socket.on('open', () => {
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
        reject(new Error('WebSocket connection timed out'));
      }, timeout);
    });
  }

  connectWithTimeout(connectionTimeout)
    .then((socket) => {
      console.log('Connected to WebSocket');
      // You can now use the WebSocket instance for communication
      //isOpen = true;
      send('register', undefined, pairing);
      emitter.emit('open');

      socket.on('close', function () {
        //isOpen = false;
        emitter.emit('close');
      })

      socket.on('message', function (data) {
        data = JSON.parse(data);
        if (data.type === 'registered') {
          socket.emit('registered', data);
          emitter.emit('registered');
        } else if (data.type === 'response') {
          socket.emit(data.id, data);
        }
      });

      emitter.on('command', function(command, payload = {}){
        const commandJSON = JSON.stringify({
          id: getCid(),
          type: 'request',
          uri: command,
          payload: payload
        })
        socket.on(commandJSON.id, function (data){
          if (data.payload.socketPath) {
            const specialSocket = new WebSocket(data.payload.socketPath);
            specialSocket.on('open', function () {
              specialSocket.send(`type:button\nname:${command}\n\n`)
              specialSocket.close();
            })
          }
        })
        socket.send(commandJSON);
      })
    })
    .catch((error) => {
      console.error('WebSocket connection error:', error.message);
      emitter.emit('noconnect')
    });

  function send(type, uri, payload = {}, command = '') {
    const json = {
      id: getCid(),
      type: type,
      uri: uri,
      payload: payload
    }
    socket.on(json.id, function (data) {
      if (data.payload.socketPath) {
        const specialSocket = new WebSocket(data.payload.socketPath);
        specialSocket.on('open', function () {
          specialSocket.send(`type:button\nname:${command}\n\n`)
          specialSocket.close();
        })
      }
    })
    try {
      socket.send(JSON.stringify(json));
    } catch (e) {
      throw e
    }
  }

  function request(uri, payload = {}) {
    send('request', uri, payload);
  }

  function specialRequest(command) {
    send('request', 'ssap://com.webos.service.networkinput/getPointerInputSocket', {}, command);
  }


  const control = {
    mute: function () {
      request('ssap://audio/setMute', { mute: true });
    },
    unmute: function () {
      request('ssap://audio/setMute', { mute: false });
    },
    volumeUp: function () {
      request('ssap://audio/volumeUp');
    },
    volumeDown: function () {
      request('ssap://audio/volumeDown');
    },
    getVolume: function () {
      request('ssap://audio/getVolume');
    },
    setVolume: function (value) {
      request('ssap://audio/setVolume', { volume: value });
    },
    play: function () {
      request('ssap://media.controls/play');
    },
    pause: function () {
      request('ssap://media.controls/pause');
    },
    fastForward: function () {
      request('ssap://media.controls/fastForward');
    },
    rewind: function () {
      request('ssap://media.controls/rewind');
    },
    netflix: function () {
      request('ssap://system.launcher/launch', { id: 'netflix' });
    },
    plex: function () {
      request('ssap://system.launcher/launch', { id: 'plex' });
    },
    hulu: function () {
      request('ssap://system.launcher/launch', { id: 'hulu' });
    },
    disney: function () {
      request('ssap://system.launcher/launch', { id: 'disneyplus' });
    },
    enter: function () {
      request('ssap://com.webos.service.ime/sendEnterKey');
    },
    delete: function () {
      request('ssap://com.webos.service.ime/deleteCharacters');
    },
    turnOff: function () {
      request('ssap://system/turnOff');
      socket.close();
    },
    select: function () {
      specialRequest('ENTER');
    },
    up: function () {
      specialRequest('UP');
    },
    down: function () {
      specialRequest('DOWN');
    },
    left: function () {
      specialRequest('LEFT');
    },
    right: function () {
      specialRequest('RIGHT');
    },
    back: function () {
      specialRequest('BACK');
    },
    home: function () {
      specialRequest('HOME');
    },
  }

  function close() {
    socket.close();
  }

  return {
    isRegistered: isRegistered,
    isOpen: isOpen,
    control,
    close: close
  };
}