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

//Localhost Determination
const localhost = false;////////////Set to true when run on local host
// Create a service (the app object is just a callback).
const app = express();
// Create an HTTP service.
const serverHTTP = http.createServer(app);
// Create an HTTPS service identical to the HTTP service.
const credentials = localhost? {} : {
    key: fs.readFileSync('keys/ECC-privkey.pem'),
    cert: fs.readFileSync('keys/ECC-cert.pem')
  };
const serverHTTPS = localhost? {} : https.createServer(credentials,app);
//create Socket IO
const io = new Server(localhost? serverHTTP : serverHTTPS);
//Set Middlewares
if(!localhost) {
    app.use(requireHTTPS);
}
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
    constructor(username, password, firstName, lastName){
        this.id = uuidv4();
        this.username = username;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
    }
}


var users=[
    new User(`001`,`001`,`F001`,`L001`),
]
var chatRoom = {
    roomID: uuidv4(),
    users: []
};


/*
* Routes
*/
app.get(`/`, (req, res) => {
    res.render(`index`);
});

app.post(`/auth`,(req, res) => {
    let username = req.body.username.trim();
    let password = req.body.password.trim();
    let existingUser = users.filter(u => u.username == username)[0];
    if (existingUser) {
        if(existingUser.password == password){
            //Log in 
            res.redirect(`dashboard`);
        }else{
            res.render(`index`,{authError:true});
        }
    } else {
        res.render(`index`,{authError:true});
    }


});
app.get(`/chat`, (req, res) => {
    res.render(`chatroom`);
});

app.get(`/dashboard`, (req, res) => {
    res.render(`dashboard`);
});
/**
 * Socket.IO
 */

io.on('connection', function (socket) {
    



    /**
     * Chat Room IO
     */
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
if(!localhost){
    serverHTTPS.listen(443);
}

console.log(`=============================================`);
console.log(`Server is ready with localhost = ${localhost}`);
console.log(`=============================================`);

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