import {inject, Lazy, bindable, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {ValidationRules, ValidationController, Validator} from 'aurelia-validation';
import {Session} from '../services/session';
import {OrganizationService} from '../services/organizationService';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
import * as Ps from 'perfect-scrollbar'; // SCROLL
import {Grid, GridOptions, IGetRowsParams, IDatasource, Column, TextFilter} from 'ag-grid/main';
import {TextSearchFilter} from '../lib/grid/textSearchFilter';

@inject(Session, Router, OrganizationService, EventAggregator, Ps, I18N, LogManager) // SCROLL
export class Organization {
  member: Object;

  organizations: Array<Object>;
  items:Array<Object>;
  pageSize: number;
  orgPromise: Promise<Response>;

  navigationInstruction: NavigationInstruction;
  selectedOrganizationMembers: Array<Object>;
  selectedItem: Object;
  membersGrid: Object;
  cmtyMembersGrid: any;
  addCmtyMembersGrid: any;
  currentMember: Object;
  // remoteData: RemoteData;

  membersPromise: Promise<Response>;
  cmtyMembersCachePromise:  Promise<void>;
  // @bindable columns;
  // @bindable rows;
  gridOptions: GridOptions;
  gridCreated: boolean;
  gridColumns: Array<any>;
  grid: any;


  ps: any; // SCROLL

  logger: Logger;
  
  constructor(private session: Session, private router: Router, 
    private organizationService: OrganizationService, 
    private evt: EventAggregator, Ps, private i18n: I18N) {

    this.ps = Ps;
    this.organizations = [];
    this.organizations['responseCollection'] = [];
    this.pageSize = 500;
    this.selectedItem = null;
    this.logger = LogManager.getLogger(this.constructor.name);
    this.pageSize = 200;

    const sortAsc = Column.SORT_ASC;
    const sortDesc = Column.SORT_DESC;
    const filterEquals = TextFilter.EQUALS;
    const filterContains = TextFilter.CONTAINS;


  }
  activate(params, navigationInstruction) {
    this.navigationInstruction = navigationInstruction;
  }

  bind(bindingContext: Object, overrideContext: Object) {
    this.logger.debug("Community | bind()");
  }
  attached() {
    this.logger.debug("Community | attached()");
    
    // Custom scrollbar:
    var container = document.getElementById('community-list');
    this.ps.initialize(container);
    this.ps.update(container);
    let me = this;
    this.getOrganizationsPage(0, this.pageSize).then(function(){
      me.selectDefaultOrganization();
    });
  }

  selectDefaultOrganization() {
    if(this.organizations && this.organizations.length > 0) {
      this.selectOrganization(this.organizations[0]);
    }
  }

  selectOrganization(organization: Object) {
    this.selectedItem = organization;
    this.scrollToCommunityInList(organization);
    this.evt.publish('orgSelected', {organization: organization});
  }

  scrollToCommunityInList(community:any) {
    let me = this;
    setTimeout(function() {
      // Scroll selected item into view.
      let container = $('#community-list')[0];
      let element = $('#org-'+community['id'])[0];
      if(typeof element === 'object') {
        me.logger.debug("scrolTo element: " + element);
        let offset = element.offsetTop;
        if(offset > (container.clientHeight - element.clientHeight)) {
          container.scrollTop = offset;
        }
      }
    }, 0);
  }

  getOrganizationsPage(startIndex: number, pageSize: number): Promise<Response> {
    var me = this;
    var orgPromise = this.organizationService.getMemberOrgs(startIndex,  pageSize);
    this.orgPromise = orgPromise;
    return orgPromise
    .then(response => {return response.json()
      .then(data => {
        me.organizations = data.responseCollection;
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

