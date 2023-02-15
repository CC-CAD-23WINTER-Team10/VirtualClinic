import { io } from "https://cdn.socket.io/4.3.2/socket.io.esm.min.js";
/* 
* Client Side JS
*/
const socket = io(`/`);
let localStream; //localCamera
let remoteVideo = document.getElementById(`user-2`);
const configuration = {
    //STUN Servers
    iceServers: [
        {
            urls: [`stun:stun1.l.google.com:19302`, `stun:stun2.l.google.com:19302`]
        }
    ]
};
let connection = {
    peerConnection: new RTCPeerConnection(configuration),
    remoteID: ``
}


/**
 * Asking the user a permission to turn on the local Camara and display on screen.
 * if permission is accepted,it will return ture;
 * if permission is denied, it will return false. 
 * @param {boolean} audio Set audio to true in production or when testing between two computer. Set audio to false when single computer testing.
 */
async function getLocalStream(audio) {
    try{
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: audio,  //Set false for single computer testing
            //peerIdentity: ``,
            //preferCurrentTab: true/false,
            video: true
        })
        document.getElementById(`user-1`).srcObject = localStream;
        return true;
    } catch(error) {
        console.log(error);
        return false;
    }
    
}

/**
 * Add local tracks to the Peer Connection.
 */
async function addLocalTracks() {
    /**
     * Add Local Tracks to peerConnection
     */
    let localTracks = localStream.getTracks();

    localTracks.forEach( track => {
        
        connection.peerConnection.addTrack(track,localStream);
        console.log(`track added`);
    });
    console.log(`Local Tracks is added to connection(${connection.remoteID})`);  
}

/**
 * Set the Remote User ID to a connection
 * @param {string} remoteID Remote User ID
 */
function setRemoteID(remoteID){
    connection.remoteID = remoteID;
}

/**
 * The caller(except the first user in the chat room) will call this function
 * to set the local description and send to the remote peer.
 * @param {string} remoteID Remote User ID
 */
async function initACallTo(remoteID) { 
    /**
     * Set Offer
     */
    let offer = await connection.peerConnection.createOffer();

    await connection.peerConnection.setLocalDescription(offer);

    console.log(`Offer: `, offer);

    socket.emit(`I provide offer`,offer,remoteID);
}

async function setRemoteDescription(offer,remoteID) {
    connection.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await connection.peerConnection.createAnswer();
    await connection.peerConnection.setLocalDescription(answer);

    socket.emit(`my answer to`,remoteID, answer);
    console.log(`Answer is set and sent`);
}



function joinARoom(){
    socket.emit(`join a chat room`);
}

document.getElementById(`start`).onclick = async function() {
    let permission = await getLocalStream(false);
    
    if(permission){
        document.getElementById(`start`).setAttribute("disabled", "disabled");
        joinARoom();
    }

};



/**
 * Socket.on
 */
socket.on("connect", () => {
    console.log(`ID: `,socket.id);
});
socket.on("disconnect", () => {
    console.log(`Disconnect from server`); // undefined
});

socket.on(`You are the first one`, () =>{
    console.log(`Waiting for other user to join`);
});

socket.on(`new joiner`, (remoteID) =>{
    setRemoteID(remoteID);
    addLocalTracks();
    console.log(`Waiting for receiving an offer and ICEcandidate`);
});

socket.on(`You need to provide offer`, async (users) =>{
    const myID = socket.id;
    //const predicate = (id) => id == myID;
    const index = users.indexOf(myID);
    if (index > -1) {
        users.splice(index,1);
        setRemoteID(users[0]);
        await addLocalTracks();
        await initACallTo(users[0]);
    }else{
        setRemoteID(users[0]);
        await addLocalTracks();
        await initACallTo(users[0]);
    }
    console.log(`type: ${typeof(users)}`, users)
});

socket.on(`new offer`, (offer,remoteID) =>{
    setRemoteDescription(offer,remoteID);
});

socket.on(`you answer from`, async (remoteID, answer) =>{
    const remoteDesc = new RTCSessionDescription(answer);
    await connection.peerConnection.setRemoteDescription(remoteDesc);

});

socket.on(`icecandidate from`, async (remoteID, candidate) =>{
    try {
        await connection.peerConnection.addIceCandidate(candidate);
    } catch (e) {
        console.error('Error adding received ice candidate', e);
    }
});


// Listen for local ICE candidates on the local RTCPeerConnection
connection.peerConnection.addEventListener('icecandidate', event => {
    if (event.candidate) {
        socket.emit('new-ice-candidate to', connection.remoteID, event.candidate);
    }
});

connection.peerConnection.addEventListener('track', async (event) => {
    const [remoteStream] = event.streams;
    remoteVideo.srcObject = remoteStream;
    console.log(`Set Remote Video Stream`);
});

connection.peerConnection.addEventListener('connectionstatechange', event => {
    if (connection.peerConnection.connectionState === 'connected') {
        // Peers connected!
        console.log(`Peers connected!!!!!`)
        
    }
});
