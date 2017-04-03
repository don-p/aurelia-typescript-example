import {inject, Lazy, bindable, LogManager, Parent, containerless, customElement} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {Router, NavigationInstruction} from 'aurelia-router';
import {ValidationRules, ValidationController, Validator} from 'aurelia-validation';
//import {Community} from '../community/community';
import {Session} from '../services/session';
import {DataService} from '../services/dataService';
import {CommunityService} from '../services/communityService';
import {OrganizationService} from '../services/organizationService';
import {AureliaConfiguration} from 'aurelia-configuration';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
import {Utils} from '../services/util';
import {Grid, GridOptions, Column, TextFilter} from 'ag-grid/main';

// @containerless
@inject(Session, Router, DataService, CommunityService, OrganizationService, EventAggregator, 
  I18N, AureliaConfiguration, Utils, LogManager) // SCROLL
export class ClearFilterButtonCustomElement {  

    navigationInstruction: NavigationInstruction;

    parent: any;
 
    @bindable pageSize;
    @bindable gridOptions: GridOptions;
 
    logger: Logger;


  constructor(private session: Session, private router: Router, 
    private dataService: DataService, private communityService: CommunityService, private organizationService: OrganizationService,
    private evt: EventAggregator, private i18n: I18N, private appConfig: AureliaConfiguration, private utils: Utils/*, private parent: Community*/){
    

    this.logger = LogManager.getLogger(this.constructor.name);
  }


  bind(context, originalContext) {
    this.parent = context;

  }
  
  getI18NFilterKey (filterName: string) {
    let profileKey = 'physicalPersonProfile';
    if(filterName.indexOf(profileKey) >= 0) {
      return filterName.substring(filterName.indexOf(profileKey));
    }
    return filterName;
  }

  get isGridFiltered() {
    return (this.gridOptions && this.gridOptions.api && this.gridOptions.api.isAnyFilterPresent()) ;
  }

  clearGridFilters(gridOptions, filterName) {
      this.utils.clearGridFilters(gridOptions, filterName);
  }
  
}