const fs = require('fs');
const path = require('path');


module.exports = function makeLogger(logPath='./logs/lgtv.log'){
  function createLogFile (logPath){
    const logDir = path.dirname(logPath);
    // Ensure the directory structure exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  createLogFile(logPath);

  return {
    note: function(message){
      const timestamp = new Date().toLocaleString();
      const logEntry = `NOTE: [${timestamp}] ${message}\n`;
      fs.appendFile(logPath, logEntry, function(error){});
    },
    warn: function(message){
      const timestamp = new Date().toLocaleString();
      const logEntry = `WARNING: [${timestamp}] ${message}`;
      fs.appendFile(logPath, logEntry, function(error){});
    },
    error: function(message){
      const timestamp = new Date().toLocaleString();
      const logEntry = `ERROR: [${timestamp}] ${message}`;
      fs.appendFile(logPath, logEntry, function(error){});
    }
  }

}