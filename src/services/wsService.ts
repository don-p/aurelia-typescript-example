import {inject, LogManager} from 'aurelia-framework';
import {AureliaConfiguration} from 'aurelia-configuration';
import * as Stomp from 'webstomp-client';
import * as StompJs from 'stompjs';
import * as SockJS from 'sockjs-client';
import {ConnectionHeaders} from 'webstomp-client';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Logger} from 'aurelia-logging';

@inject(AureliaConfiguration, EventAggregator, LogManager)
export class WebSocketService {  

    logger: Logger;
    audioContext: any;
    alertSound: any;
    alertSoundFilename: string = 'beep30_3x.mp3';

    // Service object for application utilities.
    constructor(private appConfig: AureliaConfiguration, private evt: EventAggregator){
        this.logger = LogManager.getLogger(this.constructor.name);

        let context;

        try {
            // Fix up for prefixing
            window['AudioContext'] = window['AudioContext'] || window['webkitAudioContext'];
            context = new AudioContext();
            this.audioContext = context;
            this.loadSound('./sounds/' + this.alertSoundFilename);
/*
            let bufferLoader = new BufferLoader(
                context,
                [
                '../sounds/hyper-reality/br-jam-loop.wav',
                '../sounds/hyper-reality/laughter.wav',
                ],
                finishedLoading
                );

            bufferLoader.load();
*/
        }
        catch(e) {
            alert('Web Audio API is not supported in this browser');
        }

    }

    openWsConnection(token): Promise<any> {

        let me = this;
        let promise = new Promise((resolve, reject) => {
            // let wsUrl = 'https://scig-dev.bluelinegrid.com/' /*+ this.appConfig.get('api.serverUrl')*/ + 'subscriptions?token=';
            // let wsUrl = 'http://192.168.119.143:7061/' /*+ this.appConfig.get('api.serverUrl')*/ + 'subscriptions?token=';
            let wsUrl = 'ws://' + window.location.host + '/blgws' /*+ this.appConfig.get('api.serverUrl')*/ + '/websocket?token=';
            // let wsUrl = 'wss://scig-dev.bluelinegrid.com/' /*+ this.appConfig.get('api.serverUrl')*/ + 'websocket?token=';
            // let wsUrl = 'ws://' + window.location.host + '/blgws';
            // let wsUrl = 'ws://' + window.location.host + '/blgws';
            // let token = me.session.auth['access_token'];
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
            let stompClient:any = Stomp.over(ws);
            // stompClient.debug = function(str) {
            //     // append the debug log to a #debug div
            //     me.logger.debug(str + "\n");
            // };
            
            stompClient.connect('don.peterkofsky', 'abc123', function (frame) {
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
        // let me = this;
        // // let wsUrl = 'https://scig-dev.bluelinegrid.com/' /*+ this.appConfig.get('api.serverUrl')*/ + 'subscriptions?token=';
        // // let wsUrl = 'http://192.168.119.143:7061/' /*+ this.appConfig.get('api.serverUrl')*/ + 'subscriptions?token=';
        // let wsUrl = 'ws://' + window.location.host + '/blgws' /*+ this.appConfig.get('api.serverUrl')*/ + '/websocket?token=';
        // // let wsUrl = 'wss://scig-dev.bluelinegrid.com/' /*+ this.appConfig.get('api.serverUrl')*/ + 'websocket?token=';
        // // let wsUrl = 'ws://' + window.location.host + '/blgws';
        // // let wsUrl = 'ws://' + window.location.host + '/blgws';
        // let token = this.session.auth['access_token'];
        // let url = wsUrl + token;
        // // let url = wsUrl;
        // // let  ws = new SockJS.default(url);
        // // let client = StompJs.Stomp.over(ws);
        // // client.connect({}, function (frame) {
        // //     me.logger.debug("connected to Stomp");
        // //     client.subscribe('notification.member', function(message) {
        // //       me.logger.debug("Got WS message: " + message.body);
        // //     })
        // //     frame.toString();
        // // }, function(error) {
        // //     me.logger.debug("Error connecting to Stomp");
        // //     error.toString();
        // // });
        // let ws = new WebSocket(url);
        // let stompClient = Stomp.over(ws);
        // stompClient.connect('don.peterkofsky', 'abc123', function (frame) {
        //     me.logger.debug("connected to Stomp");
        //     frame.toString();
        // }, function(error) {
        //     me.logger.debug("Error connecting to Stomp");
        //     error.toString();
        // });
        // return stompClient;
    }

    handleWsMessage(frame) {
        let body = JSON.parse(frame.body);
        let eventType = body.actionType;
        this.logger.debug(" || Received WS message: " + eventType);
        this.evt.publish(eventType, body.notification);
    }


    ///// Audio functions.
    playSound(buffer) {
        var source = this.audioContext.createBufferSource(); // creates a sound source
        source.buffer = buffer;                    // tell the source which sound to play
        source.connect(this.audioContext.destination);       // connect the source to the context's destination (the speakers)
        source.start(0);                           // play the source now
                                                // note: on older systems, may have to use deprecated noteOn(time);
    }

    loadSound(url) {
        let me = this;
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        // Decode asynchronously
        request.onload = function() {
            me.audioContext.decodeAudioData(request.response, function(buffer) {
                me.alertSound = buffer;
            }, 
            function(error) {
                console.error("Error loading sound.")
            });
        }
        request.send();
    }


}




