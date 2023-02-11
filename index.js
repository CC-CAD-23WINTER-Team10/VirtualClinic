var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');

// This line is from the Node.js HTTPS documentation.
let options = {
  key: fs.readFileSync('keys/ECC-privkey.pem'),
  cert: fs.readFileSync('keys/ECC-cert.pem')
};

// Create a service (the app object is just a callback).
var app = express();


app.set(`view engine`, `ejs`);
app.use(express.static(`public`));

/*
* Routes
*/
app.get(`/`, (req, res) => {
    //res.status(200).send(`Hello World`);
    res.render(`test2`);
});


// Create an HTTP service.
http.createServer(app).listen(80);
// Create an HTTPS service identical to the HTTP service.
https.createServer(options, app).listen(3030);
console.log(`Open(Ctrl + click) https://localhost in your broswer.`);