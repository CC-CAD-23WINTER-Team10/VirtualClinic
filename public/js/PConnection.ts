import { myDiv } from "./Modules";

/**
 * A Class that contains a Peer Connection, the socket ID for exchange of SDPs and ICE candidate, and
 * the configuration of the ICE Servers. This class will be responsible for SDPs and ICE candidates exchanges.  
 */
export class PConnection {
    remoteSocketID: string;
    //pendingStream: MediaStream = null;
    remoteStream: MediaStream = null;
    videoContainer: myDiv;
    socket: any; //A reference to the socket..IO server
    readonly configuration = {
        //STUN Servers
        iceServers: [
            {
                urls: [`stun:stun1.l.google.com:19302`,
                    `stun:stun2.l.google.com:19302`
                ]
            }
        ]
    };
    peerConnection: RTCPeerConnection; // WebRTC connection object


    constructor(remoteSocketID: string, socket: any, initialVideoContainer: myDiv) {
        this.remoteSocketID = remoteSocketID;
        this.socket = socket;
        this.peerConnection = new RTCPeerConnection(this.configuration);
        this.videoContainer = initialVideoContainer;

        //FOR DEBUG
        this.peerConnection.addEventListener("iceconnectionstatechange", (event) => {
            console.log(`CONNECTION ${this.remoteSocketID} :::: ICE Connection State: `, this.peerConnection.iceConnectionState);
        });
        //FOR DEBUG
        this.peerConnection.addEventListener("icegatheringstatechange", (event) => {
            console.log(`CONNECTION ${this.remoteSocketID} :::: ICE Gathering State: `, this.peerConnection.iceGatheringState);
        });
        //FOR DEBUG
        this.peerConnection.addEventListener("signalingstatechange", (event) => {
            console.log(`CONNECTION ${this.remoteSocketID} :::: Signaling State: `, this.peerConnection.signalingState);
        });

        // Listen to enable the streaming video and audio on UI
        this.peerConnection.addEventListener('track', async (event) => {
            console.log(`CONNECTION ${this.remoteSocketID} :::: NEW TRACK ${event.streams[0]}`);
            this.setRemoteStream(event.streams[0]);

        });

        this.listenToNegotiationNeeded();
    }

    /**
     * Add tracks to the peer connection
     * @param localStream 
     */
    addTracks(localStream: MediaStream) {
        if (localStream) {
            console.log(`CONNECTION ${this.remoteSocketID}:::: START ADDING LOCAL TRACKS.`);
            // add new tracks
            const localTracks = localStream.getTracks();
            localTracks.forEach(track => {
                this.peerConnection.addTrack(track, localStream);
            });
            console.log(`CONNECTION ${this.remoteSocketID}:::: Local Tracks is added.`);

        } else {
            console.error(`CONNECTION ${this.remoteSocketID}:::: CANNOT ADD TRACKS FROM EMPTY MEDIA STREAM`)
        }
    }

    /**
     * Remove all tracks in the peer connection
     */
    removeTracks() {
        console.log(`CONNECTION ${this.remoteSocketID}:::: START REMOVEING LOCAL TRACKS.`);
        //remove all exsiting tracks(Audio and video) 
        this.peerConnection.getSenders().forEach(sender => {
            this.peerConnection.removeTrack(sender);
        })

        console.log(`CONNECTION ${this.remoteSocketID}:::: ALL TRACKS ARE REMOVED.`)
    }



    /**
     * For the person who is the lastest participant
     * to provide an offer to other peer(existing users in the chatroom)
     */
    /*async startFirstNegotiation() {
        console.log(`CONNECTION ${this.remoteSocketID} :::: START A NEGOTIATION.`);
        try {
            let offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            this.socket.emit(`I provide offer`, offer, this.remoteSocketID);
            console.log(`CONNECTION ${this.remoteSocketID} :::: SENT AN OFFER.`);
        } catch (e) {
            this.socket.emit(`Neogitation Failed`, this.remoteSocketID);
            console.error(`CONNECTION ${this.remoteSocketID} :::: ERROR WHEN STARTING A NEGOTIATION.  ${e}`);
        }
    }*/

    /**
     * Create an offer SDP and set the local SDP.
     * Return an offer after setting the loacal SDP.
     */
    async getOffer() {
        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            return offer;
        } catch (e) {
            console.error(`CONNECTION ${this.remoteSocketID} :::: ERROR WHEN GETTING AN OFFER.  ${e}`);
        }
    }
    /**
     * Create an answer SDP according to the offer SDP provided.
     * Return an answer SDP after setting the local SDP.
     * @param offer 
     */
    async getAnswer(offer: RTCSessionDescriptionInit) {
        try {
            await this.peerConnection.setRemoteDescription(offer);
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            return answer;
        } catch (e) {
            console.error(`CONNECTION ${this.remoteSocketID} :::: ERROR WHEN GETTING AN ANSWER.  ${e}`)
        }
    }

    /**
     * Set the remote SDP provided. If all sets, it will return ture.
     * If there is an error, return false.
     * @param answer 
     */
    async completeNegotiation(answer: RTCSessionDescriptionInit) {
        try {
            await this.peerConnection.setRemoteDescription(answer);
            return "true";
        } catch (e) {
            console.error(`CONNECTION ${this.remoteSocketID} :::: ERROR WHEN COMPLETING A NEGOTIATION.  ${e}`);
            return "false";
        }
    }


    /**
     * For those who are already in the chatroom, send SDPs to other peer(Offer Provider)
     * @param offer the SDP from the offer provider
     */
    /*async answerToOffer(offer: RTCSessionDescriptionInit) {
        console.log(`CONNECTION ${this.remoteSocketID} :::: GET OFFER FROM CALLER.`);
        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            this.socket.emit(`my answer to`, this.remoteSocketID, answer);
            console.log(`CONNECTION ${this.remoteSocketID} :::: REPLY TO CALL WITH ANSWER.`);
        } catch (e) {
            this.socket.emit(`Neogitation Failed`, this.remoteSocketID);
            console.error(`CONNECTION ${this.remoteSocketID} :::: ERROR WHEN ANSWERING AN OFFER.  ${e}`);
        }
    }*/

    /*async setAnswer(answer: RTCSessionDescriptionInit) {
        console.log(`CONNECTION ${this.remoteSocketID} :::: GET ANSWER FROM PEER.`);
        try {
            const remoteDesc = new RTCSessionDescription(answer);
            await this.peerConnection.setRemoteDescription(remoteDesc);
            this.socket.emit(`Neogitation Completed`, this.remoteSocketID);
            console.log(`CONNECTION ${this.remoteSocketID} :::: ANSWER IS SET.`);
        } catch (e) {
            this.socket.emit(`Neogitation Failed`, this.remoteSocketID);
            console.error(`CONNECTION ${this.remoteSocketID} :::: ERROR WHEN SETTING AN ANSWERING.  ${e}`);
        }
    }*/


    /**
     * Remote stream setter. When the system set the remote stream, a function will execute.
     * A new remote stream will pass into the funtion.
     * This function is mainly for communication with the Chatroom Class. When the connection receives
     * a new media stream, it will pass the new stream to Chatroom Class to put the stream on the screen.
     * @param stream the new remote stream
     * @param callback the funtion to execute after setting the remote stream
     */
    setRemoteStream(stream: MediaStream) {
        this.remoteStream = stream;
        let videoElement = this.videoContainer.querySelector(`video`);
        videoElement.srcObject = this.remoteStream;
    }


    /**
     * Listen for ICE candidates and send to the other peer
     */
    listenToICE() {

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('new-ice-candidate to', this.remoteSocketID, event.candidate);
            }
        };
    }

    listenToNegotiationNeeded() {
        //Listen to Negotiation event(track changes, device changes)
        this.peerConnection.onnegotiationneeded = () => {
            console.log(`CONNECTION ${this.remoteSocketID} :::: Negotiation Needed`);

            this.socket.emit(`NEGO:New negotiation needed with`, this.remoteSocketID);
        };
    }

    /**
     * Stop the peer conncetion.
     * Besides, it stops media tracks, removes all references;
     */
    close() {
        this.peerConnection.onicecandidate = null;
        this.peerConnection.onnegotiationneeded = null;
        this.peerConnection.close();
        this.remoteStream?.getTracks().forEach(t => {
            t.stop();
        })
        this.remoteSocketID = null;
        this.remoteStream = null;
        this.socket = null;
        this.peerConnection = null;
        if (this.videoContainer.classList.contains(`preview`)) {
            this.videoContainer.parentElement?.removeChild(this.videoContainer);
        }
    }
}