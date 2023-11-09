const WebSocket = require('ws');
const udp = require('dgram');
require('dotenv').config();
const express = require('express');
const app = express();
const makeLGTV = require('./util/lgtv');
const makeServer = require('./util/server')
const magic = require('./util/magic');
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
const Server = makeServer(WebSocket, clientEmitter)
const lgtv = makeLGTV(WebSocket, lgtvEmitter)


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

app.get('/', (req, res) => {
  res.render('remote.ejs', {
  });
});




//app.listen(process.env.PORT, _ => {});
app.listen(9000, _ => { });
