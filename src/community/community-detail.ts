import {inject, Lazy, bindable, LogManager, Parent} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {AureliaConfiguration} from 'aurelia-configuration';
import {ValidationRules, ValidationController, Validator} from 'aurelia-validation';
import {Community} from './community';
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

@inject(Session, Router, DataService, CommunityService, OrganizationService, EventAggregator, 
  Ps, I18N, AureliaConfiguration, Utils, Parent.of(Community), LogManager) // SCROLL
export class CommunityDetail {
  member: Object;

  navigationInstruction: NavigationInstruction;
  selectedMembers: Array<Object>;
  selectedCmty: any;
  // communityMembers: Array<Object>;
  membersGrid: Object;
  cmtyMembersGrid: any;
  cmtyMembersSelectedGrid: any;
  addCmtyMembersGrid: any;
  currentMember: Object;
  // remoteData: RemoteData;

  membersPromise: Promise<Response>;
  cmtyMembersCachePromise:  Promise<void>;
  // @bindable columns;
  // @bindable rows;
  @bindable pageSize;
  gridOptions: GridOptions;
  gridOptionsSelected: GridOptions;
  showSelectedCommunitiesGrid: boolean;
  gridCreated: boolean;
  gridColumns: Array<any>;
  grid: any;

  ps: any; // SCROLL

  logger: Logger;
  
  constructor(private session: Session, private router: Router, 
    private dataService: DataService, private communityService: CommunityService, private organizationService: OrganizationService,
    private evt: EventAggregator, Ps, private i18n: I18N, private appConfig: AureliaConfiguration, private utils: Utils, private parent: Community) {

    // this.communityMembers = null;

    // this.ps = Ps; // SCROLL

    this.pageSize = 200;

    const sortAsc = Column.SORT_ASC;
    const sortDesc = Column.SORT_DESC;
    const filterEquals = TextFilter.EQUALS;
    const filterContains = TextFilter.CONTAINS;

    this.showSelectedCommunitiesGrid = false;

    var me = this;
    this.evt.subscribe('cmtySelected', payload => {
      if((!me.selectedCmty || me.selectedCmty === null) || (me.selectedCmty.communityId !== payload.community.communityId)) {
        me.selectedCmty = payload.community;
        // this.remoteData.setDataApi('v1/communities/' + selectedCmty + '/members')
        // DEBUG TEMP - this.getCommunityMembers(this.selectedCmty, 0);
        // this.gridDataSource.getRows({startRow: 0, endRow: this.pageSize});
        // this.loadData();

        // this.initGrid(this);

        // Clear all member selections.
        me.gridOptions.api.deselectAll();
        me.gridOptions.api.setFilterModel(null)
        me.gridOptions.api.setSortModel(null);
        me.gridOptionsSelected.api.deselectAll();
        me.gridOptionsSelected.api.setFilterModel(null)
        me.gridOptionsSelected.api.setSortModel(null);

        // Save selected communityId.
        me.gridOptions['communityId'] = me.selectedCmty.communityId;
        // Set up the virtual scrolling grid displaying community members.
        me.utils.setCommunityMembersGridDataSource('communityMembers', me.gridOptions, me.pageSize, me.communityService, null, false);
        // // FIXME: Query for IDs, in order to exclude community members from organization search.
        // // Set up collection to track available community members.
        // me.gridOptions.api.showLoadingOverlay();
        // me.getCommunityMemberIDs(me.selectedCmty.communityId, 20000).then(() => {
        //   me.gridOptions.api.hideOverlay();
        // });
        // // FIXME: Query for IDs, in order to exclude community members from organization search.
     }
    });
    this.evt.subscribe('communityMembersSelected', payload => {
      me.selectedMembers = payload.selectedMembers;
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
    let me = this;
    let cols = this.utils.getGridColumns('listMembers').map(function(col) {
        return {
            headerName: col.headerName,
            field: col.field
        };
    });

    let gridOptions = this.utils.getGridOptions('listMembers', this.pageSize);
    gridOptions.onSelectionChanged = function() {
      me.membersSelectionChanged(this);
    };
    gridOptions.getRowNodeId = function(item) {
      return item.memberId.toString();
    };
    this.gridOptions = gridOptions;
    this.initGrid(this);
    this.gridOptionsSelected = this.utils.getGridOptions('selectedMembers', null);
    this.gridOptionsSelected.onSelectionChanged = function() {
      me.membersSelectionChanged(this);
      me.gridOptions['selection'] = me.selectedMembers;
    };
    this.utils.getSelectedCommunityMembersGridDataSource('selectedCommunityMembers', this.gridOptionsSelected);
    new Grid(this.cmtyMembersSelectedGrid, this.gridOptionsSelected); //create a new grid
    this.gridOptionsSelected['api'].sizeColumnsToFit();
  }

  // findGridColumnDef(gridOptions: GridOptions, fieldName: string):Object {
  //   return this.gridOptions.columnDefs.find(function(colDef: Object){
  //     return colDef['field'] === fieldName;
  //   });
  // }

  get isGridFiltered() {
    return (!(this.showSelectedCommunitiesGrid) && 
      (this.gridOptions && this.gridOptions.api && this.gridOptions.api.isAnyFilterPresent())) ||
      ((this.showSelectedCommunitiesGrid) && 
      (this.gridOptionsSelected && this.gridOptionsSelected.api && this.gridOptionsSelected.api.isAnyFilterPresent())) ;
  }

  initGrid(me) {
    // this.cmtyMembersGrid.setGridOptions(this.gridOptions);
    new Grid(this.cmtyMembersGrid, this.gridOptions); //create a new grid
    // this.agGridWrap.gridCreated = true;
    this.gridOptions['api'].sizeColumnsToFit();
  }

  setSelectedCommunityMembersGridDataSource(dataSourceName, gridOptions, pageSize, communityService, selection, showSelected) {
    const me = this;

    // Adjust column visibility based on community type - TEAM or COI.
    let type = this.selectedCmty.communityType;

    // // Set local row model.
    //   gridOptions.enableServerSideSorting = false;
    //   gridOptions.enableServerSideFilter = false;
    //   gridOptions.rowModelType = 'normal';

      gridOptions.api.setRowData(selection);
      gridOptions.api.selectAll();

    let name = dataSourceName; //showSelected?'selectedCommunityMembers':'communityMembers';
    // let selectionFilterComponent:SelectedRowFilter = gridOptions.api.getFilterInstance('select');
    // if(showSelected) {
    //   selectionFilterComponent.setActive(true);
    //   // gridOptions.columnDefs[0].filter = new SelectedRowFilter();
    // } else {
    //   selectionFilterComponent.setActive(false);
    //   // gridOptions.columnDefs[0].filter = null;
    // }
/*    
    let gridDataSource = {
        name: name,
        rowCount: null,
        paginationPageSize: pageSize,
        //  paginationOverflowSize: 1,
          maxConcurrentDatasourceRequests: 2,
        //  maxPagesInPaginationCache: 2,
        loading: false,

        getRows: function(params: IGetRowsParams) {
          gridOptions.api.showLoadingOverlay();
          if(!this.loading) {
            me.logger.debug("..... setCommunityMembersGridDataSource Loading Grid rows | startIndex: " + params.startRow);
            me.logger.debug("..... ..... Filter | " + Object.keys(params.filterModel));
            me.logger.debug("..... ..... Sort | " + params.sortModel.toString());
            this.loading = true;
            let filter = me.findGridColumnDef(Object.keys(params.filterModel)[0]);
            me.logger.debug('Filter >> :' + JSON.stringify(params.filterModel));
            let  communityId = gridOptions.communityId;

            // let membersPromise = communityService.getCommunity(communityId, params.startRow, pageSize, params);
            // membersPromise.then(response => response.json())
            //   .then(data => {
            //     // if(gridDataSource.rowCount === null) {
            //       gridDataSource.rowCount = data.totalCount;
            //     // }
                
            //     // Filter out only selectedItems.
            //     if(showSelected) {
            //       let filteredData = [];
            //       let rows:Array<any> = data.responseCollection;
            //       rows.forEach(function(node, index, array) {
            //         if (selection.find(function(item:any, index:number, array:any[]) {
            //           return item.memberId === node.memberId;
            //         })) {
            //             filteredData.push(node);
            //         }
            //       });
            //       data.responseCollection = filteredData;
            //       data.totalCount = filteredData.length;
            //     }
                
            //     params.successCallback(data.responseCollection, data.totalCount);
            //     // pre-select nodes as needed.
            //     if(Array.isArray(selection)) {
            //       gridOptions.api.forEachNode( function (node) {
            //           if (selection.find(function(item:any, index:number, array:any[]) {
            //             return item.memberId === node.data.memberId
            //           })) {
            //               node.setSelected(true);
            //           }
            //       });
            //     }
            //     gridOptions.api.hideOverlay();
                
            //     this.loading = false;
            // });
            
            gridOptions.api.showLoadingOverlay();
            params.successCallback(selection, selection.length);
            // pre-select nodes as needed.
            if(Array.isArray(selection)) {
              gridOptions.api.forEachNode( function (node) {
                node.setSelected(true);
              });
            }
            gridOptions.api.hideOverlay();
            this.loading = false;
          }
        }
    }
    gridOptions.api.setDatasource(gridDataSource);
    */
  }

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
      this.gridOptions.api.setDatasource(this.utils.getCommunityMembersGridDataSource('communityMembers', this.gridOptions, this.pageSize, this.communityService));
    }

  };

/*  
  async getCommunityMembers(communityId: string, startIndex: number) : Promise<void> {
    let me = this;
    return this.communityService.getCommunity(communityId, startIndex, this.pageSize, null)
    .then(response => response.json())
    .then((data: any) => {
      me.logger.debug(data);
//      this.session=me.session;
      me.communityMembers = data.responseCollection;
      // me.agGridWrap.rowsChanged(me.communityMembers, null);
    }).catch(error => {
      me.logger.error("Communities members() failed."); 
      me.logger.error(error); 
    });
  }
*/

  // async getCommunityMemberIDs(communityId: string, pageSize: number) : Promise<void> {
  //   let me = this;
  //   return this.communityService.getCommunity(communityId, 0, pageSize, null)
  //   .then(response => response.json())
  //   .then((data: any) => {
  //     me.logger.debug(data);
  //     me.communityMembers = data.responseCollection.map(function(item) {
  //       return item.memberId;
  //     });
  //     // me.agGridWrap.rowsChanged(me.communityMembers, null);
  //   }).catch(error => {
  //     me.logger.error("Communities members() failed."); 
  //     me.logger.error(error); 
  //   });
  // }

  membersSelectionChanged(scope) {
    let rows = scope.api.getSelectedRows();
    this.evt.publish('communityMembersSelected', {selectedMembers: rows});
  }


}

