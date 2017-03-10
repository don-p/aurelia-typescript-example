import {bindable, inject, LogManager} from 'aurelia-framework'
import {Logger} from 'aurelia-logging';
import $ from 'jquery'

export class WizardActions {
  @bindable controller;
  @bindable wizardSteps;
  nextAction:any;
  isValidCurrentStep:boolean;
  parent:any;
  events:any;
  @bindable nextDisabled: boolean = false;

  logger: Logger;

  constructor() {
    this.nextAction = "";
    this.isValidCurrentStep = false;
    this.logger = LogManager.getLogger(this.constructor.name);
  }

  process(event) {
    event.stopPropagation();
    event.preventDefault();
    event.cancelBubble = true;
    // TODO: FEED-442 - action is undefined?
    let action = $(event.target).data('action');
    console.debug("WizardActions|process: " + action);
    if (typeof this[action] === 'function') {
      this[action]();
    }
    return false;
  }

  bind(parent) {
    this.parent = parent;
    this.events = parent.events;
    initEvents.call(this);
  }
  prev() {
    if (this.isNotFirstStep) {
      doAction.call(this, "prev");
    }
  }
  next() {
    if (this.isNotLastStep) {
      this.nextDisabled = true;
      this.logger.debug('XX Next disabled - true');
    console.debug("WizardActions|next: " );
      doAction.call(this, "next");
    }
  }
  submit() {
    if (this.isLastStep) {
      doAction.call(this, "submit");
    }
  }
  get isLastStep() {
    return this.parent.wizardSteps.isLastStep;
  }
  get isNotFirstStep() {
    return !this.parent.wizardSteps.isFirstStep;
  }
  get canGoBack() {
    return this.parent.wizardSteps.canGoBack;
  }
  get canCancel() {
    return this.parent.wizardSteps.canCancel;
  }
  get isNotLastStep() {
    return !this.isLastStep;
  }
  get hasSteps() {
    return this.parent.wizardSteps.numSteps != 0;
  }
  get currentStep() {
    return this.parent.currentStep;
  }
}
var initEvents = function() {
  this.events.subscribe("wizard:current:step:valid", (currentStep) => {
    if (this.nextAction && currentStep.getId() == this.currentStep.getId()) {
      doNextAction.call(this);
    }  
  })
}
var doNextAction = function() {
    console.debug("WizardActions|doNextAction: " );
   publish.call(this, "action", this.nextAction);
   this.nextAction = undefined;
  this.nextDisabled = false;
  this.logger.debug('XX Next disabled - false');
}
var doAction = function(action) {
  const me = this;

  if(action === 'next' && this.currentStep.callback) { // submitting the step.
    // Assumes that 'callback' will return a Promise, resolved or rejected.
    this.currentStep.callback.call(this, this.currentStep)
    .then(response => {
        console.debug('callback ---');
        // Set state as valid.
        if(response.res.errors && response.res.errors.length > 0) {
          me.currentStep.stepErrors = response.res.errors.concat(response.res.warnings);
        } else {
          me.currentStep.stepErrors = response.res.warnings;
        }
        me.currentStep.stepStatus = response.currentStep.stepStatus;
        return response;
      }, response => {
        console.error("Wizard callback rejected."); 
        // Set state as invalid.
        if(response.res.errors) {
          me.currentStep.stepErrors = response.res.errors.concat(response.res.warnings);
        } else {
          me.currentStep.stepErrors = response.res.warnings;
        }
        me.currentStep.stepStatus = response.currentStep.stepStatus;
        return response.res;
      }
    )
    .catch(error => { // server error.
      console.error('catch'); 
      // Set state as invalid.
      me.currentStep.stepErrors = [];
      me.currentStep.stepStatus = error.stepStatus;
      return error;
    })
    .then(response => {
      // do next action
      console.debug('finally');
      me.nextAction = action
      if(me.currentStep.stepErrors) {
        me.currentStep.stepErrors.sort(function(o1, o2){
          if(o1.index < o2.index){
            return -1;
          } else if(o2.index < o1.index){
            return 1;
          } else {
            return 0;
          }
        });
      }
      // if (me.currentStep.getCanValidate()) {
      //   publish.call(this, "validate:current:step", me.currentStep)
      // } else {
        doNextAction.call(me)
      // }
    });
  } else {
    this.nextAction = action
    // if (this.currentStep.getCanValidate()) {
    //   publish.call(this, "validate:current:step", this.currentStep)
    // } else {
      doNextAction.call(this)
    // }
  }
}
var publish = function(event, option) {
  let action = `wizard:${event}`
    console.debug("WizardActions|publish: " + action);
  this.events.publish(action, option) 
}
