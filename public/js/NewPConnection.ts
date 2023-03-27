export class PConnection {
    socketID: string;
    localStream: MediaStream;
    remoteStream: MediaStream = new MediaStream();
    remoteStreamSetterCallback:(newStream:MediaStream)=>void;
    socket: any;
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
    peerConnection:RTCPeerConnection; // WebRTC connection object


    constructor(id: string, localStream: MediaStream, socket: any,remoteStreamSetterCallback:(newStream:MediaStream)=>void) {
        this.socketID = id;
        this.localStream = localStream;
        this.socket = socket;
        this.remoteStreamSetterCallback = remoteStreamSetterCallback;
        this.peerConnection = new RTCPeerConnection(this.configuration);


        this.peerConnection.onicecandidateerror = (ev)=>{
            //@ts-ignore
            console.log(ev.errorCode);
        }

        // Listen connection changes !!!!!This is not working in Firefox
        this.peerConnection.addEventListener('connectionstatechange', () => {
            console.log(`CONNECTION STATE CHANGED`);
            if (this.peerConnection.connectionState === 'connected') {
                // Peers connected!
                console.log(`Peers connected!!!!!`)
        
            }else if(this.peerConnection.connectionState === 'connecting'){
                console.log(`Peers connecting!!!!!`)
            }else if(this.peerConnection.connectionState === 'failed'){
                console.log(`Peers failed!!!!!`)
            }
            //"closed" | "connected" | "connecting" | "disconnected" | "failed" | "new";
            switch (this.peerConnection.connectionState) {
                case "new":
                case "connecting":
                  console.log("CONNECTION STATE CHANGED: Connecting…");
                  break;
                case "connected":
                  console.log("CONNECTION STATE CHANGED: Online");
                  break;
                case "disconnected":
                  console.log("CONNECTION STATE CHANGED: Disconnecting…");
                  break;
                case "closed":
                  console.log("CONNECTION STATE CHANGED: Offline");
                  break;
                case "failed":
                  console.log("CONNECTION STATE CHANGED: Error");
                  break;
                default:
                  console.log("CONNECTION STATE CHANGED: Unknown");
                  break;
              }
        });


        //FOR DEBUG
        this.peerConnection.addEventListener("iceconnectionstatechange", (event) => {
            console.log(`iceconnectionstatechange: `,this.peerConnection.iceConnectionState);
        });
        //FOR DEBUG
        this.peerConnection.addEventListener("icegatheringstatechange", (event) => {
            console.log(`icegatheringstatechange: `,this.peerConnection.iceGatheringState);
        });
        //FOR DEBUG
        this.peerConnection.addEventListener("signalingstatechange", (event) => {
            console.log(`signalingstatechange: `,this.peerConnection.signalingState);
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
            this.setRemoteStream(event.streams[0],this.remoteStreamSetterCallback);
            //console.log(`Set Remote Video Stream`);
        });

        
    }


    async addLocalTracks() {
        console.log(`START ADDING LOCAL TRACKS.`);
        let localTracks = this.localStream.getTracks();

        localTracks.forEach(track => {
            console.log(track);
            this.peerConnection.addTrack(track, this.localStream);
            console.log(`track added`);

        });

        console.log(`Local Tracks is added to connection(${this.socketID})`);
        
    }

    // To provide an offer to other peer
    async initACall() {
        console.log(`INITIALISE A CALL.`);
        /**
         * Set Offer
         */
        let offer = await this.peerConnection.createOffer();

        await this.peerConnection.setLocalDescription(offer);

        //console.log(`Offer: `, offer);

        this.socket.emit(`I provide offer`, offer, this.socketID);
        console.log(`END OF CALL INITIALISATION.`);
        
    }

    // Sending SDPs to other peer
    async setRemoteDescription(offer: RTCSessionDescriptionInit) {
        console.log(`GET OFFER FROM CALLER.`);
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        this.socket.emit(`my answer to`, this.socketID, answer);
        console.log(`REPLY TO CALL WITH ANSWER.`);
        
    }


    //setter function for remote stream
    setRemoteStream(stream:MediaStream, callback?:(newStream:MediaStream)=>void){
        this.remoteStream = stream;
        if(callback){
            callback(stream);
        }
    }
}