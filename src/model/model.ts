import {DialogController} from 'aurelia-dialog';
import {inject} from 'aurelia-framework';

@inject(DialogController)
/**
 *  Generic controller for model-mutating dialogs. 
 * */
export class Model {
  item: any;

  constructor(private controller:DialogController) {

  }

  activate(item){
    this.item = item;
  }

  bind(bindingContext: Object, overrideContext: Object) {
    console.debug("Model | bind()");
  }

}

