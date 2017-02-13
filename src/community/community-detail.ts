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
  selectedCommunityMembers: Array<Object>;
  selectedOrganizationMembers: Array<Object>;
  selectedCmty: any;
  communityMembers: Array<Object>;
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

    this.communityMembers = null;

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

        me.gridOptions.api.deselectAll();
        me.gridOptions.api.setFilterModel(null)
        me.gridOptions.api.setSortModel(null);

        // Save selected communityId.
        me.gridOptions['communityId'] = me.selectedCmty.communityId;
        // Set up the virtual scrolling grid displaying community members.
        me.utils.setCommunityMembersGridDataSource('communityMembers', me.gridOptions, me.pageSize, me.communityService, null, false);
        // Set up collection to track available community members.
        me.gridOptions.api.showLoadingOverlay();
        // FIXME: Query for IDs, in order to exclude community members from organization search.
        me.getCommunityMemberIDs(me.selectedCmty.communityId, 20000).then(() => {
          me.gridOptions.api.hideOverlay();
        });
        // FIXME: Query for IDs, in order to exclude community members from organization search.
     }
    });
    this.logger = LogManager.getLogger(this.constructor.name);
  }

  // getGridColumns(type: string) { 
  //   let columns = [];
  //   // return [
  //   columns.push({
  //     colId: 'select',
  //     headerName: '', 
  //     width: 30, 
  //     minWidth: 30, 
  //     checkboxSelection: true, 
  //     suppressMenu: true
  //   });
  //   columns.push({
  //     headerName: this.i18n.tr('community.members.firstname'), 
  //     field: "physicalPersonProfile.firstName",
  //     filter: TextSearchFilter
  //   });
  //   columns.push({
  //     headerName: this.i18n.tr('community.members.lastname'), 
  //     field: "physicalPersonProfile.lastName", 
  //     filter: TextSearchFilter
  //   });
  //   if(type == 'listMembers') {
  //     columns.push({
  //       headerName: this.i18n.tr('community.members.organization'), 
  //       field: "physicalPersonProfile.organization.organizationName",
  //       filter: TextSearchFilter,
  //       hide: false
  //     });
  //   } // else if (type === 'addMembers') {
  //     columns.push({
  //       headerName: this.i18n.tr('community.members.title'), 
  //       field: "physicalPersonProfile.jobTitle",
  //       filter: TextSearchFilter
  //     });
  //   // }
  //   columns.push({
  //     headerName: this.i18n.tr('community.members.city'), 
  //     field: "physicalPersonProfile.locationProfile.city",
  //     filter: TextSearchFilter
  //   });
  //   columns.push({
  //     headerName: this.i18n.tr('community.members.state'), 
  //     field: "physicalPersonProfile.locationProfile.stateCode", 
  //     filter: TextSearchFilter,
  //     width: 100
  //   });
  //   columns.push({
  //     headerName: this.i18n.tr('community.members.zip'), 
  //     field: "physicalPersonProfile.locationProfile.zipCode", 
  //     filter: TextSearchFilter,
  //     width: 80
  //   });

  //   return columns;
  // }

  // getGridOptions(type): GridOptions {
  //   let me = this;
  //     return {
  //     columnDefs: this.getGridColumns(type),
  //     rowSelection: 'multiple',
  //     rowHeight: 30,
  //     headerHeight: 40,
  //     suppressMenuHide: true,
  //     // pageSize: this.pageSize,
  //     paginationPageSize: this.pageSize,
  //     sortingOrder: ['desc','asc'],
  //     enableServerSideSorting: true,
  //     enableServerSideFilter: true,
  //     enableColResize: true,
  //     debug: false,
  //     rowModelType: 'virtual',
  //     maxPagesInCache: 2,
  //     onViewportChanged: function() {
  //       if(!this.api) return;
  //       this.api.sizeColumnsToFit();
  //     },
  //     onGridSizeChanged: function(){
  //       if(!this.api) return;
  //       this.api.sizeColumnsToFit();
  //     }
  //   };
  // }

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
      me.gridOptions['selection'] = me.selectedCommunityMembers;
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
    return this.gridOptions && this.gridOptions.api && this.gridOptions.api.isAnyFilterPresent();
  }

  initGrid(me) {
    // this.cmtyMembersGrid.setGridOptions(this.gridOptions);
    new Grid(this.cmtyMembersGrid, this.gridOptions); //create a new grid
    // this.agGridWrap.gridCreated = true;
    this.gridOptions['api'].sizeColumnsToFit();
  }

  // setCommunityMembersGridDataSource(dataSourceName, gridOptions, pageSize, communityService, selection, showSelected) {
  //   const me = this;

  //   // Adjust column visibility based on community type - TEAM or COI.
  //   let type = this.selectedCmty.communityType;
  // //   if(type === 'TEAM') {
  // //     // Show title and org column.
  // //     gridOptions.columnApi.setColumnVisible('physicalPersonProfile.organization.organizationName', true);
  // //     gridOptions.columnApi.setColumnVisible('physicalPersonProfile.jobTitle', true);      
  // //     gridOptions.api.sizeColumnsToFit();
  // //   } else {
  // //     gridOptions.columnApi.setColumnVisible('physicalPersonProfile.organization.organizationName', true);      
  // //     gridOptions.api.sizeColumnsToFit();
  // //     gridOptions.columnApi.autoSizeColumn('physicalPersonProfile.organization.organizationName');
  // //  }
  //   let name = dataSourceName; //showSelected?'selectedCommunityMembers':'communityMembers';
  //   // let selectionFilterComponent:SelectedRowFilter = gridOptions.api.getFilterInstance('select');
  //   // if(showSelected) {
  //   //   selectionFilterComponent.setActive(true);
  //   //   // gridOptions.columnDefs[0].filter = new SelectedRowFilter();
  //   // } else {
  //   //   selectionFilterComponent.setActive(false);
  //   //   // gridOptions.columnDefs[0].filter = null;
  //   // }

  //   selection = gridOptions.selection;

  //   let gridDataSource = {
  //       /** If you know up front how many rows are in the dataset, set it here. Otherwise leave blank.*/
  //       name: name,
  //       rowCount: null,
  //       paginationPageSize: pageSize,
  //       //  paginationOverflowSize: 1,
  //         maxConcurrentDatasourceRequests: 2,
  //       //  maxPagesInPaginationCache: 2,
  //       loading: false,

  //       /** Callback the grid calls that you implement to fetch rows from the server. See below for params.*/
  //       getRows: function(params: IGetRowsParams) {
  //         gridOptions.api.showLoadingOverlay();
  //         let selection = gridOptions.selection;
  //         // if(!this.loading) {
  //           me.logger.debug("..... setCommunityMembersGridDataSource Loading Grid rows | startIndex: " + params.startRow);
  //           me.logger.debug("..... ..... Filter | " + Object.keys(params.filterModel));
  //           me.logger.debug("..... ..... Sort | " + params.sortModel.toString());
  //           this.loading = true;
  //           let filter = me.findGridColumnDef(Object.keys(params.filterModel)[0]);
  //           me.logger.debug('Filter >> :' + JSON.stringify(params.filterModel));
  //           let  communityId = gridOptions.communityId;
  //           let membersPromise = communityService.getCommunity(communityId, params.startRow, pageSize, params);
  //           membersPromise.then(response => response.json())
  //             .then(data => {
  //               // if(gridDataSource.rowCount === null) {
  //                 gridDataSource.rowCount = data.totalCount;
  //               // }
  //               /*
  //               // Filter out only selectedItems.
  //               if(showSelected) {
  //                 let filteredData = [];
  //                 let rows:Array<any> = data.responseCollection;
  //                 rows.forEach(function(node, index, array) {
  //                   if (selection.find(function(item:any, index:number, array:any[]) {
  //                     return item.memberId === node.memberId;
  //                   })) {
  //                       filteredData.push(node);
  //                   }
  //                 });
  //                 data.responseCollection = filteredData;
  //                 data.totalCount = filteredData.length;
  //               }
  //               */
  //               params.successCallback(data.responseCollection, data.totalCount);
  //               // pre-select nodes as needed.
  //               if(Array.isArray(selection)) {
  //                 gridOptions.api.forEachNode( function (node) {
  //                     if (selection.find(function(item:any, index:number, array:any[]) {
  //                       return item.memberId === node.data.memberId
  //                     })) {
  //                         node.setSelected(true);
  //                         gridOptions.api.refreshRows([node]);
  //                     }
  //                 });
  //               }
  //               gridOptions.api.hideOverlay();
                
  //               this.loading = false;
  //           });
  //         // }
  //       }
  //   }
  //   gridOptions.api.setDatasource(gridDataSource);
  // }

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

  setOrganizationMembersGridDataSource(gridOptions, pageSize, organizationService) {
    const me = this;

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
            let orgPromise = organizationService.getOrgMembers(organizationId, params.startRow, pageSize, params);
            orgPromise.then(response => response.json())
              .then(data => {
                // Filter out existing community members.
                let totalCount = data.totalCount;
                let filteredData = data.responseCollection.filter(function(item) {
                  if(me.communityMembers.indexOf(item.memberId) < 0) {
                    return true;
                  } else {
                    return false;
                  }
                });
                totalCount = filteredData.length;
                if(gridDataSource.rowCount === null) {
                  gridDataSource.rowCount = totalCount;
                }
                params.successCallback(filteredData, totalCount);
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
  async getCommunityMemberIDs(communityId: string, pageSize: number) : Promise<void> {
    let me = this;
    return this.communityService.getCommunity(communityId, 0, pageSize, null)
    .then(response => response.json())
    .then((data: any) => {
      me.logger.debug(data);
//      this.session=me.session;
      me.communityMembers = data.responseCollection.map(function(item) {
        return item.memberId;
      });
      // me.agGridWrap.rowsChanged(me.communityMembers, null);
    }).catch(error => {
      me.logger.error("Communities members() failed."); 
      me.logger.error(error); 
    });
  }

  membersSelectionChanged(scope) {
    let rows = scope.api.getSelectedRows();
    this.selectedCommunityMembers = rows;
  }

  orgMembersSelectionChanged(scope) {
    let rows = scope.api.getSelectedRows();
    this.selectedOrganizationMembers = rows;
  }

  deleteCommunityMembers(communityMembers: Array<any>) {
    let message = null;
    var me = this;

    if(communityMembers.length === 1) {
      message = this.i18n.tr('community.communities.members.confirmDelete.messageSingle', 
          {memberName: communityMembers[0].physicalPersonProfile.firstName + ' ' +
          communityMembers[0].physicalPersonProfile.lastName});
    } else if(communityMembers.length >= 1) {
      message = this.i18n.tr('community.communities.members.confirmDelete.message',
          {memberCount: communityMembers.length});
    }
    this.dataService.openPromptDialog(this.i18n.tr('community.communities.members.confirmDelete.title'),
      message,
      communityMembers, this.i18n.tr('button.remove'), true, null, 'modelPromise', '')
    .then((controller:any) => {
      let model = controller.settings;
      // Callback function for submitting the dialog.
      controller.viewModel.submit = (communityMembers) => {
        let commMemberIds = communityMembers.map(function(obj){ 
          return obj.memberId;
        });
        // Call the delete service.
        let modelPromise = this.communityService.removeCommunityMembers(me.selectedCmty.communityId, commMemberIds);
        controller.viewModel.modelPromise = modelPromise;        
        modelPromise
        .then(response => response.json())
        .then(data => {
            // Update local cache of community members.
            me.communityMembers = me.communityMembers.filter(function(item:any) {
              return !(commMemberIds.indexOf(item.memberId >= 0));
            })

            me.gridOptions.api.refreshVirtualPageCache();
            me.gridOptions.api.refreshView();
            me.gridOptions.api.deselectAll();
            // update the community member count.
            me.selectedCmty.memberCount = data['totalCount'];
            // Close dialog on success.
            controller.ok();
          }, error => {
            model.errorMessage = "Failed"; 
            me.logger.error("Community member delete() rejected."); 
          }).catch(error => {
            model.errorMessage = "Failed"; 
            me.logger.error("Community member delete() failed."); 
            me.logger.error(error); 
            return Promise.reject(error);
          })
      };
      controller.result.then((response) => {
        if (response.wasCancelled) {
          // Cancel.
          this.logger.debug('Cancel');
        }
      })
    });
  }


  addCommunityMembers() {
    let message = null;
    let membersList = [];
    let me = this;

    let gridOptions = this.utils.getGridOptions('addMembers', this.pageSize);

    this.dataService.openResourceEditDialog({modelView:'model/organizationMembersListModel.html', 
      title:this.i18n.tr('community.communities.members.addMembers'), loadingTitle: 'app.loading',
      item:membersList, okText:this.i18n.tr('button.save'), showErrors:false, validationRules:null})
    .then((controller:any) => {
      // Ensure there is no focused element that could be submitted, since dialog has no focused form elements.
      let activeElement = <HTMLElement> document.activeElement;
      activeElement.blur();

      let model = controller.settings;
      model.isSubmitDisabled = true;
      gridOptions.onSelectionChanged = function() {
        me.orgMembersSelectionChanged(this);
        controller.viewModel.item = gridOptions.api.getSelectedRows();
        controller.viewModel.isSubmitDisabled = gridOptions.api.getSelectedRows().length === 0;
      };
      gridOptions.getRowNodeId = function(item) {
        return item.memberId.toString();
      };
      let addMembersGrid = new Grid(controller.viewModel.addCmtyMembersGrid, gridOptions); //create a new grid
      gridOptions['api'].sizeColumnsToFit();
      me.setOrganizationMembersGridDataSource(gridOptions, me.pageSize, me.organizationService);

      // controller.isGridFiltered = Object.defineProperty(controller, 'isGridFiltered', {get: function() {
      //   window.console.debug('--- isGridFiltered ---');
      //     return controller.viewModel.gridOptions && controller.viewModel.gridOptions.api && controller.viewModel.gridOptions.api.isAnyFilterPresent();
      //   }
      // });
      controller.viewModel.clearGridFilters = me.utils.clearGridFilters;
      controller.viewModel.organizations = me.parent.organizations;
      controller.viewModel.communityMembers = me.communityMembers;
      controller.viewModel.setOrganizationMembersGridDataSource = me.setOrganizationMembersGridDataSource;
      controller.viewModel.gridOptions = gridOptions;
      let organizationId = me.parent.organizations[0]['organizationId'];
      gridOptions['organizationId'] = organizationId;

      // Get list of members in a selected organization.
      controller.viewModel.selectOrganization = function(event: any) {
        if(this.selectedOrganization !== event.target.value) {
          this.selectedOrganization = event.target.value;
          gridOptions['organizationId'] = this.selectedOrganization;
          this.setOrganizationMembersGridDataSource(gridOptions, me.pageSize, me.organizationService, this.selectedOrganization);
        }
      }


      // Callback function for submitting the dialog.
      controller.viewModel.submit = () => {
        let selection = gridOptions.api.getSelectedRows();
        let orgMemberIds = selection.map(function(obj){ 
          return obj.memberId;
        });

        // Call the addMembers service.
        let modelPromise = this.communityService.addCommunityMembers(this.selectedCmty.communityId, orgMemberIds);
        controller.viewModel.modelPromise = modelPromise;        
        modelPromise
        .then(response => response.json())
        .then(data => {
            // Update local cache of community members.
            Array.prototype.splice.apply(me.communityMembers,[].concat(me.communityMembers.length,0,orgMemberIds));

            me.gridOptions.api.refreshVirtualPageCache();
            me.gridOptions.api.refreshView();
            me.gridOptions.api.deselectAll();
            // update the community member count.
            me.selectedCmty.memberCount = data['totalCount'];
            // Close dialog on success.
            gridOptions.api.destroy();
            controller.ok();
          }, error => {
            model.errorMessage = "Failed"; 
            me.logger.error("Community member delete() rejected."); 
          }).catch(error => {
            model.errorMessage = "Failed"; 
            me.logger.error("Community member delete() failed."); 
            me.logger.error(error); 
            return Promise.reject(error);
          }) 
      };
      controller.viewModel.showSelectedOrganizationMembers = function(showSelected:boolean) {
        if(showSelected) {
          let selection = gridOptions.api.getSelectedRows();
          me.setSelectedOrganizationMembersGridDataSource(gridOptions, me.pageSize, selection);
        } else {
          me.setOrganizationMembersGridDataSource(gridOptions, me.pageSize, me.organizationService);
        }
      };

      controller.result.then((response) => {
        if (response.wasCancelled) {
          // Cancel.
          gridOptions.api.destroy();
          this.logger.debug('Cancel');
        }
      })
    });
    
  }

  sendConnectionRequest() {

    let message = null;
    var me = this;
    let communityMembers:any[];
    communityMembers = this.gridOptions.api.getSelectedRows();

    if(communityMembers.length === 1) {
      message = this.i18n.tr('community.communities.members.call.callConfirmMessageSingle', 
          {memberName: communityMembers[0].physicalPersonProfile.firstName + ' ' +
          communityMembers[0].physicalPersonProfile.lastName});
    } else if(communityMembers.length >= 1) {
      message = this.i18n.tr('community.communities.members.call.callConfirmMessage',
          {memberCount: communityMembers.length});
    }
    const vRules = ValidationRules
      .ensure('item').maxItems(1)
      .withMessage(this.i18n.tr('community.communities.call.callParticipantMaxCountError', {count:1}))
      .rules;

    this.dataService.openPromptDialog(this.i18n.tr('community.communities.sendConnectionRequest'),
      message,
      communityMembers, this.i18n.tr('button.call'), true, vRules, 'modelPromise', '')
    .then((controller:any) => {
      let model = controller.settings;
      // Callback function for submitting the dialog.
      controller.viewModel.submit = (communityMembers:any[]) => {
        // Add logged-in user to the call list.
        communityMembers.unshift(me.session.auth['member']);
        let memberIDs = communityMembers.map(function(value) {
          return {
            "participantId": value.memberId,
            "participantType": "MEMBER"
          }
        });
        // Call the service to start the call.
        let modelPromise = this.communityService.startConferenceCall({participantRef:memberIDs});
        controller.viewModel.modelPromise = modelPromise;        
        modelPromise
        .then(response => response.json())
        .then(data => {
            // Update the message for success.
            controller.viewModel.messagePrefix = 'global.success';
            controller.viewModel.status = 'OK';
            controller.viewModel.message = this.i18n.tr('community.communities.members.call.callSuccessMessage');
            controller.viewModel.okText = this.i18n.tr('button.ok');
            controller.viewModel.showCancel = false;
            // Close dialog on success.
            delete controller.viewModel.submit;
          }, error => {
            controller.viewModel.messagePrefix = 'global.failed';
            controller.viewModel.status = 'ERROR';
            model.errorMessage = this.i18n.tr('community.communities.members.call.callFailedMessage'); 
            me.logger.error("Community member call() rejected."); 
          }).catch(error => {
            controller.viewModel.messagePrefix = 'global.failed';
            controller.viewModel.status = 'ERROR';
            model.errorMessage = this.i18n.tr('community.communities.members.call.callFailedMessage'); 
            me.logger.error("Community member call() failed."); 
            me.logger.error(error); 
            return Promise.reject(error);
          })
      };
      controller.result.then((response) => {
        if (response.wasCancelled) {
          // Cancel.
          this.logger.debug('Cancel');
        }
      })
    });
  }
  
/*
  loadData() {
    //tell grid to set loading overlay while we get our data
    this.membersGrid['ctx'].setLoadingOverlay(true);
    
    //set limit//offset in our dataclass
    this.remoteData.setLimit(40);
    this.remoteData.setOffset(0);
    
    //get the data from class
    this.remoteData.getData()
      .then((data)=>{
        //set data to grid (the data have limit % length included)
        //-> data ={col:data.result, length:data.length, limit:40}
        // you could include offset here if you wanted..
        this.membersGrid['ctx'].setData(data);
      })
  }

  callRemoteServer(param){//filterArray, orderByArray, callback) {

    this.remoteData.createOrderByString(param.sort);
    this.remoteData.createQueryString(param.filter);
    this.remoteData.setLimit(param.limit);
    this.remoteData.setOffset(param.offset);

    return this.remoteData.getData()
      .then((data)=> {
        return data;
      }).catch((err)=> {
        console.error(err);
        //param.callback([]);
      });
  }
*/


}

