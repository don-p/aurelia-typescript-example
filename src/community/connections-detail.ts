import {inject, Lazy, bindable, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {AureliaConfiguration} from 'aurelia-configuration';
import {ValidationRules, ValidationController, Validator} from 'aurelia-validation';
import {Community} from './community';
import {Connections} from './connections';
import {Session} from '../services/session';
import {CommunityService} from '../services/communityService';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
import * as Ps from 'perfect-scrollbar'; // SCROLL
import {Grid, GridOptions, IGetRowsParams, IDatasource, Column, TextFilter} from 'ag-grid/main';
import {Utils} from '../services/util';
import {TextSearchFilter} from '../lib/grid/textSearchFilter';

@inject(Session, CommunityService, EventAggregator, 
  Ps, I18N, AureliaConfiguration, Utils, LogManager) // SCROLL
export class ConnectionsDetail {

  isSelectedMembers: boolean;
  showSelectedMembers: boolean;
  selectedOrganization: any;

  membersPromise: Promise<Response>;
  @bindable pageSize;
  gridOptions: GridOptions;
  ps: any; // SCROLL
  parent: Connections;
  logger: Logger;
  
  constructor(private session: Session, private communityService: CommunityService,
    private evt: EventAggregator, Ps, private i18n: I18N, private appConfig: AureliaConfiguration, 
    private utils: Utils) {

    // this.ps = Ps; // SCROLL

    this.pageSize = 100000;

    this.showSelectedMembers = false;

    let me = this;

    this.gridOptions = <GridOptions>{};
    this.gridOptions.getRowNodeId = function(item) {
      return item.connectId.toString();
    };
    this.gridOptions.rowModelType = 'virtual';

    this.evt.subscribe('communityMembersSelected', payload => {
      me.isSelectedMembers = payload.selectedMembers;
    });
    this.evt.subscribe('connectionChanged', payload => {
      if(payload === 'CONNECTION_TERMINATED' || 
        payload === 'REQUEST_ACCEPTED') {
        me.gridOptions.api.refreshVirtualPageCache();
        me.gridOptions.api.refreshView();
      }
    });
    this.logger = LogManager.getLogger(this.constructor.name);
  }

  bind(bindingContext: Object, overrideContext: any) {
    let me = this;
    this.parent = overrideContext.parentOverrideContext.bindingContext.vm;

    // this.gridOptions.isExternalFilterPresent = function() {
    //     // if selection is 'true', then we are filtering
    //     return !!(this.selection);
    // }

    // this.gridOptions.doesExternalFilterPass = function(node) {
    //     let pass = node.isSelected();
    //     me.logger.debug("== EXtERNAL FILTER ==");
    //     return pass;
    // }


    this.logger.debug("ConnectionsDetail | bind()");
  }

  attached(params, navigationInstruction) {
    // // Custom scrollbar:
    // var container = document.getElementById('community-member-list'); // SCROLL
    // this.ps.initialize(container);
    // this.ps.update(container);
  }

  onGridReady(event, scope) {
    let grid:any = this;
    grid.context.utils.setMemberGridDataSource(grid.context.gridOptions, grid.context.communityService, grid.context.communityService.getMemberConnections, {startIndex: 0, pageSize: grid.context.pageSize, connectionStatus: 'CONNECTED'});
    event.api.sizeColumnsToFit();
  }

  // private getTextSearchFilter(): any {
  //   return TextSearchFilter;
  // }

  onFilterChanged = function(event, scope) {
    this.utils.setGridFilterMap(this.gridOptions);
  }
  onSelectionChanged = function(event, scope) {
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

  membersSelectionChanged(scope: GridOptions) {
    let selected = scope.api.getSelectedRows().length != 0;
    this.evt.publish('communityMembersSelected', {selectedMembers: selected, memberType: 'CON'});
  }


}

