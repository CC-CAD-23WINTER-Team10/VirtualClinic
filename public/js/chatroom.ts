import { PConnection } from "./PConnection.js";
/* 
* Client Side JS
*/
//@ts-ignore
const socket = io(`/`);
var localStream: MediaStream; //localCamera
var localVideoFrame = document.getElementById(`local-video`) as HTMLVideoElement;
var previewContainer = document.getElementById(`previews`) as HTMLDivElement;
var callButton = document.getElementById(`call`) as HTMLButtonElement;
var hangupButton = document.getElementById(`hangup`) as HTMLButtonElement; //
var connections: PConnection[] = [];



callButton.onclick = async function () {
    let permission = await getLocalStream(false);

    if (permission) {
        callButton.setAttribute("disabled", "disabled");
        joinARoom();
    }

};




/**
 * Asking the user a permission to turn on the local Camara and display on screen.
 * if permission is accepted,it will return ture;
 * if permission is denied, it will return false. 
 * @param {boolean} audio Set audio to true in production or when testing between two computer. Set audio to false when single computer testing.
 */
async function getLocalStream(audio: boolean) {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: audio,  //Set false for single computer testing
            //peerIdentity: ``,
            //preferCurrentTab: true/false,
            video: true
        })

        localVideoFrame.srcObject = localStream;
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }

}



/**
 * Create a HTML Video element that holds the video from remote users.
 * @returns HTML Video element
 */
function createVideoPreview() {
    let newPreview = document.createElement(`video`);
    newPreview.setAttribute(`autoplay`, `autoplay`);
    newPreview.setAttribute(`playsinline`, `playsinline`);
    newPreview.classList.add(`remote-video`);
    return newPreview;
}




/**
 * Signal the server to start a video chat.
 */
function joinARoom() {
    socket.emit(`join a chat room`);
}





/**
 * Socket.on
 */
socket.on("connect", () => {
    console.log(`CONNECTED WITH SERVER. YOUR ID: `, socket.id);
});
socket.on("disconnect", () => {
    console.log(`DISCONNECTED WITH SERVER.`);
});

socket.on(`You are the first one`, () => {
    console.log(`YOU ARE THE FIRST PERSON IN THE ROOM`);
});

socket.on(`new joiner`, async (remoteID: string) => {
    //UI section
    let newPreview = createVideoPreview();
    previewContainer.appendChild(newPreview);


    //Connection section
    let newConnection = new PConnection(remoteID, localStream, socket, newPreview);
    await newConnection.addLocalTracks();
    connections.push(newConnection);
    console.log(`WAIT FOR OFFER & ICE FROM USER ${remoteID}`);



});

socket.on(`You need to provide offer`, async (users: string[]) => {
    const myID = socket.id;
    const otherUsers = users.filter(u => u != myID);

    otherUsers.forEach(async user => {
        //UI section
        let newPreview = createVideoPreview();
        previewContainer.appendChild(newPreview);


        //Connection section
        let newConnection = new PConnection(user, localStream, socket, newPreview);
        await newConnection.addLocalTracks();
        await newConnection.initACall();
        connections.push(newConnection);
    });
});

socket.on(`new offer`, (offer: RTCSessionDescriptionInit, remoteID: string) => {
    let connection = connections.find(c => c.id == remoteID);
    if (connection != undefined) {
        connection.setRemoteDescription(offer);
    } else {
        console.log(`CANNOT FIND CONNECTION WITH ID:${remoteID}. (socket.on(\`new offer\`))`);
    }

});

socket.on(`you answer from`, async (remoteID: string, answer: RTCSessionDescriptionInit) => {
    let connection = connections.find(c => c.id == remoteID);
    if (connection != undefined) {
        const remoteDesc = new RTCSessionDescription(answer);
        await connection.peerConnection.setRemoteDescription(remoteDesc);
        console.log(`Answer is set.`)
    } else {
        console.log(`CANNOT FIND CONNECTION WITH ID:${remoteID}. (socket.on(\`you answer from\`))`);
    }
});

socket.on(`icecandidate from`, async (remoteID: string, candidate: RTCIceCandidateInit) => {
    let connection = connections.find(c => c.id == remoteID);
    if (connection != undefined) {
        try {
            await connection.peerConnection.addIceCandidate(candidate);
            console.log(`ADDED NEW ICE FROM ${remoteID}.`)
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }

    } else {
        console.log(`CANNOT FIND CONNECTION WITH ID:${remoteID}. (socket.on(\`icecandidate from\`))`);
    }

});