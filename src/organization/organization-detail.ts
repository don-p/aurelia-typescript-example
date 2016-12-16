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
import {WizardControllerStep, WizardControllerStepFactory} from '../lib/aurelia-easywizard/controller/wizard-controller-step';

@inject(Session, Router, DataService, OrganizationService, EventAggregator, Ps, I18N, WizardControllerStepFactory, LogManager) // SCROLL
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
    private evt: EventAggregator, Ps, private i18n: I18N, private wizardStepFactory: WizardControllerStepFactory) {

    this.organizationMembers = null;

    // this.ps = Ps; // SCROLL

    this.pageSize = 200;

    const sortAsc = Column.SORT_ASC;
    const sortDesc = Column.SORT_DESC;
    const filterEquals = TextFilter.EQUALS;
    const filterContains = TextFilter.CONTAINS;


    var me = this;
    this.evt.subscribe('orgSelected', payload => {
      if((!me.selectedOrg || me.selectedOrg === null) || (me.selectedOrg.organizationId !== payload.organization.organizationId)) {
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
        me.gridOptions['organizationId'] = me.selectedOrg.organizationId;
        // Set up the virtual scrolling grid displaying community members.
        me.setOrganizationMembersGridDataSource(me.gridOptions, me.pageSize, me.organizationService);
     }
    });
    this.logger = LogManager.getLogger(this.constructor.name);
  }

  getGridColumns(type: string) { 
    let columns = [];
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
    columns.push({
      headerName: this.i18n.tr('community.members.title'), 
      field: "physicalPersonProfile.jobTitle",
      filter: TextSearchFilter
    });
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
/*    let step1Rules = ValidationRules
      .ensure((item: any) => item.files)
      // .displayName(this.i18n.tr('community.communityName'))
      .minItems(1)
      .maxItems(1)
      .rules
      ;
*/
    ///// TEMP
    let step1Rules = "((Array.isArray(this.model.files)) || (this.model.files.constructor.name === 'FileList')) && ( this.model.files.length > 0)";  
    let step2Rules = "this.stepStatus !== 'ERROR'";  
    let step3Rules = "this.stepStatus !== 'ERROR'";  

    const step1 = this.wizardStepFactory.newInstance();
    const step2 = this.wizardStepFactory.newInstance();
    const step3 = this.wizardStepFactory.newInstance();


    step1.config = {
        viewsPrefix: '../../../organization/importWizard',
        id: 'select_file',
        title: this.i18n.tr('organization.onboard.selectFile'),
        canValidate: false,
        vRules: step1Rules,
        model: orgModel,
        callback: function(step, resolve, reject): Promise<Response> {
          // Callback function for submitting the upload file.
          return me.organizationService.importValidate(step.model.orgId, step.model.files)
          .then(response => {return {'res': response.content, 'model': step}})
          .then(data => {
            let res = data['res'];
            let viewModel = data['model'];
            viewModel.model['validateResponse'] = res;
            if(res.errors && res.errors.length > 0) {
              me.logger.error("Upload errors: " + res.errors.length); 
              viewModel.stepStatus = 'ERROR';
              return Promise.reject({currentStep:viewModel, res:res});
            }
            me.logger.debug('doImportValidate response: ', res);
            viewModel.stepStatus = 'OK';
            if(res.warnings && res.warnings.length > 0) {
              viewModel.stepStatus = 'OK'; // Warnings are ignored.
              me.logger.error("Upload warnings: " + res.warnings.length); 
            }
            return {currentStep:viewModel, res:res};
          }, error => {
            step.errorMessage = "Failed"; 
            me.logger.error("Community member call() rejected."); 
            step.stepStatus = 'ERROR';
           return Promise.reject({currentStep:step, res:error.content});
          });
        }
      };
    step2.config = {
        viewsPrefix: '../../../organization/importWizard',
        id: 'validate_file',
        title: this.i18n.tr('organization.onboard.validate'),
        canValidate: false,
        vRules: step2Rules,
        model: orgModel,
        callback: function(step) {
          let validateResponse = step.model.validateResponse;
          let viewModel = step.model;
          // Callback function for submitting the upload file.
          return me.organizationService.importProcess(step.model.orgId, validateResponse.crId)
          .then(response => {return {'res': response, 'model': viewModel}})
          .then(res => { return res.res.json() 
          .then(data => {
            if(data.errors && data.errors.length > 0) {
              me.logger.error("Process errors: " + data.errors.length); 
              data.stepStatus = 'ERROR';
              return Promise.reject(res);
            }
            if(data.warnings && data.warnings.length > 0) {
              me.logger.error("Process warnings: " + data.warnings.length); 
            }
            let viewModel = res['model'];
            let ignoredCount = 0;
            // var acc = 0;
            ignoredCount =Object.keys(data.warningCount).reduce(function(acc, b) {
              return acc + data.warningCount[b];
            }, 0);
            data['ignoredCount'] = ignoredCount;
            viewModel['processResponse'] = data;
            viewModel.stepStatus = 'OK';
            // update the organization member count.
            me.selectedOrg.memberCount = data.totalCount;
            return {currentStep:viewModel, res:data};
          });
          }, error => {
            step.errorMessage = "Failed"; 
            me.logger.error("Org member call() rejected."); 
            let viewModel = error['model'];
            viewModel['processResponse'] = error;
            viewModel.stepStatus = 'OK';
            return Promise.reject({currentStep:viewModel, res:error});
          }).catch(error => {
            step.errorMessage = "Failed"; 
            me.logger.error("Org member call() failed."); 
            me.logger.error(error); 
            let viewModel = error['model'];
            viewModel['processResponse'] = error;
            viewModel.stepStatus = 'ERROR';
            return Promise.reject({currentStep:viewModel, res:error});
          });
          
        }
    };
    step3.config = {
        viewsPrefix: '../../../organization/importWizard',
        id: 'process_file',
        title: this.i18n.tr('organization.onboard.process'),
        canValidate: false,
        vRules: step3Rules,
        model: orgModel
      };

    const steps = [step1, step2, step3];

    orgModel['orgId'] = me.selectedOrg.organizationId;
    this.dataService.openWizardDialog(this.i18n.tr('organization.onboard.importMemberData'), steps, orgModel, null)
    .then((controller:any) => {
      let model = controller.settings;
      controller.viewModel.submit = (output) => {
        me.gridOptions.api.refreshVirtualPageCache();
        me.gridOptions.api.refreshView();
        // update the organization member count.
        // me.selectedOrg.memberCount = data.totalCount;
        // Close dialog on success.
        controller.ok();
      };

      controller.result.then((response) => {
        if (response.wasCancelled) {
          // Cancel.
          this.logger.debug('Cancel');
        }
      })
    });
  }

}

