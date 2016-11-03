import {DialogController} from 'aurelia-dialog';
import {inject, NewInstance, LogManager, computedFrom, BindingEngine} from 'aurelia-framework';
import {ValidationRules, ValidationController, Rules, validateTrigger} from 'aurelia-validation';
import {Logger} from 'aurelia-logging';

@inject(DialogController, NewInstance.of(ValidationController), BindingEngine, LogManager)
/**
 *  Generic controller for model-mutating dialogs. 
 * */
export class Model {
  title: string;
  okText: string;
  showCancel: boolean;
  isSubmitDisabled: boolean;
  submit: Function;
  // model: any;
  errorMessage: string;
  modelPromise: string;
  modelView: string;
  // _gridOptions: any;

  item: any;
  originalItem: any;

  logger: Logger;


  constructor(private controller:DialogController, private vController:ValidationController, private bindingEngine:BindingEngine) {
    this.vController.validateTrigger = validateTrigger.changeOrBlur;
    this.modelView = this.controller.settings.modelView;
    this.modelPromise = this.controller.settings.modelPromise;
    this.title = this.controller.settings.title;
    this.okText = this.controller.settings.okText;
    this.showCancel = this.controller.settings.showCancel;
    this.isSubmitDisabled = this.controller.settings.isSubmitDisabled && this.controller.settings.isSubmitDisabled === true?
      this.controller.settings.isSubmitDisabled:false;
    this.item = this.controller.settings.item;
    // Clone the model item.
    this.originalItem = Object.assign({}, this.item);
    this.errorMessage = null;

    if(this.controller.settings.rules) {
      Rules.set(this.item, this.controller.settings.rules);
    }

    // let subscription = this.bindingEngine.collectionObserver(this.item).subscribe(this.itemChanged);

    this.logger = LogManager.getLogger(this.constructor.name);
  }

  activate(model){
  }

  bind(bindingContext: Object, overrideContext: Object) {
    console.debug("Model | bind()");
  }

  itemChanged(splices) {
    this.logger.debug('... itemChanged');
  }

  $isDirty() {
    let me = this;
    let isEqual = function(obj1, obj2) {
      let dirty = Object.keys(obj2).every((key) => 
        obj1.hasOwnProperty(key) && (obj2[key] === obj1[key])
      );
      me.logger.debug('... dirty-checking in Model: ' + !dirty);
      return dirty;
    };
    return !(isEqual(this.item, this.originalItem));
  //  return Object.keys(this.originalItem).every((key) => 
  //     this.item.hasOwnProperty(key) && (this.originalItem[key] === this.item[key])
  //   );

  }

  @computedFrom('item.communityName')
  get isDirty() {
    return this.$isDirty();
  }
}

