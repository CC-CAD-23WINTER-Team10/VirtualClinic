/**
 * NodeJS App Entry Point
 */
const express = require('express');
const path = require(`path`);
const https = require('https');
const http = require('http');
const fs = require('fs');
const { v4: uuidv4 } = require("uuid");
const { Server } = require("socket.io");
const session = require(`express-session`);

// Create a service (the app object is just a callback).
const app = express();
// Create an HTTP service.
const serverHTTP = http.createServer(app);
// Create an HTTPS service identical to the HTTP service.
const credentials = {
    key: fs.readFileSync('keys/ECC-privkey.pem'),
    cert: fs.readFileSync('keys/ECC-cert.pem')
  };
const serverHTTPS = https.createServer(credentials,app);

//Set Middlewares
app.use(requireHTTPS);
app.set(`view engine`, `ejs`);
app.use(express.static(path.join(__dirname, `public`)));
app.use(express.urlencoded({ extended: false }));
app.use(
    session({
        secret: `I /**kNow 21@$y$@sec*-*-{}*#re3@($t.`,
        resave: false,
        saveUninitialized: true,
        httpOnly: true,  // Don't let browser javascript access cookies.
        secure: true, // Only use cookies over https.
        ephemeral: true // delete this cookie while browser close
    })
  );


/**
 * Temporary codes
 */

class User {
    constructor(id){
        this.id = id;
    }
}

var chatRoom = {
    roomID: uuidv4(),
    users: []
};


/*
* Routes
*/
app.get(`/`, (req, res) => {
    //let id = uuidv4();
    //req.session.userID = id;
    res.render(`test2`);
});

app.get(`/CHAT`, (req, res) => {
    //let id = req.params.id.trim();
    //let caller = new User(id);
    res.render(`chatroom`);
});

/**
 * Socket.IO
 */
const io = new Server(serverHTTPS);
io.on('connection', function (socket) {
    
    socket.on('join a chat room', function () {
       socket.join(`${chatRoom.roomID}`);
       const rooms = io.of("/").adapter.rooms;
       const users = rooms.get(chatRoom.roomID);
       console.log(users.size);

       if (users.size < 2) {
        //get join message from the first one in the chat room
        socket.emit(`You are the first one`);
       } else {
        //get join message from the later comer

        //send the comer id to the existing users
        socket.to(`${chatRoom.roomID}`).emit(`new joiner`, socket.id);

        //send back the request for offer(s) with the existing user ids (including the comer)
        socket.emit(`You need to provide offer`, Array.from(users));
       }
       
    });

    socket.on(`I provide offer`, function(offer, id){
        io.to(id).emit(`new offer`, offer,socket.id);
    });

    socket.on(`my answer to`, function(id, answer){
        io.to(id).emit(`you answer from`,socket.id, answer);
    });

    socket.on(`new-ice-candidate to`, function(id, candidate){
        io.to(id).emit(`icecandidate from`,socket.id, candidate);
    });

    socket.on('error', function (er) {
        console.log(er);
    });
});

/**
 * Port Listening
 */
serverHTTP.listen(80);
serverHTTPS.listen(443);
console.log(`===================================`);
console.log(`Server is ready`);
console.log(`===================================`);

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