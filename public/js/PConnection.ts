export class PConnection {
    id: string;
    localStream: MediaStream;
    remoteStream: MediaStream;
    remoteVideoFrame:HTMLVideoElement;
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
    peerConnection = new RTCPeerConnection(this.configuration);


    constructor(id: string, localStream: MediaStream, socket: any, remoteVideoFrame:HTMLVideoElement) {
        this.id = id;
        this.localStream = localStream;
        this.socket = socket;
        this.remoteVideoFrame = remoteVideoFrame;



        this.peerConnection.addEventListener('icecandidate', event => {
            if (event.candidate) {
                console.log(`Get ICE FROM STUN SERVER.`);
                socket.emit('new-ice-candidate to', this.id, event.candidate);
                console.log(`SEND ICE TO USER ${this.id}.`);
            }
        });

        this.peerConnection.addEventListener('track', async (event) => {
            console.log(`Get TRACK INFO FROM PEER CONNECTION.`);
            const [remoteStream] = event.streams;
            this.remoteVideoFrame.srcObject = remoteStream;
            console.log(`Set Remote Video Stream`);
        });

        this.peerConnection.addEventListener('connectionstatechange', event => {
            console.log(`CONNECTION STATE CHANGED`);
            if (this.peerConnection.connectionState === 'connected') {
                // Peers connected!
                console.log(`Peers connected!!!!!`)
        
            }
        });

    }


    async addLocalTracks() {
        console.log(`START ADDING LOCAL TRACKS.`);
        let localTracks = this.localStream.getTracks();

        localTracks.forEach(track => {

            this.peerConnection.addTrack(track, this.localStream);
            console.log(`track added`);

        });

        console.log(`Local Tracks is added to connection(${this.id})`);
    }


    async initACall() {
        console.log(`INITIALISE A CALL.`);
        /**
         * Set Offer
         */
        let offer = await this.peerConnection.createOffer();

        await this.peerConnection.setLocalDescription(offer);

        //console.log(`Offer: `, offer);

        this.socket.emit(`I provide offer`, offer, this.id);
        console.log(`END OF CALL INITIALISATION.`);
    }


    async setRemoteDescription(offer: RTCSessionDescriptionInit) {
        console.log(`GET OFFER FROM CALLER.`);
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        this.socket.emit(`my answer to`, this.id, answer);
        console.log(`REPLY TO CALL WITH ANSWER.`);
    }
}