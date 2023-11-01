const WebSocket = require('ws');
const udp = require('dgram');
require('dotenv').config();
const express = require('express');
const app = express();
const makeLGTV = require('./util/lgtv');
const magic = require('./util/magic');
const { EventEmitter } = require('stream');
const exec = require('child_process').exec


const lgtvEmitter = new EventEmitter();
let timeoutHandle;
const timeout = 60000;
let lgtv;
const status = {
  isOn: false,
  isOpen: false,
  isRegistered: false
};
//const router = require('router')(express.Router(), lgtv, magic);

app.set('view-engine', 'ejs');

app.use(express.static('public'));
app.use(express.json());


app.use(function(req,res,next){
  if(status.isRegistered){
    clearTimeout(timeoutHandle);
    timeoutHandle = setTimeout(lgtv.close,timeout);
  }
  next();
})


app.use(function(req,res,next){
  exec(`ping -c 1 ${process.env.TV_URL}`,function(err, stdout, stderr){
    if(stdout.includes('100%')){
      status.isOn = false;
      status.isOpen= false;
      status.isRegistered= false;
    }else{
      status.isOn = true;
    }
  });
  req.tvStatus = status;
  next();
})





lgtvEmitter.on('open', function(){
  status.isOpen = true;
})

lgtvEmitter.on('close', function(){
  status.isOpen = false;
  status.isRegistered = false;
})

lgtvEmitter.on('registered', function(){
  status.isRegistered = true;
})

app.get('/', (req, res) => {
    res.render('remote.ejs', {
      test: 'bitch'
    });
  });
  
  app.post('/test', function(req, res){
    res.send('success')
  })

  app.post('/command', function(req,res){
    if(lgtv && status.isRegistered){
      lgtv.control[req.body.command]();
      res.send({
        command: req.body.command,
        status: req.tvStatus
      });
    }else{
      res.send({status: status});
    }
  })

  app.all('/on', function(req,res){
    magic(udp);
    res.send({status: 'Turning On'});
  });

  app.all('/off', function(req,res){
    if (lgtv && status.isRegistered) {
      lgtv.control.turnOff();
      status.isOn = false;
      status.isOpen = false;
      status.isRegistered = false;
      clearTimeout(timeoutHandle);
      res.send({status: 'Turning Off'})
    }else{
      res.send({ status: 'TV not registered or already off' });
    }
  })

  app.all('/register', function(req, res){
    try {
      lgtv = makeLGTV(WebSocket, lgtvEmitter);
      res.send({
        status: req.tvStatus
    });
      timeoutHandle = setTimeout(lgtv.close,timeout);
    } catch (error) {
      res.send({status: 'Error'});
    }
  });

  app.all('/status', function(req, res){
    exec(`ping -c 1 ${process.env.TV_URL}`,function(err, stdout, stderr){
      if(stdout.includes('100%')){
        status.isOn = false;
        status.isOpen= false;
        status.isRegistered= false;
      }else{
        status.isOn = true;
      }
      res.send({
        status: req.tvStatus
      });
    })
  })

//app.listen(process.env.PORT, _ => {});
app.listen(9000, _ => {});
