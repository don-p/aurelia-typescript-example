import {inject, NewInstance, Lazy, Parent, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {AureliaConfiguration} from 'aurelia-configuration';
import {I18N} from 'aurelia-i18n';
import {ValidationRules, ValidationController} from 'aurelia-validation';
import {Community} from './community';
import {Utils} from '../services/util';
import {OrganizationService} from '../services/organizationService';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(I18N, AureliaConfiguration, Utils, OrganizationService, Parent.of(Community), NewInstance.of(ValidationController), LogManager)
export class Discover {

  $filterValues: Array<any>;
  selectedOrganization: any;

  router: Router;

  logger: Logger;

  constructor(private i18n: I18N, private appConfig: AureliaConfiguration, private utils: Utils, private organizationService:OrganizationService, private parent: Community) {

    this.$filterValues = [{attr:'physicalPersonProfile.firstName', op:'contains', value:''}];

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

  activate() {
    let me = this;
    this.parent.organizationsPromise
    .then(data => {
      me.selectedOrganization = data['responseCollection'][0].organizationId;
    });

  }

  selectOrganization = function(event: any) {
    if(this.selectedOrganization !== event.target.value) {
      this.selectedOrganization = event.target.value;
    }
  }


  searchOrganizationMembers(organization: any, filters: Array<any>) {
    return this.organizationService.searchOrganizationMembers(organization, filters, 0, 500);
  }

}

