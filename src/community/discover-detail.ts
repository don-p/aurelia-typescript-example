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
export class DiscoverDetail {
  member: Object;

  navigationInstruction: NavigationInstruction;
  selectedCommunityMembers: Array<Object>;
  selectedOrganizationMembers: Array<Object>;
  selectedOrganizationId: any;
  orgFilters: Array<any>;
  communityMembers: Array<Object>;
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

    this.communityMembers = null;

    // this.ps = Ps; // SCROLL

    this.pageSize = 200;

    const sortAsc = Column.SORT_ASC;
    const sortDesc = Column.SORT_DESC;
    const filterEquals = TextFilter.EQUALS;
    const filterContains = TextFilter.CONTAINS;

    this.showSelectedCommunitiesGrid = false;

    var me = this;
    this.evt.subscribe('orgSearch', payload => {
      me.selectedOrganizationId = payload.organization;
      me.orgFilters = payload.filters;

      me.gridOptions.api.deselectAll();
      me.gridOptions.api.setFilterModel(null)
      me.gridOptions.api.setSortModel(null);

      // Save selected organizationId.
      me.gridOptions['organizationId'] = me.selectedOrganizationId;
      me.gridOptions['orgFilters'] = me.orgFilters;
      // Set up the virtual scrolling grid displaying community members.
      me.setOrganizationMembersGridDataSource(me.gridOptions, me.pageSize, me.organizationService);
      // Set up collection to track available community members.
      me.gridOptions.api.showLoadingOverlay();
     
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
      me.orgMembersSelectionChanged(this);
    };
    gridOptions.getRowNodeId = function(item) {
      return item.memberId.toString();
    };
    this.gridOptions = gridOptions;
    this.initGrid(this);
    this.gridOptionsSelected = this.utils.getGridOptions('selectedMembers', null);
    this.gridOptionsSelected.onSelectionChanged = function() {
      me.orgMembersSelectionChanged(this);
      me.gridOptions['selection'] = me.selectedCommunityMembers;
    };
    this.utils.getSelectedCommunityMembersGridDataSource('selectedCommunityMembers', this.gridOptionsSelected);
    new Grid(this.orgMembersSelectedGrid, this.gridOptionsSelected); //create a new grid
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
    new Grid(this.orgMembersGrid, this.gridOptions); //create a new grid
    // this.agGridWrap.gridCreated = true;
    this.gridOptions['api'].sizeColumnsToFit();
  }

  setOrganizationMembersGridDataSource(gridOptions, pageSize, organizationService) {
    const me = this;
    let organizationId = gridOptions.organizationId;
    let filters = gridOptions.orgFilters;

    let gridDataSource = {
        name: 'organizationMembers',
        /** If you know up front how many rows are in the dataset, set it here. Otherwise leave blank.*/
        rowCount: null,
        paginationPageSize: pageSize,
        //  paginationOverflowSize: 1,
          maxConcurrentDatasourceRequests: 2,
        //  maxPagesInPaginationCache: 2,
        loading: false,

        /** Callback the grid calls that you implement to fetch rows from the server. See below for params.*/
        getRows: function(params: IGetRowsParams) {
            gridOptions.api.showLoadingOverlay();
          if(!this.loading) {
            me.logger.debug("..... setOrganizationMembersGridDataSource Loading Grid rows | startIndex: " + params.startRow);
            me.logger.debug("..... ..... Filter | " + Object.keys(params.filterModel));
            me.logger.debug("..... ..... Sort | " + params.sortModel.toString());
            this.loading = true;
            let  organizationId = gridOptions.organizationId;
            let orgPromise = organizationService.searchOrganizationMembers(organizationId, filters, params.startRow, pageSize, params);
            orgPromise.then(response => response.json())
              .then(data => {
                // Filter out existing community members.
                let totalCount = data.totalCount;
                if(gridDataSource.rowCount === null) {
                  gridDataSource.rowCount = totalCount;
                }
                params.successCallback(data.responseCollection, totalCount);
                gridOptions.api.hideOverlay();
               this.loading = false;
            });
          }
        }
    }
    gridOptions.api.setDatasource(gridDataSource);
  }

  setSelectedOrganizationMembersGridDataSource(gridOptions, pageSize, selection) {
    const me = this;

    let gridDataSource = {
        name: 'selectedOrganizationMembers',
        /** If you know up front how many rows are in the dataset, set it here. Otherwise leave blank.*/
        rowCount: null,
        paginationPageSize: pageSize,
        //  paginationOverflowSize: 1,
        maxConcurrentDatasourceRequests: 2,
        //  maxPagesInPaginationCache: 2,
        loading: false,

        /** Callback the grid calls that you implement to fetch rows from the server. See below for params.*/
        getRows: function(params: IGetRowsParams) {
          me.logger.debug("..... setSelectedOrganizationMembersGridDataSource Loading Grid rows | startIndex: " + params.startRow);
          gridOptions.api.showLoadingOverlay();
          params.successCallback(selection, selection.length);
          gridOptions.api.hideOverlay();
        }
    }
    gridOptions.api.setDatasource(gridDataSource);
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


  membersSelectionChanged(scope) {
    let rows = scope.api.getSelectedRows();
    this.selectedCommunityMembers = rows;
  }

  orgMembersSelectionChanged(scope) {
    let rows = scope.api.getSelectedRows();
    this.selectedOrganizationMembers = rows;
  }


}

