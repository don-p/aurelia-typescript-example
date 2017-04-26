export class Session {  
    auth: Object;
    configured: Promise<any>;
 
    constructor(){
        this.auth = {};
    }

    getRole(): string {
        // FIXME: temp hard-coded role.
        return 'admin';
        // FIXME: temp hard-coded role.
    }
}