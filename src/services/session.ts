export class Session {  
    auth: Object;
 
    constructor(){
        this.auth = {};
    }

    getRole(): string {
        // FIXME: temp hard-coded role.
        return 'admin';
        // FIXME: temp hard-coded role.
    }
}