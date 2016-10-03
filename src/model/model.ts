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
  submit: Function;
  model: Object;
  errorMessage: string;

  constructor(private controller:DialogController) {

  }

  activate(model){
    this.model = model;
    this.errorMessage = null;
  }

  bind(bindingContext: Object, overrideContext: Object) {
    console.debug("Model | bind()");
  }

}

