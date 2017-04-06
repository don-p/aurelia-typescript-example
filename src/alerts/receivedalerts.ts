import {inject, NewInstance, Lazy, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {Router, NavigationInstruction} from 'aurelia-router';
import {DataService} from '../services/dataService';
import {Session} from '../services/session';
import {I18N} from 'aurelia-i18n';
import {Grid, GridOptions, Column, TextFilter} from 'ag-grid/main';
import {WizardControllerStep} from '../lib/aurelia-easywizard/controller/wizard-controller-step';
import {AureliaConfiguration} from 'aurelia-configuration';
import {ValidationRules, ValidationController, Validator} from 'aurelia-validation';
import {CommunityService} from '../services/communityService';
import {OrganizationService} from '../services/organizationService';
import {Utils} from '../services/util';
import {MemberActionsBarCustomElement} from '../components/member-actions-bar';

@inject(Session, DataService, CommunityService, OrganizationService, I18N, AureliaConfiguration, Utils, MemberActionsBarCustomElement, LogManager)
export class ReceivedAlerts {

  router: Router;
  // alertCategories: Array<Object>;
  organizations: Array<any>;
  organizationsPromise: Promise<Response>;

  logger: Logger;
  pageSize;

  constructor(private session: Session, private dataService: DataService, private communityService: CommunityService, private organizationService: OrganizationService, private i18n: I18N, private appConfig: AureliaConfiguration, private utils: Utils) {
    this.pageSize = 200;
    this.logger = LogManager.getLogger(this.constructor.name);
  }


  bind(bindingContext: Object, overrideContext: Object) {
    this.logger.debug("ReceivedAlerts | bind()");
  }

  activate() {
    // Wait for required view data before routing, by returning a Promise from activate().

    // Get list of organizations the logged-in user has rights to.
    // let promise =  this.getOrganizationsPage(0, 500);

    // return promise;
  }


}

