import {inject, NewInstance, Lazy, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {AureliaConfiguration} from 'aurelia-configuration';
import {I18N} from 'aurelia-i18n';
import {ValidationRules, ValidationController} from 'aurelia-validation';
import {Utils} from '../services/util';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(I18N, AureliaConfiguration, Utils, NewInstance.of(ValidationController), LogManager)
export class Discover {

  $filterValues: Array<any>;

  router: Router;

  logger: Logger;

  constructor(private i18n: I18N, private appConfig: AureliaConfiguration, private utils: Utils) {

    this.$filterValues = [{attr:1, op:'contains', value:''}];

    this.logger = LogManager.getLogger(this.constructor.name);
  }

  addFilter(filter) {
    this.$filterValues.push({attr:'fn', op:'contains', value:''});
  }

  removeFilter(filter: any) {
    this.$filterValues.splice(filter, 1);
  }

  onFilterChange(filterId, event, model) {
    model.toString();
  }

  get filterValues() {
    return this.$filterValues;
  }

  bind(bindingContext: Object, overrideContext: Object) {
    this.logger.debug("Community | bind()");
  }


}

