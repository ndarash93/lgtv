function getStatus(){
    fetch('/status').then(res => {
        return res.json();
    }).then(data => {
        handlePower(data.status);
    })
}

getStatus();

const buttons = document.querySelectorAll("button");
buttons.forEach(button => {
    if (button.id != "power"){
        button.addEventListener('click', function(event){
            fetch('/command',{
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({command:event.target.id})
            }).then(res => {
                return res.json();
            }).then(data => {
                handlePower(data.status);
            })
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
