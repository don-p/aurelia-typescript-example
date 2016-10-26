import {DialogController} from 'aurelia-dialog';
import {inject} from 'aurelia-framework';

@inject(DialogController)
export class Prompt {

  model: Object;
  
  constructor(private controller:DialogController) {
  }

  activate(model) {
    this.model = model;
  }

  attached() {
    document.getElementById('model-submit-button').focus();
  }
}