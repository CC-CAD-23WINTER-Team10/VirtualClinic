//@ts-ignore
import { PConnection } from "./NewPConnection.js";
//@ts-ignore
import { User, Status, myDiv } from "./Modules.js";
//@ts-ignore
import { YesAlertBox, AlertBox } from "./AlertBox.js"


/**
 * This is a Class mainly taking care of the Video Controls of the Div element with ID #chatroom
 * and its children in dashboard page along with minimal UI controls
 * (The UI Controls' logic is mainly on dashboard.ts).
 */
export class Chatroom {
    socket: any; //A reference to the socket IO
    localStream: MediaStream; //the Local Video stream
    connections: PConnection[] = []; //A collection of PeerConnection
    muted: boolean;//ture when you don't want to send audio tracks out
    camOff: boolean;//ture when you don't want to send video tracks out

    onRejection: (socketID:string) => void = ()=>{}; //a funtion will be executed when receives a rejection
    onClose: () => void = ()=>{}; //functions will be executed when the chatroom is closing(with or without any parameters)

    //Elements in the Chatroom Div
    setting: HTMLDivElement;
    previewContainer: HTMLDivElement;
    activeFrame: myDiv;
    activeVideo: HTMLVideoElement;
    settingButton: HTMLButtonElement;
    screenButton: HTMLButtonElement;
    selfMicButton: HTMLButtonElement;
    selfCamButton: HTMLButtonElement;
    selfExitButton: HTMLButtonElement;



    constructor(socket: any, chatroomDiv: HTMLDivElement) {
        this.socket = socket;
        this.socketCommunication();//Start Listening to the socket events

        //Pass the references of the chatroom elements into this object
        this.previewContainer = chatroomDiv.querySelector(`.preview-container`)!;
        this.activeFrame = chatroomDiv.querySelector(`.active-speaker`)!;
        this.activeVideo = this.activeFrame.querySelector(`video`)!;
        this.settingButton = chatroomDiv.querySelector(`#self-setting`)!;
        this.screenButton = chatroomDiv.querySelector(`#self-screen`)!;
        this.selfMicButton = chatroomDiv.querySelector(`#self-mic`)!;
        this.selfCamButton = chatroomDiv.querySelector(`#self-cam`)!;
        this.selfExitButton = chatroomDiv.querySelector(`#self-exit`)!;
        this.setting = chatroomDiv.querySelector(`#setting`)!;

        //set Setting button OnClick Event
        this.settingButton.addEventListener(`click`, () => {
            this.showSetting();
        })

        //set Exit button onClick Event
        this.selfExitButton.addEventListener(`click`, () => {
            this.close();
        })


    }
    //
    readonly chatroomHTML: string = `
    <div class="box dsp-none" id="chatroom">
            <div class="box dsp-none" id="setting">
                <div>
                    <div>Audio Device:</div> <div><select name="" id="audio-selector"></select></div>
                    <div>Video Device:</div> <div><select name="" id="video-selector"></select></div>
                </div>
                <div>
                    <button id="selector-apply">Apply</button> <button id="selector-cancel">Cancel</button>
                </div>
                
            </div>
            <div class="preview-container dsp-none scrollale">
                 
            </div>
            

            <div class="active-speaker">
                
                <div class="video-cover dsp-flex f-end">

                    <div class="self-controls">
                        <button class="control-button" id="self-setting" title="Setting">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 416c0-17.7 14.3-32 32-32l54.7 0c12.3-28.3 40.5-48 73.3-48s61 19.7 73.3 48L480 384c17.7 0 32 14.3 32 32s-14.3 32-32 32l-246.7 0c-12.3 28.3-40.5 48-73.3 48s-61-19.7-73.3-48L32 448c-17.7 0-32-14.3-32-32zm192 0a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM384 256a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-32-80c32.8 0 61 19.7 73.3 48l54.7 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-54.7 0c-12.3 28.3-40.5 48-73.3 48s-61-19.7-73.3-48L32 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l246.7 0c12.3-28.3 40.5-48 73.3-48zM192 64a32 32 0 1 0 0 64 32 32 0 1 0 0-64zm73.3 0L480 64c17.7 0 32 14.3 32 32s-14.3 32-32 32l-214.7 0c-12.3 28.3-40.5 48-73.3 48s-61-19.7-73.3-48L32 128C14.3 128 0 113.7 0 96S14.3 64 32 64l86.7 0C131 35.7 159.2 16 192 16s61 19.7 73.3 48z"/></svg>
                        </button>

                        <button class="control-button" id="self-screen" disabled title="">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                <path d="M32 32C14.3 32 0 46.3 0 64v96c0 17.7 14.3 32 32 32s32-14.3 32-32V96h64
                                c17.7 0 32-14.3 32-32s-14.3-32-32-32H32zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32
                                v96c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H64V352zM320 32c-17.7 0-32 14.3-32 32
                                s14.3 32 32 32h64v64c0 17.7 14.3 32 32 32s32-14.3 32-32V64c0-17.7-14.3-32-32-32H320zM448 352
                                c0-17.7-14.3-32-32-32s-32 14.3-32 32v64H320c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32V352z"/>
                                </svg>
                        </button>

                        <button class="control-button" id="self-mic" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512"><path d="M336 192h-16c-8.84 0-16 7.16-16 16v48c0 74.8-64.49 134.82-140.79 127.38C96.71 376.89 48 317.11 48 250.3V208c0-8.84-7.16-16-16-16H16c-8.84 0-16 7.16-16 16v40.16c0 89.64 63.97 169.55 152 181.69V464H96c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h160c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16h-56v-33.77C285.71 418.47 352 344.9 352 256v-48c0-8.84-7.16-16-16-16zM176 352c53.02 0 96-42.98 96-96h-85.33c-5.89 0-10.67-3.58-10.67-8v-16c0-4.42 4.78-8 10.67-8H272v-32h-85.33c-5.89 0-10.67-3.58-10.67-8v-16c0-4.42 4.78-8 10.67-8H272v-32h-85.33c-5.89 0-10.67-3.58-10.67-8v-16c0-4.42 4.78-8 10.67-8H272c0-53.02-42.98-96-96-96S80 42.98 80 96v160c0 53.02 42.98 96 96 96z"/></svg>
                        </button>
    
                        <button class="control-button" id="self-cam" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640.41 512.62">
                                <path d="m224.41,141.83L45.88,3.83C27.16-10.23,13.92,21.58,3.78,31.91c-5.42,6.97-4.17,17.02,2.81,22.45l588.36,454.73c18.71,14.07,31.97-17.76,42.1-28.08,5.41-6.97,4.16-17.02-2.82-22.45"/>
                                <path d="m0,124.6v276.1c0,3.18.32,20.12,14,33.8,8.65,8.65,20.6,14,33.8,14h288.4c10.22-2.29,35.94-9.47,44.12-29.37m195.68-47.12v-243.71c0-25.4-29.1-40.4-50.4-25.8l-109.6,75.6v70.37m-32-24.93c0-37.08,0-74.16,0-111.24,0-3.18-.32-20.12-14-33.8-13.68-13.68-30.62-14-33.8-14-55.39,0-108.42-.84-157.51.13"/>
                              </svg>
                        
                        </button>
    
                        <button class="control-button" id="self-exit" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M497 273L329 441c-15 15-41 4.5-41-17v-96H152c-13.3 0-24-10.7-24-24v-96c0-13.3 10.7-24 24-24h136V88c0-21.4 25.9-32 41-17l168 168c9.3 9.4 9.3 24.6 0 34zM192 436v-40c0-6.6-5.4-12-12-12H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h84c6.6 0 12-5.4 12-12V76c0-6.6-5.4-12-12-12H96c-53 0-96 43-96 96v192c0 53 43 96 96 96h84c6.6 0 12-5.4 12-12z"/></svg>
    
    
                        </button>
    
                    </div>

                </div>
                <video autoplay playsinline></video>
            </div>
        </div>
    `;
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
    readonly fullScreenSVG: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
    <path d="M32 32C14.3 32 0 46.3 0 64v96c0 17.7 14.3 32 32 32s32-14.3 32-32V96h64
    c17.7 0 32-14.3 32-32s-14.3-32-32-32H32zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32
    v96c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H64V352zM320 32c-17.7 0-32 14.3-32 32
    s14.3 32 32 32h64v64c0 17.7 14.3 32 32 32s32-14.3 32-32V64c0-17.7-14.3-32-32-32H320zM448 352
    c0-17.7-14.3-32-32-32s-32 14.3-32 32v64H320c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32V352z"/>
    </svg>`;
    readonly browserScreenSVG: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
    <path d="M160 64c0-17.7-14.3-32-32-32s-32 14.3-32 32v64H32c-17.7 0-32 14.3-32 32s14.3 32 32 32
    h96c17.7 0 32-14.3 32-32V64zM32 320c-17.7 0-32 14.3-32 32s14.3 32 32 32H96v64c0 17.7 14.3 32 32 32
    s32-14.3 32-32V352c0-17.7-14.3-32-32-32H32zM352 64c0-17.7-14.3-32-32-32s-32 14.3-32 32v96
    c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H352V64zM320 320c-17.7 0-32 14.3-32 32v96
    c0 17.7 14.3 32 32 32s32-14.3 32-32V384h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H320z"/>
    </svg>`;



    /**
     * The start point of the chatroom
     */
    async start() {

        //get the media access permission and show a default media on screen
        let permission = await this.getMediaPermission();

        this.selfExitButton.disabled = false;

        if (permission) {
            //delay the setting show-up
            setTimeout(() => { this.showSetting(); }, 1000);
            //When it gets the audio tracks, enable the mute-button.
            if (this.localStream.getAudioTracks()) {
                this.selfMicButton.disabled = false;
            }
            //When it gets the video tracks, enable the mute-button.
            if (this.localStream.getVideoTracks()) {
                this.selfCamButton.disabled = false;
            }

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
        this.socket.emit(`leave`);
        for (const c of this.connections) {
            c.close();
        }
        this.localStream.getTracks().forEach(track => {
            track.stop();
        });
        this.selfCamButton.disabled = true;
        this.selfMicButton.disabled = true;
        this.previewContainer.innerHTML = ``;
        this.previewContainer.classList.remove(`dsp-flex`);
        this.previewContainer.classList.add(`dsp-none`);
        this.activeVideo.srcObject = null;
        this.onClose();
    }

    private async showSetting() {
        //Link elements for setting dialogue
        let audioSelector = this.setting.querySelector(`#audio-selector`) as HTMLSelectElement;
        let videoSelector = this.setting.querySelector(`#video-selector`) as HTMLSelectElement;
        let applyButton = this.setting.querySelector(`#selector-apply`) as HTMLButtonElement;
        let cancelButton = this.setting.querySelector(`#selector-cancel`) as HTMLButtonElement;
        //retrieve the cameras and mics from the system
        let cameras = await this.getConnectedDevices('videoinput');
        let mics = await this.getConnectedDevices('audioinput');

        const previousActiveSpeaker = this.activeVideo.srcObject;

        this.setActiveSpeaker(this.socket.id);//put your cam on the speaker frame to preview

        //clear options
        audioSelector.innerHTML = ``;
        videoSelector.innerHTML = ``;
        //Generate options
        //NOTE: IF THERE IS NO CAMARA/MIC AVAILABLE, THERE WILL BE ONE ITEM IN THE RETREIVED LIST 
        //      WITHOUT LABEL.

        //GENERATE FULL SCREEN ALERT ACCORDING TO THE NOTE ABOVE.
        if ((cameras.length == 1 && !cameras[0].label) || (mics.length == 1 && !mics[0].label)) {
            const title = `Media Device Issue`
            let message = ``;
            if (cameras.length == 1 && !cameras[0].label) {
                message = `You may disable the access to camara for this website or you don't have any available camara.<br>`
                let option = document.createElement(`option`);
                option.innerHTML = `No available camara`;
                option.value = ``;
                videoSelector.add(option);
            }
            if (mics.length == 1 && !mics[0].label) {
                message += `You may disable the access to microphone for this website or you don't have any available microphone.`
                let option = document.createElement(`option`);
                option.innerHTML = `No available microphone`;
                option.value = ``;
                audioSelector.add(option);
            }
            const alert = new AlertBox(message, title);
            alert.show();

        }

        //put cameras into the selection
        if (cameras) {
            for (const cam of cameras) {
                if (cam.label) {
                    const currentUsedCam = this.localStream.getVideoTracks()[0].label;
                    let option = document.createElement(`option`);
                    option.value = cam.deviceId;
                    option.innerHTML = cam.label;
                    if (cam.label == currentUsedCam) {
                        option.setAttribute(`selected`, ``);
                    }
                    videoSelector.add(option);
                }

            }
        }

        //put mics into the selection
        if (mics) {
            for (const mic of mics) {
                if (mic.label) {
                    const currentUsedMic = this.localStream.getAudioTracks()[0].label;
                    let option = document.createElement(`option`);
                    option.value = mic.deviceId;
                    option.innerHTML = mic.label;
                    if (mic.label == currentUsedMic) {
                        option.setAttribute(`selected`, ``);
                    }
                    audioSelector.add(option);
                }
            }
        }

        //set cancel button Onclick event
        cancelButton.addEventListener(`click`, () => {
            this.activeVideo.srcObject = previousActiveSpeaker;
            this.closeSetting();
        });


        //set apply button Onclick event
        applyButton.addEventListener(`click`, () => {
            const micID = audioSelector.value || false;
            const camID = videoSelector.value || false;

            const constrain: MediaStreamConstraints = {
                audio: micID ? { echoCancellation: true, deviceId: micID, noiseSuppression: true } : false,
                video: camID ? { deviceId: camID } : false
            };


            this.setLocalStream(constrain);
            this.activeVideo.srcObject = previousActiveSpeaker;
            this.closeSetting();
        });

        // set video option changes for preview
        videoSelector.onchange = () => {
            const micID = audioSelector.value || false;
            const camID = videoSelector.value || false;

            const constrain: MediaStreamConstraints = {
                audio: micID ? { echoCancellation: true, deviceId: micID, noiseSuppression: true } : false,
                video: camID ? { deviceId: camID } : false
            };

            this.previewLocalStream(constrain);
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
    }


    /**
     * Get a list of media device from the system
     * @param type "audioinput" | "audiooutput" | "videoinput"
     * @returns 
     */
    private async getConnectedDevices(type: MediaDeviceKind) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind === type)
    }








    /**
    * Asking the user a permission to turn on the local Camara and display on screen.
    * if permission is accepted,it will return ture;
    * if permission is denied, it will return false. 
    */
    async getMediaPermission() {
        const defaultConstrain = {
            audio: { echoCancellation: true },
            video: true
        }

        try {
            this.localStream = await navigator.mediaDevices.getUserMedia(defaultConstrain);
            this.activeVideo.srcObject = this.localStream;
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }

    }



    private async previewLocalStream(constrain: MediaStreamConstraints) {
        const mediaStream = await navigator.mediaDevices.getUserMedia(constrain);
        this.activeVideo.srcObject = mediaStream;
    }

    private async setLocalStream(constrain: MediaStreamConstraints) {
        this.localStream = await navigator.mediaDevices.getUserMedia(constrain);
    }

    private setActiveSpeaker(socketID: string) {
        this.activeFrame.my_relation = socketID;

        if (socketID == this.socket.id) {
            //If the active speaker media is from user's own cam and mic, always mute the mic
            //to reduce echo.
            this.activeVideo.muted = true;
            this.activeVideo.srcObject = this.localStream;
        } else {
            const connection = this.connections.find(c => c.socketID == socketID);
            this.activeVideo.srcObject = connection.remoteStream;
            this.activeVideo.muted = false;
        }
    }




    /**
     * Generate a Videio Preview for one remote user
     * @param socketID the remote user's socket ID
     * @param videoSource the remote video stream
     * @returns a Div element
     */
    createPreview(socketID: string, videoSource?: MediaStream) {
        let previewDiv = document.createElement(`div`) as myDiv;
        previewDiv.my_relation = socketID;
        previewDiv.classList.add(`preview`);

        let controlsDiv = document.createElement(`div`);
        controlsDiv.classList.add(`controls`);
        let pinDiv = document.createElement(`div`);
        pinDiv.innerHTML = this.unpinSVG;
        let micDiv = document.createElement(`div`);
        micDiv.innerHTML = this.unmutedSVG;
        controlsDiv.append(pinDiv, micDiv);

        let videoCover = document.createElement(`div`);
        videoCover.classList.add(`video-cover`)

        let videoFrame = document.createElement(`video`);
        videoFrame.autoplay = true;
        videoFrame.playsInline = true
        videoFrame.srcObject = videoSource;
        if (videoSource == this.localStream) {
            videoFrame.muted = true
        }

        previewDiv.append(controlsDiv, videoCover, videoFrame);
        return previewDiv;
    }

    /**
     * It stores the events for socket IO
     */
    socketCommunication() {
        this.socket.on("connect", () => {
            console.log(`CONNECTED WITH SERVER. YOUR ID: `, this.socket.id);
        });
        this.socket.on("disconnect", () => {
            console.log(`DISCONNECTED WITH SERVER.`);
        });

        this.socket.on(`invitation accepted by`, async (_id: string) => {
            console.log(`YOUR INVITATION IS ACCEPT BY ${_id}.`);
        })


        this.socket.on(`new joiner`, async (socketID: string) => {
            setTimeout(async () => {
                //UI section
                let newPreview = this.createPreview(socketID);
                if (this.previewContainer.children.length < 1) {
                    this.previewContainer.classList.remove(`dsp-none`);
                    this.previewContainer.classList.add(`dsp-flex`);
                }
                this.previewContainer.appendChild(newPreview);

                let addSource = (newStream: MediaStream) => {
                    newPreview.querySelector(`video`).srcObject = newStream;
                };

                //Connection section
                let newConnection = new PConnection(socketID, this.localStream, this.socket, addSource);
                await newConnection.addLocalTracks();
                this.connections.push(newConnection);
                console.log(`WAIT FOR OFFER & ICE FROM USER ${socketID}`);



            }, 2000)



        });

        this.socket.on(`You need to provide offer`, async (users: string[]) => {

            setTimeout(() => {
                const myID = this.socket.id;
                const otherUsers = users.filter(u => u != myID);

                otherUsers.forEach(async user => {

                    //UI section
                    let newPreview = this.createPreview(user);
                    if (this.previewContainer.children.length < 1) {
                        this.previewContainer.classList.remove(`dsp-none`);
                        this.previewContainer.classList.add(`dsp-flex`);
                    }
                    this.previewContainer.appendChild(newPreview);


                    let addSource = (newStream: MediaStream) => {
                        newPreview.querySelector(`video`).srcObject = newStream;
                    };

                    //Connection section
                    let newConnection = new PConnection(user, this.localStream, this.socket, addSource);
                    await newConnection.addLocalTracks();
                    await newConnection.initACall();
                    this.connections.push(newConnection);



                });
            }, 2000)

        });

        this.socket.on(`new offer`, (offer: RTCSessionDescriptionInit, remoteID: string) => {
            let connection = this.connections.find(c => c.socketID == remoteID);
            if (connection != undefined) {
                connection.setRemoteDescription(offer);
            } else {
                console.log(`CANNOT FIND CONNECTION WITH ID:${remoteID}. (socket.on(\`new offer\`))`);
            }

        });

        this.socket.on(`you answer from`, async (remoteID: string, answer: RTCSessionDescriptionInit) => {
            let connection = this.connections.find(c => c.socketID == remoteID);
            if (connection != undefined) {
                const remoteDesc = new RTCSessionDescription(answer);
                await connection.peerConnection.setRemoteDescription(remoteDesc);
                console.log(`Answer is set.`)
            } else {
                console.log(`CANNOT FIND CONNECTION WITH ID:${remoteID}. (socket.on(\`you answer from\`))`);
            }
        });

        this.socket.on(`icecandidate from`, async (remoteID: string, candidate: RTCIceCandidateInit) => {
            let connection = this.connections.find(c => c.socketID == remoteID);
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

        //When someone left the chatroom
        this.socket.on(`leave`, (socketID:string) => {
            //get the applicable PConnection
            let connetion = this.connections.find(c=>c.socketID == socketID);
            //close that connection;
            connetion.close();
            //remove the connection
            this.connections = this.connections.filter(c=>c != connetion);
            //remove the related preview
            for (const p of this.previewContainer.children) {
                if((p as myDiv).my_relation == socketID){
                     
                    p.parentElement.removeChild(p);
                    //Once the preview is found, get out of the loop
                    break;
                }
            }
            //If no previews in the container, hide it
            if(this.previewContainer.children.length == 0){
                this.previewContainer.classList.remove(`dsp-flex`);
                this.previewContainer.classList.add(`dsp-none`);
            }
        })


    }



}