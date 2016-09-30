import {DialogController} from 'aurelia-dialog';
import {inject} from 'aurelia-framework';

@inject(DialogController)
export class Prompt {

  message: string;
  title: string;
  item: any;
  
  constructor(private controller:DialogController) {
    this.title = null;
    this.message = null;
    this.item = null;
    controller.settings.lock = false;
  }

  activate(model) {
    this.title = model.question;
    this.message = model.message;
    this.item = model.item;
  }
}