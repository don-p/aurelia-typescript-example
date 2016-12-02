import {bindable, inject} from 'aurelia-framework'
import {Events} from './events'
import {WizardController} from './controller/wizard-controller'
import {WizardSteps} from './wizard/wizard-steps';

@inject(Events)
export class Wizard {
  // static inject() {return [Events]}

  events:Events;

  @bindable controller;
  wizardSteps:WizardSteps;

  constructor(events) {
    this.events = events
    initEvents.call(this)
  }
  get steps() {
    return this.controller.steps
  }
  set steps(steps) {
    this.controller.steps = steps;
  }
  firstStep() {
    return this.controller.firstStep()
  }
  lastStep() {
   return this.controller.lastStep() 
  }
  get views() {
    return this.controller.getViews()
  }
  get currentStep() {
    return this.wizardSteps.currentStep
  }
  attached() {
    setStep.call(this, this.firstStep())
  }
}
var setStep = function(newStep) {
  if(this.wizardSteps.currentStep && this.wizardSteps.currentStep.stepErrors) {
    newStep.stepErrors = this.wizardSteps.currentStep.stepErrors;
  }
  newStep.stepStatus = this.wizardSteps.currentStep.stepStatus;
  this.wizardSteps.setCurrent(newStep)
}
var getStep = function(action) {
   switch(action) {
      case 'next':
        return this.controller.nextStep(this.currentStep)
      case 'prev': 
        return this.controller.prevStep(this.currentStep)
      case 'submit': 
        return this.controller.submit(this.currentStep)  
    }  
}
var initEvents = function() {
  this.events.subscribe("wizard:action", (action) => {
    let newStep = getStep.call(this, action)
    if (newStep) {
      setStep.call(this, newStep)
    }
  })
}