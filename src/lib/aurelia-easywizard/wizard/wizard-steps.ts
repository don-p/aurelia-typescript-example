import {containerless} from 'aurelia-templating'
import {WizardControllerStep} from '../controller/wizard-controller-step'

// @containerless()
export class WizardSteps {

  steps:Array<WizardControllerStep>;
  currentStep:WizardControllerStep;
  parent:any;
  events:any;

  constructor() {
    this.currentStep = new WizardControllerStep(null);

  }
  bind(parent) {
    this.parent = parent
    parent.wizardSteps = this
    this.steps = parent.steps
    this.currentStep = this.steps[0];
    this.events = parent.events
  }
  get numSteps() {
    return this.steps.length
  }
  get isLastStep() {
    return this.currentStep == this.parent.lastStep()
  }
  get isFirstStep() {
    return this.currentStep == this.parent.firstStep()
  }

  get canGoBack() {
    return this.currentStep.canGoBack;
  }

  get canCancel() {
    return this.currentStep.canCancel;
  }

  setCurrent(currentStep) {
    if (this.currentStep.id) {
      this.currentStep.setIsCurrent(false)
     } 
    this.currentStep = currentStep
    this.currentStep.setIsCurrent(true)
  }
}
