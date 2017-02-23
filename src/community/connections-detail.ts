import {inject, Lazy, bindable, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {AureliaConfiguration} from 'aurelia-configuration';
import {ValidationRules, ValidationController, Validator} from 'aurelia-validation';
import {Community} from './community';
import {Connections} from './connections';
import {Session} from '../services/session';
import {DataService} from '../services/dataService';
import {CommunityService} from '../services/communityService';
import {OrganizationService} from '../services/organizationService';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
import {Prompt} from '../model/prompt';
import * as Ps from 'perfect-scrollbar'; // SCROLL
import {Grid, GridOptions, IGetRowsParams, IDatasource, Column, TextFilter} from 'ag-grid/main';
import {WizardControllerStep} from '../lib/aurelia-easywizard/controller/wizard-controller-step';
import {Utils} from '../services/util';

@inject(Session, Router, DataService, CommunityService, EventAggregator, 
  Ps, I18N, AureliaConfiguration, Utils, LogManager) // SCROLL
export class ConnectionsDetail {
  member: Object;

  selectedMembers: Array<Object>;
  selectedOrganization: any;
  membersGrid: any;
  membersSelectedGrid: any;
  // remoteData: RemoteData;

  membersPromise: Promise<Response>;
  @bindable pageSize;
  gridOptions: GridOptions;
  gridOptionsSelected: GridOptions;
  showSelectedCommunitiesGrid: boolean;
  gridColumns: Array<any>;
  grid: any;

  ps: any; // SCROLL
  parent: Connections;
  logger: Logger;
  
  constructor(private session: Session, private router: Router, 
    private dataService: DataService, private communityService: CommunityService,
    private evt: EventAggregator, Ps, private i18n: I18N, private appConfig: AureliaConfiguration, 
    private utils: Utils) {

    // this.ps = Ps; // SCROLL

    this.pageSize = 200;

    const sortAsc = Column.SORT_ASC;
    const sortDesc = Column.SORT_DESC;
    const filterEquals = TextFilter.EQUALS;
    const filterContains = TextFilter.CONTAINS;

    this.showSelectedCommunitiesGrid = false;

    let me = this;
    let gridOptions = this.utils.getGridOptions('listMembers', this.pageSize);
    gridOptions.onSelectionChanged = function() {
      me.orgMembersSelectionChanged(this);
    };
    gridOptions.getRowNodeId = function(item) {
      return item.connectId.toString();
    };
    this.gridOptions = gridOptions;
    this.evt.subscribe('communityMembersSelected', payload => {
      me.selectedMembers = payload.selectedMembers;
    });
    this.evt.subscribe('connectionChanged', payload => {
      if(payload === 'CONNECTION_TERMINATED' || 
        payload === 'REQUEST_ACCEPTED') {
        me.gridOptions.api.refreshVirtualPageCache();
        me.gridOptions.api.refreshView();
        me.gridOptionsSelected.api.refreshVirtualPageCache();
        me.gridOptionsSelected.api.refreshView();
      }
    });
    this.logger = LogManager.getLogger(this.constructor.name);
  }

  bind(bindingContext: Object, overrideContext: any) {
    this.parent = overrideContext.parentOverrideContext.bindingContext.vm;
    this.logger.debug("DiscoverDetail | bind()");
  }

  attached(params, navigationInstruction) {
    // // Custom scrollbar:
    // var container = document.getElementById('community-member-list'); // SCROLL
    // this.ps.initialize(container);
    // this.ps.update(container);
    let me = this;
    let cols = this.utils.getGridColumns('listMembers').map(function(col) {
        return {
            headerName: col.headerName,
            field: col.field
        };
    });

    this.initGrid(this);
    // Load the grid data.
    me.utils.setMemberConnectionsGridDataSource(me.gridOptions, me.pageSize, me.communityService, 'CONNECTED');

    this.gridOptionsSelected = this.utils.getGridOptions('selectedMembers', null);
    this.gridOptionsSelected.enableServerSideSorting = false;
    this.gridOptionsSelected.enableServerSideFilter = false;
    this.gridOptionsSelected.enableSorting = true;
    this.gridOptionsSelected.enableFilter = true;
    this.gridOptionsSelected.rowModelType = 'normal';
    this.gridOptionsSelected.onSelectionChanged = function() {
      me.orgMembersSelectionChanged(this);
      me.gridOptions['selection'] = me.selectedMembers;
    };
    new Grid(this.membersSelectedGrid, this.gridOptionsSelected); //create a new grid
    this.gridOptionsSelected['api'].sizeColumnsToFit();
  }

  // findGridColumnDef(gridOptions: GridOptions, fieldName: string):Object {
  //   return this.gridOptions.columnDefs.find(function(colDef: Object){
  //     return colDef['field'] === fieldName;
  //   });
  // }

  get isGridFiltered() {
    return this.gridOptions && this.gridOptions.api && this.gridOptions.api.isAnyFilterPresent();
  }

  initGrid(me) {
    // this.cmtyMembersGrid.setGridOptions(this.gridOptions);
    new Grid(this.membersGrid, this.gridOptions); //create a new grid
    // this.agGridWrap.gridCreated = true;
    this.gridOptions['api'].sizeColumnsToFit();
  }

  // setMemberConnectionsGridDataSource(gridOptions, pageSize, communityService) {
  //   const me = this;

  //   gridOptions.selection = null;

  //   let gridDataSource = {
  //       name: 'memberConnections',
  //       /** If you know up front how many rows are in the dataset, set it here. Otherwise leave blank.*/
  //       rowCount: null,
  //       paginationPageSize: pageSize,
  //       //  paginationOverflowSize: 1,
  //         maxConcurrentDatasourceRequests: 2,
  //       //  maxPagesInPaginationCache: 2,
  //       loading: false,

  //       /** Callback the grid calls that you implement to fetch rows from the server. See below for params.*/
  //       getRows: function(params: IGetRowsParams) {
  //           gridOptions.api.showLoadingOverlay();
  //         if(!this.loading) {
  //           me.logger.debug("..... setMemberConnectionsGridDataSource Loading Grid rows | startIndex: " + params.startRow);
  //           me.logger.debug("..... ..... Filter | " + Object.keys(params.filterModel));
  //           me.logger.debug("..... ..... Sort | " + params.sortModel.toString());
  //           this.loading = true;
  //           let memberId = me.session.auth['member'].memberId;
  //           let connectionsPromise = communityService.getMemberConnections('CONNECTED', params.startRow, pageSize, params);
  //           connectionsPromise.then(response => response.json())
  //             .then(data => {
  //               // Filter out existing community members.
  //               let totalCount = data.totalCount;
  //               if(gridDataSource.rowCount === null) {
  //                 gridDataSource.rowCount = totalCount;
  //               }
  //               let result = data.responseCollection.map(function(item){
  //                 return {
  //                   connectId: item.connectId,
  //                   connectStatus: item.connectStatus,
  //                   memberEntityType: item.member.memberEntityType,
  //                   memberId: item.member.memberId,
  //                   physicalPersonProfile: item.member.physicalPersonProfile
  //                 }
  //               });
  //               params.successCallback(result, totalCount);
  //               // pre-select nodes as needed.
  //               let selection = gridOptions.selection;
  //               if(Array.isArray(selection)) {
  //                 gridOptions.api.forEachNode( function (node) {
  //                     if (selection.find(function(item:any, index:number, array:any[]) {
  //                       return item.memberId === node.data.memberId
  //                     })) {
  //                         node.setSelected(true);
  //                         gridOptions.api.refreshRows([node]);
  //                     } else {
  //                         node.setSelected(false);
  //                         gridOptions.api.refreshRows([node]);
  //                     }
  //                 });
  //               }
  //               gridOptions.api.hideOverlay();
  //              this.loading = false;
  //           });
  //         }
  //       }
  //   }
  //   gridOptions.api.setDatasource(gridDataSource);
  // }

  clearGridFilters(gridOptions) {
      this.utils.clearGridFilters(gridOptions);
  }
  
  showSelectedCommunityMembers(showSelected:boolean) {
    if(showSelected) {
      this.showSelectedCommunitiesGrid = showSelected;
      let selection = this.gridOptions.api.getSelectedRows();
      // this.gridOptions.api.setDatasource(this.utils.getSelectedCommunityMembersGridDataSource('selectedCommunityMembers', this.gridOptions));
      this.gridOptionsSelected.api.setRowData(selection);
      this.gridOptionsSelected.api.selectAll();
      this.gridOptionsSelected.api.refreshView();
      this.gridOptionsSelected['api'].sizeColumnsToFit();
    } else {
      this.showSelectedCommunitiesGrid = showSelected;
      this.gridOptions.api.refreshVirtualPageCache();
    }

  };

  orgMembersSelectionChanged(scope) {
    let rows = scope.api.getSelectedRows();
    this.evt.publish('communityMembersSelected', {selectedMembers: rows});
  }


}

