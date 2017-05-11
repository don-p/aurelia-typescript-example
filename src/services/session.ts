import {inject, LogManager} from 'aurelia-framework';
import {WebSocketService} from './wsService';
import {Logger} from 'aurelia-logging';

@inject(WebSocketService, LogManager)
export class Session {  
    auth: Object;
    configured: Promise<any>;
    notificationStatus: any = {};

    logger: Logger;
 
    constructor(private wsService: WebSocketService){
        this.auth = {};
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