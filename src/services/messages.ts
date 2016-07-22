
// Placeholder for i18n externalization.
const messages = {
    "app.title":"Grid Command V2",

    "router.nav.login":"Login",
    "router.nav.login2":"Confirm Login",
    "router.nav.community":"Community",
    "router.nav.alerts":"Alerts",
    "router.nav.tracker":"Tracker",
    "router.nav.conversations":"Conversations",

    "login.heading":"BlueLine Grid Command 2.0",
    "login.username":"Username",
    "login.password":"Password",
    "login.submit":"Log In",
    "login.confirm":"Confirm",
    "login.login2.text1":"You will receive a confirmation code by text message or email.",
    "login.login2.text2":"When you receive the code, please enter it below.",
    "login.login2.confCode":"Confirmation code"
};

export class Messages {  

    // Service object for maintaining application message strings.
    

    constructor(){
    }
    
    getMessage(messageKey: string) {
        return messages[messageKey];
    }
}


