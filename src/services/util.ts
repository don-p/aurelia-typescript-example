import {inject, LogManager} from 'aurelia-framework';
import {AuthService} from 'aurelia-auth';
import {Session} from './session';
import {Grid, GridOptions, IGetRowsParams, IDatasource, Column, TextFilter} from 'ag-grid/main';
import {I18N} from 'aurelia-i18n';
import {TextSearchFilter} from '../lib/grid/textSearchFilter';
import {Logger} from 'aurelia-logging';

@inject(Session, AuthService, I18N, LogManager)
export class Utils {  

    logger: Logger;

    // Service object for application utilities.
    constructor(private session:Session, private auth: AuthService, private i18n: I18N){
        this.logger = LogManager.getLogger(this.constructor.name);
    }
    
    parseFetchError(params): string {
        var errorMessage = params.errorMessage;
        let hash = location.hash.substring(0,location.hash.indexOf('?'));
        let baseUrl = window.location.protocol + '//' + window.location.host + '/';
        if(hash && hash !== '') {
            let url = baseUrl + hash;
            location.replace(url);
        }
        return errorMessage;
    }

    isLoggedIn(): boolean {
        if(this.session && this.session.auth['access_token'] && this.auth.isAuthenticated()) {
            return true;
        } 
        return false;
    }

    /**
     * Ag-Grid utility support functions.
     */

    getGridColumns(type: string) { 
        let columns = [];
        // return [
        if(type !== 'transferOwnership' &&
          type !== 'listConnectionRequests' &&
          type != 'organizationMembers') {
            columns.push({
                colId: 'select',
                headerName: '', 
                pinned: 'left',
                width: 30, 
                minWidth: 30, 
                checkboxSelection: true, 
                suppressMenu: true
            });
        }
        columns.push({
            headerName: this.i18n.tr('community.communities.members.firstname'), 
            field: "physicalPersonProfile.firstName",
            filter: TextSearchFilter
        });
        columns.push({
            headerName: this.i18n.tr('community.communities.members.lastname'), 
            field: "physicalPersonProfile.lastName", 
            filter: TextSearchFilter
        });
        if(type == 'listMembers' || 
          type == 'listConnectionRequests' || 
          type == 'selectedCommunityMembers') {
            columns.push({
                headerName: this.i18n.tr('community.communities.members.organization'), 
                field: "physicalPersonProfile.organization.organizationName",
                filter: TextSearchFilter,
                hide: false
            });
        } // else if (type === 'addMembers') {
        columns.push({
            headerName: this.i18n.tr('community.communities.members.title'), 
            field: "physicalPersonProfile.jobTitle",
            filter: TextSearchFilter
        });
        // }
        if(type !== 'listConnectionRequests') {
          columns.push({
              headerName: this.i18n.tr('community.communities.members.city'), 
              field: "physicalPersonProfile.locationProfile.city",
              filter: TextSearchFilter
          });
          columns.push({
              headerName: this.i18n.tr('community.communities.members.state'), 
              field: "physicalPersonProfile.locationProfile.stateCode", 
              filter: TextSearchFilter,
              width: 100
          });
          columns.push({
              headerName: this.i18n.tr('community.communities.members.zip'), 
              field: "physicalPersonProfile.locationProfile.zipCode", 
              filter: TextSearchFilter,
              width: 80
          });
        }
        if(type == 'listConnectionRequests') {
          columns.push({
            headerName: '',
            cellRenderer: function(params) {
              var eDiv = document.createElement('div');
              eDiv.innerHTML = '<i if.bind="requestType==\'INVITED\'" onclick="parent.editConnectionRequest([\'' + params.data.memberId + '\'], \'ACCEPT\')" click.delegate="parent.editConnectionRequest([connection], \'ACCEPT\')" class="ico-bin float-right"></i> <i click.delegate="editConnectionRequest([connection], \'ACCEPT\')" class="ico-circle-right6 float-right"></i>';
              var eButton = eDiv.querySelectorAll('.btn-simple')[0];

              return eDiv;
            }
          })
        }
        return columns;
    }

    getGridOptions(type, pageSize): GridOptions {
        let me = this;
        let isConnectionRequests = type === 'listConnectionRequests';
        let rowModel = type === 'listConnectionRequests'?'normal':'virtual';

        return <GridOptions>{
        columnDefs: this.getGridColumns(type),
        rowSelection: 'multiple',
        suppressRowClickSelection: true,
        rowHeight: 30,
        headerHeight: 40,
        suppressMenuHide: true,
        // pageSize: this.pageSize,
        paginationPageSize: pageSize,
        sortingOrder: ['desc','asc'],
        enableServerSideSorting: !isConnectionRequests,
        enableServerSideFilter: !isConnectionRequests,
        enableSorting: isConnectionRequests,
        enableFilter: false,
        enableColResize: true,
        debug: false,
        rowModelType: rowModel,
        maxPagesInCache: 2,
        onViewportChanged: function() {
            if(!this.api) return;
            this.api.sizeColumnsToFit();
        },
        onGridSizeChanged: function(){
            if(!this.api) return;
            this.api.sizeColumnsToFit();
        }
        };
    }

  clearGridFilters(gridOptions, filterName) {
      if(!!(filterName)) {
        let filterComponent = gridOptions.api.getFilterInstance(filterName);
        filterComponent.setFilter(null);
        gridOptions.api.onFilterChanged();
      } else {
        gridOptions.api.setFilterModel({});
        gridOptions.api.refreshView();
      }
  }

  setGridFilterMap(gridOptions) {
      let filters = new Map();
      let obj = gridOptions.api.getFilterModel();
      Object.keys(obj).forEach(key => {
        filters.set(key, obj[key]);
      });
      gridOptions['filters'] = filters;    
  }

  findGridColumnDef(gridOptions: GridOptions, fieldName: string):Object {
    return gridOptions.columnDefs.find(function(colDef: Object){
      return colDef['field'] === fieldName;
    });
  }

  setCommunityMembersGridDataSource(dataSourceName, gridOptions, pageSize, communityService, selection, showSelected) {
    const me = this;

    // Adjust column visibility based on community type - TEAM or COI.
    // let type = this.selectedCmty.communityType;
  //   if(type === 'TEAM') {
  //     // Show title and org column.
  //     gridOptions.columnApi.setColumnVisible('physicalPersonProfile.organization.organizationName', true);
  //     gridOptions.columnApi.setColumnVisible('physicalPersonProfile.jobTitle', true);      
  //     gridOptions.api.sizeColumnsToFit();
  //   } else {
  //     gridOptions.columnApi.setColumnVisible('physicalPersonProfile.organization.organizationName', true);      
  //     gridOptions.api.sizeColumnsToFit();
  //     gridOptions.columnApi.autoSizeColumn('physicalPersonProfile.organization.organizationName');
  //  }
    let name = dataSourceName; //showSelected?'selectedCommunityMembers':'communityMembers';
    // let selectionFilterComponent:SelectedRowFilter = gridOptions.api.getFilterInstance('select');
    // if(showSelected) {
    //   selectionFilterComponent.setActive(true);
    //   // gridOptions.columnDefs[0].filter = new SelectedRowFilter();
    // } else {
    //   selectionFilterComponent.setActive(false);
    //   // gridOptions.columnDefs[0].filter = null;
    // }

    selection = gridOptions.selection;

    let gridDataSource = this.getCommunityMembersGridDataSource(dataSourceName, gridOptions, pageSize, communityService);
    gridOptions.api.setDatasource(gridDataSource);
  }

  getCommunityMembersGridDataSource(dataSourceName, gridOptions, pageSize, communityService) {
    const me = this;

    let name = dataSourceName; //showSelected?'selectedCommunityMembers':'communityMembers';
    // let selectionFilterComponent:SelectedRowFilter = gridOptions.api.getFilterInstance('select');
    // if(showSelected) {
    //   selectionFilterComponent.setActive(true);
    //   // gridOptions.columnDefs[0].filter = new SelectedRowFilter();
    // } else {
    //   selectionFilterComponent.setActive(false);
    //   // gridOptions.columnDefs[0].filter = null;
    // }

    let selection = gridOptions.selection;

    let gridDataSource = {
        /** If you know up front how many rows are in the dataset, set it here. Otherwise leave blank.*/
        name: name,
        rowCount: null,
        paginationPageSize: pageSize,
        //  paginationOverflowSize: 1,
        maxConcurrentDatasourceRequests: 2,
        //  maxPagesInPaginationCache: 2,
        loading: false,

        /** Callback the grid calls that you implement to fetch rows from the server. See below for params.*/
        getRows: function(params: IGetRowsParams) {
          gridOptions.api.showLoadingOverlay();
          let selection = gridOptions.selection;
          // if(!this.loading) {
            me.logger.debug("..... setCommunityMembersGridDataSource Loading Grid rows | startIndex: " + params.startRow);
            me.logger.debug("..... ..... Filter | " + Object.keys(params.filterModel));
            me.logger.debug("..... ..... Sort | " + params.sortModel.toString());
            this.loading = true;
            let filter = me.findGridColumnDef(gridOptions, Object.keys(params.filterModel)[0]);
            me.logger.debug('Filter >> :' + JSON.stringify(params.filterModel));
            let  communityId = gridOptions.communityId;
            let membersPromise = communityService.getCommunity(communityId, params.startRow, pageSize, params);
            membersPromise.then(response => response.json())
              .then(data => {
                // if(gridDataSource.rowCount === null) {
                  gridDataSource.rowCount = data.totalCount;
                // }
                /*
                // Filter out only selectedItems.
                if(showSelected) {
                  let filteredData = [];
                  let rows:Array<any> = data.responseCollection;
                  rows.forEach(function(node, index, array) {
                    if (selection.find(function(item:any, index:number, array:any[]) {
                      return item.memberId === node.memberId;
                    })) {
                        filteredData.push(node);
                    }
                  });
                  data.responseCollection = filteredData;
                  data.totalCount = filteredData.length;
                }
                */
                params.successCallback(data.responseCollection, data.totalCount);
                // pre-select nodes as needed.
                if(Array.isArray(selection)) {
                  gridOptions.api.forEachNode( function (node) {
                      if (selection.find(function(item:any, index:number, array:any[]) {
                        return item.memberId === node.data.memberId
                      })) {
                          node.setSelected(true);
                          gridOptions.api.refreshRows([node]);
                      } else {
                          node.setSelected(false);
                          gridOptions.api.refreshRows([node]);
                      }
                  });
                }
                gridOptions.api.hideOverlay();
                
                this.loading = false;
            });
          // }
        }
    }
    return gridDataSource
  }

  getSelectedCommunityMembersGridDataSource(dataSourceName, gridOptions: GridOptions):any {
    const me = this;

    // Set local row model.
    gridOptions.enableServerSideSorting = false;
    gridOptions.enableServerSideFilter = false;
    gridOptions.enableSorting = true;
    gridOptions.enableFilter = false;
    gridOptions.rowModelType = 'normal';

    let gridDataSource = {
        name: dataSourceName,
        /** If you know up front how many rows are in the dataset, set it here. Otherwise leave blank.*/
        rowCount: null,
        // paginationPageSize: pageSize,
        //  paginationOverflowSize: 1,
        maxConcurrentDatasourceRequests: 2,
        //  maxPagesInPaginationCache: 2,
        loading: false,

        // /** Callback the grid calls that you implement to fetch rows from the server. See below for params.*/
        // getRows: function(params: IGetRowsParams) {
        //   me.logger.debug("..... setSelectedOrganizationMembersGridDataSource Loading Grid rows | startIndex: " + params.startRow);
        //   gridOptions.api.showLoadingOverlay();
        //   params.successCallback(selection, selection.length);
        //   gridOptions.api.hideOverlay();
        // }
    }
    return gridDataSource;
  }
  setSelectedCommunityMembersGridDataSource(gridOptions: GridOptions, pageSize, selection) {
    const me = this;

    // Set local row model.
    gridOptions.enableServerSideSorting = false;
    gridOptions.enableServerSideFilter = false;
    gridOptions.enableSorting = true;
    gridOptions.enableFilter = true;
    gridOptions.rowModelType = '';
    gridOptions.api.setRowData(selection);

    let gridDataSource = this.getSelectedCommunityMembersGridDataSource('selectedCommunityMembers', gridOptions);
    gridOptions.api.setDatasource(gridDataSource);
  }
  
  setMemberConnectionsGridDataSource(gridOptions, pageSize, communityService, status) {
    const me = this;

    gridOptions.selection = null;

    let gridDataSource = {
        name: 'memberConnections',
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
            me.logger.debug("..... setMemberConnectionsGridDataSource Loading Grid rows | startIndex: " + params.startRow);
            me.logger.debug("..... ..... Filter | " + Object.keys(params.filterModel));
            me.logger.debug("..... ..... Sort | " + params.sortModel.toString());
            this.loading = true;
            let memberId = me.session.auth['member'].memberId;
            let connectionsPromise = communityService.getMemberConnections(status, params.startRow, pageSize, params);
            connectionsPromise.then(response => response.json())
              .then(data => {
                // Filter out existing community members.
                let totalCount = data.totalCount;
                if(gridDataSource.rowCount === null) {
                  gridDataSource.rowCount = totalCount;
                }
                let result = data.responseCollection.map(function(item){
                  return {
                    connectId: item.connectId,
                    connectStatus: item.connectStatus,
                    memberEntityType: item.member.memberEntityType,
                    memberId: item.member.memberId,
                    physicalPersonProfile: item.member.physicalPersonProfile
                  }
                });
                params.successCallback(result, totalCount);
                // pre-select nodes as needed.
                let selection = gridOptions.selection;
                if(Array.isArray(selection)) {
                  gridOptions.api.forEachNode( function (node) {
                      if (selection.find(function(item:any, index:number, array:any[]) {
                        return item.memberId === node.data.memberId
                      })) {
                          node.setSelected(true);
                          gridOptions.api.refreshRows([node]);
                      } else {
                          node.setSelected(false);
                          gridOptions.api.refreshRows([node]);
                      }
                  });
                }
                gridOptions.api.hideOverlay();
               this.loading = false;
            });
          }
        }
    }
    gridOptions.api.setDatasource(gridDataSource);
  }

  setMemberConnectionRequestsGridDataSource(gridOptions:GridOptions, pageSize, communityService, status) {
      const me = this;
      gridOptions.api.showLoadingOverlay();
      let connectionsPromise = communityService.getMemberConnections(status, 0, pageSize);
      connectionsPromise.then(response => response.json())
        .then(data => {
          let result = data.responseCollection.map(function(item){
            return {
              connectId: item.connectId,
              connectStatus: item.connectStatus,
              memberEntityType: item.member.memberEntityType,
              memberId: item.member.memberId,
              physicalPersonProfile: item.member.physicalPersonProfile,
              statusComment: item.statusComment
            }
          });
          gridOptions.api.setRowData(result);
          gridOptions.api.hideOverlay();
      });
  }

  /**
   * Utilities
   */
  $isDirty(originalItem, item) {
    if(!(originalItem) || !(item)) {
      return false;
    }
    let me = this;
    let isEqual = function(obj1, obj2) {
      let equal = true;
      if(Array.isArray(obj1)) {
        equal = me.isArrayEqual(obj2, obj1);
      } else if(typeof obj1 === 'object') {
        equal = me.isObjectEqual(obj1, obj2);
      }
      me.logger.debug('... dirty-checking in Model: ' + !equal);
      return equal;
    };
    return !(isEqual(item, originalItem));
  }

  isObjectEqual(obj1, obj2) {
    let me = this;
     let isEqual = Object.keys(obj2).every((key) => 
      obj1.hasOwnProperty(key) && 
      ((obj2[key] === obj1[key]) || (me.isEmpty(obj2[key]) && me.isEmpty(obj1[key])))
    );
    return isEqual;
  }

  isArrayEqual(obj1:Array<any>, obj2:Array<any>) {
    let me = this;
    return obj2.every(
      function(key) { 
        return obj1.indexOf(key) !== -1
      }
    );
  }
  
  isEmpty(obj) {
    if(obj === undefined || obj === null) {
      return true;
    }
    if(typeof obj === 'string' && (obj === '')) {
      return true;
    }

    return false;
  }

}
