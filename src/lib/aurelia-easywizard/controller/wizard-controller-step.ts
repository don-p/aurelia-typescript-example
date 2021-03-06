import {noView, inject, bindable} from 'aurelia-framework'
import {WizardController} from './wizard-controller';

// @noView
export class WizardControllerStep {

  title:string;
  id:string;
  isCurrent:boolean;
  canGoBack: boolean;
  canCancel: boolean;
  canValidate:boolean;
  isDirty: boolean;
  stepErrors: Array<any>;
  stepStatus: any;
  viewsPrefix:string;
  model:any;
  initialize:boolean;
  callback: Function;
  attachedFn: Function;

  vRules: string;

  @bindable controller:WizardController;
  
  constructor(controller) {
    this.controller = controller;
    this.title = "";
    this.id = "";
    this.isCurrent = false;
    this.canGoBack = true;
    this.canCancel = true;
    this.canValidate = true;
    this.isDirty = false;
    this.viewsPrefix = "";
    this.model = {};
    this.initialize = false;

    if (this.initialize) {
      // this.initialize()
    }
  }
  
  get view() { 
    if (this.id) {
      return `${this.viewsPrefix}/${this.id}.html`
    }
  }
  setIsCurrent(current) {
    this.isCurrent = current
  }
  getId() {return this.id}
  getTitle() {return this.title}
  getCanValidate() {return this.canValidate}
  getIsCurrent() {return this.isCurrent }

  set config(config:any) {
    this.title = config.title;
    this.id = config.id;
    this.isCurrent = config.isCurrent;
    this.canGoBack = config.canGoBack===false?false:true;
    this.canCancel = config.canCancel===false?false:true;
    this.canValidate = config.canValidate;
    this.vRules = config.vRules;
    this.viewsPrefix = config.viewsPrefix;
    this.model = config.model;
    this.callback = config.callback;
    this.attachedFn= config.attachedFn;
    this.initialize = config.initialize;    
  }
  getModel() {
    return this.model
  }
  updateModel(model) {
    Object.keys(this.model).forEach((property) => {
      this.model[property] = model[property]
    })
  }
  ensureValidation(validation) {
    return (
      (!(this.stepErrors) || this.stepErrors.length === 0) &&
      (true)
    );
  }

  get isValid():boolean {

    // let result =  this.doValidate(this.model, 'files', this.vRules );

    // console.debug('----- isValid?: ' + result +' -----');

    // return (Array.isArray(result) && result.length === 0);

  return typeof this.vRules == 'string'?eval(this.vRules.toString()):this.controller.vController.errors.length === 0;
  }

  // async doValidate(object, property, rules): Promise<Array<ValidationError>> {
  //   let p = this.validation.validate({object:object, propertyName:property, rules:rules});
  //   p.then(errors => {
  //     // console.debug('----- isValid?: resolved -----');
  //       // return errors;
  //   });
  //   return await p;
  //   // let resolved = await result;
  //   // return await resolved;
  // }
}

// @inject(ValidationController)
export class WizardControllerStepFactory {
  constructor() {
  }

  newInstance() {
    return new WizardControllerStep(null);
  }
}
