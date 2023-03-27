/**
 * NodeJS App Entry Point
 */
// libraries required by the app
const express = require('express');
const path = require(`path`);
const https = require('https');
const http = require('http');
const fs = require('fs');  // file system
const { v4: uuidv4 } = require("uuid");  // generate room id
const { Server } = require("socket.io"); // signaling among peers
const session = require(`express-session`); // Login + sessions
const Database = require('./Database.js') //MongoDB

//Localhost Determination
const localhost = true; //Set to true when run on local host
// Create a service (the app object is just a callback).
const app = express();
// Create an HTTP service.
const serverHTTP = http.createServer(app);
// Create an HTTPS service identical to the HTTP service.
const credentials = localhost ? {} : {
    key: fs.readFileSync('keys/ECC-privkey.pem'),  // key for HTTPS 
    cert: fs.readFileSync('keys/ECC-cert.pem')     // Certificate for the HTTPS
};
const serverHTTPS = localhost ? {} : https.createServer(credentials, app); // If localhost is true then empty object, if not then create a HTTPS object with its credentials
//create Socket IO
const io = new Server(localhost ? serverHTTP : serverHTTPS);
//database
const db = new Database(`mongodb://127.0.0.1:27017/virtual-clinic`);// Customise your MongoDB url here
var activePhysicians = [];//the active user array for the dashboard user list
var activePatients = [];

//Set Middlewares
if (!localhost) {
    app.use(requireHTTPS); //If not running localhost then app is force to use HTTPS
}
app.set(`view engine`, `ejs`); //Enable ejs templates
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
 * Temporary codes --This will be replace by Database logic code
 */


class Chatroom {
    roomID = uuidv4();
    users = [];
    startTime;
    constructor(startTime) {
        this.startTime = startTime;
    }
}


var chatrooms = [];
var chatRoom = {
    roomID: uuidv4(), // Assing roomId
    users: []
};


/*
* Routes
*/
app.get(`/`, (req, res) => {
    res.render(`index`);
});

// Validates the Login
app.post(`/auth`, async (req, res) => {
    let username = req.body.username?.trim();
    let password = req.body.password?.trim();
    let validated = await db.getAuth(username, password);

    if (validated) {
        //Log in 
        req.session.username = username; //save username in session
        req.session.loggedIn = true;
        res.render(`dashboard`, { username });

    } else {
        res.render(`index`, { authError: true });
    }
});

app.get(`/chat`, (req, res) => {
    res.render(`chatroom`);
});

app.get(`/dashboard`, (req, res) => {

    if (req.session.loggedIn) {
        let username = req.session.username;
        res.render(`dashboard`, { username });
    } else {
        res.redirect(`/`);
    }

});

/**
 * Socket.IO  ---Function for signaling
 */
io.on('connection', function (socket) {
    /**
     * Dashboard IO
     */
    socket.on("disconnecting", () => {


    });

    //Response when one user disconneting with the server
    socket.on("disconnect", () => {
        //console.log(`REMOVING ${socket.id} FROM ACTIVE USER ARRAY`);
        //console.log(`patient?:`,activePatients.filter( p => p.lastSocketID == socket.id));
        //console.log(`physician?:`,activePhysicians.filter( p => p.lastSocketID == socket.id));
        activePatients = activePatients.filter(p => p.lastSocketID != socket.id);
        activePhysicians = activePhysicians.filter(p => p.lastSocketID != socket.id);
        //chatrooms.find(r=>r.roomID == )
        sendNewListToPatients();
        sendNewListToPhysicians(); //sent new list to all physicians

        //console.log(`REMOVED ${socket.id} FROM ACTIVE USER ARRAY`);
        //console.log(`After Removal:`,activePatients.concat(activePhysicians));
    });



    //The first message sent to the server when open Dashboard
    socket.on(`Hi`, async (username, status) => {

        await db.updateSocketID(socket.id, username);//update the socket id in database so that we can track who is id's owner

        let newActiveUser = await db.getOneUser(username);//fetch the data of this user in the database (`firstName lastName lastSocketID kind img title department`)

        newActiveUser.status = status;//add the status property to the user, new connected user will be available by default

        const isPhysician = await db.isPhysician(username)
        if (isPhysician) {
            //check if this user is physician, so that we can boardcast the new user list according to their role
            //the patient should not be able to call other patients
            await socket.join(`PhysicianRoom`);
            activePhysicians.push(newActiveUser);//push the new active user to the active user array with the data from the database
            
        } else {
            await socket.join(`PatientRoom`);
            activePatients.push(newActiveUser);//push the new active user to the active user array with the data from the database
        }
        sendNewListToPatients();
        sendNewListToPhysicians();

        //console.log(`Hi! from ${username}`,/*activePatients.concat(activePhysicians)*/);
    });





    //when someone clicks the call/invite button, 
    //this message with the invited person's socket id will be sent to the server.
    socket.on(`invite`, async (_id) => {
        //fetch user info
        const sender = await db.getOneUserBySocket(socket.id);
        const receiver = await db.getOneUserByID(_id);
        const fullName = (sender.title ? (sender.title + ` `) : ``) + sender.firstName + ` ` + sender.lastName;
        //console.log(fullName, ` is in `, socket.rooms);
        //then the server will check if the sender is in a room
        //if not, assgin a room to the sender
        const roomID = Array.from(socket.rooms).find(r => r != socket.id && r != `PhysicianRoom` && r != `PatientRoom`)
        if (!roomID) {
            let newChatroom = new Chatroom(Date.now());
            newChatroom.users.push(sender);
            socket.join(newChatroom.roomID);
            chatrooms.push(newChatroom);

        } else {

        }

        io.to(receiver.lastSocketID).emit(`invitation from`, sender._id, fullName);

    });

    //the Invitation Receiver Reply Acceptance
    socket.on(`accept invitation from`, async (_id) => {
        //get the chatroom ID that was assigned by the system
        const invitationSender = await db.getOneUserByID(_id);
        const invitationReceiver = await db.getOneUserBySocket(socket.id);
        if (!invitationSender || !invitationReceiver) {
            //if one of them is not found
            console.log(`DB ERROR: CANNOT FIND USER.(socket.on, accept invitation from)`)
        } else {
            const roomsOfInviSender = Array.from(io.of("/").adapter.sids.get(invitationSender.lastSocketID));
            const chatroomID = roomsOfInviSender.find(r => r != invitationSender.lastSocketID && r != `PhysicianRoom` && r != `PatientRoom`);
            if (chatroomID) {
                //get the existing users in the room before the new one joins
                const users = Array.from(io.of("/").adapter.rooms.get(chatroomID));// An array of socket ids without the invitationReceiver
                //send message to users exsiting in the room a message to start peer connection estabilshment
                io.to(chatroomID).emit(`new joiner`, socket.id);//From here they communicate with socketID;
                //send back to the invitation sender
                io.to(invitationSender.lastSocketID).emit(`invitation accepted by`, invitationReceiver._id);//First chat room IO for client-side
                //join the room
                socket.join(chatroomID);
                (chatrooms.find(r=>r.roomID == chatroomID)).users.push(invitationReceiver);
                
                //send message to the invitation receiver to start peer connection estabilshment
                socket.emit(`You need to provide offer`, users);//From here they communicate with socketID;
                
            } else {
                //Maybe the invitation Sender disconnected from the server, it will get undefined.
                console.log(`SOCKET ERROR: Cannot find chatroom ID. (socket.on, accept invitation from)`)
            }
        }



    });

    //the Invitation Receiver Reply Rejection
    socket.on(`reject invitation from`, (id) => {
        io.to(id).emit(`invitation rejected by`, socket.id);
    });


    socket.on(`Status Change`, (newStatus) => {
        let allActiveUser = activePatients.concat(activePhysicians);
        let thisUser = allActiveUser.find(u => u.lastSocketID == socket.id);
        thisUser.status = newStatus;

        sendNewListToPatients();
        sendNewListToPhysicians();
    });



    /**
     * Chat Room IO
     */
    // firts message from the user when clicks the call button(OLD CHATROOM ONLY)
    socket.on('join a chat room', function () {
        socket.join(`${chatRoom.roomID}`);
        const rooms = io.of("/").adapter.rooms;
        const users = rooms.get(chatRoom.roomID);
        console.log(users.size);  //  to test how many have entered the room

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

    socket.on(`I provide offer`, function (offer, id) {
        io.to(id).emit(`new offer`, offer, socket.id);
    });

    socket.on(`my answer to`, function (id, answer) {
        io.to(id).emit(`you answer from`, socket.id, answer);
    });

    socket.on(`new-ice-candidate to`, function (id, candidate) {
        io.to(id).emit(`icecandidate from`, socket.id, candidate);
    });

    socket.on('error', function (er) {
        console.log(er);
    });
});

/**
 * Port Listening
 */
serverHTTP.listen(80);
if (!localhost) {
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

function sendNewListToPatients() {
    io.in(`PatientRoom`).emit(`new user list`, activePhysicians);
}

function sendNewListToPhysicians() {
    const allActiveUser = activePhysicians.concat(activePatients); //prepare this to send to all physicians but not patients
    io.in("PhysicianRoom").emit(`new user list`, allActiveUser);//any new online user, new list will be sent.
}

//The enum of the Status of a user
var Status;
(function (Status) {
    Status["Available"] = "greenyellow";
    Status["Leave"] = "yellow";
    Status["Busy"] = "red";
    Status["Offline"] = "grey";
})(Status || (Status = {}));