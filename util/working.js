function makeLGTV(WebSocket) {
  let isRegistered = false;
  let isSocketOpen = false;
  let isSpecialSocketOpen = false;
  const socket = new WebSocket('ws://192.168.0.21:3000');
  //let specialSocket;
  const cidPrefix = ('0000000' + (Math.floor(Math.random() * 0xFFFFFFFF).toString(16))).slice(-8);
  let cidCount = 0;
  const specialRequestLog = {};
  let pairing = require('./pairing.json');

  function test(n){
    console.log('Test',n);
  }

  setTimeout(function() {
    console.log('Socket Closed!');
    socket.close();
  }, 2000);

  function getCid() {
    return cidPrefix + ('000' + (cidCount++).toString(16)).slice(-4);
  }

  socket.on('open', function() {
    console.log('WebSocket connection established.');
    isSocketOpen = true;
    register();
  });

  socket.on('message', function open(data) {
    data = JSON.parse(data);
    console.log(data);
    if(data.type === 'registered'){
      isRegistered = true;
    }else if(data.type ==='response'){
      if (specialRequestLog[data.id]){
        console.log(specialRequestLog[data.id])
        const specialSocket = new WebSocket(data.payload.socketPath)
        specialSocket.on('open',function(){
          specialSocket.send(`type:button\nname:${specialRequestLog[data.id].payload}\n\n`)
          delete specialRequestLog[data.id]
          specialSocket.close();
        })
      }
    }
  });

  function waitForSocketOpen() {
    return new Promise((resolve) => {
      const checkVariable = () => {
        if (isSocketOpen) {
          resolve();
        } else {
          setTimeout(checkVariable, 100); // Check again after a short delay
        }
      };
  
      checkVariable();
    });
  }

  function waitForIsRegistered() {
    return new Promise((resolve) => {
      const checkVariable = () => {
        if (isRegistered) {
          resolve();
        } else {
          setTimeout(checkVariable, 100); // Check again after a short delay
        }
      };
  
      checkVariable();
    });
  }

  async function register() {
    await waitForSocketOpen();
    pairing['client-key'] = 'dfeeeeb3b2f6777db1457c4000efdba4';
    send('register', undefined, pairing);
  }

  function send(type, uri, payload) {
    const cid = getCid();
    const json = JSON.stringify({
      id: cid,
      type: type,
      uri: uri,
      payload: payload
    });
    console.log('sadsadsadsadsadsads',json)
    return new Promise((resolve) => { 
      socket.send(json);
      resolve();
    });
  }

  async function request(uri, payload = {}) {
    await waitForIsRegistered();
    send('request', uri, payload);
  }

  function waitForSpecialSocketOpen() {
    return new Promise((resolve) => {
      const checkVariable = () => {
        if (isSpecialSocketOpen) {
          resolve();
        } else {
          setTimeout(checkVariable, 100); // Check again after a short delay
        }
      };
  
      checkVariable();
    });
  }

  function specialSend(type, uri, command) {
    const cid = getCid();
    const json = JSON.stringify({
      id: cid,
      type: type,
      uri: uri,
      payload: {}
    });
    specialRequestLog[cid] = {'payload': command}
    console.log(specialRequestLog);
    return new Promise((resolve) => { 
      socket.send(json);
      resolve();
    });
  }

  async function specialRequest(payload) {
    await waitForIsRegistered();
    specialSend('request','ssap://com.webos.service.networkinput/getPointerInputSocket',payload);
  }


  const control = {
    volumeUp: function(){
      request('ssap://audio/volumeUp');
    },
    volumeDown: function(){
      request('ssap://audio/volumeDown');
    },
    getVolume: function(){
      request('ssap://audio/getVolume');
    },
    setVolume: function(value){
      request('ssap://audio/setVolume',{volume:value});
    },
    play: function(){
      request('ssap://media.controls/play');
    },
    pause: function(){
      request('ssap://media.controls/pause');
    },
    fastForward: function(){
      request('ssap://media.controls/fastForward');
    },
    rewind: function(){
      request('ssap://media.controls/rewind');
    },
    netflix: function(){
      request('ssap://system.launcher/launch', {id: 'netflix'});
    },
    plex: function(){
      request('ssap://system.launcher/launch', {id: 'plex'});
    },
    hulu: function(){
      request('ssap://system.launcher/launch', {id: 'hulu'});
    },
    enter: function(){
      request('ssap://com.webos.service.ime/sendEnterKey');
    },
    delete: function(){
      request('ssap://com.webos.service.ime/deleteCharacters');
    },
    turnOff: function(){
      request('ssap://system/turnOff');
    },
    select: function(){
      specialRequest('ENTER');
    },
    up: function(){
      specialRequest('UP');
    },
    down: function(){
      specialRequest('DOWN');
    },
    left: function(){
      specialRequest('LEFT');
    },
    right: function(){
      specialRequest('RIGHT');
    },
  }

  return {
    register,
    send,
    request,
    control
  };
}

module.exports = makeLGTV;