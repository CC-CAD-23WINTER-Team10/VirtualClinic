
/**
 * Full Screen Alert
 */
export class AlertBox{
    box :HTMLDivElement = document.createElement(`div`);
    titleDiv: HTMLDivElement = document.createElement(`div`);
    messageDiv: HTMLDivElement = document.createElement(`div`);
    buttonDiv: HTMLDivElement = document.createElement(`div`);
    dismissButton: HTMLButtonElement = document.createElement(`button`);

    /**
     * Create A full screen alert that has a message and a dismiss button.
     * @param message 
     */
    constructor(message:string);
    /**
     * Create A full screen alert that has a title, a message ,and a dismiss button.
     * @param message 
     * @param title 
     */
    constructor(title:string, message:string);
    /**
     * Create A full screen alert that has a title, a message ,and a dismiss button.
     * And it allows customised buttons using{text:``,clickListener: e=>{}}
     * where text is the text shown in the button, clickListener is the callback function after a click
     * on the button.
     * @param message 
     * @param title 
     * @param buttons 
     */
    constructor(message:string,title?:string,...buttons:AlertButton[]);
    constructor(message:string,title?:string,...buttons:AlertButton[]){
        
        this.box.classList.add(`box`,`alert`);

        this.titleDiv.classList.add(`alert-title`);
        this.titleDiv.innerHTML = title?? ``;
        this.box.append(this.titleDiv);

        this.messageDiv.classList.add(`alert-message`);
        this.messageDiv.innerHTML = message;
        this.box.append(this.messageDiv);

        this.buttonDiv.classList.add(`alert-buttons`);
        this.box.append(this.buttonDiv);

        if(buttons){
            for (const button of buttons) {
                let newButton = document.createElement(`button`);
                newButton.innerHTML = button.text;
                newButton.onclick = button.clickListener;
                newButton.addEventListener(`click`,e=>{this.close()});
                this.buttonDiv.append(newButton);
            }
        }

        this.dismissButton.innerHTML = `Dismiss`;
        this.dismissButton.addEventListener(`click`, e=>{
            this.close();
        })

        this.buttonDiv.append(this.dismissButton);

    }
    /*
    html: string = `    
    <div class="box alert">
        <div class="alert-title">
            Lorem ipsum dolor
        </div>
        <div class="alert-message">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi quia repellat magni repudiandae vel recusandae possimus itaque aperiam velit temporibus? Deleniti tempora porro libero minima veritatis. Consequatur unde ab deleniti expedita vel, esse laborum aperiam fugiat quae, consectetur suscipit ullam, est ea optio nemo nulla maiores fugit corrupti quaerat repellendus.
        </div>
        <div class="alert-buttons">
            <button>Yes</button>
            <button>Dismiss</button>
        </div>
    </div>`;
    */
    show(){
        document.body.append(this.box);
    }

    close(){
        this.box.parentElement?.removeChild(this.box);
    }
   
    

}


/**
 * Button in the full screen alert
 */
interface AlertButton {
    text:string;
    clickListener: (this: GlobalEventHandlers, ev: HTMLElementEventMap[`click`]) => any;
}


/**
 * Full screen alert with a default Yes Button
 */
export class YesAlertBox extends AlertBox {

    constructor(message:string,yesButtonListener:((this: GlobalEventHandlers, ev: HTMLElementEventMap[`click`]) => any),title?:string){
        super(message,title,{text:`Yes`,clickListener:yesButtonListener});
    }

}
