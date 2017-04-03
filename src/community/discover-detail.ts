import {inject, Lazy, bindable, LogManager, Parent} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {AureliaConfiguration} from 'aurelia-configuration';
import {ValidationRules, ValidationController, Validator} from 'aurelia-validation';
import {Community} from './community';
import {Session} from '../services/session';
import {OrganizationService} from '../services/organizationService';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
import {Prompt} from '../model/prompt';
import * as Ps from 'perfect-scrollbar'; // SCROLL
import {Grid, GridOptions, IGetRowsParams, IDatasource, Column, TextFilter} from 'ag-grid/main';
import {Utils} from '../services/util';

@inject(Session, OrganizationService, EventAggregator, 
  Ps, I18N, AureliaConfiguration, Utils, Parent.of(Community), LogManager) // SCROLL
export class DiscoverDetail {

  isSelectedMembers: boolean;
  showSelectedMembers: boolean;
  selectedCmty: any;

  selectedOrganization: any;
  orgFilters: Array<any>;
  membersGrid: Object;
  orgMembersGrid: any;
  orgMembersSelectedGrid: any;
  addCmtyMembersGrid: any;
  currentMember: Object;
  // remoteData: RemoteData;

  membersPromise: Promise<Response>;
  cmtyMembersCachePromise:  Promise<void>;
  // @bindable columns;
  // @bindable rows;
  @bindable pageSize;
  gridOptions: GridOptions;

  ps: any; // SCROLL

  logger: Logger;
  
  constructor(private session: Session, private organizationService: OrganizationService,
    private evt: EventAggregator, Ps, private i18n: I18N, private appConfig: AureliaConfiguration, private utils: Utils, private parent: Community) {

    // this.ps = Ps; // SCROLL

    this.pageSize = 100000;
    this.showSelectedMembers = false;

    let me = this;
    this.gridOptions = <GridOptions>{};
    this.gridOptions.getRowNodeId = function(item) {
      return item.memberId.toString();
    };
    this.gridOptions.rowModelType = 'virtual';

    this.evt.subscribe('orgSearch', payload => {
      me.selectedOrganization = payload.organization;
      me.orgFilters = payload.filters;

      me.gridOptions.api.deselectAll();
      me.gridOptions.api.setFilterModel(null)
      me.gridOptions.api.setSortModel(null);

      // Save selected organizationId.
      me.gridOptions['organizationId'] = me.selectedOrganization.organizationId;
      me.gridOptions['orgFilters'] = me.orgFilters;
      // Set up the virtual scrolling grid displaying organization members.
      me.utils.setMemberGridDataSource(
        me.gridOptions, 
        me.organizationService, 
        me.organizationService.searchOrganizationMembers, 
        {startIndex: 0, pageSize: me.pageSize, organizationId: me.selectedOrganization.organizationId, filters: me.orgFilters},
        false
      );
      // Set up collection to track available community members.
      me.gridOptions.api.showLoadingOverlay();
     
    });
    this.evt.subscribe('orgSelected', payload => {
      me.selectedOrganization = payload.organization;
      me.orgFilters = [];
      // Save selected organizationId.
      me.gridOptions['organizationId'] = me.selectedOrganization.organizationId;
      me.gridOptions['orgFilters'] = me.orgFilters;
     if(!!(me.gridOptions.api)) {
        me.gridOptions.api.deselectAll();
        me.gridOptions.api.setFilterModel(null)
        me.gridOptions.api.setSortModel(null);
        // Load the grid data.
        // Set up the virtual scrolling grid displaying community members.
        me.gridOptions.api.refreshVirtualPageCache();
        me.gridOptions.api.refreshView();
        // Set up collection to track available community members.
        me.gridOptions.api.showLoadingOverlay();
      }
      me.utils.setMemberGridDataSource(
        me.gridOptions, 
        me.organizationService, 
        me.organizationService.searchOrganizationMembers, 
        {startIndex: 0, pageSize: me.pageSize, organizationId: me.selectedOrganization.organizationId, filters: me.orgFilters}, 
        false
      );
    });
    this.evt.subscribe('communityMembersSelected', payload => {
      me.isSelectedMembers = payload.isSelectedMembers;
    });
    this.logger = LogManager.getLogger(this.constructor.name);
  }

  bind(bindingContext: Object, overrideContext: Object) {
    this.logger.debug("DiscoverDetail | bind()");
  }

  attached(params, navigationInstruction) {
    this.logger.debug("DiscoverDetail | attached()");
    // // Custom scrollbar:
    // var container = document.getElementById('community-member-list'); // SCROLL
    // this.ps.initialize(container);
    // this.ps.update(container);

    // this.evt.publish('childViewAttached', 'discover-detail');
  }

  onGridReady(event) {
    let grid:any = this;
    // grid.context.utils.setMemberGridDataSource(grid.context.gridOptions, grid.context.communityService, grid.context.communityService.getMemberConnections, {startIndex: 0, pageSize: grid.context.pageSize, communityId: grid.context.selectedCmty.communityId});
    grid.context.evt.publish('childViewAttached', 'discover-detail');
    event.api.sizeColumnsToFit();
  }

  onFilterChanged = function(event) {
    this.utils.setGridFilterMap(this.gridOptions);
  }

  onSelectionChanged = function() {
    this.context.membersSelectionChanged(this.context.gridOptions);
  };

  get isGridFiltered() {
    return (this.gridOptions && this.gridOptions.api && this.gridOptions.api.isAnyFilterPresent()) ;
  }

  clearGridFilters(gridOptions, filterName) {
      this.utils.clearGridFilters(gridOptions, filterName);
  }
  
  showSelectedCommunityMembers(showSelected:boolean) {
    this.gridOptions['showSelected'] = showSelected;
    this.showSelectedMembers = showSelected;
    this.gridOptions.api.refreshVirtualPageCache();

  };

  membersSelectionChanged(scope) {
    let selected = scope.api.getSelectedRows().length != 0;
    this.evt.publish('communityMembersSelected', {selectedMembers: scope.api.getSelectedRows(), isSelectedMembers: selected, memberType: 'ORG'});
  }

}

