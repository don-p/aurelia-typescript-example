import {DialogController} from 'aurelia-dialog';
import {inject, NewInstance} from 'aurelia-framework';
import {ValidationRules, ValidationController, Rules, validateTrigger} from 'aurelia-validation';

@inject(DialogController, NewInstance.of(ValidationController))
export class Prompt {

  title: string;
  message: string;
  okText: string;
  showCancel: boolean;
  isSubmitDisabled: boolean;
  submit: Function;
  errorMessage: string;
  modelPromise: string;
  modelView: string;
  loadingTitle: string;
  item: any;
  isDirty: boolean = true;

 
  constructor(private controller:DialogController, private vController:ValidationController) {
    this.vController.validateTrigger = validateTrigger.manual;
    this.modelView = this.controller.settings.modelView;
    this.modelPromise = this.controller.settings.modelPromise;
    this.loadingTitle = this.controller.settings.loadingTitle;
    this.title = this.controller.settings.title;
    this.message = this.controller.settings.message;
    this.okText = this.controller.settings.okText;
    this.showCancel = this.controller.settings.showCancel;
    this.isSubmitDisabled = this.controller.settings.isSubmitDisabled && this.controller.settings.isSubmitDisabled === true?
    this.controller.settings.isSubmitDisabled:false;
    this.item = this.controller.settings.item;
    this.errorMessage = null;

    if(this.controller.settings.rules) {
      Rules.set(this.item, this.controller.settings.rules);
    }
    // this.logger = LogManager.getLogger(this.constructor.name);
  }

  attached() {
    let me = this;
    document.getElementById('model-submit-button').focus();
    this.vController.validate({ object: this, propertyName: 'item', rules: this.controller.settings.rules })
    // this.vController.validate()
    .then(errors => {
    });
    
  }

  get hasValidationErrors() {
    return Array.isArray(this.vController.errors) && this.vController.errors.length > 0;
  }

  get validationErrors() {
    return this.vController.errors;
  }


}