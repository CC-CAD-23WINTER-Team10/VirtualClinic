//@ts-ignore
import { PConnection } from "./PConnection.js";
//@ts-ignore
import { User, Status, myDiv } from "./Modules.js";
//@ts-ignore
import { YesAlertBox, AlertBox } from "./AlertBox.js"

interface reply{
    sdp: RTCSessionDescriptionInit
}


/**
 * This is a Class mainly taking care of the Video Controls of the Div element with ID #chatroom
 * and its children in dashboard page along with minimal UI controls
 * (The UI Controls' logic is mainly on dashboard.ts).
 */
export class Chatroom {
    socket: any; //A reference to the socket IO
    localStream: MediaStream; //the Local Video stream
    connections: Map<string, PConnection> = new Map(); //A collection of PeerConnection
    muted: boolean;//ture when you don't want to send audio tracks out
    camOff: boolean;//ture when you don't want to send video tracks out
    pinedMedia: string; //the socket id of the pined media owner
    settingOnce: boolean = false;//to mark wether the user set the device. If not the local stream will not be sent.
    settingIsOpened: boolean = false;//to mark wether the setting is opened.

    onRejection: (socketID: string) => void = () => { }; //a funtion will be executed when receives a rejection
    onClose: () => void = () => { }; //functions will be executed when the chatroom is closing(with or without any parameters)

    //Elements in the Chatroom Div
    setting: HTMLDivElement;
    previewContainer: HTMLDivElement;
    activeFrame: myDiv;
    activeVideo: HTMLVideoElement;
    settingButton: HTMLButtonElement;
    selfMicButton: HTMLButtonElement;
    selfCamButton: HTMLButtonElement;
    selfExitButton: HTMLButtonElement;



    //Button SVGs for UI Changes
    readonly pinSVG: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
    <path d="M298.028 214.267L285.793 96H328c13.255 0 24-10.745 24-24V24c0-13.255-10.745-24-24-24
    H56C42.745 0 32 10.745 32 24v48c0 13.255 10.745 24 24 24h42.207L85.972 214.267
    C37.465 236.82 0 277.261 0 328c0 13.255 10.745 24 24 24h136v104.007c0 1.242.289 2.467.845 3.578
    l24 48c2.941 5.882 11.364 5.893 14.311 0l24-48a8.008 8.008 0 0 0 .845-3.578V352h136
    c13.255 0 24-10.745 24-24-.001-51.183-37.983-91.42-85.973-113.733z"></path>
    </svg>`;
    readonly unpinSVG: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
	<path d="M426.03,215.27L413.79,97c20.81-1.83,65.68,9.56,66.21-24c-2.52-21.6,11.13-71.36-24-72c0,0-272,0-272,0
		c-35.08,0.58-21.51,50.45-24,72c0.63,33.58,45.17,22.16,66.21,24l-12.23,118.27C165.47,237.82,128,278.26,128,329
		c0,13.25,10.75,23.99,24,23.99h136v104.01c0,1.24,0.29,2.47,0.85,3.58l24,48c2.94,5.88,11.36,5.89,14.31,0l24-48
		c0.56-1.11,0.84-2.34,0.85-3.58V353h136c13.25,0,24-10.74,24-24C512,277.82,474.02,237.58,426.03,215.27z"/>
	<path d="M224.41,142.03c0,0-178.53-138-178.53-138C27.16-10.03,13.92,21.78,3.78,32.11c-5.42,6.97-4.17,17.02,2.81,22.45
		c0,0,588.36,454.73,588.36,454.73c18.71,14.07,31.97-17.76,42.1-28.08c5.41-6.97,4.16-17.02-2.82-22.45"/>
    </svg>`;
    readonly unmutedSVG: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512">
    <path d="M336 192h-16c-8.84 0-16 7.16-16 16v48c0 74.8-64.49 134.82-140.79 127.38
    C96.71 376.89 48 317.11 48 250.3V208c0-8.84-7.16-16-16-16H16c-8.84 0-16 7.16-16 16
    v40.16c0 89.64 63.97 169.55 152 181.69V464H96c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16
    h160c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16h-56v-33.77C285.71 418.47 352 344.9 352 256
    v-48c0-8.84-7.16-16-16-16zM176 352c53.02 0 96-42.98 96-96h-85.33c-5.89 0-10.67-3.58-10.67-8
    v-16c0-4.42 4.78-8 10.67-8H272v-32h-85.33c-5.89 0-10.67-3.58-10.67-8v-16c0-4.42 4.78-8 10.67-8
    H272v-32h-85.33c-5.89 0-10.67-3.58-10.67-8v-16c0-4.42 4.78-8 10.67-8H272c0-53.02-42.98-96-96-96
    S80 42.98 80 96v160c0 53.02 42.98 96 96 96z"/>
    </svg>`;
    readonly mutedSVG: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
    <path d="M633.82 458.1L476.26 336.33C488.74 312.21 496 284.98 496 256v-48c0-8.84-7.16-16-16-16
    h-16c-8.84 0-16 7.16-16 16v48c0 17.92-3.96 34.8-10.72 50.2l-26.55-20.52c3.1-9.4 5.28-19.22 5.28-29.67
    h-43.67l-41.4-32H416v-32h-85.33c-5.89 0-10.67-3.58-10.67-8v-16c0-4.42 4.78-8 10.67-8H416v-32h-85.33
    c-5.89 0-10.67-3.58-10.67-8v-16c0-4.42 4.78-8 10.67-8H416c0-53.02-42.98-96-96-96s-96 42.98-96 96
    v45.36L45.47 3.37C38.49-2.05 28.43-.8 23.01 6.18L3.37 31.45C-2.05 38.42-.8 48.47 6.18 53.9
    l588.36 454.73c6.98 5.43 17.03 4.17 22.46-2.81l19.64-25.27c5.41-6.97 4.16-17.02-2.82-22.45zM400 464
    h-56v-33.78c11.71-1.62 23.1-4.28 33.96-8.08l-50.4-38.96
    c-6.71.4-13.41.87-20.35.2-55.85-5.45-98.74-48.63-111.18-101.85L144 241.31
    v6.85c0 89.64 63.97 169.55 152 181.69V464h-56c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h160
    c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16z"/>
    </svg>`;
    readonly camOnSVG: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
    <path d="M336.2 64H47.8C21.4 64 0 85.4 0 111.8v288.4C0 426.6 21.4 448 47.8 448h288.4
    c26.4 0 47.8-21.4 47.8-47.8V111.8c0-26.4-21.4-47.8-47.8-47.8zm189.4 37.7L416 177.3v157.4l109.6 75.5
    c21.2 14.6 50.4-.3 50.4-25.8V127.5c0-25.4-29.1-40.4-50.4-25.8z"/></svg>`;
    readonly camOffSVG: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640.41 512.62">
    <path d="m224.41,141.83L45.88,3.83C27.16-10.23,13.92,21.58,3.78,31.91c-5.42,6.97-4.17,17.02,2.81,22.45
    l588.36,454.73c18.71,14.07,31.97-17.76,42.1-28.08,5.41-6.97,4.16-17.02-2.82-22.45"/>
    <path d="m0,124.6v276.1c0,3.18.32,20.12,14,33.8,8.65,8.65,20.6,14,33.8,14h288.4
    c10.22-2.29,35.94-9.47,44.12-29.37m195.68-47.12v-243.71c0-25.4-29.1-40.4-50.4-25.8l-109.6,75.6
    v70.37m-32-24.93c0-37.08,0-74.16,0-111.24,0-3.18-.32-20.12-14-33.8-13.68-13.68-30.62-14-33.8-14-55.39,0-108.42-.84-157.51.13"/>
    </svg>`;


    constructor(socket: any, chatroomDiv: HTMLDivElement) {
        this.socket = socket;
        this.setSocketCommunication();//Start Listening to the socket events

        //Pass the references of the chatroom elements into this object
        this.previewContainer = chatroomDiv.querySelector(`.preview-container`)!;
        this.activeFrame = chatroomDiv.querySelector(`.active-speaker`)!;
        this.activeVideo = this.activeFrame.querySelector(`video`)!;
        this.settingButton = chatroomDiv.querySelector(`#self-setting`)!;
        this.selfMicButton = chatroomDiv.querySelector(`#self-mic`)!;
        this.selfCamButton = chatroomDiv.querySelector(`#self-cam`)!;
        this.selfExitButton = chatroomDiv.querySelector(`#self-exit`)!;
        this.setting = chatroomDiv.querySelector(`#setting`)!;

        this.muted = false;
        this.camOff = false;

        //set Setting button OnClick Event
        this.settingButton.addEventListener(`click`, () => {
            this.showSetting();
        })

        //set Exit button onClick Event
        this.selfExitButton.addEventListener(`click`, () => {
            this.close();
        })

        //set the Mute button Event
        this.selfMicButton.addEventListener(`click`, () => {
            this.toggleMute();
        })

        //set the cam button Event
        this.selfCamButton.addEventListener(`click`, () => {
            this.toggleCam();
        })


    }





    /**
     * The start point of the chatroom
     */
    async start() {
        this.activeFrame.my_relation = this.socket.id;
        //get the media access permission and show a default media on screen
        let permission = await this.getMediaPermission();

        this.selfExitButton.disabled = false;

        if (permission) {
            //delay the setting show-up
            setTimeout(() => { this.showSetting(); }, 1000);


        } else {
            let alert = new AlertBox(`You may not grant the access to audio and/or video device.`, `Media Access Permission`);
            alert.show();
        }

    }

    /**
     * End point of the chat room. 1. It resets the UI to default.
     * 2. Close all connections. 3. Tell server to leave room.
     * 4. Stop accessing the cam and mic. 5. Remove all references
     * 6. excute onClose functions
     */
    close() {
        //tell the server leaving
        this.socket.emit(`leave`);

        //close and clear all Peer Connections
        this.connections.forEach(c => {
            c.close();
        })
        this.connections.clear();
        //Stop accessing the mic and cam
        this.localStream?.getTracks().forEach(track => {
            track.stop();
        });

        //put the buttons to default state
        this.selfCamButton.disabled = true;
        this.selfMicButton.disabled = true;
        //remove all registered event listeners for buttons
        this.settingButton.removeEventListener(`click`, () => {
            this.showSetting();
        });
        this.selfExitButton.removeEventListener(`click`, () => {
            this.close();
        })
        this.selfMicButton.removeEventListener(`click`, () => {
            this.toggleMute();
        })
        this.selfCamButton.removeEventListener(`click`, () => {
            this.toggleCam();
        })
        //remove all previews
        for (let index = 0; index < this.previewContainer.children.length; index++) {
            let element = this.previewContainer.children[index];
            element.parentElement.removeChild(element);
        }
        //hide preview container
        this.previewContainer.classList.remove(`dsp-flex`);
        this.previewContainer.classList.add(`dsp-none`);
        //remove media source 
        this.activeVideo.srcObject = null;
        //remove socket message listeners
        this.removeSocketCommunication();

        console.log(`CHAT ROOM IS CLOSING`)


        this.onClose();

    }

    /**
     * To open the setting dialogue in the chat room
     */
    private async showSetting() {
        this.settingIsOpened = true;
        //Link elements for setting dialogue
        let audioSelector = this.setting.querySelector(`#audio-selector`) as HTMLSelectElement;
        let videoSelector = this.setting.querySelector(`#video-selector`) as HTMLSelectElement;
        let applyButton = this.setting.querySelector(`#selector-apply`) as HTMLButtonElement;
        let cancelButton = this.setting.querySelector(`#selector-cancel`) as HTMLButtonElement;
        //retrieve the cameras and mics from the system
        let cameras = await this.getConnectedDevices('videoinput');
        let mics = await this.getConnectedDevices('audioinput');
        console.log(cameras);
        console.log(mics);

        const previousCentrePlayerOwner = this.activeFrame.my_relation;

        this.switchVideoPlayersToCentre(this.socket.id)//put your cam on the centre player to preview

        //clear options
        audioSelector.innerHTML = ``;
        videoSelector.innerHTML = ``;
        //Generate options
        //NOTE: IF THERE IS NO CAMARA/MIC AVAILABLE, THERE WILL BE ONE ITEM IN THE RETREIVED LIST 
        //      WITHOUT LABEL.

        //GENERATE FULL SCREEN ALERT ACCORDING TO THE NOTE ABOVE.
        if ((cameras.length == 1 && !(cameras[0].label)) || (mics.length == 1 && !(mics[0].label))) {
            const title = `Media Device Issue`
            let message = ``;
            if (cameras.length == 1 && !cameras[0].label) {
                message = `You may disable the access to camara for this website or you don't have any available camara.<br>`
            }
            if (mics.length == 1 && !mics[0].label) {
                message += `You may disable the access to microphone for this website or you don't have any available microphone.`
            }
            const alert = new AlertBox(message, title);
            alert.show();

        }

        //put cameras into the selection
        if (cameras) {
            const currentUsedCam = this.localStream?.getVideoTracks()[0]?.label;//get the cam that is being used, may be null.
            let hasSelectedItem = false;//set a flag if there is a cam is being used, and selected in the list
            for (const cam of cameras) {
                if (cam.label) {
                    //generate option
                    let option = document.createElement(`option`);
                    option.value = cam.deviceId;
                    option.innerHTML = cam.label;
                    if (cam.label == currentUsedCam) {
                        option.selected = true;
                        hasSelectedItem = true;//set the flag
                    }
                    videoSelector.add(option);
                }
            }
            //generate an option for no cam
            let optionForCamOff = document.createElement(`option`);
            optionForCamOff.value = `false`;
            optionForCamOff.innerHTML = `Cam Off`;
            if (!hasSelectedItem) {
                optionForCamOff.selected = true;
            }
            videoSelector.add(optionForCamOff);

        }

        //put mics into the selection
        if (mics) {
            let hasSelectedItem = false;//set a flag if there is a mic is being used, and selected in the list
            for (const mic of mics) {
                if (mic.label) {
                    const currentUsedMic = this.localStream?.getAudioTracks()[0]?.label;
                    let option = document.createElement(`option`);
                    option.value = mic.deviceId;
                    option.innerHTML = mic.label;
                    if (mic.label == currentUsedMic) {
                        option.selected = true;
                        hasSelectedItem = true;
                    }
                    audioSelector.add(option);
                }
            }
            //generate an option for no mic
            let optionForMicOff = document.createElement(`option`);
            optionForMicOff.value = `false`;
            optionForMicOff.innerHTML = `Mic Off`;
            if (!hasSelectedItem) {
                optionForMicOff.selected = true;
            }
            audioSelector.add(optionForMicOff);
        }

        //set cancel button Onclick event
        const cancelButtonClickEvent = () => {
            this.switchVideoPlayersToCentre(previousCentrePlayerOwner);
            applyButton.removeEventListener(`click`, applyButtonClickEvent);
            cancelButton.removeEventListener(`click`, cancelButtonClickEvent);
            videoSelector.onchange = null;
            this.closeSetting();
        }

        if (this.settingOnce) {
            cancelButton.disabled = false;
            cancelButton.title = `Dismiss changes`;
            cancelButton.addEventListener(`click`, cancelButtonClickEvent);
        } else {
            cancelButton.disabled = true;
            cancelButton.title = `You must set the media device before the meeting starts.`;
        }


        //set apply button Onclick event
        const applyButtonClickEvent = async () => {
            const micID = audioSelector.value == `false` ? false : audioSelector.value || false;
            const camID = videoSelector.value == `false` ? false : videoSelector.value || false;

            const constrain: MediaStreamConstraints = {
                audio: micID ? { echoCancellation: true, deviceId: micID, noiseSuppression: true } : false,
                video: camID ? { deviceId: camID } : false
            };
            console.log(constrain);

            await this.setLocalStream(constrain);

            //When user chooses a mic, enable the mute-button.
            if (micID) {
                if (this.muted) {
                    this.selfMicButton.title = `Click to unmute youself`;
                    this.selfMicButton.innerHTML = this.mutedSVG;
                    this.localStream?.getAudioTracks().forEach(t => {
                        t.enabled = false;
                    })
                } else {
                    this.selfMicButton.title = `Click to mute youself`;
                    this.selfMicButton.innerHTML = this.unmutedSVG;
                    this.localStream?.getAudioTracks().forEach(t => {
                        t.enabled = true;
                    })
                }
                this.selfMicButton.disabled = false;
            } else {
                this.selfMicButton.innerHTML = this.mutedSVG;
                this.selfMicButton.disabled = true;
                this.selfMicButton.title = `No Microphone`;
            }
            //When user chooses a cam, enable the cam-button.
            if (camID) {
                if (this.camOff) {
                    this.selfCamButton.title = `Click to turn on camara`;
                    this.selfCamButton.innerHTML = this.camOffSVG;
                    this.localStream?.getVideoTracks().forEach(t => {
                        t.enabled = false;
                    })
                } else {
                    this.selfCamButton.title = `Click to turn off camara`;
                    this.selfCamButton.innerHTML = this.camOnSVG;
                    this.localStream?.getVideoTracks().forEach(t => {
                        t.enabled = true;
                    })
                }
                this.selfCamButton.disabled = false;
            } else {
                this.selfCamButton.innerHTML = this.camOffSVG;
                this.selfCamButton.disabled = true;
                this.selfCamButton.title = `No Camara`;
            }
            //Put the center player back to previous media
            this.switchVideoPlayersToCentre(previousCentrePlayerOwner);

            this.settingOnce = true;
            videoSelector.onchange = null;
            cancelButton.removeEventListener(`click`, cancelButtonClickEvent);
            applyButton.removeEventListener(`click`, applyButtonClickEvent);

            this.closeSetting();
        }

        applyButton.addEventListener(`click`, applyButtonClickEvent);

        // set video option changes for preview
        videoSelector.onchange = () => {
            const micID = audioSelector.value == `false` ? false : audioSelector.value || false;
            const camID = videoSelector.value == `false` ? false : videoSelector.value || false;

            const constrain: MediaStreamConstraints = {
                audio: micID ? { echoCancellation: true, deviceId: micID, noiseSuppression: true } : false,
                video: camID ? { deviceId: camID } : false
            };
            console.log(`MEDIA SELECTION CHANGE::::`, constrain);

            if (!micID && !camID) {
                this.activeVideo.srcObject = null;
            } else {
                this.previewSelectedStream(constrain);
            }

        }


        //Show the setting by changing the CSS class(From display:none to flex)
        this.setting.classList.remove(`dsp-none`);
        this.setting.classList.add(`dsp-flex`);
    }


    /**
     * Hide the setting by changing the CSS class(From display:flex to none)
     */
    private closeSetting() {
        this.setting.classList.remove(`dsp-flex`);
        this.setting.classList.add(`dsp-none`);
        this.settingIsOpened = false;

    }


    /**
     * Get a list of media device from the system
     * @param type "audioinput" | "audiooutput" | "videoinput"
     * @returns 
     */
    private async getConnectedDevices(type: MediaDeviceKind) {
        //get temporary access to both mic and cam, so that it will generate labels of applicable device
        const tempMediaAccess = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        //get the device list
        const devices = await navigator.mediaDevices.enumerateDevices();
        //stop access to mic and cam
        tempMediaAccess?.getTracks().forEach(track => {
            track.stop();
        })
        //return the desired device list by filtering
        return devices.filter(device => device.kind === type)
    }








    /**
    * Asking the user a permission to turn on the local Camara and display on screen.
    * if permission is accepted,it will return ture;
    * if permission is denied, it will return false. 
    */
    async getMediaPermission() {
        const defaultConstrain = {
            audio: { echoCancellation: true, noiseSuppression: true },
            video: true
        }

        try {
            this.localStream = await navigator.mediaDevices.getUserMedia(defaultConstrain);
            this.switchVideoPlayersToCentre(this.socket.id);
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }

    }


    /**
     * Put the media that matches the seleted constrains to the centre player to preview
     * Note: The media the user is looking at is not sent to remote peer yet
     * @param constrain 
     */
    private async previewSelectedStream(constrain: MediaStreamConstraints) {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia(constrain);
            this.activeVideo.srcObject = mediaStream;
            this.activeVideo.muted = true;
        } catch (err) {
            console.error(`ERROR WHEN PREVIWING SELECTED STREAM::::`, err);
        }

    }


    /**
     * To set the local stream of the chat room, also set the local stream in every existing peer connection.
     * For peer connection, the connection will remove the previous tracks added,
     * then add the local stream tracks to the peer connection if the local stream is not null.
     * @param constrain 
     */
    private async setLocalStream(constrain: MediaStreamConstraints) {
        if (!constrain.audio && !constrain.video) {
            //if the user choose mic off and cam off, remove the local stream
            this.localStream = null;
            this.connections.forEach(c => {
                c.removeTracks();
            });
        } else {

            try {
                const newStream = await navigator.mediaDevices.getUserMedia(constrain);
                this.localStream = newStream;
                this.connections.forEach(c => {
                    c.removeTracks();
                    c.addTracks(newStream);
                })
            } catch (err) {
                console.error(`ERROR WHEN SETTING LOCAL STREAM::::`, err);
            }

        }

    }


    /**
     * Swith the desired media stream to the centre player with its socket ID
     * @param socketIDToCenter 
     * @returns 
     */
    private switchVideoPlayersToCentre(socketIDToCenter: string) {
        if (!socketIDToCenter) {
            console.error(`ERROR :::: GET AN EMPTY SOCKET ID WHEN SWITCHING VIDEO PLAYER`);
            return;
        }
        //check if any preview belongs to the socket id that is going to be put in the centre player
        const previews = this.previewContainer.children;
        let preview: myDiv;//look for preview, may be null
        for (const p of previews) {
            if ((p as myDiv).my_relation == socketIDToCenter) {
                preview = p as myDiv;
            }
        }

        const socketIDToPreview = this.activeFrame.my_relation;//get the owner of centre player(gonna put this to preview container)
        if (!socketIDToPreview) {
            console.error(`ERROR :::: CANNOT GET OWNER OF CENTRE PLAYER WHEN SWITCHING VIDEO PLAYER`);
            return;
        }
        //if the owner of the centre player is the same with the one that is about to be put to centre player, no need to switch.
        if (socketIDToCenter == socketIDToPreview) {
            this.activeVideo.srcObject = this.localStream;
            this.activeVideo.muted = true;
            console.log(`SWITCHING VIDEO PLAYER:::: SAME OWNER, NO NEED TO SWITCH`);
            return;
        }


        this.activeFrame.my_relation = socketIDToCenter;//set centre player owner
        //set the centre player
        if (socketIDToCenter == this.socket.id) {
            //put local stream to centre player
            this.activeVideo.srcObject = this.localStream;
            this.activeVideo.muted = true;
        } else {
            //put the remote stream to centre player
            const connection = this.connections.get(socketIDToCenter); //get the peer connection belonging to the id
            if (connection) {
                connection.videoContainer = this.activeFrame;
                this.activeVideo.srcObject = connection.remoteStream;
                this.activeVideo.muted = false;
            } else {
                console.error(`ERROR :::: CANNOT FIND CONNECTION WHEN PUTTING A REMOTE STREAM TO CENTRE PLAYER`);
            }
        }

        //set the preview player
        if (preview) {
            preview.my_relation = socketIDToPreview;//set preview owner
            let videoPlayer = preview.querySelector(`video`);
            let micDiv = preview.querySelector(`.micDiv`);
            if (socketIDToPreview == this.socket.id) {
                //put local stream to the preview player
                videoPlayer.srcObject = this.localStream;
                videoPlayer.muted = true;
                micDiv.innerHTML = this.mutedSVG;

            } else {

                const connection = this.connections.get(socketIDToPreview); //get the peer connection belonging to the id
                if (connection) {
                    connection.videoContainer = preview;
                    videoPlayer.srcObject = connection.remoteStream;
                    videoPlayer.muted = false;
                    micDiv.innerHTML = this.unmutedSVG;
                } else {
                    console.error(`ERROR :::: CANNOT FIND CONNECTION WHEN PUTTING A REMOTE STREAM TO PREVIEW PLAYER`);
                }
            }
        } else {
            console.log(`SWITCH VIDEO PLAYER :::: NO PREVIEW`);
        }



    }

    /**
     * To turn off the user's microphone(the remote peer cannot hear the user)
     * Note: the microphone is still accessed by the application, if there is one selected in the setting.
     */
    private toggleMute() {

        if (!this.selfMicButton.disabled) {
            this.muted = !this.muted;
            if (this.muted) {
                this.selfMicButton.title = `Click to unmute youself`;
                this.selfMicButton.innerHTML = this.mutedSVG;
                this.localStream?.getAudioTracks().forEach(track => {
                    track.enabled = false;
                })
            } else {
                this.selfMicButton.title = `Click to mute youself`;
                this.selfMicButton.innerHTML = this.unmutedSVG;
                this.localStream?.getAudioTracks().forEach(track => {
                    track.enabled = true;
                })
            }
        }
    }

    /**
     * To turn off the user's camara(the remote peer cannot see the user)
     * Note: the camara is still accessed by the application, if there is one selected in the setting.
     */
    private toggleCam() {

        if (!this.selfCamButton.disabled) {
            this.camOff = !this.camOff;
            if (this.camOff) {
                this.selfCamButton.title = `Click to turn on camara`;
                this.selfCamButton.innerHTML = this.camOffSVG;
                this.localStream?.getVideoTracks().forEach(track => {
                    track.enabled = false;
                })
            } else {
                this.selfCamButton.title = `Click to turn off camara`;
                this.selfCamButton.innerHTML = this.camOnSVG;
                this.localStream?.getVideoTracks().forEach(track => {
                    track.enabled = true;
                })
            }
        }


    }




    /**
     * Generate a Videio Preview for one remote user
     * @param socketID the remote user's socket ID
     * @param videoSource the remote video stream
     * @returns a Div element
     */
    createPreview(socketID: string, videoSource?: MediaStream) {
        console.log(`Creating Preview for ${socketID}`);
        let previewDiv = document.createElement(`div`) as myDiv;
        previewDiv.my_relation = socketID;
        previewDiv.classList.add(`preview`);

        let controlsDiv = document.createElement(`div`);
        controlsDiv.classList.add(`controls`);
        let pinDiv = document.createElement(`div`);
        pinDiv.innerHTML = this.unpinSVG;
        let micDiv = document.createElement(`div`);
        micDiv.innerHTML = this.unmutedSVG;
        micDiv.classList.add(`micDiv`);
        controlsDiv.append(pinDiv, micDiv);

        let videoCover = document.createElement(`div`);
        videoCover.classList.add(`video-cover`)

        let videoFrame = document.createElement(`video`);
        videoFrame.autoplay = true;
        videoFrame.playsInline = true
        videoFrame.srcObject = videoSource;
        if (previewDiv.my_relation == this.socket.id) {
            videoFrame.muted = true;
            micDiv.innerHTML = this.mutedSVG;
        }

        previewDiv.append(controlsDiv, videoCover, videoFrame);

        pinDiv.onclick = () => {
            console.log(`Pin this to central player ${previewDiv.my_relation}`);
            //Only when the setting is not opened, the user can switch players
            if (!this.settingIsOpened) {
                this.pinedMedia = previewDiv.my_relation;
                this.switchVideoPlayersToCentre(previewDiv.my_relation);
            }

        }

        micDiv.onclick = () => {
            console.log(`Toggle mute for ${previewDiv.my_relation}`);
            //Only the remote stream can be toggled mute/unmute
            if (previewDiv.my_relation != this.socket.id) {
                videoFrame.muted = !videoFrame.muted;
                if (videoFrame.muted) {
                    micDiv.innerHTML = this.mutedSVG;
                } else {
                    micDiv.innerHTML = this.unmutedSVG;
                }
            }

        }

        return previewDiv;
    }

    /**
     * It registers the events for socket IO
     */
    setSocketCommunication() {
        this.socket.on(`invitation accepted by`, async (_id: string) => {
            console.log(`YOUR INVITATION IS ACCEPT BY ${_id}.`);
        });


        this.socket.on(`new joiner`, async (socketID: string) => {
            //setTimeout(async () => {
                //UI section
                let newPreview = this.createPreview(socketID);
                console.log(`NEW JOINER:::::Created preview for ${socketID}`);
                if (this.previewContainer.children.length < 1) {
                    this.previewContainer.classList.remove(`dsp-none`);
                    this.previewContainer.classList.add(`dsp-flex`);
                }
                this.previewContainer.appendChild(newPreview);



                //Connection section
                let newConnection = new PConnection(socketID, this.socket, newPreview);
                if (this.settingOnce && this.localStream) {
                    newConnection.addTracks(this.localStream);
                }
                this.connections.set(socketID, newConnection);
                console.log(`WAIT FOR OFFER & ICE FROM USER ${socketID}`);

                //console.log(`CURRENT CONNECTIONS: ${[...this.connections.entries()]}`);

            //}, 2000)



        });

        /*
        this.socket.on(`You need to provide offer`, async (users: string[]) => {
            console.log(`You need to provide offer`);
            setTimeout(async () => {
                const myID = this.socket.id;
                const otherUsers = users.filter(u => u != myID);
                console.log(`Provide Offer:::::Other users:${otherUsers}`)

                otherUsers.forEach(async socketID => {

                    //UI section
                    let newPreview = this.createPreview(socketID);
                    console.log(`Provide Offer:::::Created preview for ${socketID}`);
                    if (this.previewContainer.children.length < 1) {
                        this.previewContainer.classList.remove(`dsp-none`);
                        this.previewContainer.classList.add(`dsp-flex`);
                    }
                    this.previewContainer.appendChild(newPreview);

                    //Connection section
                    let newConnection = new PConnection(socketID, this.socket, newPreview);
                    this.connections.set(socketID, newConnection);
                    if (this.settingOnce && this.localStream) {
                        //if the user already set the media once, put the desired media to the connection
                        newConnection.addTracks(this.localStream);
                    }

                    await newConnection.startFirstNegotiation();// To initialise a peer connection with/without local stream.

                    console.log(`CURRENT CONNECTIONS: ${[...this.connections.entries()]}`);
                });

            }, 2000)

        });
*/
        this.socket.on(`NEGO:You need to provide offer to`, (remoteSocketID: string, reply: any) => {
            console.log(`GET NEW OFFER REQUEST FOR ${remoteSocketID}`);
            let conncetion = this.connections.get(remoteSocketID);
            if (conncetion) {
                conncetion.getOffer().then(offer => {
                    const offerString = JSON.stringify(offer);
                    reply(offerString);
                }).catch(reason => {
                    console.error(`ERROR WHEN TRY TO GET AN OFFER FROM CONNECTION ${remoteSocketID}, ${reason}`);
                });
            } else {
                //UI section
                let newPreview = this.createPreview(remoteSocketID);
                console.log(`Provide Offer:::::Created preview for ${remoteSocketID}`);
                if (this.previewContainer.children.length < 1) {
                    this.previewContainer.classList.remove(`dsp-none`);
                    this.previewContainer.classList.add(`dsp-flex`);
                }
                this.previewContainer.appendChild(newPreview);

                //Connection section
                let newConnection = new PConnection(remoteSocketID, this.socket, newPreview);
                this.connections.set(remoteSocketID, newConnection);
                if (this.settingOnce && this.localStream) {
                    //if the user already set the media once, put the desired media to the connection
                    newConnection.addTracks(this.localStream);
                }

                newConnection.getOffer().then(offer => {
                    const OfferString = JSON.stringify(offer);
                    reply(OfferString);
                }).catch(reason => {
                    console.error(`ERROR WHEN TRY TO GET AN OFFER FROM CONNECTION ${remoteSocketID}, ${reason}`);
                });
            }
        });

        this.socket.on(`NEGO:You got a new offer from`, (remoteSocketID: string, offer: string, reply: any) => {
            console.log(`GET A NEW OFFER FROM ${remoteSocketID}`);
            let conncetion = this.connections.get(remoteSocketID);
            if (conncetion) {
                conncetion.getAnswer(JSON.parse(offer)).then(answer => {
                    const answerString = JSON.stringify(answer);
                    reply(answerString);
                    conncetion.listenToICE();
                }).catch(reason => {
                    console.error(`ERROR WHEN TRY TO GET AN ANSWER FROM CONNECTION ${remoteSocketID}, ${reason}`);
                });
            } else {
                console.error(`CANNOT FIND CONNECTION FOR ${remoteSocketID}, WHEN GETTING AN NEW OFFER.`);
            }
        });

        this.socket.on(`NEGO:You got an answer from`, (remoteSocketID: string, answer: string, reply: any) => {
            console.log(`GET AN ANSWER FROM ${remoteSocketID}`);
            let conncetion = this.connections.get(remoteSocketID);
            if (conncetion) {
                conncetion.completeNegotiation(JSON.parse(answer)).then((isCompleted) => {
                    conncetion.listenToICE();
                    reply(isCompleted);
                }).catch(reason => {
                    console.error(`ERROR WHEN TRY TO COMPLETE A NEGOTIATION FOR CONNECTION ${remoteSocketID}, ${reason}`);
                });
            } else {
                console.error(`CANNOT FIND CONNECTION FOR ${remoteSocketID}, WHEN GETTING AN NEW ANSWER.`);
            }
        });
/*
        this.socket.on(`new offer`, (offer: RTCSessionDescriptionInit, remoteID: string) => {
            console.log(`GET NEW OFFER FROM ${remoteID}`);
            let connection = this.connections.get(remoteID);
            if (connection != undefined) {
                connection.answerToOffer(offer);
                connection.listenToICE();
            } else {
                console.log(`CANNOT FIND CONNECTION WITH ID:${remoteID}. (socket.on(\`new offer\`))`);
            }

            console.log(`CURRENT CONNECTIONS: ${[...this.connections.entries()]}`);

        });

        this.socket.on(`you answer from`, async (remoteID: string, answer: RTCSessionDescriptionInit) => {
            let connection = this.connections.get(remoteID);
            if (connection) {
                connection.setAnswer(answer);
                connection.listenToICE();
            } else {
                console.log(`CANNOT FIND CONNECTION WITH ID:${remoteID}. (socket.on(\`you answer from\`))`);
            }

            console.log(`CURRENT CONNECTIONS: ${[...this.connections.entries()]}`);
        });
*/
        this.socket.on(`icecandidate from`, async (remoteID: string, candidate: RTCIceCandidateInit) => {
            let connection = this.connections.get(remoteID);
            if (connection) {

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

        //When someone left the chatroom
        this.socket.on(`leave`, (socketID: string) => {
            //get the applicable PConnection
            let connetion = this.connections.get(socketID);
            if (!connetion) {
                console.log(`NO RELATED CONNECTION`);
                return;
            }
            //close that connection;
            connetion.close();
            //remove the connection
            this.connections.delete(socketID);
            //remove the related preview
            for (const p of this.previewContainer.children) {
                if ((p as myDiv).my_relation == socketID) {

                    p.parentElement.removeChild(p);

                    console.log(`Preview ${(p as myDiv).my_relation} is removed.`);
                    //Once the preview is found, get out of the loop
                    break;
                }
            }


            //If the pined or the central player is the leaving one,replace them
            if (this.pinedMedia == socketID) {
                this.pinedMedia = null;
            }
            if (this.activeFrame.my_relation == socketID) {
                this.activeFrame.my_relation = (this.previewContainer.firstElementChild as myDiv)?.my_relation || this.socket.id;
                if (this.activeFrame.my_relation == this.socket.id) {
                    this.activeVideo.srcObject = this.localStream;
                    this.previewContainer.removeChild(this.previewContainer.firstElementChild);
                } else {
                    const conncetion = this.connections.get(this.activeFrame.my_relation);
                    if (!conncetion) {
                        console.log(`ERROR:::: CANNOT FIND CONNECTION WHEN SOMEONE IS LEAVING THE CHAT ROOM`);
                        return;
                    }
                    this.activeVideo.srcObject = conncetion.remoteStream;
                    conncetion.videoContainer = this.activeFrame;
                    this.previewContainer.removeChild(this.previewContainer.firstElementChild);
                }
            }

            //If no previews in the container, hide it
            if (this.previewContainer.children.length == 0) {
                this.previewContainer.classList.remove(`dsp-flex`);
                this.previewContainer.classList.add(`dsp-none`);
            }

            console.log(`CURRENT CONNECTIONS: ${[...this.connections.entries()]}`);
        })


    }


    removeSocketCommunication(){
        this.socket.removeAllListeners(`invitation accepted by`);
        this.socket.removeAllListeners(`new joiner`);
        this.socket.removeAllListeners(`NEGO:You need to provide offer to`);
        this.socket.removeAllListeners(`NEGO:You got a new offer from`);
        this.socket.removeAllListeners(`NEGO:You got an answer from`);
        this.socket.removeAllListeners(`icecandidate from`);
        this.socket.removeAllListeners(`leave`);
    }

}