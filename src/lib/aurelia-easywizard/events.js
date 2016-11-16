import {EventAggregator} from 'aurelia-event-aggregator';
import {noView} from 'aurelia-framework'

// @noView
export class Events {
    static inject() {return [EventAggregator]}

    constructor(aggregator) {
      this.aggregator = aggregator;
    }
    publish(event, payload) {
      this.aggregator.publish(event, payload); 
    }
    subscribe(event, callback) {
      this.aggregator.subscribe(event, callback);
    }
}