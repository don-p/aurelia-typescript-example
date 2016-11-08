import {DialogController} from 'aurelia-dialog';
import {inject} from 'aurelia-framework';

@inject(DialogController)
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
  item: any;
  isDirty: boolean = true;
  hasValidationErrors: boolean = false;

 
  constructor(private controller:DialogController) {
    this.modelView = this.controller.settings.modelView;
    this.modelPromise = this.controller.settings.modelPromise;
    this.title = this.controller.settings.title;
    this.message = this.controller.settings.message;
    this.okText = this.controller.settings.okText;
    this.showCancel = this.controller.settings.showCancel;
    this.isSubmitDisabled = this.controller.settings.isSubmitDisabled && this.controller.settings.isSubmitDisabled === true?
      this.controller.settings.isSubmitDisabled:false;
    this.item = this.controller.settings.item;
    this.errorMessage = null;

    // this.logger = LogManager.getLogger(this.constructor.name);
  }

  attached() {
    document.getElementById('model-submit-button').focus();
  }
}