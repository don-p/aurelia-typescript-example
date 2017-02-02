import {inject, Lazy, bindable, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {AureliaConfiguration} from 'aurelia-configuration';
import {ValidationRules, ValidationController, Validator} from 'aurelia-validation';
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
  Ps, I18N, AureliaConfiguration, Utils, LogManager) // SCROLL
export class CommunityDetail {
  member: Object;

  navigationInstruction: NavigationInstruction;
  selectedCommunityMembers: Array<Object>;
  selectedOrganizationMembers: Array<Object>;
  selectedCmty: any;
  organizations: Array<Object>;
  alertCategories: Array<Object>;
  // communityMembers: { get: () => any[] };
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
    private evt: EventAggregator, Ps, private i18n: I18N, private appConfig: AureliaConfiguration, private utils: Utils) {

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
    // Get list of organizations the logged-in user has rights to.
    this.getOrganizationsPage(0, 500);
    // Get list of alert/notification categories.
    this.getAlertCategoriesPage(0, 500);
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

  bind() {
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
      message = this.i18n.tr('community.members.confirmDelete.messageSingle', 
          {memberName: communityMembers[0].physicalPersonProfile.firstName + ' ' +
          communityMembers[0].physicalPersonProfile.lastName});
    } else if(communityMembers.length >= 1) {
      message = this.i18n.tr('community.members.confirmDelete.message',
          {memberCount: communityMembers.length});
    }
    this.dataService.openPromptDialog(this.i18n.tr('community.members.confirmDelete.title'),
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

  getAlertCategoriesPage(startIndex: number, pageSize: number): Promise<Response> {
    var me = this;
    var alertPromise = this.dataService.getAlertCategories(startIndex,  pageSize);
    return alertPromise
    .then(response => {return response.json()
      .then(data => {
        me.alertCategories = data.responseCollection;
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

  getOrganizationsPage(startIndex: number, pageSize: number): Promise<Response> {
    var me = this;
    var orgPromise = this.organizationService.getMemberOrgs(startIndex,  pageSize);
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

  addCommunityMembers() {
    let message = null;
    let membersList = [];
    let me = this;

    let gridOptions = this.utils.getGridOptions('addMembers', this.pageSize);

    this.dataService.openResourceEditDialog({modelView:'model/organizationMembersListModel.html', 
      title:this.i18n.tr('community.members.addMembers'), loadingTitle: 'app.loading',
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
      controller.viewModel.organizations = me.organizations;
      controller.viewModel.communityMembers = me.communityMembers;
      controller.viewModel.setOrganizationMembersGridDataSource = me.setOrganizationMembersGridDataSource;
      controller.viewModel.gridOptions = gridOptions;
      let organizationId = me.organizations[0]['organizationId'];
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

  makeCallCommunityMembers() {
    let maxParticipants = this.appConfig.get('server.MAX_CONFERENCE_PARTICIPANTS');
    this.logger.debug('makeCallCommunityMembers() => MAX_CONFERENCE_PARTICIPANTS = ' + maxParticipants);

    let message = null;
    var me = this;
    let communityMembers:any[];
    communityMembers = this.gridOptions.api.getSelectedRows();

    if(communityMembers.length === 1) {
      message = this.i18n.tr('community.members.call.callConfirmMessageSingle', 
          {memberName: communityMembers[0].physicalPersonProfile.firstName + ' ' +
          communityMembers[0].physicalPersonProfile.lastName});
    } else if(communityMembers.length >= 1) {
      message = this.i18n.tr('community.members.call.callConfirmMessage',
          {memberCount: communityMembers.length});
    }
    const vRules = ValidationRules
      .ensure('item').maxItems(maxParticipants)
      .withMessage(this.i18n.tr('community.call.callParticipantMaxCountError', {count:maxParticipants}))
      .rules;

    this.dataService.openPromptDialog(this.i18n.tr('community.members.call.title'),
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
            controller.viewModel.message = this.i18n.tr('community.members.call.callSuccessMessage');
            controller.viewModel.okText = this.i18n.tr('button.ok');
            controller.viewModel.showCancel = false;
            // Close dialog on success.
            delete controller.viewModel.submit;
          }, error => {
            controller.viewModel.messagePrefix = 'global.failed';
            controller.viewModel.status = 'ERROR';
            model.errorMessage = this.i18n.tr('community.members.call.callFailedMessage'); 
            me.logger.error("Community member call() rejected."); 
          }).catch(error => {
            controller.viewModel.messagePrefix = 'global.failed';
            controller.viewModel.status = 'ERROR';
            model.errorMessage = this.i18n.tr('community.members.call.callFailedMessage'); 
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

  sendConnectionRequest() {

    let message = null;
    var me = this;
    let communityMembers:any[];
    communityMembers = this.gridOptions.api.getSelectedRows();

    if(communityMembers.length === 1) {
      message = this.i18n.tr('community.members.call.callConfirmMessageSingle', 
          {memberName: communityMembers[0].physicalPersonProfile.firstName + ' ' +
          communityMembers[0].physicalPersonProfile.lastName});
    } else if(communityMembers.length >= 1) {
      message = this.i18n.tr('community.members.call.callConfirmMessage',
          {memberCount: communityMembers.length});
    }
    const vRules = ValidationRules
      .ensure('item').maxItems(1)
      .withMessage(this.i18n.tr('community.call.callParticipantMaxCountError', {count:1}))
      .rules;

    this.dataService.openPromptDialog(this.i18n.tr('community.sendConnectionRequest'),
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
            controller.viewModel.message = this.i18n.tr('community.members.call.callSuccessMessage');
            controller.viewModel.okText = this.i18n.tr('button.ok');
            controller.viewModel.showCancel = false;
            // Close dialog on success.
            delete controller.viewModel.submit;
          }, error => {
            controller.viewModel.messagePrefix = 'global.failed';
            controller.viewModel.status = 'ERROR';
            model.errorMessage = this.i18n.tr('community.members.call.callFailedMessage'); 
            me.logger.error("Community member call() rejected."); 
          }).catch(error => {
            controller.viewModel.messagePrefix = 'global.failed';
            controller.viewModel.status = 'ERROR';
            model.errorMessage = this.i18n.tr('community.members.call.callFailedMessage'); 
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
  
//   sendAlertCommunityMembers(communityMembers, communities) {
//     let me = this;

//     // let gridOptions = this.getGridOptions('listMembers');
//     let message = null;
//     // let communityMembers:any[];
//     // communityMembers = this.gridOptions.api.getSelectedRows();
//     // gridOptions.onModelUpdated = function(event) {
//     //   event.toString();
//     // }

//     let alertModel = {
//       communityMembers: communityMembers,
//       alertType: '',
//       alertMessage: '',
//       files: []
//     };
//     const maxMessageLength = this.appConfig.get('maxAlertMessageSize');
//     const vRules = ValidationRules
//       .ensure('communityMembers')
//       .displayName(this.i18n.tr('community.alert.recipientsList'))
//       .minItems(1)
//       .then()
//       .ensure('alertMessage')
//       .displayName(this.i18n.tr('community.alert.message'))
//       .required()
//       .then()
//       .maxLength(maxMessageLength)
//       .on(alertModel)
//       .rules;

//     const step1config = {
//         viewsPrefix: 'community/alertWizard',
//         id: 'alert_type',
//         title: this.i18n.tr('community.alert.selectTypeRecipients'),
//         canValidate: false,
//         model: alertModel,
//         attachedFn: function(){
//           me.logger.debug( "------attached");
//           let wizardController = this.controller;
//           this.controller.wizard.currentStep.cmtyAlertGrid = this.cmtyAlertGrid;
//           this.controller.wizard.currentStep.cmtyGrid = this.cmtyGrid;
//           // let gridOptions = me.getGridOptions('listMembers');

//           // let alertMembersGrid = new Grid(/*controller.viewModel.cmtyAlertGrid*/ this.cmtyAlertGrid, gridOptions); //create a new grid
//           // gridOptions['api'].sizeColumnsToFit();
//           let communityId = me.selectedCmty.communityId;
//           // gridOptions['communityId'] = communityId;
//           // this.controller.gridOptions = gridOptions;
//           // let communityMembers = me.gridOptions.api.getSelectedRows();
//           // me.setSelectedOrganizationMembersGridDataSource(gridOptions, me.pageSize, communityMembers);
//           // me.setSelectedCommunityMembersGridDataSource('alertRecipients', gridOptions, me.pageSize, me.communityService, communityMembers, true);

//           // selected members.
//           let selection = me.gridOptions.api.getSelectedRows();
//           let gridOptions = me.utils.getGridOptions('listMembers', me.pageSize);
//           gridOptions['selection'] = selection;
//           // Set local row model.
//           gridOptions.enableServerSideSorting = false;
//           gridOptions.enableServerSideFilter = false;
//           gridOptions.enableSorting = true;
//           gridOptions.enableFilter = true;
//           gridOptions.rowModelType = '';
//           gridOptions['communityId'] = communityId;
//           this.controller.alertSelectedMembersGridOptions = gridOptions;
//           this.controller.alertSelectedMembersGrid = new Grid(this.controller.wizard.currentStep.cmtyAlertGrid, gridOptions); //create a new grid
//           let ctrl = this.controller;
//           // ***** FIXME: fix for isAnyFilterPresent
//           gridOptions.onAfterFilterChanged = function(event) {
//             ctrl.alertSelectedMembersGridOptions = this;
//             me.logger.debug('***** FILTER CHANGED');
//           };
//           // ***** FIXME: fix for isAnyFilterPresent
//          // me.setSelectedCommunityMembersGridDataSource('alertRecipients', gridOptions, me.pageSize, me.communityService, selection, true);
//           // all members.
//           gridOptions = me.utils.getGridOptions('listMembers', me.pageSize);
//           // Set local row model.
//           gridOptions['communityId'] = communityId;
//           this.controller.alertMembersGridOptions = gridOptions;
//           this.controller.alertMembersGrid = new Grid(this.controller.wizard.currentStep.cmtyGrid, this.controller.alertMembersGridOptions); //create a new grid
//           me.utils.setCommunityMembersGridDataSource('alertCommunityMembers', gridOptions, me.pageSize, me.communityService, null, false);
          


//           showSelectedMembers(this.controller.dialogController, true);
//           // gridOptions.api['rowModel'].datasource.name = 'alertCommunityRecipients';

//           this.controller.alertSelectedMembersGridOptions.onSelectionChanged = function() {
//             let rows = this.api.getSelectedRows();
//             alertModel.communityMembers = rows;
//             wizardController.vController.validate({ object: alertModel, propertyName: 'communityMembers' });
//             // controller.viewModel.item = controller.viewModel.gridOptions.api.getSelectedRows();
//             // controller.viewModel.isSubmitDisabled = controller.viewModel.gridOptions.api.getSelectedRows().length === 0;
//           };
//           this.controller.alertMembersGridOptions.onSelectionChanged = function() {
//             let rows = this.api.getSelectedRows();
//             alertModel.communityMembers = rows;
//             wizardController.vController.validate({ object: alertModel, propertyName: 'communityMembers' });
//             // controller.viewModel.item = controller.viewModel.gridOptions.api.getSelectedRows();
//             // controller.viewModel.isSubmitDisabled = controller.viewModel.gridOptions.api.getSelectedRows().length === 0;
//           };
//           gridOptions.getRowNodeId = function(item) {
//             return item.memberId.toString();
//           };
          
//           // Pre-set selected nodes from previously-selected.
//           // let communityMembers = me.gridOptions.api.getSelectedRows();
//           // gridOptions.api.forEachNode( function (node) {
//           //     if (communityMembers.find(function(item:any, index:number, array:any[]) {
//           //       return item.memberId === node.data.memberId
//           //     })) {
//           //         node.setSelected(true);
//           //     }
//           // });
//         }
//       };
//     const step2config = {
//         viewsPrefix: 'community/alertWizard',
//         id: 'alert_message',
//         title: this.i18n.tr('community.alert.selectMessage'),
//         canValidate: true,
//         model: alertModel
//       };
//     const step3config = {
//         viewsPrefix: 'community/alertWizard',
//         id: 'alert_confirm',
//         title: this.i18n.tr('community.alert.confirm'),
//         canValidate: false,
//         model: alertModel,
//         attachedFn: function(){
//           me.logger.debug( "------attached");
//           let wizardController = this.controller;
//           wizardController.errorMessage = me.i18n.tr('community.members.alert.alertConfirmMessage', {alertType: this.controller.dialogController.alertModel.alertType.categoryName, attCount: ((this.controller.dialogController.alertModel.fileList)?this.controller.dialogController.alertModel.fileList.length:0), recipientCount: this.controller.dialogController.alertModel.communityMembers.length});
//           // this.step.errorMessage = me.i18n.tr('community.members.alert.alertConfirmMessage', {alertType: this.controller.dialogController.alertModel.alertType.categoryName, attCount: ((this.controller.dialogController.alertModel.fileList)?this.controller.dialogController.alertModel.fileList.length:0), recipientCount: this.controller.dialogController.alertModel.communityMembers.length});
//         },
//         callback: function(step){
//           me.logger.debug( "------attached");
//           // Call the service to send the alert.
//           let view = this;
//           let modelPromise = me.communityService.sendNotification(this.controller.dialogController.alertModel.communityMembers, [], 
//           {message: this.controller.dialogController.alertModel.alertMessage, notificationCategory: this.controller.dialogController.alertModel.alertType.categoryId, attachmentRefs: this.controller.dialogController.alertModel.files});
//           step.controller.wizard.wizLoadingPromise = modelPromise;        
          
//           return modelPromise.then(response => response.content)
//           .then(data => {
//               // Update the message for success.
//               view.controller.showCancel = false;
//               // Close dialog on success.
//               // delete this.controller.viewModel.submit;
//               if(view.controller.alertMembersGridOptions.api) {
//                 view.controller.alertMembersGridOptions.api.destroy();
//               }
//               if(view.controller.alertSelectedMembersGridOptions.api) {
//                 view.controller.alertSelectedMembersGridOptions.api.destroy();
//               }
//               let viewModel = view.controller;
//               // viewModel.wizard.currentStep.stepStatus = 'OK';
//               view.controller.stepStatus = 'OK';
//               view.controller.errorMessage = me.i18n.tr('community.members.alert.alertSuccessMessage', 
//                 {alertCategory: view.controller.wizard.currentStep.model.alertType.categoryName, 
//                   recipientCount: view.controller.wizard.currentStep.model.communityMembers.length});
//               // view.controller.wizard.currentStep.errorMessage = me.i18n.tr('community.members.alert.alertSuccessMessage', 
//               //   {alertCategory: view.controller.wizard.currentStep.model.alertType.categoryName, 
//               //     recipientCount: view.controller.wizard.currentStep.model.communityMembers.length});
//               return {currentStep:viewModel, res:data};
//               // controller.ok();
//             }, error => {
//               view.controller.stepStatus = 'ERROR';
//               view.controller.errorMessage = me.i18n.tr('community.members.alert.alertErrorMessage', 
//                 {alertCategory: view.controller.wizard.currentStep.model.alertType.categoryName, 
//                   recipientCount: view.controller.wizard.currentStep.model.communityMembers.length});
//               // view.controller.wizard.currentStep.errorMessage = "Failed"; 
//               me.logger.error("Community member call() rejected."); 
//             }).catch(error => {
//               view.controller.stepStatus = 'ERROR';
//               view.controller.errorMessage = me.i18n.tr('community.members.alert.alertErrorMessage', 
//                 {alertCategory: view.controller.wizard.currentStep.model.alertType.categoryName, 
//                   recipientCount: view.controller.wizard.currentStep.model.communityMembers.length});
//               // view.controller.wizard.currentStep.errorMessage = "Failed"; 
//               me.logger.error("Community member call() failed."); 
//               me.logger.error(error); 
//               return Promise.reject(error);
//             })
//             // return modelPromise;
//         }

//       };
//      const step4config = {
//         viewsPrefix: 'community/alertWizard',
//         id: 'alert_result',
//         title: this.i18n.tr('community.alert.finish'),
//         canValidate: false,
//         canGoBack: false,
//         canCancel: false,
//         model: alertModel,
//         // attachedFn: function(){
//         //   me.logger.debug( "------attached");
//         //   // Call the service to send the alert.
//         //   let view = this;
//         //   let modelPromise = me.communityService.sendNotification(this.controller.dialogController.alertModel.communityMembers, 
//         //   {message: this.controller.dialogController.alertModel.alertMessage, notificationCategory: this.controller.dialogController.alertModel.alertType.categoryId, attachmentRefs: this.controller.dialogController.alertModel.fileList});
          
//         //   modelPromise.then(response => response.content)
//         //   .then(data => {
//         //       // Update the message for success.
//         //       view.controller.wizard.currentStep.errorMessage = me.i18n.tr('community.members.alert.alertSuccessMessage', {alertCategory: view.controller.dialogController.alertModel.alertType.categoryName, recipientCount: this.controller.dialogController.alertModel.communityMembers.length});
//         //       view.controller.showCancel = false;
//         //       // Close dialog on success.
//         //       // delete this.controller.viewModel.submit;
//         //       if(view.controller.alertMembersGridOptions.api) {
//         //         view.controller.alertMembersGridOptions.api.destroy();
//         //       }
//         //       if(view.controller.alertSelectedMembersGridOptions.api) {
//         //         view.controller.alertSelectedMembersGridOptions.api.destroy();
//         //       }
//         //       // controller.ok();
//         //     }, error => {
//         //       view.step.errorMessage = "Failed"; 
//         //       me.logger.error("Community member call() rejected."); 
//         //     }).catch(error => {
//         //       view.step.errorMessage = "Failed"; 
//         //       me.logger.error("Community member call() failed."); 
//         //       me.logger.error(error); 
//         //       return Promise.reject(error);
//         //     })
//         // }
//       };


//     const steps = [step1config, step2config, step3config, step4config];

//     let showSelectedMembers = function(controller:any, showSelected:boolean) {
//       let selection = me.gridOptions.api.getSelectedRows();
//       let obj = controller.viewModel;
//       selection = alertModel.communityMembers;
//       // controller.viewModel.gridOptions.api.refreshVirtualPageCache();
//       // controller.viewModel.gridOptions.api.destroy();
//       obj.showSelected = showSelected;
//       if(showSelected) {
//         obj.alertSelectedMembersGridOptions.api.setRowData(selection);
//         obj.alertSelectedMembersGridOptions.api.refreshInMemoryRowModel();
//         obj.alertSelectedMembersGridOptions.api.selectAll();
        
//         // let gridOptions = me.getGridOptions('listMembers');
//         // let communityId = me.selectedCmty.communityId;
//         // gridOptions['communityId'] = communityId;
//         // controller.gridOptions = gridOptions;
        
//         // let alertMembersGrid = new Grid(controller.viewModel.wizard.currentStep.cmtyAlertGrid, controller.viewModel.gridOptions); //create a new grid
//         // me.setSelectedCommunityMembersGridDataSource('alertRecipients', controller.viewModel.gridOptions, me.pageSize, me.communityService, selection, true);
//         me.toString();
//       } else {
//         // let gridOptions = me.getGridOptions('listMembers');
//         // let communityId = me.selectedCmty.communityId;
//         // gridOptions['communityId'] = communityId;
//         // controller.gridOptions = gridOptions;
//         // let alertMembersGrid = new Grid(controller.viewModel.wizard.currentStep.cmtyGrid, controller.viewModel.gridOptions); //create a new grid
//         obj.alertMembersGridOptions['selection'] = selection;
        
//         // controller.viewModel.alertMembersGridOptions.api.refreshVirtualPageCache();
//         // controller.viewModel.alertMembersGridOptions.api.refreshView();

//         me.utils.setCommunityMembersGridDataSource('alertCommunityMembers', obj.alertMembersGridOptions, 
//           me.pageSize, me.communityService, selection, false);
//         // controller.viewModel.alertMembersGrid.context.beans.gridApi.beanInstance.refreshVirtualPageCache();
//         me.toString();
//         // controller.viewModel.gridOptions.api['rowModel'].datasource.name = 'alertCommunityRecipients';
//       }
//     };

//     this.dataService.openWizardDialog('Send Alert', steps,
//       communityMembers, vRules)
//     .then((controller:any) => {

//           // let alertMembersGrid = new Grid(/*controller.viewModel.cmtyAlertGrid*/ controller.viewModel.cmtyAlertGrid, gridOptions); //create a new grid
//           // gridOptions['api'].sizeColumnsToFit();
//           // let communityId = me.selectedCmty.communityId;
//           // gridOptions['communityId'] = communityId;
//           // me.setCommunityMembersGridDataSource(gridOptions, me.pageSize, me.communityService);
//           // // Pre-set selected nodes from previously-selected.
//           // let communityMembers = me.gridOptions.api.getSelectedRows();
//           // gridOptions.api.forEachNode( function (node) {
//           //     if (communityMembers.find(function(item:any, index:number, array:any[]) {
//           //       return item.memberId === node.data.memberId
//           //     })) {
//           //         node.setSelected(true);
//           //     }
//           // });
//           // this.gridOptions = gridOptions;


//       // controller.viewModel.gridOptions.onSelectionChanged = function() {
//       //   let rows = controller.viewModel.gridOptions.api.getSelectedRows();
//       //   communityMembers = rows;
//       //   controller.viewModel.item = controller.viewModel.gridOptions.api.getSelectedRows();
//       //   controller.viewModel.isSubmitDisabled = controller.viewModel.gridOptions.api.getSelectedRows().length === 0;
//       // };
//       // controller.viewModel.gridOptions.getRowNodeId = function(item) {
//       //   return item.memberId.toString();
//       // };

//       // let alertMembersGrid = new Grid(controller.viewModel.cmtyAlertGrid /*controller.viewModel.stepList.first.cmtyAlertGrid*/, gridOptions); //create a new grid
//       // gridOptions['api'].sizeColumnsToFit();
//       // let communityId = me.selectedCmty.communityId;
//       // gridOptions['communityId'] = communityId;
//       // me.setCommunityMembersGridDataSource(gridOptions, me.pageSize, me.communityService);

//       // controller.attached = function() {
//       //   let alertMembersGrid = new Grid(controller.viewModel.cmtyAlertGrid, gridOptions); //create a new grid
//       //   gridOptions['api'].sizeColumnsToFit();
//       //   let communityId = me.selectedCmty.communityId;
//       //   gridOptions['communityId'] = communityId;
//       //   me.setCommunityMembersGridDataSource(gridOptions, me.pageSize, me.communityService);

//       // }
//       let model = controller.settings;
//       controller.viewModel.maxMessageLength = maxMessageLength;
//       controller.errorMessage = '';
//       controller.alertModel = alertModel;
//       controller.viewModel.alertCategories = me.alertCategories;
//       // Get selected alert category.
//       controller.viewModel.selectAlertCategory = function(event: any) {
//         if(this.selectedAlertCategory !== event.target.value) {
//           this.selectedAlertCategory = event.target.value;
//           // gridOptions['organizationId'] = this.selectedOrganization;
//           // this.setOrganizationMembersGridDataSource(gridOptions, me.pageSize, me.organizationService, this.selectedOrganization);
//         }
//       };
//       controller.viewModel.onAlertAttachmentFile = function(event, fileList) {
//         let fileArray = Array.from(fileList);
//         controller.alertModel.files = fileArray;
//       };

//       Object.defineProperty(controller.viewModel, 'isGridFiltered', {
//         get: function() {
//           let result = this.alertSelectedMembersGridOptions && this.alertSelectedMembersGridOptions.api && this.alertSelectedMembersGridOptions.api.isAnyFilterPresent();
//           window.console.debug('--- isGridFiltered --- : ' + result);
//           return result;
//         }
//       });
//       controller.viewModel.removeAttachment = function(att: any) {
//         if(att) {
//           let index = controller.alertModel.files.indexOf(att);
//           controller.alertModel.files.splice(index, 1);
//         } else {
//           delete controller.alertModel.fileList;
//         }
//       };
//       // Callback function for submitting the dialog.
//       controller.viewModel.submit = (communityMembers:any[]) => {
//       //  // Call the service to send the alert.
//       //   let modelPromise = this.communityService.sendNotification(controller.alertModel.communityMembers[0].memberId, 
//       //   {message: controller.alertModel.alertMessage, notificationCategory: controller.alertModel.alertType.categoryId, attachmentRefs: controller.alertModel.fileList});
        
//       //   modelPromise.then(response => response.json())
//       //   .then(data => {
//       //       // Update the message for success.
//       //       controller.viewModel.wizard.currentStep.errorMessage = this.i18n.tr('community.members.alert.alertSuccessMessage', {alertCategory: controller.alertModel.alertType.categoryName});
//       //       controller.viewModel.showCancel = false;
//       //       // Close dialog on success.
//       //       delete controller.viewModel.submit;
//       //       controller.viewModel.gridOptions.api.destroy();
//       //       setTimeout(function() {
//       //         controller.ok();
//       //       }, 1000);
//       //       // controller.ok();
//       //     }, error => {
//       //       model.errorMessage = "Failed"; 
//       //       me.logger.error("Community member call() rejected."); 
//       //     }).catch(error => {
//       //       model.errorMessage = "Failed"; 
//       //       me.logger.error("Community member call() failed."); 
//       //       me.logger.error(error); 
//       //       return Promise.reject(error);
//       //     })

//       controller.ok();
//       };
// /* TODO: Fix for showing CLearFilter button.
// Object.defineProperty(controller.viewModel, "isGridFiltered", { get: function () { //return this.a + 1; } });
//       // controller.viewModel.isGridFiltered = function() {
//         return (controller.viewModel.showSelected && 
//             (controller.viewModel.alertSelectedMembersGridOptions && 
//             controller.viewModel.alertSelectedMembersGridOptions.api && 
//             controller.viewModel.alertSelectedMembersGridOptions.api.isAnyFilterPresent())) ||
//             (!(controller.viewModel.showSelected) && 
//             (controller.viewModel.alertMembersGridOptions && 
//             controller.viewModel.alertMembersGridOptions.api && 
//             controller.viewModel.alertMembersGridOptions.api.isAnyFilterPresent()));
//       }});
// */
//       controller.viewModel.showSelectedMembers = function(showSelected:boolean) {
//         showSelectedMembers(controller, showSelected);
//       };

//       controller.viewModel.clearGridFilters = function(gridOptions) {
//         gridOptions.api.setFilterModel({});
//         gridOptions.api.refreshView();
//       };

//       /*
//       controller.viewModel.showSelectedMembers = function(showSelected:boolean) {
//         let selection = controller.viewModel.gridOptions.api.getSelectedRows();

//         selection = alertModel.communityMembers;
//         // controller.viewModel.gridOptions.api.refreshVirtualPageCache();
//         // controller.viewModel.gridOptions.api.destroy();
//         controller.viewModel.showSelected = showSelected;
//         if(showSelected) {
//           me.setSelectedCommunityMembersGridDataSource('alertRecipients', controller.viewModel.gridOptions, me.pageSize, me.communityService, selection, true);
//           let alertMembersGrid = new Grid(this.wizard.currentStep.cmtyAlertGrid, controller.viewModel.gridOptions); //create a new grid
//           me.toString();
//         } else {
//           me.setCommunityMembersGridDataSource('alertCommunityMembers', controller.viewModel.gridOptions, me.pageSize, me.communityService, selection, false);
//           let alertMembersGrid = new Grid(this.wizard.currentStep.cmtyGrid, controller.viewModel.gridOptions); //create a new grid
//           me.toString();
//           // controller.viewModel.gridOptions.api['rowModel'].datasource.name = 'alertCommunityRecipients';
//         }
//       };
//       */
//       controller.result.then((response) => {
//         if (response.wasCancelled) {
//           // Cancel.
//           this.logger.debug('Cancel');
//         }
//       })
//     });
//   }

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

