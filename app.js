const express = require('express')
const app = express()
const port = 3000
var os = require('os')
const { timeStamp } = require('console')
var ip = require("ip")

var ifaces = os.networkInterfaces()
var pip = getIPAddress()

// Iterate over interfaces ...
var adresses = Object.keys(ifaces).reduce(function (result, dev) {
    return result.concat(ifaces[dev].reduce(function (result, details) {
      return result.concat(details.family === 'IPv4' && !details.internal ? [details.address] : []);
    }, []));
  });
  
  // Print the result
  console.log(adresses)


app.get('/', (req, res) =>
        {
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            let ts = Date.now()
            res.send('Call from IP ' + req.connection.remoteAddress  + '  to ' + pip + ' timestamp: ' + ts + ' /n');
            console.log('Call from IP ' + req.connection.remoteAddress  + ' to ' + pip + ' timestamp: ' + ts + ' /n');
        });

app.get('/whocallme', (req, res) =>
  {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let ts = Date.now()
    
    res.send('Call from IP ' + req.connection.remoteAddress  + '  to ' + pip + ' timestamp: ' + ts + ' /n');
    console.log('Call from IP ' + req.connection.remoteAddress  + ' to ' + pip + ' timestamp: ' + ts + ' /n');
});

function getIPAddress() {
  var interfaces = require('os').networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];

    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
        return alias.address;
    }
  }
  return '0.0.0.0';
}


app.listen(port, () => console.log(`Example app listening on port ${port}!`))