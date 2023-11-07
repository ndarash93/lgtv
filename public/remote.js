//const WebSocket = require('ws');
const ws = new WebSocket('ws://192.168.0.11:8080')

ws.onopen = (() => {
  console.log('Connected to WebSocket server');
  ws.send(JSON.stringify({body:'Hello, server!'}));
  //ws.send('Hello World!')
});

ws.onmessage = ((message) => {
  console.log(`Received from server: ${message}`);
});

ws.onclose = (() => {
  console.log('Disconnected from WebSocket server');
});




const buttons = document.querySelectorAll("button");
buttons.forEach(button => {
    if (button.id != "power"){
        button.addEventListener('click', function(event){
            try{
                ws.send(JSON.stringify({
                    body: {command:event.target.id}
                }))
            }catch(error){
                console.log(error)
            }
        });
    }
})

const powerButton = document.getElementById("power");
powerButton.addEventListener('click', function(event){
    if(event.target.value == "register"){
        fetch('/register').then(res => { return res.text() }).then();
        setTimeout(function(){
            getStatus();
        },200);
    }else if(event.target.value == 'turnOff'){
        fetch('/off').then(res => { return res.text() }).then();
    }else{
        fetch('/on').then(res => { return res.text() }).then();
    }
})

function handlePower(data){
    const powerButton = document.getElementById("power");
    if(data.isRegistered){
        powerButton.style.borderColor = "green";
        powerButton.value = "turnOff";
    }else if(data.isOpen){
        powerButton.style.borderColor = "yellow";
        powerButton.value = "register";
    }else if(data.isOn){
        powerButton.style.borderColor = "red";
        powerButton.value = "register";
    }else{
        powerButton.style.borderColor = "black";
        powerButton.value = "turnOn";
    }
}
