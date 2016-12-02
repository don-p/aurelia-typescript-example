import {noView} from 'aurelia-framework'

// @noView
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

  constructor() {
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

  set config(config:any) {
    this.title = config.title;
    this.id = config.id;
    this.isCurrent = config.isCurrent;
    this.canValidate = config.canValidate;
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
  ensureValidation() {
    return (!(this.stepErrors) || this.stepErrors.length === 0);
  }
}

