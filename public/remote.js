//const WebSocket = require('ws');
const ws = new WebSocket('ws://192.168.0.11:8080')

ws.onopen = (() => {
    console.log('Connected to WebSocket server');
    ws.send(JSON.stringify({ body: 'Hello, server!' }));
    //ws.send('Hello World!')
});

ws.onmessage = ((message) => {
    console.log(`Received from server: ${message.data}`);
});

ws.onclose = (() => {
    console.log('Disconnected from WebSocket server');
});

ws.addEventListener('noconnect', function(){
    console.log('noconnect');
})


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
            console.log(error)
        }
    });
    for (const child of button.children){
        child.value = child.parentElement.getAttribute('value');
    }
})
