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
        if(type !== 'transferOwnership') {
            columns.push({
                colId: 'select',
                headerName: '', 
                width: 30, 
                minWidth: 30, 
                checkboxSelection: true, 
                suppressMenu: true
            });
        }
        columns.push({
            headerName: this.i18n.tr('community.members.firstname'), 
            field: "physicalPersonProfile.firstName",
            filter: TextSearchFilter
        });
        columns.push({
            headerName: this.i18n.tr('community.members.lastname'), 
            field: "physicalPersonProfile.lastName", 
            filter: TextSearchFilter
        });
        if(type == 'listMembers') {
            columns.push({
                headerName: this.i18n.tr('community.members.organization'), 
                field: "physicalPersonProfile.organization.organizationName",
                filter: TextSearchFilter,
                hide: false
            });
        } // else if (type === 'addMembers') {
        columns.push({
            headerName: this.i18n.tr('community.members.title'), 
            field: "physicalPersonProfile.jobTitle",
            filter: TextSearchFilter
        });
        // }
        columns.push({
            headerName: this.i18n.tr('community.members.city'), 
            field: "physicalPersonProfile.locationProfile.city",
            filter: TextSearchFilter
        });
        columns.push({
            headerName: this.i18n.tr('community.members.state'), 
            field: "physicalPersonProfile.locationProfile.stateCode", 
            filter: TextSearchFilter,
            width: 100
        });
        columns.push({
            headerName: this.i18n.tr('community.members.zip'), 
            field: "physicalPersonProfile.locationProfile.zipCode", 
            filter: TextSearchFilter,
            width: 80
        });

        return columns;
    }

    getGridOptions(type, pageSize): GridOptions {
        let me = this;
        return {
        columnDefs: this.getGridColumns(type),
        rowSelection: 'multiple',
        rowHeight: 30,
        headerHeight: 40,
        suppressMenuHide: true,
        // pageSize: this.pageSize,
        paginationPageSize: pageSize,
        sortingOrder: ['desc','asc'],
        enableServerSideSorting: true,
        enableServerSideFilter: true,
        enableColResize: true,
        debug: false,
        rowModelType: 'virtual',
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

  clearGridFilters(gridOptions) {
      gridOptions.api.setFilterModel({});
      gridOptions.api.refreshView();
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
                      }
                  });
                }
                gridOptions.api.hideOverlay();
                
                this.loading = false;
            });
          // }
        }
    }
    gridOptions.api.setDatasource(gridDataSource);
  }

}