import {bindable} from 'aurelia-framework'
import $ from 'jquery';
import {Events} from '../events';

export class WizardStepPane {
  static inject() {return [Element]}

  element:any;
  wizardStepView: string;
  parent:any;
  events:Events;
  
  @bindable controller;
  
  constructor(element) {
    this.element = element;
    this.wizardStepView = "./wizard-step-view";
  }
  bind(parent) {
    this.parent = parent;
    this.controller = parent.controller;
    this.events = parent.events;
    initEvents.call(this);
  }
  
  get isActive() {
    let id = this.currentStep.id;
    return id != undefined && id.length > 0
  }

  get currentStep() {
    return this.parent.currentStep
  }

 get currentStepView() {
    return this.currentStep.view;
  }
  submit() {
    let form = getForm.call(this)
    let formSubmit = $(form).find('button[type="submit"]')
    $(formSubmit).trigger('click')
  }
}
var getForm = function() {
  return $(this.element).find('form')
}
var initEvents = function() {
  const me = this;
  this.events.subscribe("wizard:validate:current:step", () => {
     if (me.currentStep.getIsCurrent()) {
        me.submit()
     } 
  })
}