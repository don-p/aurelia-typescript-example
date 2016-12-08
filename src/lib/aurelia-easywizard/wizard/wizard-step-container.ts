import {containerless, bindable} from 'aurelia-templating'

// @containerless()
export class WizardStepContainer {

  @bindable controller;
  parent;
  events;
  
  constructor() {
    this.parent = {currentStep:{}}
  }
  
  bind(parent) {
    this.parent = parent
    this.controller = parent.controller;
    this.events = parent.events
  }
  get currentStep() {
    return this.parent.currentStep
  }
}
