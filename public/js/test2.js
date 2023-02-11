/* 
* Client Side JS
*/

let myVideoStream; //localCamera
let remoteVideoStream; //Camera From others
let peerConnection;

const servers = {
    //STUN Servers
    iceServers: [
        {
            urls: [`stun:stun1.l.google.com:19302`, `stun:stun2.l.google.com:19302`]
        }
    ]
};

/**
 * Turn on the local Camara and display on screen
 * @param {boolean} audio Set audio to true in production or when testing between two computer. Set audio to false when single computer testing.
 */
async function getLocalStream(audio) {
    myVideoStream = await navigator.mediaDevices.getUserMedia({
        audio: audio,  //Set false for single computer testing
        //peerIdentity: ``,
        //preferCurrentTab: true/false,
        video: true
    })

    document.getElementById(`user-1`).srcObject = myVideoStream;
}

/**
 * function Description
 */
async function sendVideoCallRequest() {
    peerConnection = new RTCPeerConnection(servers);

    remoteVideoStream = new MediaStream();

    document.getElementById(`user-2`).srcObject = remoteVideoStream;

    

    /**
     * Add Local Tracks to peerConnection
     */
    let localTracks = myVideoStream.getTracks();

    localTracks.forEach( track => {
        
        peerConnection.addTrack(track,myVideoStream);
        
    });

    /**
     * Set Offer
     */
    let offer = await peerConnections[0].createOffer();

    await peerConnection.setLocalDescription(offer);
}


document.getElementById(`start`).onclick = function() {
    getLocalStream(false);
};