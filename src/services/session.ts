import {inject, LogManager} from 'aurelia-framework';
import {WebSocketService} from './wsService';
import {Logger} from 'aurelia-logging';

@inject(WebSocketService, LogManager)
export class Session {  
    auth: AuthResource;
    configured: Promise<any>;
    notificationStatus: any = {};

    logger: Logger;
 
    constructor(private wsService: WebSocketService){
        this.auth = new AuthResource();
        this.logger = LogManager.getLogger(this.constructor.name);
        this.logger.debug("Session created.");
    }

    getRole(): string {
        // FIXME: temp hard-coded role.
        return 'admin';
        // FIXME: temp hard-coded role.
    }

    get unreadAlertCount() {
        return this.notificationStatus.UNREAD;
    }
}

export class AuthResource {

    member: any;
    organization: any;
    access_token: string;
    refresh_token: string;
    mfa: any;
    expires_in: number;
    isLoggedIn: boolean;
}