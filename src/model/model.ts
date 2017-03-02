import {DialogController} from 'aurelia-dialog';
import {inject, NewInstance, LogManager} from 'aurelia-framework';
import {ValidationRules, ValidationController, Rules, validateTrigger} from 'aurelia-validation';
import {Logger} from 'aurelia-logging';

@inject(DialogController, NewInstance.of(ValidationController), LogManager)
/**
 *  Generic controller for model-mutating dialogs. 
 * */
export class Model {
  title: string;
  okText: string;
  showCancel: boolean;
  showErrors: boolean = true;
  isSubmitDisabled: boolean;
  submit: Function;
  errorMessage: string;
  modelPromise: string;
  modelView: string;
  loadingTitle: string;

  item: any;
  originalItem: any;
  vRules: ValidationRules;

  gridOptions: any;

  logger: Logger;


  constructor(private controller:DialogController, private vController:ValidationController) {
    this.vController.validateTrigger = validateTrigger.changeOrBlur;
    this.modelView = this.controller.settings.modelView;
    this.modelPromise = this.controller.settings.modelPromise;
    this.title = this.controller.settings.title;
    this.loadingTitle = this.controller.settings.loadingTitle;
    this.okText = this.controller.settings.okText;
    this.showCancel = this.controller.settings.showCancel;
    this.showErrors = typeof this.controller.settings.showErrors === 'boolean'?this.controller.settings.showErrors:true;
    this.isSubmitDisabled = typeof this.controller.settings.isSubmitDisabled === 'boolean' && this.controller.settings.isSubmitDisabled === true?
      this.controller.settings.isSubmitDisabled:false;
    this.item = this.controller.settings.item;
    this.errorMessage = null;
    this.vRules = this.controller.settings.rules;
    if(this.controller.settings.rules) {
      Rules.set(this.item, this.controller.settings.rules);
      // this.vController.addObject(this.item, this.controller.settings.rules);
      
    }

    this.logger = LogManager.getLogger(this.constructor.name);
  }

  activate(model){
  }
  attached() {
    // Clone the model item.
    if(Array.isArray(this.item )) {
      this.originalItem = this.item.splice(0);
    } else if(typeof this.item === 'object') {
      this.originalItem = Object.assign({}, this.item);
    } 

    this.logger.debug('attached');
  }

  bind(bindingContext: Object, overrideContext: Object) {
    console.debug("Model | bind()");
  }

  doCancel(event) {
    event.stopPropagation()
    let me = this;
    // if(this.vController) {
    // me.vController.reset();
    // }
      setTimeout(function(){
        me.controller.cancel();
      }, 0);
  }

  itemChanged(splices) {
    this.logger.debug('... itemChanged');
  }

  clearError() {
    // let me = this;
    // this.vResults = [];
    this.vController.validate();
  };

  $isDirty() {
    if(!(this.originalItem) || !(this.item)) {
      return false;
    }
    let me = this;
    let isEqual = function(obj1, obj2) {
      let equal = true;
      if(Array.isArray(obj1)) {
        equal = me.isArrayEqual(obj2, obj1);
      } else if(typeof obj1 === 'object') {
        equal = me.isObjectEqual(obj1, obj2);
      }
      me.logger.debug('... dirty-checking in Model: ' + !equal);
      return equal;
    };
    return !(isEqual(this.item, this.originalItem));
  }

  isObjectEqual(obj1, obj2) {
    let me = this;
     let isEqual = Object.keys(obj2).every((key) => 
      obj1.hasOwnProperty(key) && 
      ((obj2[key] === obj1[key]) || (me.isEmpty(obj2[key]) && me.isEmpty(obj1[key])))
    );
    return isEqual;
  }

  isArrayEqual(obj1:Array<any>, obj2:Array<any>) {
    let me = this;
    return obj2.every(
      function(key) { 
        return obj1.indexOf(key) !== -1
      }
    );
  }
  
  get isDirty() {
    return this.$isDirty();
  }

  isEmpty(obj) {
    if(obj === undefined || obj === null) {
      return true;
    }
    if(typeof obj === 'string' && (obj === '')) {
      return true;
    }

    return false;
  }

  get vControlerJSON() {
    return JSON.stringify(this.vController.errors);
  }
  
  get hasValidationErrors() {
    return Array.isArray(this.vController.errors) && this.vController.errors.length > 0;
  }

  get validationErrors() {
    return this.vController.errors;
  }

  get isGridFiltered() {
    window.console.debug('--- isGridFiltered ---');
    return this.gridOptions && this.gridOptions.api && this.gridOptions.api.isAnyFilterPresent();
  }
 
}

