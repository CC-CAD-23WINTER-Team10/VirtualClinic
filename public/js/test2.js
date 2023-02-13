/* 
* Client Side JS
*/
//const socket = io(`/`);
//var peer = new Peer(undefined, {path: `/peerjs`,host: `/`,port: `3030`,});

let myVideoStream; //localCamera
let remoteVideoStream; //Camera From others
const servers = {
    //STUN Servers
    iceServers: [
        {
            urls: [`stun:stun1.l.google.com:19302`, `stun:stun2.l.google.com:19302`]
        }
    ]
};
let peerConnection = new RTCPeerConnection(servers);

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
async function createOffer() { 

    /**
     * Add Local Tracks to peerConnection
     */
    let localTracks = myVideoStream.getTracks();

    localTracks.forEach( track => {
        
        peerConnection.addTrack(track,myVideoStream);
        
    });

    peerConnection.onicecandidate = async (event) =>{
        if(event.candidate){
            console.log(`New ICE Cand: `, event.candidate);
        }
    }

    /**
     * Set Offer
     */
    let offer = await peerConnection.createOffer();

    await peerConnection.setLocalDescription(offer);

    console.log(`Offer: `, offer);
}

function setRemoteVideoStream() {
    remoteVideoStream = new MediaStream();
    document.getElementById(`user-2`).srcObject = remoteVideoStream;
    console.log(`Set Remote Video Stream`);

    peerConnection.ontrack = (event) =>{
        let remoteTracks = event.streams[0].getTracks();
        remoteTracks.forEach(track => {
            remoteVideoStream.addTrack(track);
        });
    }
    console.log(`Add Remote Video Stream`);
}

document.getElementById(`start`).onclick = async function() {
    await getLocalStream(false);
    
    setRemoteVideoStream();

    createOffer();
};