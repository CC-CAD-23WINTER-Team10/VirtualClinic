

/* Setting Variables */
let APP_ID = "dd8d8348fdce44e2803884c659caa555" //from project ID in augora --it have to be updated to token autentication: check other videos

let token = null;
let uid = String(Math.floor(Math.random()*10000)) // every user have a kind of unique ID

let client;  // var for client object
let channel; // var for a channel use by users

//variables for getting chat invitation code -Room ID
let queryString = window.location.search
let urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')

if(!roomId){
    window.location = 'lobby.html'
}

let localStream; //local video and audio data
let remoteStream; //remote video and audio data
let peerConnection; //storage the information between us and the remote user 

const servers = {
    iceServers:[
        { //creating and object here for my stuns servers
            urls:['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
        }
    ]
}

//function that starts everything up - ask for permition for using camerra and microphone
let init = async () => {
    client = await AgoraRTM.createInstance(APP_ID)  //create client boject: createIntance is a method of Augora -check documentation
    await client.login({uid, token}) // token is for now a null value

    // index.html?room=234234  -- the way needs to be in the future
    channel = client.createChannel(roomId) // create a channel this is initially named main...but then would be smth like RoomID
    await channel.join()  //another user can then join the channel...

    channel.on('MemberJoined', handleUserJoined) //when a user join the channel we let it know it is conected
    channel.on('MemberLeft', handleUserLeft) //when peer user left the video call

    //to listen from peer and response
    client.on('MessageFromPeer', handlerMessageFromPeer)

    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false}) //initial set to false to avoid the echo efect
    document.getElementById("user-1").srcObject = localStream; //sent video and auidio data to the video layout

    // createOffer() //this is call as soon the page initiates
}

//fucntion to hide window cam once user left
let handleUserLeft = (MemberId) => {
    document.getElementById('user-2').style.display = 'none'
}

// method to respond to the peer invitation message
let handlerMessageFromPeer = async (message, MemberId) => {

    message = JSON.parse(message.text) //getting the invitation message from the peer
   // console.log('Message: ', message)

   //Lets ask a few questions
   if(message.type === 'offer'){
        createAnswer(MemberId, message.offer) 
   }

   if(message.type === 'answer'){
        addAnswer(message.answer) 
    }

    if(message.type === 'candidate'){
        if(peerConnection){
            peerConnection.addIceCandidate(message.candidate)
        } 
    }
}

// method to informed new user has join to the channel
let handleUserJoined = async (MemberId) => {  
    console.log('A new user joined the channel: ', MemberId) // when join method is executed it will have a new user to sow up
    createOffer(MemberId) //to send invitation to new user to join chat
}

let createPeerConnection = async (MemberId) =>{
    peerConnection = new RTCPeerConnection(servers)
    
    remoteStream = new MediaStream()
    document.getElementById("user-2").srcObject = remoteStream

    //creating window cam for 2nd peer user
    document.getElementById('user-2').style.display = 'block' 

    //everytime we move the create offer funtion into handler user join for some reason the local stream doen't get creates right away if the page is refreshed too fast. so...
    if(!localStream){
        localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false}) //initial set to false to avoid the echo efect
        document.getElementById("user-1").srcObject = localStream; //sent video and auidio data to the video layout
    }

    //getting the local stream and passing to the connection
    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async (event) => {
        if(event.candidate){
            //console.log('New ICE candidate:', event.candidate)
            client.sendMessageToPeer({text:JSON.stringify({'type':'candidate','candidate':event.candidate})}, MemberId)  //send the ICE candidates as this are generating -ICE x 3 messages
        }
    }
}

//start the process of conecting to peers
let createOffer = async (MemberId) => {
    //Calling create peer connection
    await createPeerConnection(MemberId)

    //agora to crate the SDKs
    let offer = await peerConnection.createOffer() //each peer conection have an offer and an answer
    await peerConnection.setLocalDescription(offer)

    //client.sendMessageToPeer({text: 'Hey!!!'}, MemberId) //send invitation text to user --for testing
    client.sendMessageToPeer({text:JSON.stringify({'type':'offer','offer':offer})}, MemberId)  //send the invitation data to the Peer User

    //console.log('Offer: ', offer)
}

let createAnswer = async (MemberId, offer) => {
    // calling create peer connection
    await createPeerConnection(MemberId)

    await peerConnection.setRemoteDescription(offer)

    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    client.sendMessageToPeer({text:JSON.stringify({'type':'answer','answer':answer})}, MemberId)  //send the invitation data to the Peer User
}

//The peer that initiates the offer are going to get back the answer and need to process this
let addAnswer = async (answer) => {
    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer)        
    }
}

//function to determine when user have left the room for a certain time and gets automatically logout
let leaveChannel = async () => {
    await channel.leave()
    await client.logout()
}

//user dont usually press a button to leave the channel so...when it close windows it will leaves the channel too
window.addEventListener('beforeunload', leaveChannel)

init()

