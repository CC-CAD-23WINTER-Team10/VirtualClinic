/**
 * NodeJS App Entry Point
 */
var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');
//var session = require('cookie-session');

// Create a service (the app object is just a callback).
var app = express();


app.set(`view engine`, `ejs`);
app.use(express.static(`public`));
app.use(requireHTTPS);
/*app.use(
    session({
      secret: "some secret",
      httpOnly: true,  // Don't let browser javascript access cookies.
      secure: true, // Only use cookies over https.
    })
  );
*/



/*
* Routes
*/
app.get(`/`, (req, res) => {
    //res.status(200).send(`Hello World`);
    res.render(`test2`);
});




/**
 * Port Listening
 */
// Create an HTTP service.
http.createServer(app).listen(80);

// Create an HTTPS service identical to the HTTP service.
let credentials = {
    key: fs.readFileSync('keys/ECC-privkey.pem'),
    cert: fs.readFileSync('keys/ECC-cert.pem')
  };
https.createServer(credentials, app).listen(443);

console.log(`Open(Ctrl + click) https://localhost in your broswer.`);

/**
 * Other Functions
 */

/**
 * Force HTTPS
 * @param {*} req Request
 * @param {*} res Response
 * @param {*} next 
 * @returns 
 */
function requireHTTPS(req, res, next) {
    // The 'x-forwarded-proto' check is for Heroku
    if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV !== "development") {
      return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
  }