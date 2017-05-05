import {inject, LogManager} from 'aurelia-framework';
import {AureliaConfiguration} from 'aurelia-configuration';
import {Session} from './session';
import * as Stomp from 'webstomp-client';
import * as StompJs from 'stompjs';
import * as SockJS from 'sockjs-client';
import {ConnectionHeaders} from 'webstomp-client';
import {Logger} from 'aurelia-logging';

@inject(Session, AureliaConfiguration, LogManager)
export class WebSocketService {  

    logger: Logger;

    // Service object for application utilities.
    constructor(private session:Session, private appConfig: AureliaConfiguration){
        this.logger = LogManager.getLogger(this.constructor.name);
    }

    openWsConnection() {
        let me = this;
        // let wsUrl = 'https://scig-dev.bluelinegrid.com/' /*+ this.appConfig.get('api.serverUrl')*/ + 'subscriptions?token=';
        // let wsUrl = 'http://192.168.119.143:7061/' /*+ this.appConfig.get('api.serverUrl')*/ + 'subscriptions?token=';
        let wsUrl = 'ws://' + window.location.host + '/blgws' /*+ this.appConfig.get('api.serverUrl')*/ + '/websocket?token=';
        // let wsUrl = 'wss://scig-dev.bluelinegrid.com/' /*+ this.appConfig.get('api.serverUrl')*/ + 'websocket?token=';
        // let wsUrl = 'ws://' + window.location.host + '/blgws';
        // let wsUrl = 'ws://' + window.location.host + '/blgws';
        let token = this.session.auth['access_token'];
        let url = wsUrl + token;
        // let url = wsUrl;
        // let  ws = new SockJS.default(url);
        // let client = StompJs.Stomp.over(ws);
        // client.connect({}, function (frame) {
        //     me.logger.debug("connected to Stomp");
        //     client.subscribe('notification.member', function(message) {
        //       me.logger.debug("Got WS message: " + message.body);
        //     })
        //     frame.toString();
        // }, function(error) {
        //     me.logger.debug("Error connecting to Stomp");
        //     error.toString();
        // });
        let ws = new WebSocket(url);
        let stompClient = Stomp.over(ws);
        stompClient.connect('don.peterkofsky', 'abc123', function (frame) {
            me.logger.debug("connected to Stomp");
            frame.toString();
        }, function(error) {
            me.logger.debug("Error connecting to Stomp");
            error.toString();
        });
    }
    
}




