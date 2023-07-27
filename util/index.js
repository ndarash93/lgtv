require('dotenv').config();
const WebSocket = require('ws');
const udp = require('dgram');

const magic = require('./magic');
const lgtv = require('./lgtv')(WebSocket);
//const lgtv = require('./working')(WebSocket);

//magic(udp)

setTimeout(function(){
    lgtv.control.setVolume(12);
},500);
