import {inject, LogManager} from 'aurelia-framework';
import {AureliaConfiguration} from 'aurelia-configuration';
import {Logger} from 'aurelia-logging';

@inject(AureliaConfiguration, LogManager)
export class AudioService {  

    logger: Logger;
    audioContext: any;
    alertSound: any;
    alertSoundAudio: HTMLAudioElement;
    // alertSoundFilename: string = 'beep30_3x.mp3';
    alertSoundFilename: string = 'GC_Alert-t-1.mp3';
    wsProtocol: string;

    // Service object for application utilities.
    constructor(private appConfig: AureliaConfiguration){
        this.logger = LogManager.getLogger(this.constructor.name);

        let context;
        try {
            // Fix up for prefixing
            window['AudioContext'] = window['AudioContext'] || window['webkitAudioContext'];
            context = new AudioContext();
            this.audioContext = context;
            this.loadSound('./sounds/' + this.alertSoundFilename);
            this.loadSoundCompat('./sounds/' + this.alertSoundFilename);
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

    ///// Audio functions.
    playSound(buffer) {
        var source = this.audioContext.createBufferSource(); // creates a sound source
        source.buffer = buffer;                    // tell the source which sound to play
        source.connect(this.audioContext.destination);       // connect the source to the context's destination (the speakers)
        source.start(0);                           // play the source now
                                                // note: on older systems, may have to use deprecated noteOn(time);
    }

    playSoundCompat(audio: HTMLAudioElement) {
        audio.play();
    }

    loadSoundCompat(url) {
        let audio = new Audio(url);
        this.alertSoundAudio = audio;
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




