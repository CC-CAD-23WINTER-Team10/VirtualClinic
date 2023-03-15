//@ts-ignore
import { User, Status, myDiv, } from "./Modules.js";
import { YesAlertBox } from "./AlertBox.js"
//@ts-ignore
import { Chatroom } from "./NewChatroom.js";
/* 
* Dashboard
*/
//@ts-ignore
const socket = io(`/`); //Connect with the server's socket io
var currentStatus: Status; //Own status
var chatroom: Chatroom;
var userArray: User[] = [];
var invitedUsers: User[] = []; //An array that stores users that the current user invited(so the call button will be disabled)
var detailClickListener = function (e: MouseEvent) {
    let target = e.target as HTMLElement;
    if (target.closest(`.person-detial`)) {
        //console.log(`YOU CLICK INSIDE THE PERSON DETAIL.`)
    } else {
        //console.log(`YOU CLICK OUTSIDE THE PERSON DETAIL.`)
        let element = document.querySelector(`.person-detial`) as myDiv;
        destroyDetailElement(element);
    }
}

/**
 * ICON SVG IMAGES
 */

var callSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<path d="M493.4 24.6l-104-24c-11.3-2.6-22.9 3.3-27.5 13.9l-48 112c-4.2 9.8-1.4 21.3 6.9 28
l60.6 49.6c-36 76.7-98.9 140.5-177.2 177.2l-49.6-60.6c-6.8-8.3-18.2-11.1-28-6.9l-112 48
C3.9 366.5-2 378.1.6 389.4l24 104C27.1 504.2 36.7 512 48 512
c256.1 0 464-207.5 464-464 0-11.2-7.7-20.9-18.6-23.4z"/>
</svg>`;

var inviteSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
<path d="M624 208h-64v-64c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v64h-64
c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h64v64c0 8.8 7.2 16 16 16h32
c8.8 0 16-7.2 16-16v-64h64c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm-400 48
c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32
h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4
V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"/>
</svg>`;
/**
 * UI MONITORING AND AUTO-RESIZE
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
let bodySizeObserver = new ResizeObserver(e => {
    //<body> height changes then the <main> height changes 
    const entry = e[0];
    const heightOfBody = entry.borderBoxSize[0].blockSize;
    const heightOfHeader = header?.offsetHeight;
    const heightOfFootet = footer?.offsetHeight;

    main!.style.height = (heightOfBody - (heightOfFootet ?? 0) - (heightOfHeader ?? 0)) + `px`;
})
let mainSizeObserver = new ResizeObserver((e) => {
    //<main> width changes then the #chatroom width changes
    const entry = e[0];
    const widthOfMain = entry.contentBoxSize[0].inlineSize;//width without padding and border
    const widthOfShrinkable = shrinkableBox.offsetWidth;
    const widthOFChatroom = widthOfMain - widthOfShrinkable - 10;
    chatroomDiv.style.width = widthOFChatroom + `px`;
})
let userListResizeObserver = new ResizeObserver(e => {
    //userlist resizes then check if it's overflow.
    //Overflow : give extra space(20px) for the Scroll Bar right to User Bottons(300px)
    //Not overflow: back to default.
    const userListEntry = e[0];
    const visiableHeight = userListEntry.borderBoxSize[0].blockSize;
    const fullHeight = userListEntry.target.scrollHeight;
    if (fullHeight > visiableHeight) {
        //Overflow!
        (userListEntry.target as HTMLDivElement).style.width = `320px`;
    }
    else {
        (userListEntry.target as HTMLDivElement).style.width = `auto`;
    }
})
let shrinkableResizeObserver = new ResizeObserver(e => {
    //shinkable box width changes then chatroom width changes
    const entry = e[0];
    const widthOfShrinkable = entry.borderBoxSize[0].inlineSize;
    const widthOfMain = main!.clientWidth - parseFloat(window.getComputedStyle(main!).paddingLeft) - parseFloat(window.getComputedStyle(main!).paddingRight);
    chatroomDiv.style.width = (widthOfMain - widthOfShrinkable - 10) + `px`;
})
let chatroomResizeObserver = new ResizeObserver(e => {
    //chatroom resizes then the content containers inside resizes
    const entry = e[0];
    previewContainerDiv.style.width = entry.contentBoxSize[0].inlineSize + `px`;
    activeSpeakerDiv.style.width = entry.contentBoxSize[0].inlineSize + `px`;
    activeSpeakerDiv.style.maxHeight = (entry.contentBoxSize[0].blockSize - previewContainerDiv.offsetHeight) + `px`;
    for (const child of activeSpeakerDiv.children) {
        (child as HTMLElement).style.maxHeight = activeSpeakerDiv.clientHeight + `px`;
        (child as HTMLElement).style.maxWidth = activeSpeakerDiv.clientWidth + `px`;
    }
})
let previewContainerResizeObserver = new ResizeObserver(e => {
    //when the container shows up/ disappears, the active spearker frame resizes (height)(including its children)
    const entry = e[0];

    const chatroomDivContentHeight = chatroomDiv.clientHeight - parseFloat(window.getComputedStyle(chatroomDiv!).paddingTop) - parseFloat(window.getComputedStyle(chatroomDiv!).paddingBottom);
    activeSpeakerDiv.style.maxHeight = (chatroomDivContentHeight - entry.borderBoxSize[0].blockSize - 2) + `px`; //gap = 2px
    for (const child of activeSpeakerDiv.children) {
        (child as HTMLElement).style.maxHeight = `inherit`;
    }
})
bodySizeObserver.observe(body);
mainSizeObserver.observe(main!);
chatroomResizeObserver.observe(chatroomDiv);
userListResizeObserver.observe(userList);
shrinkableResizeObserver.observe(shrinkableBox);
previewContainerResizeObserver.observe(previewContainerDiv);
/**
 * END OF UI MONITORING AND AUTO-RESIZE
 */


/**
 * Create a Div that contains user protrait, name, and status bar.
 * @param user the user.
 * @returns Return the Div created.
 */
function createUserElement(user: User) {
    let imgFile = user.img;
    let name = user.firstName + ` ` + user.lastName;
    let status = user.status;


    let userDiv = document.createElement(`div`);
    userDiv.classList.add(`user`);


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
function createDetailElement(user: User) {
    //fetch the user's info
    let _id = user._id;
    let name = user.firstName + ` ` + user.lastName;
    let title = user.title;
    let department = user.department;
    let img = user.img;
    let status = user.status;

    //create HTML elements according to the prototype
    //console.log(`CREATING A DETAIL ELEMENT.`);
    let detailDiv = document.createElement(`div`) as myDiv;
    detailDiv.classList.add(`person-detial`);
    detailDiv.my_relation = _id;

    let upperSection = document.createElement(`div`);
    let iconDiv = document.createElement(`div`);
    let textSection = document.createElement(`div`);
    let nameDiv = document.createElement(`div`);
    let titleDiv = document.createElement(`div`);
    let departmentDiv = document.createElement(`div`);
    let statusDiv = document.createElement(`div`);
    let statusIcon = document.createElement(`div`);
    let statusText = document.createElement(`div`);

    nameDiv.innerHTML = name;
    titleDiv.innerHTML = `Title: ` + title;
    departmentDiv.innerHTML = `Department: ` + department;
    statusIcon.style.backgroundColor = status;
    statusIcon.id = `statusIcon`;
    statusText.id = `statusText`;
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

    statusDiv.append(statusIcon, statusText);

    textSection.append(nameDiv, titleDiv, departmentDiv, statusDiv);

    iconDiv.style.backgroundImage = `url(images/protraits/${img})`;

    upperSection.append(iconDiv, textSection);

    let lowerSection = document.createElement(`div`);
    let callButton = document.createElement(`button`);
    setCallButton(user, callButton);
    lowerSection.append(callButton);

    detailDiv.append(upperSection, lowerSection)
    //console.log(`CREATED A DETAIL ELEMENT.`);

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

/**
 * Set the call button UI according to the users' status
 * @param user the remote user whose detail you are looking at
 * @param callButton the call button in the detail section
 */
function setCallButton(user: User, callButton: HTMLButtonElement) {
    //fetch the remote user's info
    let status = user.status;
    let _id = user._id;
    let name = user.firstName + ` ` + user.lastName;
    let title = user.title;

    //preset or reset the call button UI
    callButton.innerHTML = callSVG;
    callButton.title = `Call`;
    callButton.disabled = false;

    //If the local user is in a meeting, then change the UI to INVITE-ICON
    if (currentStatus == Status.Busy) {
        callButton.innerHTML = inviteSVG;
        callButton.title = `Invite`;
    }

    //If the remote user is who you'r calling, disable the button
    if (invitedUsers.find(u => u == user)) {
        callButton.disabled = true;
        callButton.title = `You cannot call a person who is being called or invited.`;
    }

    //If the remote user is not available, disable the button
    if (status != Status.Available) {
        callButton.disabled = true;
        callButton.title = `You cannot call a person who is not available.`;
    } else {
        //If the remote user is available, set the click event
        callButton.onclick = function (e) {
            //After you click the call button, a full screen alert shows up to confirm the call.
            //Set the message in the alert
            let message = `Are you sure to invite ${title} ${name}?`;
            if (currentStatus != Status.Busy) {
                message = `Are you sure to call ${title} ${name}?`;
            }
            //Set the event for the Yes Button in the alert
            let yesListener = function (ev: MouseEvent) {
                //console.log(`You Click Yes!!`);
                //Only if the user is in a meeting, the user's status will be Busy.
                //If not, means the user is not in a meeting, then it should start from the entry point
                if (currentStatus != Status.Busy) {

                    currentStatus = Status.Busy;//change the local user's status
                    socket.emit(`Status Change`, Status.Busy);//notify server the new status

                    showChatroom();
                    //Create a Chatroom Object to manage the Peer Connection and the UI change in chatroom Div.
                    chatroom = new Chatroom(socket, chatroomDiv);
                    chatroom.start();//Chatroom start point
                }


                invitedUsers.push(user);//Add the called user into this array for reference(UI dependency)
                socket.emit(`invite`, _id);//Send invitation via server

            }
            //End of Set the event for the Yes Button in the alert

            //create the alert and show
            let alert = new YesAlertBox(message, yesListener);
            alert.show();
        }
    }

}


function showChatroom() {
    shrinkableBox.classList.remove(`shrinkable-box`);
    shrinkableBox.classList.add(`shrinkable-box-collaspe`);
    chatroomDiv.classList.remove(`dsp-none`);
    chatroomDiv.classList.add(`dsp-flex`);
}

function hidechatroom() {
    chatroomDiv.classList.remove(`dsp-flex`);
    chatroomDiv.classList.add(`dsp-none`);
    shrinkableBox.classList.remove(`shrinkable-box-collaspe`);
    shrinkableBox.classList.add(`shrinkable-box`);
}

/**
 * Socket.on
 */
socket.on("connect", () => {
    console.log(`CONNECTED WITH SERVER. YOUR ID: `, socket.id);
    const username = (document.querySelector(`#username`) as HTMLInputElement).value;
    //tell the server who I'm(username) with that socketID to update the user info
    socket.emit(`Hi`, username, currentStatus ?? Status.Available);
});

socket.on("disconnect", () => {
    console.log(`DISCONNECTED WITH SERVER.`);
});


socket.on(`new user list`, (users: Array<User>) => {
    userArray = users.filter(u => u.lastSocketID != socket.id);//Remove the current user from the array.
    //console.log(users);
    userList.innerHTML = ``;//clear the user list

    userArray.forEach(u => {//generate the user list items

        let fullName = u.firstName + ` ` + u.lastName;
        let userDiv = createUserElement(u);

        userDiv.addEventListener(`click`, (e) => {//Add click event to each user list item
            let div = e.target as myDiv;
            if (div.my_relation == undefined) {
                div = div.parentElement as myDiv;
            }

            //When the user click the user list item, related detail will show up
            let detail = createDetailElement(u);
            shrinkableBox.append(detail);

            setTimeout(() => {
                //when the user click outside of the detail section, the detail section will go away
                document.addEventListener(`click`, detailClickListener)
            }, 10);

        })

        userList.append(userDiv);

    });


    //Check if Detail section is opened
    let detailDiv = shrinkableBox.querySelector(`.person-detial`) as myDiv;
    if (detailDiv) {
        //if detailDiv exists, refresh the status and its text
        //And according to the status of that user, to determine if the call button need to be disabled
        let statusIcon = detailDiv.querySelector(`#statusIcon`) as myDiv;
        let statusText = detailDiv.querySelector(`#statusText`) as myDiv;
        let callButton = detailDiv.querySelector(`button`);
        console.log(callButton);
        console.log(detailDiv.my_relation);
        const detailOwnerID = detailDiv.my_relation;

        //Check if the detail section Owner is still online(active user on server-side)
        //they may be offline, after the detail section creation
        //If they are online, refresh the related UI accordingly,
        //If not diable the call button and change status to offline
        const owner = userArray.find(u => u._id == detailOwnerID);

        if (owner) {
            //Online
            setCallButton(owner, callButton);
            statusIcon.style.backgroundColor = owner.status;
            switch (owner.status) {
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

        } else {
            //Offline
            statusIcon.style.backgroundColor = Status.Offline;
            callButton.title = `You cannot call a person who is not available.`;
            callButton.disabled = true;
        }

    }

})

//Get a call
socket.on("invitation from", (_id: string, name: string) => {
    console.log(`GET A CALL FROM ${name}.`);
    //set message, yes button event, and dismiss butoon event in a full screen alert
    let message = `${name} invites you to a meeting. Do you want to accept?`
    let yesButtonEvent = () => {
        currentStatus = Status.Busy;//change the local user's status
        socket.emit(`Status Change`, Status.Busy);//notify server the new status

        showChatroom();
        //Create a Chatroom Object to manage the Peer Connection and the UI change in chatroom Div.
        chatroom = new Chatroom(socket, chatroomDiv);
        chatroom.start();//Chatroom start point


        const user = userArray.find(u => u._id == _id);
        invitedUsers.push(user);//Add the called user into this array for reference(UI dependency)
        socket.emit(`accept invitation from`, _id);//Send accept via server
        console.log(`You accept a call from ${name}`)
    }
    let rejected = false;
    let newFullScreenAlert = new YesAlertBox(message, yesButtonEvent);
    newFullScreenAlert.dismissButton.addEventListener(`click`, () => {
        socket.emit(`reject invitation from`, _id);
        rejected = true;
    });
    newFullScreenAlert.show();

    console.log(`Waiting for your response.`);

    //After 30s, reject automatically and close the alert.
    setTimeout(() => {
        newFullScreenAlert.close();
        if (!rejected) {
            socket.emit(`reject invitation from`, _id);
        }
    }, 1000 * 30)
})
