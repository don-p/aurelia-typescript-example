import {containerless, bindable} from 'aurelia-framework';
import {WizardControllerStep} from '../controller/wizard-controller-step';

// import * as s from 'underscore.string/lib/underscore.string.js';

// @containerless()
export class WizardStep {
  @bindable step: WizardControllerStep;
  @bindable steps: Array<WizardControllerStep>;
  @bindable current: WizardControllerStep;

  contstructor() {
    this.step = new WizardControllerStep(null);
    this.steps = [];
  }

  get class() {
    if (this.step.id) {
        if (this.step.isCurrent) {
          return "active";
        }   
    }
    return ""  
  }
  get title() {
    let step = this.step;
    let title = step.title;
    if (title) {
      return title;
    } else {
      return step.id;
      // return s(step.id).humanize().titleize().value()
    }
  }

  get isComplete() {
    return this.steps.indexOf(this.step) < this.steps.indexOf(this.current);
  }
}