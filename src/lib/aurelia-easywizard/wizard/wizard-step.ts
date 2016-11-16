import {containerless, bindable} from 'aurelia-framework';

// import * as s from 'underscore.string/lib/underscore.string.js';

// @containerless()
export class WizardStep {
  @bindable step: any;

  contstructor() {
    this.step = {};
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
}