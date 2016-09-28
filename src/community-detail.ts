import {inject, Lazy, bindable} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {Session} from './services/session';
import {AppConfig} from './services/appConfig';
import {DataService} from './services/dataService';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
import {DialogService} from 'aurelia-dialog';
import {Prompt} from './lib/prompt/prompt';
import * as Ps from 'perfect-scrollbar'; // SCROLL

import * as ag from 'ag-grid';
// import {AgGridWrapper} from './lib/ag-grid';


// import {RemoteData} from './services/remoteData';


// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(Lazy.of(HttpClient), Session, Router, AppConfig, DataService, EventAggregator, Ps, I18N, DialogService) // SCROLL
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
  gridOptions: Object;
  gridCreated: boolean;
  gridColumns: Array<any>;
  grid: any;
  gridDataSource: ag.IDatasource;


  ps: any; // SCROLL


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

  
  constructor(private getHttpClient: () => HttpClient, private session: Session, private router: Router, private appConfig: AppConfig, 
    private dataService: DataService, private evt: EventAggregator, Ps, private i18n: I18N, private dialogService: DialogService) { // SCROLL

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

    this.pageSize = 35;

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
        getRowNodeId: function(item) {
          return item.memberId.toString();
        }
    };


    // var eGridDiv = document.querySelector('#eGridDiv');
    this.gridOptions = gridOptions;
    this.initGrid(this);

  }
  initGrid(me) {
    // this.cmtyMembersGrid.setGridOptions(this.gridOptions);
    new ag.Grid(this.cmtyMembersGrid, this.gridOptions); //create a new grid
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
            getRows: function(params: ag.IGetRowsParams) {
               me.gridOptions.api.showLoadingOverlay();
              if(!this.loading) {
                console.debug("..... Loading Grid row | startIndex: " + params.startRow);
                console.debug("..... ..... Filter | " + Object.keys(params.filterModel));
                console.debug("..... ..... Sort | " + params.sortModel.toString());
                this.loading = true;
                me.membersPromise = me.dataService.getCommunity(me.selectedCmty.communityId, params.startRow, me.pageSize);
                me.membersPromise.then(response => response.json())
                  .then(data => {
                    if(me.gridDataSource.rowCount === null) {
                      me.gridDataSource.rowCount = data.totalCount;
                    }
                    me.gridOptions.api.hideOverlay();
                    params.successCallback(data.responseCollection, data.totalCount-1);
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
    var me = this;
    return this.dataService.getCommunity(communityId, startIndex, this.pageSize)
    .then(response => response.json())
    .then(data => {
      console.log(json(data));
//      this.session=me.session;
      me.communityMembers = data.responseCollection;
      // me.agGridWrap.rowsChanged(me.communityMembers, null);
    }).catch(error => {
      console.log("Communities members() failed."); 
      console.log(error); 
    });
  }

  membersSelectionChanged(scope) {
    let rows = scope.api.getSelectedRows();
    this.selectedCommunityMembers = rows;
  }

  deleteCommunityMembers(communityMembers: Array<any>) {
    let message = null;
    if(communityMembers.length === 1) {
      message = this.i18n.tr('community.members.confirmDelete.messageSingle', 
          {memberName: communityMembers[0].physicalPersonProfile.firstName + ' ' +
          communityMembers[0].physicalPersonProfile.lastName});
    } else if(communityMembers.length >= 1) {
      message = this.i18n.tr('community.members.confirmDelete.message');
    }
    this.dialogService.open({ viewModel: Prompt, model: {
        question:this.i18n.tr('community.members.confirmDelete.title') , 
        message: message
      }
    }).then(response => {
      if (!response.wasCancelled) {
        // Call the delete service.
        console.log('Delete');
      } else {
        // Cancel.
        console.log('Cancel');
      }
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

