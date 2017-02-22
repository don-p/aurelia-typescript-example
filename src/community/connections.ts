import {inject, NewInstance, Lazy, Parent, LogManager} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {AureliaConfiguration} from 'aurelia-configuration';
import {I18N} from 'aurelia-i18n';
import {ValidationRules, ValidationController, Rules, validateTrigger} from 'aurelia-validation';
import {Community} from './community';
import {Utils} from '../services/util';
import {CommunityService} from '../services/communityService';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(I18N, AureliaConfiguration, Utils, CommunityService, Parent.of(Community), EventAggregator, NewInstance.of(ValidationController), LogManager)
export class Connections {

  $filterValues: Array<any>;
  selectedOrganization: any;

  connections: Array<any>;
  requestType: string;
  router: Router;

  logger: Logger;

  constructor(private i18n: I18N, private appConfig: AureliaConfiguration, private utils: Utils, 
    private communityService:CommunityService, private parent: Community, private evt: EventAggregator, private vController:ValidationController) {

    this.requestType = 'INVITED';

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
    this.$filterValues.push({attr:'fn', op:'LIKE', value:''});
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
    this.showRequests(this.requestType);

    this.logger.debug("Community | bind()");
  }

  attached() {
    this.selectOrganization(this.parent.organizations[0]);
  }
  activate(params, navigationInstruction) {
    // this.selectOrganization(this.parent.organizations[0]);
  }

  showRequests(type: string) {
    this.requestType = type;
    let me = this;
    let connectionsPromise = this.communityService.getMemberConnections(type, 0, 10000, null);
    connectionsPromise
    .then(response => {return response.json()
      .then(data => {
        let result = data.responseCollection.map(function(item){
          return {
            connectId: item.connectId,
            connectStatus: item.connectStatus,
            memberEntityType: item.member.memberEntityType,
            memberId: item.member.memberId,
            physicalPersonProfile: item.member.physicalPersonProfile
          }
        });
        me.connections = result;
        return result;
        // me.logger.debug('cmtyPromise resolved: ' + JSON.stringify(data));
      }).catch(error => {
        me.logger.error('Communities list() failed in response.json(). Error: ' + error); 
        return Promise.reject(error);
      })
    })
    .catch(error => {
      me.logger.error('Communities list() failed in then(response). Error: ' + error); 
      me.logger.error(error); 
      //throw error;
      return Promise.reject(error);
    });
  }

  editConnectionRequest(connections: Array<any>, status) {
    let memberIds = connections.map(function(connection) {
      return connection.memberId;
    })
    this.communityService.editConnectionRequest(memberIds, status)
    .then(response => response.json())
    .then(data => {
      // Filter out existing community members.
      let totalCount = data['totalCount'];
    });
  }

  selectOrganization = function(organization: any) {
    this.resetSearchFilters();
    return this.evt.publish('orgSelected', {organization: organization});
  }

  resetSearchFilters() {
    this.$filterValues = [{attr:'physicalPersonProfile.firstName', op:'LIKE', value:''}];
  }

  searchOrganizationMembers(organization: any, filters: Array<any>) {
    return this.evt.publish('orgSearch', {organization: organization, filters: filters});
    // return this.organizationService.searchOrganizationMembers(organization, filters, 0, 500);
  }

}

