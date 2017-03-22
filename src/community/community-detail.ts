import {inject, Lazy, bindable, LogManager, Parent} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {AureliaConfiguration} from 'aurelia-configuration';
import {ValidationRules, ValidationController, Validator} from 'aurelia-validation';
import {Community} from './community';
import {Session} from '../services/session';
import {CommunityService} from '../services/communityService';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
import * as Ps from 'perfect-scrollbar'; // SCROLL
import {Grid, GridOptions, IGetRowsParams, IDatasource, Column, TextFilter} from 'ag-grid/main';
import {Utils} from '../services/util';

@inject(Session, CommunityService, EventAggregator, 
  Ps, I18N, AureliaConfiguration, Utils, Parent.of(Community), LogManager) // SCROLL
export class CommunityDetail {

  isSelectedMembers: boolean;
  showSelectedMembers: boolean;
  selectedCmty: any;

  currentMember: Object;

  membersPromise: Promise<Response>;
  cmtyMembersCachePromise:  Promise<void>;
  @bindable pageSize;
  gridOptions: GridOptions;
  grid: any;

  ps: any; // SCROLL

  logger: Logger;
  
  constructor(private session: Session, private communityService: CommunityService,
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

    this.evt.subscribe('cmtySelected', payload => {
      if((!me.selectedCmty || me.selectedCmty === null) || (me.selectedCmty.communityId !== payload.community.communityId)) {
        me.selectedCmty = payload.community;
        // Save selected communityId.
        me.gridOptions['communityId'] = me.selectedCmty.communityId;
        // Clear all member selections.
        me.isSelectedMembers = false;
        me.showSelectedMembers = false;

        if(!!(me.gridOptions.api)) {
          me.gridOptions.api.deselectAll();
          me.gridOptions.api.setFilterModel(null)
          me.gridOptions.api.setSortModel(null);
          // Set up the virtual scrolling grid displaying community members.
          me.gridOptions.api.refreshVirtualPageCache();
          me.gridOptions.api.refreshView();
        }
        me.utils.setMemberGridDataSource(me.gridOptions, me.communityService, me.communityService.getCommunity, {startIndex: 0, pageSize: me.pageSize, communityId: me.selectedCmty.communityId});

        // me.utils.setCommunityMembersGridDataSource('communityMembers', me.gridOptions, me.pageSize, me.communityService, null, false);
     }
    });
    this.evt.subscribe('communityMembersSelected', payload => {
      me.isSelectedMembers = payload.selectedMembers;
    });
    this.logger = LogManager.getLogger(this.constructor.name);
  }

  activate(params, navigationInstruction) {
  }

  bind(bindingContext: Object, overrideContext: Object) {
    this.logger.debug("CommunityDetail | bind()");
  }

  attached(params, navigationInstruction) {
    // // Custom scrollbar:
    // var container = document.getElementById('community-member-list'); // SCROLL
    // this.ps.initialize(container);
    // this.ps.update(container);
  }

  onGridReady(event) {
    let grid:any = this;
    // grid.context.utils.setMemberGridDataSource(grid.context.gridOptions, grid.context.communityService, grid.context.communityService.getMemberConnections, {startIndex: 0, pageSize: grid.context.pageSize, communityId: grid.context.selectedCmty.communityId});
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
    this.evt.publish('communityMembersSelected', {selectedMembers: selected, memberType: 'COM'});
  }

}

