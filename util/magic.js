module.exports = function buildTurnOn(udp){
  const client = udp.createSocket('udp4',);
  isOpen = true;
  const macAddress = '0C:8E:29:48:2F:D2';

  function buildMagicPacket(macAddress){
    const macAddressParts = macAddress.split(':').map(part => {
      return parseInt(part,16);
    })
    //console.log(macAddressParts)
    let buffer = Buffer.alloc(102)
    buffer.fill(0xFF,0,6);
    for (let i = 6; i < 102; i++){
      buffer.fill(macAddressParts[i%6],i)
    }
    //console.log(buffer.toString('hex'))
    return buffer;
  }

  const magicPacket = buildMagicPacket(macAddress) 

  client.bind(() =>{
    client.setBroadcast(true);
  });

  client.send(magicPacket,0,magicPacket.length,9,'255.255.255.255', (err,num) =>{
    //console.log(err,num);
    client.close();
    isOpen = false;
  })
  setTimeout(()=>{
    if(isOpen){
      client.close();
    }
    //console.log('Client Closed')
  }, 1000)

}