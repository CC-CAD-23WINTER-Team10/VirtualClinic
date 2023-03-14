/**
 * Login Page 
 */
//@ts-ignore
var loginForm = document.getElementById(`loginForm`) as HTMLFormElement;
var submitButton = document.getElementById(`submit`) as HTMLAnchorElement;

submitButton.onclick = function() {
    console.log(`SUBMIT BUTTON IS CLICKED.`);
    loginForm.submit();
};