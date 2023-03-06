import { PConnection } from "./PConnection.js";
import { User, Status, myDiv, YesAlertBox, AlertBox } from "./User.js";

export class Chatroom {
    socket: any;
    localStream: MediaStream;
    connections: PConnection[] = [];

    //Elements
    setting: HTMLDivElement;
    previewContainer: HTMLDivElement;
    activeFrame: HTMLDivElement;
    activeVideo: HTMLVideoElement;
    settingButton: HTMLButtonElement;
    screenButton: HTMLButtonElement;
    selfMicButton: HTMLButtonElement;
    selfCamButton: HTMLButtonElement;
    selfExitButton: HTMLButtonElement;

    

    constructor(socket:any, chatroomDiv:HTMLDivElement){
        this.socket = socket;
        this.previewContainer = chatroomDiv.querySelector(`.preview-container`);
        this.activeFrame = chatroomDiv.querySelector(`.active-speaker`);
        this.activeVideo = this.activeFrame.querySelector(`video`);
        this.settingButton = chatroomDiv.querySelector(`#self-setting`);
        this.screenButton = chatroomDiv.querySelector(`#self-screen`);
        this.selfMicButton = chatroomDiv.querySelector(`#self-mic`);
        this.selfCamButton = chatroomDiv.querySelector(`#self-cam`);
        this.selfExitButton = chatroomDiv.querySelector(`#self-exit`);
        this.setting = chatroomDiv.querySelector(`#setting`);

        this.settingButton.addEventListener(`click`, ()=>{
            this.showSetting();
        })
    }

    readonly pinSVG:string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
    <path d="M298.028 214.267L285.793 96H328c13.255 0 24-10.745 24-24V24c0-13.255-10.745-24-24-24
    H56C42.745 0 32 10.745 32 24v48c0 13.255 10.745 24 24 24h42.207L85.972 214.267
    C37.465 236.82 0 277.261 0 328c0 13.255 10.745 24 24 24h136v104.007c0 1.242.289 2.467.845 3.578
    l24 48c2.941 5.882 11.364 5.893 14.311 0l24-48a8.008 8.008 0 0 0 .845-3.578V352h136
    c13.255 0 24-10.745 24-24-.001-51.183-37.983-91.42-85.973-113.733z"></path>
    </svg>`;
    readonly unpinSVG:string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
	<path d="M426.03,215.27L413.79,97c20.81-1.83,65.68,9.56,66.21-24c-2.52-21.6,11.13-71.36-24-72c0,0-272,0-272,0
		c-35.08,0.58-21.51,50.45-24,72c0.63,33.58,45.17,22.16,66.21,24l-12.23,118.27C165.47,237.82,128,278.26,128,329
		c0,13.25,10.75,23.99,24,23.99h136v104.01c0,1.24,0.29,2.47,0.85,3.58l24,48c2.94,5.88,11.36,5.89,14.31,0l24-48
		c0.56-1.11,0.84-2.34,0.85-3.58V353h136c13.25,0,24-10.74,24-24C512,277.82,474.02,237.58,426.03,215.27z"/>
	<path d="M224.41,142.03c0,0-178.53-138-178.53-138C27.16-10.03,13.92,21.78,3.78,32.11c-5.42,6.97-4.17,17.02,2.81,22.45
		c0,0,588.36,454.73,588.36,454.73c18.71,14.07,31.97-17.76,42.1-28.08c5.41-6.97,4.16-17.02-2.82-22.45"/>
    </svg>`;
    readonly unmutedSVG:string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512">
    <path d="M336 192h-16c-8.84 0-16 7.16-16 16v48c0 74.8-64.49 134.82-140.79 127.38
    C96.71 376.89 48 317.11 48 250.3V208c0-8.84-7.16-16-16-16H16c-8.84 0-16 7.16-16 16
    v40.16c0 89.64 63.97 169.55 152 181.69V464H96c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16
    h160c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16h-56v-33.77C285.71 418.47 352 344.9 352 256
    v-48c0-8.84-7.16-16-16-16zM176 352c53.02 0 96-42.98 96-96h-85.33c-5.89 0-10.67-3.58-10.67-8
    v-16c0-4.42 4.78-8 10.67-8H272v-32h-85.33c-5.89 0-10.67-3.58-10.67-8v-16c0-4.42 4.78-8 10.67-8
    H272v-32h-85.33c-5.89 0-10.67-3.58-10.67-8v-16c0-4.42 4.78-8 10.67-8H272c0-53.02-42.98-96-96-96
    S80 42.98 80 96v160c0 53.02 42.98 96 96 96z"/>
    </svg>`;
    readonly mutedSVG:string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
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
    readonly camOnSVG:string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
    <path d="M336.2 64H47.8C21.4 64 0 85.4 0 111.8v288.4C0 426.6 21.4 448 47.8 448h288.4
    c26.4 0 47.8-21.4 47.8-47.8V111.8c0-26.4-21.4-47.8-47.8-47.8zm189.4 37.7L416 177.3v157.4l109.6 75.5
    c21.2 14.6 50.4-.3 50.4-25.8V127.5c0-25.4-29.1-40.4-50.4-25.8z"/></svg>`;
    readonly camOffSVG:string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640.41 512.62">
    <path d="m224.41,141.83L45.88,3.83C27.16-10.23,13.92,21.58,3.78,31.91c-5.42,6.97-4.17,17.02,2.81,22.45
    l588.36,454.73c18.71,14.07,31.97-17.76,42.1-28.08,5.41-6.97,4.16-17.02-2.82-22.45"/>
    <path d="m0,124.6v276.1c0,3.18.32,20.12,14,33.8,8.65,8.65,20.6,14,33.8,14h288.4
    c10.22-2.29,35.94-9.47,44.12-29.37m195.68-47.12v-243.71c0-25.4-29.1-40.4-50.4-25.8l-109.6,75.6
    v70.37m-32-24.93c0-37.08,0-74.16,0-111.24,0-3.18-.32-20.12-14-33.8-13.68-13.68-30.62-14-33.8-14-55.39,0-108.42-.84-157.51.13"/>
    </svg>`;
    readonly fullScreenSVG:string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
    <path d="M32 32C14.3 32 0 46.3 0 64v96c0 17.7 14.3 32 32 32s32-14.3 32-32V96h64
    c17.7 0 32-14.3 32-32s-14.3-32-32-32H32zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32
    v96c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H64V352zM320 32c-17.7 0-32 14.3-32 32
    s14.3 32 32 32h64v64c0 17.7 14.3 32 32 32s32-14.3 32-32V64c0-17.7-14.3-32-32-32H320zM448 352
    c0-17.7-14.3-32-32-32s-32 14.3-32 32v64H320c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32V352z"/>
    </svg>`;
    readonly browserScreenSVG:string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
    <path d="M160 64c0-17.7-14.3-32-32-32s-32 14.3-32 32v64H32c-17.7 0-32 14.3-32 32s14.3 32 32 32
    h96c17.7 0 32-14.3 32-32V64zM32 320c-17.7 0-32 14.3-32 32s14.3 32 32 32H96v64c0 17.7 14.3 32 32 32
    s32-14.3 32-32V352c0-17.7-14.3-32-32-32H32zM352 64c0-17.7-14.3-32-32-32s-32 14.3-32 32v96
    c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H352V64zM320 320c-17.7 0-32 14.3-32 32v96
    c0 17.7 14.3 32 32 32s32-14.3 32-32V384h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H320z"/>
    </svg>`;
    

    async start() {
        let permission = await this.getLocalStream(true);

        if(permission){
            
            setTimeout(()=>{this.showSetting();},1000);


        }else{
            let alert = new AlertBox(`You may not grant the access to audio and/or video device.`,`Media Access Permission`);
            alert.show();
        }

        
        
    }

    async showSetting(){
        let audioSelector = this.setting.querySelector(`#audio-selector`) as HTMLSelectElement;
        let videoSelector = this.setting.querySelector(`#video-selector`) as HTMLSelectElement;
        let applyButton = this.setting.querySelector(`#selector-apply`) as HTMLButtonElement;
        let cancelButton = this.setting.querySelector(`#selector-cancel`) as HTMLButtonElement;
        let cameras = await this.getConnectedDevices('videoinput');
        let mics = await this.getConnectedDevices('audioinput');
        
        this.activeVideo.srcObject = this.localStream;

        //clear options
        audioSelector.innerHTML =``;
        videoSelector.innerHTML =``;
        //Generate options
        if ((cameras.length == 1 && !cameras[0].label) || (mics.length == 1 && !mics[0].label)) {
            const title = `Media Device Issue`
            let message = ``;
            if(cameras.length == 1 && !cameras[0].label){
                message = `You may disable the access to camara for this website or you don't have any available camara. `
                let option = document.createElement(`option`);
                option.innerHTML = `No available camara`;
                videoSelector.add(option);
            }
            if(mics.length == 1 && !mics[0].label){
                message += `You may disable the access to microphone for this website or you don't have any available microphone.`
                let option = document.createElement(`option`);
                option.innerHTML = `No available microphone`;
                audioSelector.add(option);
            }
            const alert = new AlertBox(message,title);
            alert.show();

        } 

        if (cameras) {
            for (const cam of cameras) {
                if (cam.label) {
                    let option = document.createElement(`option`);
                    option.value = cam.deviceId;
                    option.innerHTML = cam.label;
                    videoSelector.add(option);
                }

            }
        }

        if(mics){
            for (const mic of mics) {
                if (mic.label) {
                    let option = document.createElement(`option`);
                    option.value = mic.deviceId;
                    option.innerHTML = mic.label;
                    audioSelector.add(option);
                }
            }
        }

        cancelButton.addEventListener(`click`,()=>{
            this.closeSetting();
        })

        this.setting.classList.remove(`dsp-none`);
        this.setting.classList.add(`dsp-flex`); 
    }

    closeSetting(){
        this.setting.classList.remove(`dsp-flex`);
        this.setting.classList.add(`dsp-none`);
    }

    async getConnectedDevices(type:MediaDeviceKind) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind === type)
    }
    
    
    





    /**
    * Asking the user a permission to turn on the local Camara and display on screen.
    * if permission is accepted,it will return ture;
    * if permission is denied, it will return false. 
    */
    async getLocalStream() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {'echoCancellation': true},  //Set false for single computer testing
                //peerIdentity: ``,
                //preferCurrentTab: true/false,
                video: true
            })

            this.activeVideo.srcObject = this.localStream;
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }

    }




    createPreview(id:string, videoSource:MediaStream){
        let previewDiv = document.createElement(`div`) as myDiv;
        previewDiv.my_relation = id;
        previewDiv.classList.add(`preview`);

        let controlsDiv = document.createElement(`div`);
        controlsDiv.classList.add(`controls`);
        let pinDiv = document.createElement(`div`);
        pinDiv.innerHTML = this.unpinSVG;
        let micDiv = document.createElement(`div`);
        micDiv.innerHTML = this.unmutedSVG;
        controlsDiv.append(pinDiv,micDiv);

        let videoCover = document.createElement(`div`);
        videoCover.classList.add(`video-cover`)

        let videoFrame = document.createElement(`video`);
        videoFrame.setAttribute(`autoplay`,``);
        videoFrame.setAttribute(`playsinline`,``);
        videoFrame.srcObject = videoSource;

        previewDiv.append(controlsDiv,videoCover,videoFrame)
        return previewDiv;
    }
}