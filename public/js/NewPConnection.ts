/**
 * A Class that contains a Peer Connection, the socket ID for exchange of SDPs and ICE candidate, and
 * the configuration of the ICE Servers. This class will be responsible for SDPs and ICE candidates exchanges.  
 */
export class PConnection {
    socketID: string;
    localStream: MediaStream;
    remoteStream: MediaStream;
    remoteStreamSetterCallback: (newStream: MediaStream) => void;//(See explaination of setRemoteStream())
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


    constructor(id: string, localStream: MediaStream, socket: any, remoteStreamSetterCallback?: (newStream: MediaStream) => void) {
        this.socketID = id;
        this.localStream = localStream;
        this.socket = socket;
        this.remoteStreamSetterCallback = remoteStreamSetterCallback;
        this.peerConnection = new RTCPeerConnection(this.configuration);


        //FOR DEBUG
        this.peerConnection.addEventListener("iceconnectionstatechange", (event) => {
            console.log(`iceconnectionstatechange: `, this.peerConnection.iceConnectionState);
        });
        //FOR DEBUG
        this.peerConnection.addEventListener("icegatheringstatechange", (event) => {
            console.log(`icegatheringstatechange: `, this.peerConnection.iceGatheringState);
        });
        //FOR DEBUG
        this.peerConnection.addEventListener("signalingstatechange", (event) => {
            console.log(`signalingstatechange: `, this.peerConnection.signalingState);
        });


        // Listen for ICE candidates and send to the other peer
        this.peerConnection.addEventListener('icecandidate', event => {
            if (event.candidate) {
                //console.log(`Get ICE FROM STUN SERVER.`);
                socket.emit('new-ice-candidate to', this.socketID, event.candidate);
                //console.log(`SEND ICE TO USER ${this.socketID}.`);
            }
        });

        // Listen to enable the streaming video and audio on UI
        this.peerConnection.addEventListener('track', async (event) => {
            //console.log(`Get TRACK INFO FROM PEER CONNECTION.`);
            this.setRemoteStream(event.streams[0], this.remoteStreamSetterCallback);
            //console.log(`Set Remote Video Stream`);
        });


    }

    /**
     * Put the local video and audio tracks into the peer connection
     */
    async addLocalTracks() {
        //Someone might not grant access to media or the media is occupied by other applications
        //In this case, check the local stream existance first,
        //if not, just not add the tracks and they can still establish the connection for listening to others
        if (this.localStream) {
            console.log(`START ADDING LOCAL TRACKS.`);

            let localTracks = this.localStream.getTracks();

            localTracks.forEach(track => {
                console.log(track);
                this.peerConnection.addTrack(track, this.localStream);
                console.log(`track added`);

            });

            console.log(`Local Tracks is added to connection(${this.socketID})`);
        } else {
            console.log(`NO LOCAL TRACK IS AVAILABLE RIGHT NOW`)
        }


    }



    /**
     * For the person who is the lastest participant
     * to provide an offer to other peer(existing users in the chatroom)
     */
    async initACall() {
        console.log(`INITIALISE A CALL.`);

        let offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        this.socket.emit(`I provide offer`, offer, this.socketID);
        console.log(`END OF CALL INITIALISATION.`);

    }


    /**
     * For those who are already in the chatroom, send SDPs to other peer(Offer Provider)
     * @param offer the SDP from the offer provider
     */
    async setRemoteDescription(offer: RTCSessionDescriptionInit) {
        console.log(`GET OFFER FROM CALLER.`);
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        this.socket.emit(`my answer to`, this.socketID, answer);
        console.log(`REPLY TO CALL WITH ANSWER.`);

    }


    /**
     * Remote stream setter. When the system set the remote stream, a function will execute.
     * A new remote stream will pass into the funtion.
     * This function is mainly for communication with the Chatroom Class. When the connection receives
     * a new media stream, it will pass the new stream to Chatroom Class to put the stream on the screen.
     * @param stream the new remote stream
     * @param callback the funtion to execute after setting the remote stream
     */
    setRemoteStream(stream: MediaStream, callback?: (newStream: MediaStream) => void) {
        this.remoteStream = stream;
        if (callback) {
            callback(stream);
        }
    }

    /**
     * Stop the peer conncetion.
     * Besides, it stops media tracks, removes all references;
     */
    close() {
        this.peerConnection.close();
        this.remoteStream.getTracks().forEach(t=>{
            t.stop();
        })
        this.socketID = null;
        this.localStream = null;
        this.remoteStream = null;
        this.remoteStreamSetterCallback = null;
        this.socket = null;
        this.configuration = null;
        this.peerConnection = null;
    }
}