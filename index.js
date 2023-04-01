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



/*
* Routes
*/
app.get(`/`, (req, res) => {
    req.session.username = ``;
    req.session.loggedIn = false;
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
        
        socket.broadcast.emit(`leave`, socket.id);

        activePatients = activePatients.filter(p => p.lastSocketID != socket.id);
        activePhysicians = activePhysicians.filter(p => p.lastSocketID != socket.id);
       
        sendNewListToPatients();
        sendNewListToPhysicians();

    
    });



    //The first message sent to the server when open Dashboard
    socket.on(`Hi`, async (username, status) => {

        let newActiveUser = await db.getOneUser(username);//fetch the data of this user in the database (`firstName lastName lastSocketID kind img title department`)

        io.in(newActiveUser.lastSocketID).disconnectSockets(true);//Kick out the previous socket(to prevent the same user from login more than once)
        
        await db.updateSocketID(socket.id, username);//update the socket id in database so that we can track who is id's owner
        
        let updatedUser = await db.getOneUser(username);
        
        if (updatedUser) {
            updatedUser.status = status;//add the status property to the user, new connected user will be available by default

            const isPhysician = await db.isPhysician(username);
            if (isPhysician) {
                //check if this user is physician, so that we can boardcast the new user list according to their role
                //the patient should not be able to call other patients
                await socket.join(`PhysicianRoom`);
                activePhysicians.push(updatedUser);//push the new active user to the active user array with the data from the database

            } else {
                await socket.join(`PatientRoom`);
                activePatients.push(updatedUser);//push the new active user to the active user array with the data from the database
            }
            sendNewListToPatients();
            sendNewListToPhysicians();
        } else {
            console.log(`FAILED TO GET USER WITH USERNAME:${username}`);
        }



    });





    //when someone clicks the call/invite button, 
    //this message with the invited person's socket id will be sent to the server.
    socket.on(`invite`, async (_id) => {
        //fetch user info
        const sender = await db.getOneUserBySocket(socket.id);
        const receiver = await db.getOneUserByID(_id);
        const fullName = (sender.title ? (sender.title + ` `) : ``) + sender.firstName + ` ` + sender.lastName;

        if (sender && receiver) {

            //then the server will check if the sender is in a room
            //if not, assgin a room to the sender
            const roomID = Array.from(socket.rooms).find(r => r != socket.id && r != `PhysicianRoom` && r != `PatientRoom`);
            
            if (!roomID) {
                console.log(`The Invitation Sender(${socket.id}) Has No Room`);
                let newID = uuidv4();
                socket.join(newID);
                console.log(`Created A New Room(${newID}) For ${socket.id}.`);
                console.log(`Now Room(${newID}) Has :::: ${io.of("/").adapter.rooms.get(newID)}`);
            } else {
                console.log(`The Invitation Sender(${socket.id}) Has Room ${roomID}`);
                console.log(`Now Room(${roomID}) Has :::: ${io.of("/").adapter.rooms.get(roomID)}`);
            }

            io.to(receiver.lastSocketID).emit(`invitation from`, sender._id, fullName);

        }



    });

    //the Invitation Receiver Reply Acceptance
    socket.on(`accept invitation from`, async (_id) => {
        console.log(`Invitation from ${_id} is accepted.`);
        //get the chatroom ID that was assigned by the system
        const invitationSender = await db.getOneUserByID(_id);
        const invitationReceiver = await db.getOneUserBySocket(socket.id);
        if (!invitationSender || !invitationReceiver) {
            //if one of them is not found
            console.log(`DB ERROR: CANNOT FIND USER.(socket.on, accept invitation from)`)
        } else {
            console.log(`Invi Sender is in ${[...io.of("/").adapter.sids.get(invitationSender.lastSocketID).values()]}`);
            console.log(`Invi Receiver is in ${[...io.of("/").adapter.sids.get(invitationReceiver.lastSocketID).values()]}`);
            const roomsOfInviSender = Array.from(io.of("/").adapter.sids.get(invitationSender.lastSocketID));
            const chatroomID = roomsOfInviSender.find(r => r != invitationSender.lastSocketID && r != `PhysicianRoom` && r != `PatientRoom`);
            if (chatroomID) {
                //get the existing users in the room before the new one joins
                const users = Array.from(io.of("/").adapter.rooms.get(chatroomID));// An array of socket ids without the invitationReceiver
                console.log(`ROOM ${chatroomID} has user :: ${io.of("/").adapter.rooms.get(chatroomID)}`);
                //send message to users exsiting in the room a message to start peer connection estabilshment
                io.to(chatroomID).emit(`new joiner`, socket.id);//From here they communicate with socketID;
                console.log(`EMIT::::: NEW JOINER.`)
                //send back to the invitation sender
                io.to(invitationSender.lastSocketID).emit(`invitation accepted by`, invitationReceiver._id);//First chat room IO for client-side
                //join the room
                socket.join(chatroomID);
                

                console.log(`Invi Sender is in ${[...io.of("/").adapter.sids.get(invitationSender.lastSocketID).values()]}`);
                console.log(`Invi Receiver is in ${[...io.of("/").adapter.sids.get(invitationReceiver.lastSocketID).values()]}`);

                //send message to the invitation receiver to start peer connection estabilshment
                socket.emit(`You need to provide offer`, users);//From here they communicate with socketID;

            } else {
                //Maybe the invitation Sender disconnected from the server, it will get undefined.
                console.log(`SOCKET ERROR: Cannot find chatroom ID. (socket.on, accept invitation from)`)
            }
        }



    });

    //the Invitation Receiver Reply Rejection
    socket.on(`reject invitation from`, async (_id) => {
        const invitationSender = await db.getOneUserByID(_id);
        const invitationReceiver = await db.getOneUserBySocket(socket.id);
        io.to(invitationSender.lastSocketID).emit(`invitation rejected by`, invitationReceiver._id);
    });


    socket.on(`Status Change`, (newStatus) => {
        let allActiveUser = activePatients.concat(activePhysicians);
        let thisUser = allActiveUser.find(u => u.lastSocketID == socket.id);
        thisUser.status = newStatus ?? Status.Available;

        sendNewListToPatients();
        sendNewListToPhysicians();
    });



    /**
     * Chat Room IO
     */
    
    
    socket.on(`I provide offer`, (offer, socketID) => {
        console.log(`${socket.id} PROVIDE OFFER TO ${socketID}`);
        io.to(socketID).emit(`new offer`, offer, socket.id);
    });

    socket.on(`my answer to`, function (socketID, answer) {
        io.to(socketID).emit(`you answer from`, socket.id, answer);
    });

    socket.on(`new-ice-candidate to`, function (socketID, candidate) {
        io.to(socketID).emit(`icecandidate from`, socket.id, candidate);
    });

    socket.on('error', function (er) {
        console.log(er);
    });


    socket.on(`leave`, async () => {
        const user = await db.getOneUserBySocket(socket.id);
        const roomsOfUser = Array.from(io.of("/").adapter.sids.get(socket.id));
        console.log(user.lastSocketID, `is leaving`);
        console.log(`He/She is in `,roomsOfUser);
        const chatroomID = roomsOfUser.find(r => (r != socket.id) && r != `PhysicianRoom` && r != `PatientRoom`);
        console.log(`The chatroom he/she is gonna leave is:::: ${chatroomID}`)
        if (user && chatroomID) {
            socket.leave(chatroomID);
            const restingUsers = io.of("/").adapter.rooms.get(chatroomID);
            let message = `empty`;
            if(restingUsers){
                message = Array.from(restingUsers);
            }
            console.log(`After leaving(Socket Room): `, message);
            io.to(chatroomID).emit(`leave`, socket.id);
        } else {
            console.log(`ERROR: CANNOT FIND ROOM OR USER.(socket.on leave)`);
        }
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
    const allActiveUser = activePhysicians.concat(activePatients[activePatients.length-1]); //gets all physicians and last patient conected
    io.in(`PatientRoom`).emit(`new user list`, allActiveUser);
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