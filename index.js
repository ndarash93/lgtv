const WebSocket = require('ws');
const udp = require('dgram');
const https = require('https');
const fs = require('fs');
require('dotenv').config();
const express = require('express');
const app = express();
const magic = require('./util/magic');
const makeLGTV = require('./util/lgtv', magic);
const makeServer = require('./util/server')
const EventEmitter = require('events');
const lgtv = require('./util/lgtv');
const logger = require('./util/logger')();

const DEBUG = false;

const options = {
  cert: fs.readFileSync('cert.pem'),
  key: fs.readFileSync('key.pem')
};

const lgtvEmitter = new EventEmitter();
const clientEmitter = new EventEmitter();

const server = https.createServer(options)
makeServer(WebSocket, server, clientEmitter)




const status = {
  isOn: false,
  isOpen: false,
  isRegistered: false
};


app.set('view-engine', 'ejs');

app.use(express.static('public'));
app.use(express.json());


clientEmitter.on('connect', () => {
  //console.log('Client Connected')
  logger.note('client connected')
})

clientEmitter.on('message', (message) => {
  //console.log(message);
  logger.note('client connected')
  clientEmitter.emit('status', status)
})

clientEmitter.on('close', function() {
  //console.log('Client closed')
  logger.note(JSON.stringify({message: 'Client Closed'}))
})
clientEmitter.on('client->lg', function(message){
  if(message.type === 'command'){
    if(message.command === 'power'){
      if(!status.isOn){
        magic(udp)
        status.isOn = true;
      }else if(!status.isOpen){
        const lgtv = makeLGTV(WebSocket, lgtvEmitter)
      }else if(!status.isRegistered){
        lgtvEmitter.emit('register');
      }else{
        lgtvEmitter.emit('command', {command: message.command, payload: message.payload})
      }
    }else{
      lgtvEmitter.emit('command', {command: message.command, payload: message.payload})
    }
    clientEmitter.emit('status', status);
    logger.note(JSON.stringify({message: message, status: status}));
  }
})

lgtvEmitter.on('open', function () {
  status.isOpen = true;
  clientEmitter.emit('status', status)
  logger.note()
})

lgtvEmitter.on('close', function () {
  logger.note('LGTV Disconnected');
  status.isRegistered = false;
  status.isOpen = false;
  status.isOn = false;
  clientEmitter.emit('status', status)
  delete lgtv;
})

lgtvEmitter.on('registered', function () {
  logger.note('Registered')
  status.isRegistered = true;
  clientEmitter.emit('status', status)
})


lgtvEmitter.on('lg->client', function(response){
  //console.log('Response', response.response);
  clientEmitter.emit('response', {response: response.response});
})

app.get('/', (req, res) => {
  const server = process.env.DEBUG === 'true'
  ? `wss://${process.env.SERVER}:8002`
  : `wss://${process.env.SERVER}:${process.env.WS_PORT}`;
  res.render('remote.ejs', { server });
});


process.on('uncaughtException', function(err){
  logger.error(JSON.stringify(err))
  process.exit(1);
})

app.listen(process.env.DEBUG === 'true' ? 9000 : process.env.PORT, _ => {});
server.listen(process.env.WS_PORT, _ => {});