import {inject, NewInstance, Lazy, Parent, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {AureliaConfiguration} from 'aurelia-configuration';
import {I18N} from 'aurelia-i18n';
import {ValidationRules, ValidationController, Rules, validateTrigger} from 'aurelia-validation';
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

  constructor(private i18n: I18N, private appConfig: AureliaConfiguration, private utils: Utils, 
    private organizationService:OrganizationService, private parent: Community, private vController:ValidationController) {

    this.$filterValues = [{attr:'physicalPersonProfile.firstName', op:'contains', value:''}];

    // ValidationRules
    // .ensureObject()
    // .satisfies(obj => obj * obj.width * obj.height <= 50)
    //   .withMessage('Volume cannot be greater than 50 cubic centemeters.')
    // .on(this.$filterValues);

    // ValidationRules.on(this).passes(validatePhoneNumber);

    const vRules = ValidationRules
      // .ensure('value')
      // .satisfies(this.filterValid)

      // .ensure('$filterValues').displayName("First name")
      //   .required()
      //   .satisfies(v => this.filterValid(v)).withMessage('${$displayName} cannot have leading or trailing spaces.')
  .ensure('$filterValues').satisfies(this.filterValid).withMessage('Passwords must match')
      // .displayName(this.i18n.tr('community.communities.alert.recipientsList'))
      // .minItems(1)
      // .then()
      // .ensure('alertMessage')
      // .displayName(this.i18n.tr('community.communities.alert.message'))
      // .required()
      // .then()
      // .maxLength(maxMessageLength)
      .rules;
    Rules.set(this, vRules);
    this.vController.validateTrigger = validateTrigger.changeOrBlur;

    this.logger = LogManager.getLogger(this.constructor.name);
    
  }

  filterValid(value) {
    return this.$filterValues.length  >0;
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
    this.selectedOrganization = this.parent.organizations[0].organizationId;
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

