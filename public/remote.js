//const { response } = require("express");

//const WebSocket = require('ws');

const powerButton = document.getElementById('power');
const muteButton = document.getElementById('mute');
let ws;

function connectWebSocket(){
    ws = new WebSocket('ws://192.168.0.11:8080')


    ws.onopen = (() => {
        console.log('Connected to WebSocket server');
        //ws.send(JSON.stringify({ body: 'Hello, server!' }));
        //ws.send('Hello World!')
    });

    ws.onmessage = ((message) => {
        //console.log(`Received from server: ${message.data}`);
        data = JSON.parse(message.data)
        if (data.type === 'status') {
            console.log(data.status)
            if (data.status.isRegistered) {
                powerButton.style.border = "2px solid green"
            } else if (data.status.isOpen) {
                powerButton.style.border = "2px solid yellow"
            } else if (data.status.isOn) {
                powerButton.style.border = "2px solid red"
            } else {
                powerButton.style.border = "2px solid darkgrey"
            }
        } else if (data.type === 'response') {
            if (data.response === 'mute') {
                muteButton.innerHTML = '<i class="fa-solid fa-volume-high"></i>'
                muteButton.value = 'unmute'
            } else if (data.response === 'unmute') {
                muteButton.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>'
                muteButton.value = 'mute'
            }
        }
    });

    ws.onclose = (() => {
        console.log('Disconnected from WebSocket server');
        retryTimeout = setTimeout(connectWebSocket, 2000);
    });
}

connectWebSocket();

const buttons = document.querySelectorAll("button");
buttons.forEach(button => {
    button.addEventListener('click', function (event) {
        try {
            ws.send(JSON.stringify({
                body: {
                    command: event.target.value,
                    payload: event.target.payload
                }
            }))
        } catch (error) {

        }
    });
    for (const child of button.children) {
        child.value = child.parentElement.getAttribute('value');
    }
})

window.addEventListener('beforeunload', function () {
    clearTimeout(retryTimeout);
});