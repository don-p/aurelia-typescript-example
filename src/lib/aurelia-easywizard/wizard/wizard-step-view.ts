import{inject, bindable} from 'aurelia-framework';
import {Validator, ValidationController, ValidationRules, validateTrigger} from 'aurelia-validation';
import {Events} from '../events';
import {noView} from 'aurelia-templating';

// @noView()
@inject(ValidationController, Validator, Events)
export class WizardStepView {
  validation:any;
  vRules: ValidationRules;
  events:Events;
  stepProperties:any;
  step:any;
 
  @bindable controller;

  constructor(private vController:ValidationController, validation, events, element) {
    // this.validation = validation.on(this);
    this.events = events;
    this.stepProperties = {};   

    this.vRules = null;
 
  }
  
  bind(parent) {
    // this.controller = parent.controller;
  } 

  activate(model) {
    this.step = model.currentStep;
   this.controller = model.controller;
    this.step.ensureValidation(this.validation);
    this.stepProperties = this.step.getModel();
    Object.assign(this, this.stepProperties);

    // Rules.set(this.step.item, this.vRules);
      
    

  }

  attached() {
    if(this.step.attachedFn) {
      this.step.attachedFn.call(this);
    }
  }
  submit() {
    let self = this
    return this.validation.validate().then(() => {
      updateStepProperties.call(this)
      this.step.updateModel(this.stepProperties)
      this.events.publish("wizard:current:step:valid", this.step)
    }).catch(function(error)  {
      console.log("wizard validation failed", self, error)
    })
  } 

  // get isValid():boolean {

  //   let result =  this.doValidate(this.step.item, 'files', this.vRules );
  //   return result.length === 0;
  // // return true;
  // }

  // async doValidate(object, property, rules): Promise<Array<ValidationError>> {
  //   let result = await this.validation.validate({ object: this.step.item, propertyName: 'files', rules: this.vRules });
  //   return result;

  // }

}

var updateStepProperties = function() {
  Object.keys(this.stepProperties).forEach((property) => {
    this.stepProperties[property] = this[property]
  })
}