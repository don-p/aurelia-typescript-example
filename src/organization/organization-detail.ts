import {inject, bindable, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {ValidationRules, ValidationController, Validator} from 'aurelia-validation';
import {Session} from '../services/session';
import {DataService} from '../services/dataService';
import {OrganizationService} from '../services/organizationService';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
import {Prompt} from '../model/prompt';
import * as Ps from 'perfect-scrollbar'; // SCROLL
import {Grid, GridOptions, IGetRowsParams, IDatasource, Column, TextFilter} from 'ag-grid/main';
import {TextSearchFilter} from '../lib/grid/textSearchFilter';
import {WizardControllerStep} from '../lib/aurelia-easywizard/controller/wizard-controller-step';

@inject(Session, Router, DataService, OrganizationService, EventAggregator, Ps, I18N, LogManager) // SCROLL
export class OrganizationDetail {
  member: Object;

  navigationInstruction: NavigationInstruction;
  selectedOrganizationMembers: Array<Object>;
  selectedOrg: any;
  organizationMembers: Array<Object>;
  membersGrid: Object;
  orgMembersGrid: any;
  // addCmtyMembersGrid: any;
  currentMember: Object;
  // remoteData: RemoteData;

  membersPromise: Promise<Response>;
  orgMembersCachePromise:  Promise<void>;
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
    private dataService: DataService, private organizationService: OrganizationService,  
    private evt: EventAggregator, Ps, private i18n: I18N) {

    this.organizationMembers = null;

    // this.ps = Ps; // SCROLL

    this.pageSize = 200;

    const sortAsc = Column.SORT_ASC;
    const sortDesc = Column.SORT_DESC;
    const filterEquals = TextFilter.EQUALS;
    const filterContains = TextFilter.CONTAINS;


    var me = this;
    this.evt.subscribe('orgSelected', payload => {
      if((!me.selectedOrg || me.selectedOrg === null) || (me.selectedOrg.id !== payload.organization.id)) {
        me.selectedOrg = payload.organization;
        // this.remoteData.setDataApi('v1/communities/' + selectedCmty + '/members')
        // DEBUG TEMP - this.getorganizationMembers(this.selectedCmty, 0);
        // this.gridDataSource.getRows({startRow: 0, endRow: this.pageSize});
        // this.loadData();

        // this.initGrid(this);

        me.gridOptions.api.deselectAll();
        me.gridOptions.api.setFilterModel(null)
        me.gridOptions.api.setSortModel(null);

        // Save selected orgId.
        me.gridOptions['organizationId'] = me.selectedOrg.id;
        // Set up the virtual scrolling grid displaying community members.
        me.setOrganizationMembersGridDataSource(me.gridOptions, me.pageSize, me.organizationService);
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
        hide: true
      });
    } else if (type === 'addMembers') {
      columns.push({
        headerName: this.i18n.tr('community.members.title'), 
        field: "physicalPersonProfile.jobTitle",
        filter: TextSearchFilter
      });
    }
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
            let orgPromise = organizationService.getOrgMembers(organizationId, params.startRow, pageSize, params);
            orgPromise.then(response => response.json())
              .then(data => {
                // Filter out existing community members.
                let totalCount = data.totalCount;
                // let filteredData = data.responseCollection.filter(function(item) {
                //   if(me.organizationMembers.indexOf(item.id) < 0) {
                //     return true;
                //   } else {
                //     totalCount--;
                //     return false;
                //   }
                // });
                if(gridDataSource.rowCount === null) {
                  gridDataSource.rowCount = totalCount;
                }
                gridOptions.api.hideOverlay();
                params.successCallback(data.responseCollection, totalCount);
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
      gridOptions.api.setFilterModel({});
      gridOptions.api.refreshView();
  }

  addOrganizationMembers() {

    this.logger.debug('addOrganizationMembers()');

    var me = this;
    let orgModel:Object = {
      orgId:'',
      files: []
    }
    // const vRules = ValidationRules
    //   .ensure('item').maxItems(maxParticipants)
    //   .withMessage(this.i18n.tr('community.call.callParticipantMaxCountError', {count:maxParticipants}))
    //   .rules;
    const step1 = new WizardControllerStep();
    const step2 = new WizardControllerStep();
    const step3 = new WizardControllerStep();

    step1.config = {
        viewsPrefix: '../../../organization/importWizard',
        id:'select_file',
        title:'Select File',
        canValidate: false,
        model: orgModel,
        callback: function(model) {
          // Callback function for submitting the upload file.
          me.organizationService.importValidate(model.orgId, model.files)
          .then(response => {return {'res': response.content, 'model': model}})
          .then(data => {
            let res = data['res'];
            let viewModel = data['model'];
            viewModel['validateResponse'] = res;
            me.logger.debug('doImportValidate response: ', res);
            // Update the message for success.
            // controller.viewModel.message = this.i18n.tr('community.members.call.callSuccessMessage');
            // controller.viewModel.okText = this.i18n.tr('button.ok');
            // controller.viewModel.showCancel = false;
            // // Close dialog on success.
            // delete controller.viewModel.submit;
          }, error => {
            model.errorMessage = "Failed"; 
            me.logger.error("Community member call() rejected."); 
          }).catch(error => {
            model.errorMessage = "Failed"; 
            me.logger.error("Community member call() failed."); 
            me.logger.error(error); 
            return Promise.reject(error);
          });
        }
      };
    step2.config = {
        viewsPrefix: '../../../organization/importWizard',
        id:'validate_file',
        title:'Validate',
        canValidate: false,
        model: orgModel,
        callback: function(model) {
          let validateResponse = model.validateResponse;
          let viewModel = model;
          // Callback function for submitting the upload file.
          me.organizationService.importProcess(model.orgId, validateResponse.crId)
          .then(response => {
          let viewModel2 = viewModel;
            return response.json().then(data => {
              let res = data;
              // let viewModel = data['model'];
              // viewModel['processResponse'] = res;
              me.logger.debug('doImportProcess response: ', res);
              // Update the message for success.
              // controller.viewModel.message = this.i18n.tr('community.members.call.callSuccessMessage');
              // controller.viewModel.okText = this.i18n.tr('button.ok');
              // controller.viewModel.showCancel = false;
              // // Close dialog on success.
              // delete controller.viewModel.submit;
            })
          }, error => {
            model.errorMessage = "Failed"; 
            me.logger.error("Community member call() rejected."); 
          }).catch(error => {
            model.errorMessage = "Failed"; 
            me.logger.error("Community member call() failed."); 
            me.logger.error(error); 
            return Promise.reject(error);
          });
        }
        
      };
    step3.config = {
        viewsPrefix: '../../../organization/importWizard',
        id:'process_file',
        title:'Process',
        canValidate: false,
        model: orgModel
      };

    const steps = [step1, step2, step3];

    orgModel['orgId'] = me.selectedOrg.id;
    this.dataService.openWizardDialog(steps,
      orgModel, null)
    .then((controller:any) => {
      let model = controller.settings;
      /*
      controller.viewModel.submit = (organizationMembers:any[]) => {
        // Add logged-in user to the call list.
        organizationMembers.unshift(me.session.auth['member']);
        let memberIDs = organizationMembers.map(function(value) {
          return {
            "participantId": value.memberId,
            "participantType": "MEMBER"
          }
        });
        // Call the service to start the call.
        controller.viewModel.modelPromise = this.communityService.startConferenceCall({participantRef:memberIDs});
        controller.viewModel.modelPromise.then(response => response.json())
        .then(data => {
            // Update the message for success.
            controller.viewModel.message = this.i18n.tr('community.members.call.callSuccessMessage');
            controller.viewModel.okText = this.i18n.tr('button.ok');
            controller.viewModel.showCancel = false;
            // Close dialog on success.
            delete controller.viewModel.submit;
          }, error => {
            model.errorMessage = "Failed"; 
            me.logger.error("Community member call() rejected."); 
          }).catch(error => {
            model.errorMessage = "Failed"; 
            me.logger.error("Community member call() failed."); 
            me.logger.error(error); 
            return Promise.reject(error);
          })
      };
      */
      controller.result.then((response) => {
        if (response.wasCancelled) {
          // Cancel.
          this.logger.debug('Cancel');
        }
      })
    });
  }

}

