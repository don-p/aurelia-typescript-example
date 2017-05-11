import {inject, LogManager} from 'aurelia-framework';
import {AureliaConfiguration} from 'aurelia-configuration';
import * as Stomp from 'webstomp-client';
import {ConnectionHeaders} from 'webstomp-client';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Logger} from 'aurelia-logging';

@inject(AureliaConfiguration, EventAggregator, LogManager)
export class WebSocketService {  

    logger: Logger;
    wsProtocol: string;

    // Service object for application utilities.
    constructor(private appConfig: AureliaConfiguration, private evt: EventAggregator){
        this.logger = LogManager.getLogger(this.constructor.name);

        this.wsProtocol = 'wss';
        if('%LOCAL_ENVIRONMENT%') {
            this.wsProtocol = 'ws';
        }
    }

    openWsConnection(token): Promise<any> {

        let me = this;

        let wsHeartbeatInterval = this.appConfig.get('api.wsHeartbeatInterval');
        let promise = new Promise((resolve, reject) => {
            let wsUrl = this.wsProtocol + '://' + window.location.host + '/blgws/websocket?token=';
            let url = wsUrl + token;
            let ws = new WebSocket(url);
            let options:any = {heartbeat: {incoming: wsHeartbeatInterval, outgoing: wsHeartbeatInterval}};
            let stompClient:any = Stomp.over(ws, options);
            // Override StompClient debugging to use our Logger.
            stompClient.debug = function(str) {
                 me.logger.info(str);
            };
            
            stompClient.connect('user', 'pwd', function (frame) {
                me.logger.debug("connected to Stomp");
                if(frame['headers'].session) {
                    resolve({frame: frame, client: stompClient});
                }
             }, function(error) {
                me.logger.debug("Error connecting to Stomp");
                reject(error);
            });
        });
        return promise;
    }

    handleWsMessage(frame) {
        let body = JSON.parse(frame.body);
        let eventType = body.actionType;
        this.logger.debug(" || Received WS message: " + eventType);
        this.evt.publish(eventType, body);
    }

}




