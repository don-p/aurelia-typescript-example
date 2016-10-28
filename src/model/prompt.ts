import {DialogController} from 'aurelia-dialog';
import {inject} from 'aurelia-framework';

@inject(DialogController)
export class Prompt {

  model: Object;
  
  constructor(private controller:DialogController) {
  }

  activate(model) {
    if(!(typeof model.showCancel === 'boolean')) {
      model.showCancel = true;
    }
    this.model = model;
  }

  attached() {
    document.getElementById('model-submit-button').focus();
  }
}