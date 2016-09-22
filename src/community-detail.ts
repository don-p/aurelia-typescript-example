import {inject, Lazy, bindable} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {Session} from './services/session';
import {AppConfig} from './services/appConfig';
import {DataService} from './services/dataService';
import {EventAggregator} from 'aurelia-event-aggregator';
import * as Ps from 'perfect-scrollbar'; // SCROLL

import * as ag from 'ag-grid';
import {AgGridWrapper} from './lib/ag-grid';


// import {RemoteData} from './services/remoteData';


// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(Lazy.of(HttpClient), Session, Router, AppConfig, DataService, EventAggregator, Ps, AgGridWrapper) // SCROLL
export class CommunityDetail {
  member: Object;

  navigationInstruction: NavigationInstruction;
  // selectedCommunityMembers: Array<Object>;
  selectedCmty: any;
  selectedCommunityMembers: { get: () => any[] };
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
    private dataService: DataService, private evt: EventAggregator, Ps, private agGridWrap:AgGridWrapper) { // SCROLL

    this.selectedCommunityMembers = null;
    // this.membersGrid = {};
    // this.currentMember = {};
    // this.remoteData = new RemoteData(appConfig.apiServerUrl, null);

    // this.ps = Ps; // SCROLL


    this.gridColumns = [
      { headerName: '', field: "customerId", width: 50, checkboxSelection: true, suppressMenu: true},
      { headerName: "First Name", field: "physicalPersonProfile.firstName",filter: 'text' },
      { headerName: "Last Name", field: "physicalPersonProfile.lastName", filter: 'text' },
      { headerName: "Title", field: "physicalPersonProfile.jobTitle",filter: 'text' },
      { headerName: "Organization", field: "physicalPersonProfile.organization.organizationName", filter: 'text' },
      { headerName: "City", field: "physicalPersonProfile.locationProfile.city",filter: 'text' },
      { headerName: "State", field: "physicalPersonProfile.locationProfile.stateCode", filter: 'text' },
      { headerName: "ZIP", field: "physicalPersonProfile.locationProfile.zipCode",filter: 'text' }
    ];

    this.pageSize = 50;

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
    // this.selectedCommunityMembers = params;

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
        // rowData: this.selectedCommunityMembers,
        rowSelection: 'multiple',
      //  rowHeight: 25,
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
        getRowNodeId: function(item) {
          return item.memberId.toString();
        }
    };


    // var eGridDiv = document.querySelector('#eGridDiv');
    this.gridOptions = gridOptions;
    this.initGrid(this);

  }
  initGrid(me) {
    this.cmtyMembersGrid.setGridOptions(this.gridOptions);
    this.agGridWrap.gridCreated = true;
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
                this.loading = true;
                me.membersPromise = me.dataService.getCommunity(me.selectedCmty.communityId, params.startRow, me.pageSize);
                me.membersPromise.then(response => response.json())
                  .then(data => {
                    if(me.gridDataSource.rowCount === null) {
                      me.gridDataSource.rowCount = data.totalCount;
                    }
                     me.gridOptions.api.hideOverlay();
                   params.successCallback(data.responseCollection, data.totalCount-1);
                    // me.gridOptions.api.hideOverlay();
                    this.loading = false;
                });
              }
            }
        }
        me.gridOptions.api.setDatasource(me.gridDataSource);
        me.gridOptions.api.sizeColumnsToFit();
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
      me.selectedCommunityMembers = data.responseCollection;
      me.agGridWrap.rowsChanged(me.selectedCommunityMembers, null);
    }).catch(error => {
      console.log("Communities members() failed."); 
      console.log(error); 
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

