import {inject, NewInstance, Lazy, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {Router, NavigationInstruction} from 'aurelia-router';
import {DataService} from '../services/dataService';
import {Session} from '../services/session';
import {I18N} from 'aurelia-i18n';
import {Grid, GridOptions, IGetRowsParams, IDatasource, Column, TextFilter} from 'ag-grid/main';
import {WizardControllerStep} from '../lib/aurelia-easywizard/controller/wizard-controller-step';
import {AureliaConfiguration} from 'aurelia-configuration';
import {ValidationRules, ValidationController, Validator} from 'aurelia-validation';
import {CommunityService} from '../services/communityService';
import {OrganizationService} from '../services/organizationService';
import {Utils} from '../services/util';
import {MemberActionsBar} from '../components/memberActionsBar';

@inject(Session, DataService, CommunityService, OrganizationService, I18N, AureliaConfiguration, Utils, MemberActionsBar, LogManager)
export class Community {

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

  // Child router for subtabs - Community, Discover, Connections.
  configureRouter(config, router) {
    config.map([
      { 
        route: '', redirect: 'communities', nav: false
      },
      { 
        route: 'communities', name: 'community/communities', moduleId: './communities', 
        nav: true, title: this.i18n.tr('router.nav.communities'), 
        settings:{
          detailView: 'community-detail', 
          memberActions: [
            MemberActionsBar.GRIDCALL, 
            MemberActionsBar.ALERT, 
            MemberActionsBar.CONNECT, 
            MemberActionsBar.ADDMEMBER, 
            MemberActionsBar.REMOVEMEMBER,
            MemberActionsBar.TRANSFEROWNER
          ]
        }
      },
      { 
        route: 'connections', name: 'community/connections', moduleId: './connections', 
        nav: true, title: this.i18n.tr('router.nav.connections'), 
        settings:{detailView: 'connections-detail'}
      },
      { 
        route: 'discover', name: 'community/discover', moduleId: './discover', 
        nav: true, title: this.i18n.tr('router.nav.discover'), 
        settings:{detailView: 'discover-detail'}
      }
    ]);

    // router.hasAction = (instruction: NavigationInstruction, action: string) {
    //   const actions:Array<string> = instruction.config.settings.actions;
    //   return actions.includes(action);
    // }

    this.router = router;
  }

  bind(bindingContext: Object, overrideContext: Object) {
    this.logger.debug("Community | bind()");
  }

  activate() {
    // Wait for required view data before routing, by returning a Promise from activate().

    // Get list of organizations the logged-in user has rights to.
    let promise =  this.getOrganizationsPage(0, 500);

    return promise;
  }


  getOrganizationsPage(startIndex: number, pageSize: number): Promise<Response> {
    var me = this;
    var orgPromise = this.organizationService.getMemberOrgs(startIndex,  pageSize);
    return orgPromise
    .then(response => {return response.json()
      .then(data => {
        me.organizations = data.responseCollection;
        return data;
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

}

