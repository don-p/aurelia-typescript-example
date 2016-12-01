import {bindable, inject} from 'aurelia-framework'
import $ from 'jquery'

export class WizardActions {
  @bindable controller;
  nextAction:any;
  isValidCurrentStep:boolean;
  parent:any;
  events:any;

  constructor() {
  this.nextAction = ""
  this.isValidCurrentStep = false
  }

process(event) {
    event.stopPropagation()
    event.preventDefault()
    event.cancelBubble = true
    let action = $(event.target).data('action')
    if (typeof this[action] === 'function') {
      this[action]()
    }
    return false
  }
  bind(parent) {
    this.parent = parent
    this.events = parent.events
    initEvents.call(this)
  }
  prev() {
    if (this.isNotFirstStep) {
      doAction.call(this, "prev")
    }
  }
  next() {
    if (this.isNotLastStep) {
      doAction.call(this, "next")
    }
  }
  submit() {
    if (this.isLastStep) {
      doAction.call(this, "submit")
    }
  }
  get isLastStep() {
    return this.parent.wizardSteps.isLastStep
  }
  get isNotFirstStep() {
    return !this.parent.wizardSteps.isFirstStep
  }
  get isNotLastStep() {
    return !this.isLastStep
  }
  get hasSteps() {
    return this.parent.wizardSteps.numSteps != 0
  }
  get currentStep() {
    return this.parent.currentStep
  }
}
var initEvents = function() {
  this.events.subscribe("wizard:current:step:valid", (currentStep) => {
    if (this.nextAction && currentStep.getId() == this.currentStep.getId()) {
      doNextAction.call(this)
    }  
  })
}
var doNextAction = function() {
   publish.call(this, "action", this.nextAction)
   this.nextAction = undefined
}
var doAction = function(action) {
  const me = this;

  if(this.currentStep.callback) {
    // Assumes that 'callback' will return a Promise, resolved or rejected.
    this.currentStep.callback.call(this, this.currentStep.model)
    .then(response => {
        console.debug('callback ---');
        // Set state as valid.
        me.currentStep.stepErrors = response.errors.concat(response.warnings);
        return response;
      }, response => {
        console.error("Community member call() rejected."); 
        // Set state as invalid.
        me.currentStep.stepErrors = response.errors.concat(response.warnings);
        return response;
      })
      .catch(error => {
        console.error('catch'); 
      }).then(response => {
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
        if (me.currentStep.getCanValidate()) {
          publish.call(this, "validate:current:step", me.currentStep)
        } else {
          doNextAction.call(me)
        }
      })
  ;
  } else {
    this.nextAction = action
    if (this.currentStep.getCanValidate()) {
      publish.call(this, "validate:current:step", this.currentStep)
    } else {
      doNextAction.call(this)
    }
  }
}
var publish = function(event, option) {
  let action = `wizard:${event}`
  this.events.publish(action, option) 
}
