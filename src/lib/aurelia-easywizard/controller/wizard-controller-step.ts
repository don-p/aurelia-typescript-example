import {noView, inject} from 'aurelia-framework'
import {Validator, ValidationController, ValidationRules, ValidationError} from 'aurelia-validation';

// @noView
@inject(Validator)
export class WizardControllerStep {

  title:string;
  id:string;
  isCurrent:boolean;
  canValidate:boolean;
  stepErrors: Array<any>;
  stepStatus: any;
  viewsPrefix:string;
  model:any;
  initialize:boolean;
  callback: Function;

  vRules: ValidationRules;
  
  constructor(private validation:ValidationController) {

    this.title = "";
    this.id = "";
    this.isCurrent = false;
    this.canValidate = true;
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
    this.canValidate = config.canValidate;
    this.vRules = config.vRules;
    this.viewsPrefix = config.viewsPrefix;
    this.model = config.model;
    this.callback = config.callback;
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

  return eval(this.vRules.toString());
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

@inject(Validator)
export class WizardControllerStepFactory {
  constructor(private validation:ValidationController) {
  }

  newInstance() {
    return new WizardControllerStep(this.validation);
  }
}
