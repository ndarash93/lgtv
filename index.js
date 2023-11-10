const WebSocket = require('ws');
const udp = require('dgram');
require('dotenv').config();
const express = require('express');
const app = express();
const magic = require('./util/magic');
const makeLGTV = require('./util/lgtv', magic);
const makeServer = require('./util/server')
const EventEmitter = require('events');
const exec = require('child_process').exec




const lgtvEmitter = new EventEmitter();
const clientEmitter = new EventEmitter();

const status = {
  isOn: false,
  isOpen: false,
  isRegistered: false
};
//const router = require('router')(express.Router(), lgtv, magic);
const Server = makeServer(WebSocket, clientEmitter, status)
//const lgtv = makeLGTV(WebSocket, lgtvEmitter, magic, status)


app.set('view-engine', 'ejs');

app.use(express.static('public'));
app.use(express.json());



clientEmitter.on('connect', () => {
  console.log('Client Connected')
})

clientEmitter.on('message', (message) => {
  console.log(message);
})

clientEmitter.on('close', _ => {
  console.log('Client closed')
})
clientEmitter.on('client->lg', function(message){
  if(message.type === 'command'){
    if(message.command === 'power'){
      if(!status.isOn){
        magic(udp)
        status.isOn = true;
      }else if(!status.isOpen){
        const lgtv = makeLGTV(WebSocket, lgtvEmitter, magic, status)
      }
    }
    console.log(`ClientEmmitter Message: ${message}`);
    lgtvEmitter.emit('command', {command: message.command, payload: message.payload})
  }
})

lgtvEmitter.on('open', function () {
  status.isOpen = true;
})

lgtvEmitter.on('close', function () {
  status.isOpen = false;
  status.isRegistered = false;
})

lgtvEmitter.on('registered', function () {
  console.log('Registered')
  status.isRegistered = true;
})

lgtvEmitter.on('noconnect', function () {
  console.log('Registered')
  status.isOn = false;
  status.isOpen = false;
  status.isRegistered = false;
  clientEmitter.emit('noconnect');
})

app.get('/', (req, res) => {
  res.render('remote.ejs', {
  });
});




//app.listen(process.env.PORT, _ => {});
app.listen(9000, _ => { });
