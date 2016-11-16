import {containerless, bindable} from 'aurelia-templating'

// @containerless()
export class WizardStepContainer {
  constructor() {
    this.parent = {currentStep:{}}
  }
  
  bind(parent) {
    this.parent = parent
    this.events = parent.events
  }
  get currentStep() {
    return this.parent.currentStep
  }
}
