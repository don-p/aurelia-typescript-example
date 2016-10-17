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
// import {AgGridWrapper} from './lib/ag-grid';


// import {RemoteData} from './services/remoteData';


// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(Session, Router, DataService, CommunityService, EventAggregator, Ps, I18N, DialogService, LogManager) // SCROLL
export class CommunityDetail {
  member: Object;

  navigationInstruction: NavigationInstruction;
  selectedCommunityMembers: Array<Object>;
  selectedCmty: any;
  communityMembers: { get: () => any[] };
  membersGrid: Object;
  cmtyMembersGrid: any;
  currentMember: Object;
  // remoteData: RemoteData;

  membersPromise: Promise<Response>;
  // @bindable columns;
  // @bindable rows;
  @bindable pageSize;
  gridOptions: GridOptions;
  gridCreated: boolean;
  gridColumns: Array<any>;
  grid: any;
  gridDataSource: IDatasource;


  ps: any; // SCROLL

  logger: Logger;

  //   columnDefs = [
  //     {headerName: "Make", field: "make"},
  //     {headerName: "Model", field: "model"},
  //     {headerName: "Price", field: "price"}
  // ];
  
  // @bindable() rowData = [
  //     {make: "Toyota", model: "Celica", price: 35000},
  //     {make: "Ford", model: "Mondeo", price: 32000},
  //     {make: "Porsche", model: "Boxter", price: 72000}
  // ];

  
  constructor(private session: Session, private router: Router, 
    private dataService: DataService, private communityService: CommunityService, 
    private evt: EventAggregator, Ps, private i18n: I18N, private dialogService: DialogService) { // SCROLL

    this.communityMembers = null;
    // this.membersGrid = {};
    // this.currentMember = {};
    // this.remoteData = new RemoteData(appConfig.apiServerUrl, null);

    // this.ps = Ps; // SCROLL


    this.gridColumns = [
      {
        headerName: '', 
        field: "customerId", 
        width: 30, 
        minWidth: 30, 
        checkboxSelection: true, 
        suppressMenu: true
      },
      {
        headerName: this.i18n.tr('community.members.firstname'), 
        field: "physicalPersonProfile.firstName",
        filter: 'text'
      },
      {
        headerName: this.i18n.tr('community.members.lastname'), 
        field: "physicalPersonProfile.lastName", 
        filter: 'text'
      },
      {
        headerName: this.i18n.tr('community.members.title'), 
        field: "physicalPersonProfile.jobTitle",
        filter: 'text'
      },
      {
        headerName: this.i18n.tr('community.members.organization'), 
        field: "physicalPersonProfile.organization.organizationName",
        filter: 'text'
      },
      {
        headerName: this.i18n.tr('community.members.city'), 
        field: "physicalPersonProfile.locationProfile.city",
        filter: 'text'
      },
      {
        headerName: this.i18n.tr('community.members.state'), 
        field: "physicalPersonProfile.locationProfile.stateCode", 
        filter: 'text',
        width: 100
      },
      {
        headerName: this.i18n.tr('community.members.zip'), 
        field: "physicalPersonProfile.locationProfile.zipCode", 
        filter: 'text',
        width: 80
      }
    ];

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

        me.setGridDataSource(me);
      }
    });
    this.logger = LogManager.getLogger(this.constructor.name);
  }

  attached(params, navigationInstruction) {
    // this.navigationInstruction = navigationInstruction;
    // this.communityMembers = params;

    // // Custom scrollbar:
    // var container = document.getElementById('community-member-list'); // SCROLL
    // this.ps.initialize(container);
    // this.ps.update(container);
    let me = this;
    let cols = this.gridColumns.map(function(col) {
        return {
            headerName: col.headerName,
            field: col.field
        };
    });

    let gridOptions = {
        columnDefs: this.gridColumns,
        // rowData: this.communityMembers,
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
        virtualPaging: true,
        datasource: this.gridDataSource,
        maxPagesInCache: 2,
        onSelectionChanged: function() {
          me.membersSelectionChanged(this)
        },
        onViewportChanged: function() {
          me.gridOptions['api'].sizeColumnsToFit();
        },
        onGridSizeChanged: function(){
          if(!this.api) return;
          this.api.sizeColumnsToFit();
        },
        getRowNodeId: function(item) {
          return item.memberId.toString();
        }
    };


    // var eGridDiv = document.querySelector('#eGridDiv');
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

  setGridDataSource(me) {
    // me.dataService.getCommunity(me.selectedCmty, 0, me.pageSize)
    //   .then(response => response.json())
    //   .then(data => {
    //       // params.successCallback(data.responseCollection, data.totalCount-1);
    
        me.gridDataSource = {
            /** If you know up front how many rows are in the dataset, set it here. Otherwise leave blank.*/
            rowCount: null,
            paginationPageSize: me.pageSize,
            //  paginationOverflowSize: 1,
             maxConcurrentDatasourceRequests: 2,
            //  maxPagesInPaginationCache: 2,
            loading: false,

            /** Callback the grid calls that you implement to fetch rows from the server. See below for params.*/
            getRows: function(params: IGetRowsParams) {
               me.gridOptions.api.showLoadingOverlay();
              if(!this.loading) {
                me.logger.debug("..... Loading Grid row | startIndex: " + params.startRow);
                me.logger.debug("..... ..... Filter | " + Object.keys(params.filterModel));
                me.logger.debug("..... ..... Sort | " + params.sortModel.toString());
                this.loading = true;
                let filter = me.findGridColumnDef(Object.keys(params.filterModel)[0]);
                me.membersPromise = me.communityService.getCommunity(me.selectedCmty.communityId, params.startRow, me.pageSize);
                me.membersPromise.then(response => response.json())
                  .then(data => {
                    if(me.gridDataSource.rowCount === null) {
                      me.gridDataSource.rowCount = data.totalCount;
                    }
                    me.gridOptions.api.hideOverlay();
                    params.successCallback(data.responseCollection, data.totalCount/*-1*/);
                    this.loading = false;
                });
              }
            }
        }
        me.gridOptions.api.setDatasource(me.gridDataSource);
    // });


  }

  bind() {
  }

  // rowDataChanged(newValue) {
  //   if (newValue && newValue.length) {
  //       this.gridOptions.api.setRowData(newValue);
  //       this.gridOptions.api.refreshView();
  //   }
  // }
  
  async getCommunityMembers(communityId: string, startIndex: number) : Promise<void> {
    let me = this;
    return this.communityService.getCommunity(communityId, startIndex, this.pageSize)
    .then(response => response.json())
    .then(data => {
      me.logger.debug(json(data));
//      this.session=me.session;
      me.communityMembers = data.responseCollection;
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
      communityMembers, this.i18n.tr('button.delete'), 'modelPromise')
    .then((controller:any) => {
      let model = controller.settings.model;
      // Callback function for submitting the dialog.
      model.submit = (communityMembers) => {
        let commMemberIds = communityMembers.map(function(obj){ 
          return obj.memberId;
        });
        // Call the delete service.
        this.communityService.deleteCommunityMembers(this.selectedCmty.communityId, commMemberIds)
          .then(data => {
            me.gridOptions.api.refreshVirtualPageCache();
            me.gridOptions.api.refreshView();
            me.gridOptions.api.deselectAll();
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
      }
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

    this.communityService.getOrgMembers(organizationId)
    .then(response => response.json())
    .then(data => {
      Array.prototype.push.apply(membersList, data.responseCollection);
      // membersList = membersList.concat(data.responseCollection);
    });
    this.dataService.openResourceEditDialog('model/communityMembersModel.html', this.i18n.tr('community.members.addMembers'),
      membersList, this.i18n.tr('button.delete'))
    .then((controller:any) => {
      let model = controller.settings.model;
      // Callback function for submitting the dialog.
      model.submit = (communityMembers) => {
        let commMemberIds = communityMembers.map(function(obj){ 
          return obj.memberId;
        });

        // Call the delete service.
        this.communityService.deleteCommunityMembers(this.selectedCmty.communityId, commMemberIds)
          .then(data => {
            this.gridOptions.api.refreshView();
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
      }

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

