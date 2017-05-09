import {inject, LogManager} from 'aurelia-framework';
import {WebSocketService} from './wsService';
import {Logger} from 'aurelia-logging';

@inject(WebSocketService, LogManager)
export class Session {  
    auth: Object;
    configured: Promise<any>;
    wsConnection: any;
    wsSubscriptions: Array<Function>;
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

    startWsConnection() {
        let me = this;
        let stompClientPromise = this.wsService.openWsConnection(me.auth['access_token']);
        stompClientPromise.then(function(connectResult) {
            let stompClient = connectResult.client;
            me.addSubscriptions(stompClient);
            this.wsConnection = stompClient;
        }).catch(function(error) {
            me.logger.debug("Error connecting to Stomp: " + error);
        });
    }

    addSubscriptions(stompClient) {
        let me = this;
        let alertSub = stompClient.subscribe('/exchange/member.notification.alert/' + me.auth['member'].memberId, function(message) {
            me.wsService.handleWsMessage(message);
            me.logger.debug("Got WS alert message: " + message.body);
        });
        me.wsSubscriptions.push(alertSub);
        me.logger.debug("Added sub: " + alertSub);
    }

    removeSubscriptions() {
        let sub:any;
        for(sub of this.wsSubscriptions) {
            sub.unsubscribe();
        }
    }

    get unreadAlertCount() {
        return this.notificationStatus.UNREAD;
    }
}