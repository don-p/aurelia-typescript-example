import {inject, LogManager} from 'aurelia-framework';
import {AureliaConfiguration} from 'aurelia-configuration';
import * as Stomp from 'webstomp-client';
import {ConnectionHeaders} from 'webstomp-client';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Logger} from 'aurelia-logging';

const WS_CONNECTION_MAX_RETRIES: number = 5;

@inject(AureliaConfiguration, EventAggregator, LogManager)
export class WebSocketService {  

    logger: Logger;
    wsProtocol: string;
    wsConnection: Stomp.Client;
    wsSubscriptions: Array<Function> = [];

    // Service object for application utilities.
    constructor(private appConfig: AureliaConfiguration, private evt: EventAggregator){
        this.logger = LogManager.getLogger(this.constructor.name);

        this.wsProtocol = 'wss';
        if('%LOCAL_ENVIRONMENT%') {
            this.wsProtocol = 'ws';
        }
    }

    createWebSocket(wsUrl: string): WebSocket {
        return new WebSocket(wsUrl);
    }

    openWsConnection(session): Promise<any> {

        let me = this;

        let wsHeartbeatInterval = this.appConfig.get('api.wsHeartbeatInterval');
        let promise = new Promise((resolve, reject) => {
            let wsUrl = this.wsProtocol + '://' + window.location.host + '/blgws/websocket?token=';
            let url = wsUrl + session.auth['access_token'];
            let ws = me.createWebSocket(url);
            let options:any = {heartbeat: {incoming: wsHeartbeatInterval, outgoing: wsHeartbeatInterval}};
            let stompClient:any = Stomp.over(ws, options);
            // Override StompClient debugging to use our Logger.
            stompClient.debug = function(str) {
                 me.logger.info(str);
            };
            
            stompClient.connect('user', 'pwd', function (frame) {
                me.logger.debug("connected to Stomp");

                // Handle unexpected closing of websocket connection.
                ws.onclose = function(event) {
                    me.logger.error("websocket connection closed: " + event);
                    if(event.type === 'close') {
                        // Clean up connection,.
                        me.removeSubscriptions();
                        me.wsConnection.disconnect(function(){});
                        // Start to re-try ws connection.
                        let retryCount = 0;
                        let workerId = setInterval(function(ws) {
                            if(retryCount >= WS_CONNECTION_MAX_RETRIES) {
                                me.logger.info("websocket re-connection max attempts exceeded");
                                // Stop trying.
                                clearInterval(workerId);
                            } else {
                                retryCount++;
                                me.openWsConnection(session).then(function(result) {
                                    me.logger.info("websocket re-connected");
                                    // Re-connected, so done.
                                    clearInterval(workerId);
                                }).catch(function(error) {
                                    // Keep trying.
                                    me.logger.info("websocket re-connection failed, trying again");
                                });
                            }
                        }, wsHeartbeatInterval);
                    }
                }

                // After a successful websocket/STOMP connection, add default subscriptions.
                if(frame['headers'].session) {
                    me.addSubscriptions(stompClient, session);
                    me.wsConnection = stompClient;
                    resolve({frame: frame, client: stompClient});
                }
             }, function(error) {
                me.logger.debug("Error connecting to Stomp");
                reject(error);
            });
        });
        return promise;
    }

    addSubscriptions(stompClient, session) {
        let me = this;
        let alertSub = stompClient.subscribe('/exchange/member.notification.alert/' + session.auth['member'].memberId, function(message) {
            me.handleWsMessage(message);
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
    

    /**
     * WebSocket message routing/delegation.
     */
    handleWsMessage(frame) {
        let body = JSON.parse(frame.body);
        let eventType = body.actionType;
        this.logger.debug(" || Received WS message: " + eventType);
        this.evt.publish(eventType, body);
    }

}




