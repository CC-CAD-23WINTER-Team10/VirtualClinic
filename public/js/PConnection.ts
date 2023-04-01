import { myDiv } from "./Modules";

/**
 * A Class that contains a Peer Connection, the socket ID for exchange of SDPs and ICE candidate, and
 * the configuration of the ICE Servers. This class will be responsible for SDPs and ICE candidates exchanges.  
 */
export class PConnection {
    socketID: string;
    localStream: MediaStream;
    remoteStream: MediaStream = null;
    videoContainer: myDiv;
    socket: any; //A reference to the socket..IO server
    configuration = {
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


    constructor(id: string, localStream: MediaStream, socket: any, initialVideoContainer: myDiv) {
        this.socketID = id;
        this.localStream = localStream;
        this.socket = socket;
        this.peerConnection = new RTCPeerConnection(this.configuration);
        this.videoContainer = initialVideoContainer;

        //FOR DEBUG
        this.peerConnection.addEventListener("iceconnectionstatechange", (event) => {
            console.log(`CONNECTION ${this.socketID} :::: ICE Connection State: `, this.peerConnection.iceConnectionState);
        });
        //FOR DEBUG
        this.peerConnection.addEventListener("icegatheringstatechange", (event) => {
            console.log(`CONNECTION ${this.socketID} :::: ICE Gathering State: `, this.peerConnection.iceGatheringState);
        });
        //FOR DEBUG
        this.peerConnection.addEventListener("signalingstatechange", (event) => {
            console.log(`CONNECTION ${this.socketID} :::: Signaling State: `, this.peerConnection.signalingState);
        });


        //Listen to Negotiation event(track changes, device changes)
        this.peerConnection.addEventListener("negotiationneeded", (event) => {
            console.log(`CONNECTION ${this.socketID} :::: Negotiation Needed`)
            this.initACall()
                .catch((err) => {
                    console.log(`CONNECTION ${this.socketID} :::: Negotiation Error: ${err}`)

                });
        });


        // Listen to enable the streaming video and audio on UI
        this.peerConnection.addEventListener('track', async (event) => {
            console.log(`CONNECTION ${this.socketID} :::: NEW TRACK ${event.streams[0]}`);
            this.setRemoteStream(event.streams[0]);

        });


    }

    /**
     * Put the local video and audio tracks into the peer connection
     * Or remove the tracks
     */
    async setLocalTracks() {
        //Someone might not grant access to media or the media is occupied by other applications
        //In this case, check the local stream existance first,
        //if not, just not add the tracks and they can still establish the connection for listening to others
        if (this.localStream) {
            console.log(`CONNECTION ${this.socketID}:::: START ADDING LOCAL TRACKS.`);

            //remove all exsiting tracks(Audio and video) 
            this.peerConnection.getSenders().forEach(sender => {
                this.peerConnection.removeTrack(sender);
            })

            // add new tracks
            let localTracks = this.localStream.getTracks();
            localTracks.forEach(track => {
                console.log(track);
                this.peerConnection.addTrack(track, this.localStream);
                //console.log(`track added`);

            });

            console.log(`CONNECTION ${this.socketID}:::: Local Tracks is added.`);
        } else {
            //remove all exsiting tracks if any(Audio and video) 
            this.peerConnection.getSenders().forEach(sender => {
                this.peerConnection.removeTrack(sender);
            })
            console.log(`CONNECTION ${this.socketID}:::: NO LOCAL TRACK IS AVAILABLE RIGHT NOW OR ALL TRACKS ARE REMOVED`)
        }


    }



    /**
     * For the person who is the lastest participant
     * to provide an offer to other peer(existing users in the chatroom)
     */
    async initACall() {
        console.log(`CONNECTION ${this.socketID} :::: INITIALISE A CALL.`);

        let offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        this.socket.emit(`I provide offer`, offer, this.socketID);
        console.log(`CONNECTION ${this.socketID} :::: END OF CALL INITIALISATION.`);

    }


    /**
     * For those who are already in the chatroom, send SDPs to other peer(Offer Provider)
     * @param offer the SDP from the offer provider
     */
    async setRemoteDescription(offer: RTCSessionDescriptionInit) {
        console.log(`CONNECTION ${this.socketID} :::: GET OFFER FROM CALLER.`);
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        this.socket.emit(`my answer to`, this.socketID, answer);
        console.log(`CONNECTION ${this.socketID} :::: REPLY TO CALL WITH ANSWER.`);

    }

    async setAnswer(answer: RTCSessionDescriptionInit) {
        console.log(`CONNECTION ${this.socketID} :::: GET ANSWER FROM PEER.`);
        const remoteDesc = new RTCSessionDescription(answer);
        await this.peerConnection.setRemoteDescription(remoteDesc);

        console.log(`CONNECTION ${this.socketID} :::: ANSWER IS SET.`);

    }


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



    listenToICE() {
        // Listen for ICE candidates and send to the other peer
        this.peerConnection.addEventListener('icecandidate', event => {
            if (event.candidate) {
                //console.log(`Get ICE FROM STUN SERVER.`);
                this.socket.emit('new-ice-candidate to', this.socketID, event.candidate);
                //console.log(`SEND ICE TO USER ${this.socketID}.`);
            }
        });
    }

    /**
     * Stop the peer conncetion.
     * Besides, it stops media tracks, removes all references;
     */
    close() {
        this.peerConnection.close();
        this.remoteStream?.getTracks().forEach(t => {
            t.stop();
        })
        this.socketID = null;
        this.localStream = null;
        this.remoteStream = null;
        this.socket = null;
        this.configuration = null;
        this.peerConnection = null;
        if (this.videoContainer.classList.contains(`preview`)) {
            this.videoContainer.parentElement?.removeChild(this.videoContainer);
        }
    }
}