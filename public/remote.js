//const WebSocket = require('ws');
const ws = new WebSocket('ws://192.168.0.11:8080')

ws.onopen = (() => {
    console.log('Connected to WebSocket server');
    ws.send(JSON.stringify({ body: 'Hello, server!' }));
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
    button.addEventListener('click', function (event) {
        try {
            ws.send(JSON.stringify({
                body: { command: event.target.value }
            }))
        } catch (error) {
            console.log(error)
        }
    });
    for (const child of button.children){
        child.value = child.parentElement.getAttribute('value');
    }
})
