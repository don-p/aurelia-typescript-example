import {inject, LogManager} from 'aurelia-framework';
import {AuthService} from 'aurelia-auth';
import {Session} from './session';
import {Grid, GridOptions, IGetRowsParams, Column, TextFilter} from 'ag-grid/main';
import {I18N} from 'aurelia-i18n';
import {TextSearchFilter} from '../lib/grid/textSearchFilter';
import {Logger} from 'aurelia-logging';
import {MemberResource} from '../model/memberResource';

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
        if(this.session && this.session.auth.access_token && this.auth.isAuthenticated()) {
            return true;
        } 
        return false;
    }

    /**
     * Resource model object factory methods.
     */
    parseMemberResource(json): any {
        let content = JSON.parse(json, (k, v) => { 
            if ((k !== '')  && typeof this == 'object' && typeof v == 'object' && (!(isNaN(k)) && !(isNaN(parseInt(k))) )) {
                return new MemberResource(v);
            } 
            return v;                
        });
        return content;
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

  setCommunityMembersGridDataSource(dataSourceName, gridOptions, pageSize, communityService, selection, showSelected) {

    // FIXME: DEPRECATED - remove
  }

  setMemberGridDataSource(gridOptions, dataService: any, callback: Function, args: any, isConnectionType: boolean) {
    const me = this;

    // gridOptions.isExternalFilterPresent = function() {
    //     // if selection is 'true', then we are filtering
    //     return gridOptions.selection;
    // }

    // gridOptions.doesExternalFilterPass = function(node) {
    //     return node.selected;
    // }    

    let gridDataSource = {
        name: 'memberConnections',
        /** If you know up front how many rows are in the dataset, set it here. Otherwise leave blank.*/
        rowCount: null,
        maxConcurrentDatasourceRequests: 2,
        loading: false,

        /** Callback the grid calls that you implement to fetch rows from the server. See below for params.*/
        getRows: function(params: IGetRowsParams) {
          gridOptions.api.showLoadingOverlay();
          if(!this.loading) {
            me.logger.debug("..... setMemberGridDataSource Loading Grid rows | startIndex: " + params.startRow);
            me.logger.debug("..... ..... Filter | " + Object.keys(params.filterModel));
            me.logger.debug("..... ..... Sort | " + params.sortModel.toString());
            this.loading = true;
            let memberId = me.session.auth.member.memberId;
/*
            if(!(gridOptions.selection)) { //showAll
*/
              let rowSelection = gridOptions.api.getSelectedRows();
              args['params'] = params;
              let membersPromise = callback.call(dataService, args);
              membersPromise//.then(response => response.json())
                .then(data => {
                  // Filter out existing community members.
                  let totalCount = data.totalCount;
                  if(gridDataSource.rowCount === null) {
                    gridDataSource.rowCount = totalCount;
                  }
                  let result = data.responseCollection;
                  let idProperty = 'memberId';
                  if(!!(isConnectionType)) { // Normalize Connections response member entity.
                    idProperty = 'connectId';
                  }

                  
                  if(!!(gridOptions.showSelected)) { // Filter out only selectedItems.
                    let filteredData = [];
                    let rows:Array<any> = result;
                    rows.forEach(function(node, index, array) {
                      if (rowSelection.find(function(item:any, index:number, array:any[]) {
                        return item[idProperty] === node[idProperty];
                      })) {
                          filteredData.push(node);
                      }
                    });
                    result = filteredData;
                    totalCount = filteredData.length;
                  }
                  params.successCallback(result, totalCount);

                  // if(!!(gridOptions.selection)) {
                  //   let notSelected = [];
                  //   gridOptions.api.forEachNode( function (node) {
                  //     if(!(node.isSelected())) {
                  //       notSelected.push(node);
                  //     }
                  //   });
                  // }                  
                  /*
                  // pre-select nodes as needed.
                  if(Array.isArray(rowSelection)) {
                    gridOptions.api.deselectAll();
                    gridOptions.api.forEachNode( function (node) {
                        if (rowSelection.find(function(item:any, index:number, array:any[]) {
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
                  */
                  gridOptions.api.hideOverlay();
                this.loading = false;
              });
/*
            } else { // showSelected
              let rowSelection = gridOptions.api.getSelectedRows();
              gridOptions.api.deselectAll();
              params.successCallback(rowSelection, rowSelection.length);
              // re-select nodes as needed.
              gridOptions.api.forEachNode( function (node) {
                 node.setSelected(true);
               });
              gridOptions.api.hideOverlay();
              this.loading = false;
            }
*/
          }
        }
    }
    gridOptions.api.setDatasource(gridDataSource);
    return gridDataSource;
  }

  setMemberConnectionRequestsGridDataSource(gridOptions:GridOptions, pageSize, communityService, status) {
      const me = this;
      gridOptions.api.showLoadingOverlay();
      let connectionsPromise = communityService.getMemberConnections({startIndex: 0, pageSize: pageSize, connectionStatus: status});
      connectionsPromise//.then(response => response.json())
        .then(data => {
          let result = data.responseCollection;
          gridOptions.api.setRowData(result);
          gridOptions.api.hideOverlay();
      });
  }

  setNotificationsGridDataSource(gridOptions, dataService: any, callback: Function, args: any, isConnectionType: boolean) {
    const me = this;

    let gridDataSource = {
        name: 'memberNotifications',
        /** If you know up front how many rows are in the dataset, set it here. Otherwise leave blank.*/
        rowCount: null,
        maxConcurrentDatasourceRequests: 2,
        loading: false,

        /** Callback the grid calls that you implement to fetch rows from the server. See below for params.*/
        getRows: function(params: IGetRowsParams) {
          gridOptions.api.showLoadingOverlay();
          if(!this.loading) {
            me.logger.debug("..... setNotificationsGridDataSource Loading Grid rows | startIndex: " + params.startRow);
            me.logger.debug("..... ..... Filter | " + Object.keys(params.filterModel));
            me.logger.debug("..... ..... Sort | " + params.sortModel.toString());
            this.loading = true;
            let memberId = me.session.auth.member.memberId;
            args['params'] = params;
            let membersPromise = callback.call(dataService, args);
            membersPromise//.then(response => response.json())
              .then(data => {
                // Filter out existing community members.
                let totalCount = data.totalCount;
                if(gridDataSource.rowCount === null) {
                  gridDataSource.rowCount = totalCount;
                }
                let result = data.responseCollection;
                params.successCallback(result, totalCount);

                gridOptions.api.hideOverlay();
                this.loading = false;
              });
/*
            } else { // showSelected
              let rowSelection = gridOptions.api.getSelectedRows();
              gridOptions.api.deselectAll();
              params.successCallback(rowSelection, rowSelection.length);
              // re-select nodes as needed.
              gridOptions.api.forEachNode( function (node) {
                 node.setSelected(true);
               });
              gridOptions.api.hideOverlay();
              this.loading = false;
            }
*/
          }
        }
    }
    gridOptions.api.setDatasource(gridDataSource);
    return gridDataSource;
  }

  setNotificationsGridMemoryDataSource(gridOptions, dataService: any, callback: Function, args: any, isConnectionType: boolean) {
    const me = this;

    gridOptions.totalCount = 0;
    gridOptions.api.showLoadingOverlay();
    let membersPromise = callback.call(dataService, args);
    membersPromise//.then(response => response.json())
      .then(data => {
        let totalCount = data.totalCount;
        let result = data.responseCollection;
        gridOptions.totalCount = totalCount;
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
