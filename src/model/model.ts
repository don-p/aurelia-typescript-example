import {DialogController} from 'aurelia-dialog';
import {inject} from 'aurelia-framework';

@inject(DialogController)
/**
 *  Generic controller for model-mutating dialogs. 
 * */
export class Model {
  title: string;
  okText: string;
  item: any;

  constructor(private controller:DialogController) {

  }

  activate(model){
    this.title = model.title;
    this.okText = model.okText;
    this.item = model.item;
  }

  bind(bindingContext: Object, overrideContext: Object) {
    console.debug("Model | bind()");
  }

}

