/**
 * Login Page 
 */
//@ts-ignore
const socket = io(`/`);
var loginForm = document.getElementById(`loginForm`) as HTMLFormElement;
var submitButton = document.getElementById(`submit`) as HTMLAnchorElement;

submitButton.onclick = function() {
    console.log(`SUBMIT BUTTON IS CLICKED.`);
    loginForm.submit();
};





/**
 * Socket.on
 */
socket.on("connect", () => {
    console.log(`CONNECTED WITH SERVER. YOUR ID: `, socket.id);
});
socket.on("disconnect", () => {
    console.log(`DISCONNECTED WITH SERVER.`);
});