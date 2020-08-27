const express = require('express')
const app = express()
const port = 3000
var os = require('os')
const { timeStamp } = require('console')
var ifaces = os.networkInterfaces()

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


                res.send('Hello World! from IP [' + ip + '] to [' +  adresses + '] ' + ts + ' /n');
        });
app.listen(port, () => console.log(`Example app listening on port ${port}!`))