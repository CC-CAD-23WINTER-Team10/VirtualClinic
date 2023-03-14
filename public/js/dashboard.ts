//@ts-ignore
import { User, Status, myDiv,  } from "./Modules.js";
import { YesAlertBox } from "./AlertBox.js"
//@ts-ignore
import { Chatroom } from "./NewChatroom.js";
/* 
* Dashboard
*/
//@ts-ignore
const socket = io(`/`);
var currentStatus: Status;
var users: User[] = [];
var chatroom:Chatroom;
var invitedUsers:User[] = [];
var detailClickListener = function (e: MouseEvent) {
    let target = e.target as HTMLElement;
    if (target.closest(`.person-detial`)) {
        console.log(`YOU CLICK INSIDE THE PERSON DETAIL.`)
    } else {
        console.log(`YOU CLICK OUTSIDE THE PERSON DETAIL.`)
        let element = document.querySelector(`.person-detial`) as myDiv;
        destroyDetailElement(element);
    }
}


/**
 * UI MONITORING AND CHANGING
 */

//Elements
let body = document.body;
let header = document.querySelector(`header`);
let footer = document.querySelector(`footer`);
let main = document.querySelector(`main`);
var userList = document.querySelector(`#user-list`) as HTMLDivElement;
let chatroomDiv = document.querySelector(`#chatroom`) as HTMLDivElement;
let previewContainerDiv = chatroomDiv.querySelector(`.preview-container`) as HTMLDivElement;
let activeSpeakerDiv = chatroomDiv.querySelector(`.active-speaker`) as myDiv;
let shrinkableBox = document.querySelector(`#shrinkable-box`) as HTMLDivElement;
let shrinkableBoxFlexContent = shrinkableBox.querySelector(`div`) as HTMLDivElement;
let expensionButton = shrinkableBox.querySelector(`.expension-button`) as HTMLButtonElement;

//SizeObservers
let bodySizeObserver = new ResizeObserver(e=>{
    //<body> height changes then the <main> height changes 
    const entry = e[0];
    const heightOfBody = entry.borderBoxSize[0].blockSize;
    const heightOfHeader = header?.offsetHeight;
    const heightOfFootet = footer?.offsetHeight;

    main!.style.height = (heightOfBody-(heightOfFootet?? 0) -(heightOfHeader?? 0)) + `px`;
})
let mainSizeObserver = new ResizeObserver((e) => {
    //<main> width changes then the #chatroom width changes
    const entry = e[0];
    const widthOfMain = entry.contentBoxSize[0].inlineSize;//width without padding and border
    const widthOfShrinkable = shrinkableBox.offsetWidth;
    const widthOFChatroom = widthOfMain - widthOfShrinkable - 10;
    chatroomDiv.style.width = widthOFChatroom + `px`;
})
let userListResizeObserver = new ResizeObserver(e=>{
    //userlist resizes then check if it's overflow.
    //Overflow : give extra space(20px) for the Scroll Bar right to User Bottons(300px)
    //Not overflow: back to default.
    const userListEntry = e[0];
    const visiableHeight = userListEntry.borderBoxSize[0].blockSize;
    const fullHeight = userListEntry.target.scrollHeight;
    if(fullHeight > visiableHeight ){
        //Overflow!
        (userListEntry.target as HTMLDivElement).style.width = `320px`;
    }
    else {
        (userListEntry.target as HTMLDivElement).style.width = `auto`;
    }
})
let shrinkableResizeObserver = new ResizeObserver(e=>{
    //shinkable box width changes then chatroom width changes
    const entry = e[0];
    const widthOfShrinkable = entry.borderBoxSize[0].inlineSize;
    const widthOfMain = main!.clientWidth - parseFloat(window.getComputedStyle(main!).paddingLeft) - parseFloat(window.getComputedStyle(main!).paddingRight);
    chatroomDiv.style.width = (widthOfMain - widthOfShrinkable - 10) + `px`;
})
let chatroomResizeObserver = new ResizeObserver(e=>{
    //chatroom resizes then the content containers inside resizes
    const entry = e[0];
    previewContainerDiv.style.width = entry.contentBoxSize[0].inlineSize + `px`;
    activeSpeakerDiv.style.width = entry.contentBoxSize[0].inlineSize + `px`;
    activeSpeakerDiv.style.maxHeight = (entry.contentBoxSize[0].blockSize - previewContainerDiv.offsetHeight) + `px`;
    for (const child of activeSpeakerDiv.children){
        (child as HTMLElement).style.height = activeSpeakerDiv.clientHeight + `px`;
        (child as HTMLElement).style.maxWidth = activeSpeakerDiv.clientWidth + `px`;
    }
})
bodySizeObserver.observe(body);
mainSizeObserver.observe(main!);
chatroomResizeObserver.observe(chatroomDiv);
userListResizeObserver.observe(userList);
shrinkableResizeObserver.observe(shrinkableBox);

/**
 * Create a Div that contains user protrait, name, and status bar.
 * @param id The id of the user.
 * @param imgFile The file name and extension of the protrait.
 * @param name The Name of the user.
 * @param status The status(Colour) of the user.
 * @returns Return the Div created.
 */
function createUserElement(id: string, imgFile: string, name: string, status: Status) {

    let userDiv = document.createElement(`div`) as myDiv;
    userDiv.classList.add(`user`);
    userDiv.my_relation = id;

    let iconDiv = document.createElement(`div`);
    iconDiv.style.backgroundImage = `url(images/protraits/${imgFile})`;
    userDiv.append(iconDiv);

    let nameDiv = document.createElement(`div`);
    nameDiv.innerHTML = name;
    userDiv.append(nameDiv);

    let statusDiv = document.createElement(`div`);
    statusDiv.style.backgroundColor = status;
    userDiv.append(statusDiv);

    return userDiv;
}


/**
 * Create a Div that contains user protrait, 
 * personal details, and status bar with call button.
 * @param id 
 * @param name 
 * @param title 
 * @param department 
 * @param img 
 * @param status 
 * @returns 
 */
function createDetailElement(user:User) {
    let id= user.lastSocketID; 
    let name = user.firstName + ` ` + user.lastName;
    let title = user.title; 
    let department = user.department;
    let img = user.img;
    let status = user.status;


    console.log(`CREATING A DETAIL ELEMENT.`);
    let detailDiv = document.createElement(`div`) as myDiv;
    detailDiv.classList.add(`person-detial`);
    detailDiv.my_relation = id;

    let upperSection = document.createElement(`div`);
    let iconDiv = document.createElement(`div`);
    let textSection = document.createElement(`div`);
    let nameDiv = document.createElement(`div`);
    let titleDiv = document.createElement(`div`);
    let departmentDiv = document.createElement(`div`);
    let statusDiv = document.createElement(`div`);
    let statusIcon = document.createElement(`div`) as myDiv;
    let statusText = document.createElement(`div`) as myDiv;

    nameDiv.innerHTML = name;
    titleDiv.innerHTML = `Title: ` + title;
    departmentDiv.innerHTML = `Department: ` + department;
    statusIcon.style.backgroundColor = status;
    statusIcon.id = `statusIcon`;
    statusIcon.my_relation = id;
    statusText.id = `statusText`;
    statusText.my_relation = id;
    switch (status) {
        case Status.Available:
            statusText.innerHTML = `Available`;
            break;
        case Status.Busy:
            statusText.innerHTML = `Busy`;
            break;
        case Status.Leave:
            statusText.innerHTML = `Leave`;
            break;
        default:
            statusText.innerHTML = `Offline`;
            break;
    }
    
    statusDiv.append(statusIcon,statusText);

    textSection.append(nameDiv, titleDiv, departmentDiv,statusDiv);

    iconDiv.style.backgroundImage = `url(images/protraits/${img})`;

    upperSection.append(iconDiv, textSection);

    let lowerSection = document.createElement(`div`);
    let callButton = document.createElement(`button`);
    callButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <path d="M493.4 24.6l-104-24c-11.3-2.6-22.9 3.3-27.5 13.9l-48 112c-4.2 9.8-1.4 21.3 6.9 28
    l60.6 49.6c-36 76.7-98.9 140.5-177.2 177.2l-49.6-60.6c-6.8-8.3-18.2-11.1-28-6.9l-112 48
    C3.9 366.5-2 378.1.6 389.4l24 104C27.1 504.2 36.7 512 48 512
    c256.1 0 464-207.5 464-464 0-11.2-7.7-20.9-18.6-23.4z"/>
    </svg>`;
    callButton.title = `Call`;
    if(currentStatus == Status.Busy){
        callButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
        <path d="M624 208h-64v-64c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v64h-64
        c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h64v64c0 8.8 7.2 16 16 16h32
        c8.8 0 16-7.2 16-16v-64h64c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm-400 48
        c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32
        h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4
        V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"/>
        </svg>`; 
        callButton.title = `Invite`;
    }

    if(invitedUsers.find(u => u==user )){
        callButton.disabled = true;
        callButton.title = `You cannot call a person who is being called or invited.`
    }

    if(status != Status.Available){
        callButton.disabled = true;
        callButton.title = `You cannot call a person who is not available.`
    }else{
        
        callButton.onclick = function (e) {
            let message = `Are you sure to invite ${title} ${name}?`;
            if(currentStatus != Status.Busy){
                message = `Are you sure to call ${title} ${name}?`;
            }

            let yesListener = function (ev:MouseEvent){
                console.log(`You Click Yes!!`);
                
                if(currentStatus != Status.Busy){
                    currentStatus = Status.Busy;
                    socket.emit(`Status Change`,Status.Busy);
                    shrinkableBox.classList.remove(`shrinkable-box`);
                    shrinkableBox.classList.add(`shrinkable-box-collaspe`);
                    showChatroom();
                    chatroom = new Chatroom(socket,chatroomDiv);
                    chatroom.start();
                }
                invitedUsers.push(user);
                socket.emit(`invite`,id);
                
            }


            let alert = new YesAlertBox(message,yesListener);
            alert.show();
        }
    }




    lowerSection.append(callButton);

    detailDiv.append(upperSection, lowerSection)
    console.log(`CREATED A DETAIL ELEMENT.`);

    return detailDiv;
}


/**
 * Remove the detail Div from its container.
 * @param element the detail Div.
 */
function destroyDetailElement(element: myDiv) {
    document.removeEventListener(`click`, detailClickListener)
    element.parentElement?.removeChild(element);
}


function showChatroom() {
    chatroomDiv.classList.remove(`dsp-none`);
    chatroomDiv.classList.add(`dsp-flex`);
}

function hidechatroom() {
    chatroomDiv.classList.remove(`dsp-flex`);
    chatroomDiv.classList.add(`dsp-none`);
}

/**
 * Socket.on
 */
socket.on("connect", () => {
    console.log(`CONNECTED WITH SERVER. YOUR ID: `, socket.id);
    const username = (document.querySelector(`#username`) as HTMLInputElement).value;
    socket.emit(`Hi`, username);//tell the server who I'm(username) with that socketID to update the user info
});

socket.on("disconnect", () => {
    console.log(`DISCONNECTED WITH SERVER.`);
});


socket.on(`new user list`,(users:Array<User>)=>{
    users = users.filter(u=> u.lastSocketID != socket.id);//Remove the current user from the array.
    //console.log(users);
    userList.innerHTML = ``;

    users.forEach(u => {

        let fullName = u.firstName + ` ` + u.lastName;
        let userDiv = createUserElement(u.lastSocketID, u.img, fullName, u.status);
    
        userDiv.addEventListener(`click`, (e) => {
            let div = e.target as myDiv;
            if (div.my_relation == undefined) {
                div = div.parentElement as myDiv;
            }
    
            let detail = createDetailElement(u);
            shrinkableBox.append(detail);
    
            setTimeout(() => {
                document.addEventListener(`click`, detailClickListener)
            }, 10);
    
        })
    
        userList.append(userDiv);
    
    });

})

socket.on("new call from",(remoteID:string, name: string)=>{
    console.log(`GET A CALL FROM ${remoteID}.`);
    let message = `${name} is calling you. Do you want to accept?`
    let yesButtonEvent = ()=>{

    }
    //let newFullScreenAlert = new YesAlertBox()
})
