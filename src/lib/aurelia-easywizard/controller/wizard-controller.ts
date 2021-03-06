import {DialogController} from 'aurelia-dialog';
import {inject, noView, NewInstance, LogManager} from 'aurelia-framework';
import {ValidationRules, ValidationController, Rules, Rule, validateTrigger} from 'aurelia-validation';
import {Logger} from 'aurelia-logging';
import {WizardControllerStep} from './wizard-controller-step';
import {Wizard} from '../wizard';
import {StepList} from '../step-list'

@noView()
@inject(DialogController, NewInstance.of(ValidationController))
export class WizardController {
  wizard: Wizard;
  _steps: Array<WizardControllerStep>;
  stepList: StepList;
  title: string;
  okText: string;
  showCancel: boolean;
  isSubmitDisabled: boolean;
  submit: Function;
  errorMessage: string;
  modelPromise: string;
  modelView: string;

  item: any;
  originalItem: any;
  vRules: Rule<any, any>[][];
  vController:ValidationController;
  gridOptions: any;
  _isGridFiltered: Function;

  logger: Logger;


  constructor(private dialogController:DialogController, ValidationController) {
    // this.vController.validateTrigger = validateTrigger.manual;
    this.vController = ValidationController;
    this.modelView = this.dialogController.settings.modelView;
    this.modelPromise = this.dialogController.settings.modelPromise;
    this.title = this.dialogController.settings.title;
    this.okText = this.dialogController.settings.okText;
    this.showCancel = this.dialogController.settings.showCancel;
    this.isSubmitDisabled = this.dialogController.settings.isSubmitDisabled && this.dialogController.settings.isSubmitDisabled === true?
      this.dialogController.settings.isSubmitDisabled:false;
    this.item = this.dialogController.settings.item;
    this.errorMessage = null;
    this.vRules = this.dialogController.settings.rules;
    if(this.dialogController.settings.rules) {
      this.vController.validateTrigger = validateTrigger.changeOrBlur;
      // Rules.set(this.item, this.vRules);
      // this.vController.addObject(this.item, this.dialogController.settings.rules);
    }

    this.logger = LogManager.getLogger(this.constructor.name);
    this._steps= [];
    for(let i = 0; i < this.dialogController.settings.steps.length; i++) {
      let step = this.dialogController.settings.steps[i];
      let wizardStep = new WizardControllerStep(this);
      wizardStep.config = step;
      this._steps.push(wizardStep);
    }
    initStepList.call(this);
  }

  validate() {
    this.logger.debug('validate(): ');
    this.wizard.currentStep.isDirty = true;
    // this.vController.validate();
  }
  
  // stepList = new StepList();
  set steps(steps) {
    this._steps = steps
    initStepList.call(this)
  }
  get steps() {
    return this._steps
  }
  firstStep() {
    return this.steps[0]
  }
  lastStep() {
    return this.steps[this.steps.length - 1]
  }
  nextStep(currentStep) {
    console.debug("WizardController|nextStep: " + currentStep);
    if (currentStep != this.lastStep()) {
      return this.stepList.next(currentStep)
    }
  }
  prevStep(currentStep) {
    if (currentStep != this.firstStep()) {
      return this.stepList.prev(currentStep) 
    }
  }
  getViews() {
    return this.steps.map((step)=> {
      return step.view;
    })
  }
  doSubmit(currentStep) {
    console.log('TODO SUBMIT HERE', this.steps)
  }

  get gWindow () {
    return window;
  }

  // interface ethod stub; implementation provided by wizard instance.
  get isGridFiltered(): boolean {
    // let result = this._isGridFiltered?this._isGridFiltered():false;
    // window.console.debug('--- isGridFiltered --- : ' + result);
    // return result;
    // return this.gridOptions && this.gridOptions.api && this.gridOptions.api.isAnyFilterPresent();
    return false;
  }
}
var initStepList = function() {
  this.stepList = new StepList()
  this.steps.forEach((step) => {
    this.stepList.add(step)
  })
}