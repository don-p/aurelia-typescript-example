import {inject, Lazy, bindable, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {Session} from './services/session';
import {DataService} from './services/dataService';
import {CommunityService} from './services/communityService';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
import {DialogService, DialogController} from 'aurelia-dialog';
import {Prompt} from './model/prompt';
import * as Ps from 'perfect-scrollbar'; // SCROLL
import {Grid, GridOptions, IGetRowsParams, IDatasource} from 'ag-grid';
// import {RemoteData} from './services/remoteData';

@inject(Session, Router, DataService, CommunityService, EventAggregator, Ps, I18N, DialogService, LogManager) // SCROLL
export class CommunityDetail {
  member: Object;

  navigationInstruction: NavigationInstruction;
  selectedCommunityMembers: Array<Object>;
  selectedOrganizationMembers: Array<Object>;
  selectedCmty: any;
  // communityMembers: { get: () => any[] };
  communityMembers: Array<Object>;
  membersGrid: Object;
  cmtyMembersGrid: any;
  addCmtyMembersGrid: any;
  currentMember: Object;
  // remoteData: RemoteData;

  membersPromise: Promise<Response>;
  cmtyMembersCachePromise:  Promise<void>;
  // @bindable columns;
  // @bindable rows;
  @bindable pageSize;
  gridOptions: GridOptions;
  gridCreated: boolean;
  gridColumns: Array<any>;
  grid: any;


  ps: any; // SCROLL

  logger: Logger;
  
  constructor(private session: Session, private router: Router, 
    private dataService: DataService, private communityService: CommunityService, 
    private evt: EventAggregator, Ps, private i18n: I18N, private dialogService: DialogService) {

    this.communityMembers = null;
    // this.membersGrid = {};
    // this.currentMember = {};
    // this.remoteData = new RemoteData(appConfig.apiServerUrl, null);

    // this.ps = Ps; // SCROLL

    this.pageSize = 200;

    var me = this;
    this.evt.subscribe('cmtySelected', payload => {
      if((!me.selectedCmty || me.selectedCmty === null) || (me.selectedCmty.communityId !== payload.community.communityId)) {
        me.selectedCmty = payload.community;
        // this.remoteData.setDataApi('v1/communities/' + selectedCmty + '/members')
        // DEBUG TEMP - this.getCommunityMembers(this.selectedCmty, 0);
        // this.gridDataSource.getRows({startRow: 0, endRow: this.pageSize});
        // this.loadData();

        // this.initGrid(this);

        // Save selected communityId.
        me.gridOptions['communityId'] = me.selectedCmty.communityId;
        // Set up the virtual scrolling grid displaying community members.
        me.setCommunityMembersGridDataSource(me.gridOptions, me.pageSize, me.communityService);
        // Set up collection to track available community members.
        me.gridOptions.api.showLoadingOverlay();
        me.getCommunityMemberIDs(me.selectedCmty.communityId, 20000).then(() => {
          me.gridOptions.api.hideOverlay();
        });
      }
    });
    this.logger = LogManager.getLogger(this.constructor.name);
  }

  getGridColumns(type: string) { 
    let columns = [];
    // return [
    columns.push({
      headerName: '', 
      width: 30, 
      minWidth: 30, 
      checkboxSelection: true, 
      suppressMenu: true
    });
    columns.push({
      headerName: this.i18n.tr('community.members.firstname'), 
      field: "physicalPersonProfile.firstName",
      filter: 'text'
    });
    columns.push({
      headerName: this.i18n.tr('community.members.lastname'), 
      field: "physicalPersonProfile.lastName", 
      filter: 'text'
    });
    columns.push({
      headerName: this.i18n.tr('community.members.title'), 
      field: "physicalPersonProfile.jobTitle",
      filter: 'text'
    });
    if(type == 'listMembers') {
      columns.push({
        headerName: this.i18n.tr('community.members.organization'), 
        field: "physicalPersonProfile.organization.organizationName",
        filter: 'text'
      });
    } else if (type === 'addMembers') {
      columns.push({
        headerName: this.i18n.tr('community.members.title'), 
        field: "physicalPersonProfile.title",
        filter: 'text'
      });
    }
    columns.push({
      headerName: this.i18n.tr('community.members.city'), 
      field: "physicalPersonProfile.locationProfile.city",
      filter: 'text'
    });
    columns.push({
      headerName: this.i18n.tr('community.members.state'), 
      field: "physicalPersonProfile.locationProfile.stateCode", 
      filter: 'text',
      width: 100
    });
    columns.push({
      headerName: this.i18n.tr('community.members.zip'), 
      field: "physicalPersonProfile.locationProfile.zipCode", 
      filter: 'text',
      width: 80
    });

    return columns;
  }

  getGridOptions(type): GridOptions {
    let me = this;
      return {
      columnDefs: this.getGridColumns(type),
      rowSelection: 'multiple',
      rowHeight: 30,
      headerHeight: 40,
      suppressMenuHide: true,
      // pageSize: this.pageSize,
      paginationPageSize: this.pageSize,
      enableServerSideSorting: true,
      enableServerSideFilter: true,
      enableColResize: true,
      debug: false,
      rowModelType: 'virtual',
      maxPagesInCache: 2,
      onViewportChanged: function() {
        me.gridOptions['api'].sizeColumnsToFit();
      },
      onGridSizeChanged: function(){
        if(!this.api) return;
        this.api.sizeColumnsToFit();
      }
    };
  }

  attached(params, navigationInstruction) {
    // // Custom scrollbar:
    // var container = document.getElementById('community-member-list'); // SCROLL
    // this.ps.initialize(container);
    // this.ps.update(container);
    let me = this;
    let cols = this.getGridColumns('listMembers').map(function(col) {
        return {
            headerName: col.headerName,
            field: col.field
        };
    });

    let gridOptions = this.getGridOptions('listMembers');
    gridOptions.onSelectionChanged = function() {
      me.membersSelectionChanged(this)
    };
    gridOptions.getRowNodeId = function(item) {
      return item.memberId.toString();
    };
    this.gridOptions = gridOptions;
    this.initGrid(this);
  }

  findGridColumnDef(fieldName: string):Object {
    return this.gridOptions.columnDefs.find(function(colDef: Object){
      return colDef['field'] === fieldName;
    });
  }

  initGrid(me) {
    // this.cmtyMembersGrid.setGridOptions(this.gridOptions);
    new Grid(this.cmtyMembersGrid, this.gridOptions); //create a new grid
    // this.agGridWrap.gridCreated = true;
    this.gridOptions['api'].sizeColumnsToFit();
  }

  setCommunityMembersGridDataSource(gridOptions, pageSize, communityService) {
    const me = this;

    let gridDataSource = {
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
            me.logger.debug("..... setCommunityMembersGridDataSource Loading Grid rows | startIndex: " + params.startRow);
            me.logger.debug("..... ..... Filter | " + Object.keys(params.filterModel));
            me.logger.debug("..... ..... Sort | " + params.sortModel.toString());
            this.loading = true;
            let filter = me.findGridColumnDef(Object.keys(params.filterModel)[0]);
            let  communityId = gridOptions.communityId;
            let membersPromise = communityService.getCommunity(communityId, params.startRow, pageSize);
            membersPromise.then(response => response.json())
              .then(data => {
                if(gridDataSource.rowCount === null) {
                  gridDataSource.rowCount = data.totalCount;
                }
                gridOptions.api.hideOverlay();
                params.successCallback(data.responseCollection, data.totalCount);
                this.loading = false;
            });
          }
        }
    }
    gridOptions.api.setDatasource(gridDataSource);
  }

  setOrganizationMembersGridDataSource(gridOptions, pageSize, communityService) {
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
            let filter = me.findGridColumnDef(Object.keys(params.filterModel)[0]);
            let  organizationId = gridOptions.organizationId;
            let orgPromise = communityService.getOrgMembers(organizationId, params.startRow, pageSize);
            orgPromise.then(response => response.json())
              .then(data => {
                // Filter out existing community members.
                let totalCount = data.totalCount;
                let filteredData = data.responseCollection.filter(function(item) {
                  if(me.communityMembers.indexOf(item.memberId) < 0) {
                    return true;
                  } else {
                    totalCount--;
                    return false;
                  }
                });
                if(gridDataSource.rowCount === null) {
                  gridDataSource.rowCount = totalCount;
                }
                gridOptions.api.hideOverlay();
                params.successCallback(filteredData, totalCount);
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
  
  async getCommunityMembers(communityId: string, startIndex: number) : Promise<void> {
    let me = this;
    return this.communityService.getCommunity(communityId, startIndex, this.pageSize)
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

  async getCommunityMemberIDs(communityId: string, pageSize: number) : Promise<void> {
    let me = this;
    return this.communityService.getCommunity(communityId, 0, pageSize)
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
      communityMembers, this.i18n.tr('button.remove'), 'modelPromise')
    .then((controller:any) => {
      let model = controller.settings.model;
      // Callback function for submitting the dialog.
      model.submit = (communityMembers) => {
        let commMemberIds = communityMembers.map(function(obj){ 
          return obj.memberId;
        });
        // Call the delete service.
        this.communityService.removeCommunityMembers(this.selectedCmty.communityId, commMemberIds)
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
            me.selectedCmty.memberCount = data.totalCount;
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
    let organizationId = this.session.auth['organization'].organizationId;
    let me = this;

    this.dataService.openResourceEditDialog('model/communityMembersModel.html', this.i18n.tr('community.members.addMembers'),
      membersList, this.i18n.tr('button.save'))
    .then((controller:any) => {
      // me.communityService.getOrgMembers(organizationId)
      // .then(response => response.json())
      // .then(data => {
      //   Array.prototype.push.apply(membersList, data.responseCollection);
      // });

      let cols = me.getGridColumns('addMembers');
      let model = controller.settings.model;
      let gridOptions = this.getGridOptions('addMembers');
      model.isSubmitDisabled = true;
      gridOptions.onSelectionChanged = function() {
        me.orgMembersSelectionChanged(this);
        model.isSubmitDisabled = gridOptions.api.getSelectedRows().length === 0;
      };
      gridOptions.getRowNodeId = function(item) {
        return item.memberId.toString();
      };
      gridOptions['organizationId'] = organizationId;
      let addMembersGrid = new Grid(controller.viewModel.addCmtyMembersGrid, gridOptions); //create a new grid
      gridOptions['api'].sizeColumnsToFit();
      me.setOrganizationMembersGridDataSource(gridOptions, me.pageSize, me.communityService);


      // let model = controller.settings.model;
      model.gridOptions = gridOptions;
      // Callback function for submitting the dialog.
      model.submit = () => {
        let selection = gridOptions.api.getSelectedRows();
        let orgMemberIds = selection.map(function(obj){ 
          return obj.memberId;
        });

        // Call the addMembers service.
        this.communityService.addCommunityMembers(this.selectedCmty.communityId, orgMemberIds)
        .then(response => response.json())
        .then(data => {
            // Update local cache of community members.
            Array.prototype.splice.apply(me.communityMembers,[].concat(me.communityMembers.length,0,orgMemberIds));

            me.gridOptions.api.refreshVirtualPageCache();
            me.gridOptions.api.refreshView();
            me.gridOptions.api.deselectAll();
            // update the community member count.
            me.selectedCmty.memberCount = data.totalCount;
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
      model.showSelectedOrganizationMembers = function(showSelected:boolean) {
        if(showSelected) {
          let selection = gridOptions.api.getSelectedRows();
          me.setSelectedOrganizationMembersGridDataSource(gridOptions, me.pageSize, selection);
        } else {
          me.setOrganizationMembersGridDataSource(gridOptions, me.pageSize, me.communityService);
        }
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

