const WebSocket = require('ws');
const udp = require('dgram');
require('dotenv').config();
const express = require('express');
const app = express();
const magic = require('./util/magic');
const makeLGTV = require('./util/lgtv', magic);
const makeServer = require('./util/server')
const EventEmitter = require('events');
const { stat } = require('fs');
const { emit } = require('process');
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
//const lgtv = makeLGTV(WebSocket, lgtvEmitter, magic, status)


app.set('view-engine', 'ejs');

app.use(express.static('public'));
app.use(express.json());



clientEmitter.on('connect', () => {
  console.log('Client Connected')
})

clientEmitter.on('message', (message) => {
  console.log(message);
  clientEmitter.emit('status', status)
})

clientEmitter.on('close', function() {
  console.log('Client closed')
})
clientEmitter.on('client->lg', function(message){
  if(message.type === 'command'){
    if(message.command === 'power'){
      if(!status.isOn){
        magic(udp)
        status.isOn = true;
        setTimeout(function(){
          const lgtv = makeLGTV(WebSocket, lgtvEmitter)
        },3000);
      }else if(!status.isOpen){
        const lgtv = makeLGTV(WebSocket, lgtvEmitter)
      }else if(!status.isRegistered){
        lgtvEmitter.emit('register');
      }
    }
    //console.log(`ClientEmmitter Message: ${message}`);
    clientEmitter.emit('status', status);
    lgtvEmitter.emit('command', {command: message.command, payload: message.payload})
  }
})

lgtvEmitter.on('open', function () {
  status.isOpen = true;
  clientEmitter.emit('status', status)
})

lgtvEmitter.on('close', function () {
  console.log('LGTV Emitter close')
  status.isRegistered = false;
  status.isOpen = false;
  status.isOn = false;
  clientEmitter.emit('status', status)
})

lgtvEmitter.on('registered', function () {
  console.log('Registered')
  status.isRegistered = true;
  clientEmitter.emit('status', status)
})

lgtvEmitter.on('timeout', function(){
  status.isOn = false;
  status.isOpen = false;
  status.isRegistered = false;
  clientEmitter.emit('status', status)
})

lgtvEmitter.on('lg->client', function(response){
  console.log('Response', response.response);
  clientEmitter.emit('response', {response: response.response});
  //clientEmitter.emit('status', status);
})

app.get('/', (req, res) => {
  res.render('remote.ejs', {
  });
});




//app.listen(process.env.PORT, _ => {});
app.listen(9000, _ => { });
