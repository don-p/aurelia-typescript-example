import {inject, bindable, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {ValidationRules, ValidationController, Validator} from 'aurelia-validation';
import {Session} from '../services/session';
import {DataService} from '../services/dataService';
import {OrganizationService} from '../services/organizationService';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
// import * as Ps from 'perfect-scrollbar'; // SCROLL
import {Grid, GridOptions, IGetRowsParams, IDatasource, Column, TextFilter} from 'ag-grid/main';
import {TextSearchFilter} from '../lib/grid/textSearchFilter';
import {Utils} from '../services/util';

@inject(Session, DataService, OrganizationService, EventAggregator, I18N, Utils, LogManager) // SCROLL
export class OrganizationDetail {
  member: Object;

  selectedOrg: any;
  membersGrid: Object;
  orgMembersGrid: any;
  // addCmtyMembersGrid: any;
  currentMember: Object;
  // remoteData: RemoteData;

  @bindable pageSize;
  gridOptions: GridOptions;
  grid: any;


  ps: any; // SCROLL

  logger: Logger;
  
  constructor(private session: Session, private dataService: DataService, private organizationService: OrganizationService,  
    private evt: EventAggregator, private i18n: I18N, private utils: Utils) {

    // this.ps = Ps; // SCROLL

    this.pageSize = 100000;

    var me = this;

    this.gridOptions = <GridOptions>{};
    this.gridOptions.getRowNodeId = function(item) {
      return item.memberId.toString();
    };
    this.gridOptions.rowModelType = 'virtual';


    this.evt.subscribe('orgSelected', payload => {
      if((!me.selectedOrg || me.selectedOrg === null) || (me.selectedOrg.organizationId !== payload.organization.organizationId)) {
        me.selectedOrg = payload.organization;

        if(!!(me.gridOptions.api)) {
          me.gridOptions.api.setFilterModel(null)
          me.gridOptions.api.setSortModel(null);
        }
      
        // Save selected orgId.
        me.gridOptions['organizationId'] = me.selectedOrg.organizationId;
        // Set up the virtual scrolling grid displaying community members.
        me.utils.setMemberGridDataSource(
          me.gridOptions, 
          me.organizationService, 
          me.organizationService.getOrgMembers, 
          {startIndex: 0, pageSize: me.pageSize, organizationId: me.selectedOrg.organizationId}, 
          false
        );
     }
    });
    this.logger = LogManager.getLogger(this.constructor.name);
  }


  attached(params, navigationInstruction) {
    // // Custom scrollbar:
    // var container = document.getElementById('community-member-list'); // SCROLL
    // this.ps.initialize(container);
    // this.ps.update(container);
  }

  onGridReady(event) {
    let grid:any = this;
    event.api.sizeColumnsToFit();
  }

  onFilterChanged = function(event) {
    this.utils.setGridFilterMap(this.gridOptions);
  }

  get isGridFiltered() {
    return this.gridOptions && this.gridOptions.api && this.gridOptions.api.isAnyFilterPresent();
  }


  bind() {
  }

  clearGridFilters(gridOptions, filterName) {
      this.utils.clearGridFilters(gridOptions, filterName);
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
    let step1Rules = "((Array.isArray(this.model.files)) || (this.model.files.constructor.prototype.toString().indexOf('FileList') !== -1)) && ( this.model.files.length > 0)";  
    let step2Rules = "this.stepStatus !== 'ERROR'";  
    let step3Rules = "this.stepStatus !== 'ERROR'";  

    const step1config = {
        viewsPrefix: '../../../organization/importWizard',
        id: 'select_file',
        title: this.i18n.tr('organization.onboard.selectFile'),
        canValidate: false,
        vRules: step1Rules,
        model: orgModel,
        callback: function(step, resolve, reject): Promise<Object> {
          // Callback function for submitting the upload file.
          let modelPromise = me.organizationService.importValidate(step.model.orgId, step.model.files);
          step.controller.wizard.wizLoadingPromise = modelPromise;        
          return modelPromise
          .then(response => {//return {'res': response.content, 'model': step} })
          // .then((data:Object) => {
            let data = {'res': response.content, 'model': step} ;
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
            return Promise.resolve({currentStep:viewModel, res:res});
          }, error => {
            step.errorMessage = "Failed"; 
            me.logger.error("Community member call() rejected."); 
            step.stepStatus = 'ERROR';
           return Promise.reject({currentStep:step, res:error.content});
          });
        }
      };
    const step2config = {
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
          let modelPromise = me.organizationService.importProcess(step.model.orgId, validateResponse.crId);
          step.controller.wizard.wizLoadingPromise = modelPromise;        
          return modelPromise
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
            // refresh the member list.
            me.gridOptions.api.refreshVirtualPageCache();
            me.gridOptions.api.refreshView();
            
            return Promise.resolve({currentStep:viewModel, res:data});
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
    const step3config = {
        viewsPrefix: '../../../organization/importWizard',
        id: 'process_file',
        title: this.i18n.tr('organization.onboard.process'),
        canValidate: false,
        canGoBack: false,
        canCancel: false,
        vRules: step3Rules,
        model: orgModel
      };

    const steps = [step1config, step2config, step3config];

    orgModel['orgId'] = me.selectedOrg.organizationId;
    this.dataService.openWizardDialog(this.i18n.tr('organization.onboard.importMemberData'), steps, orgModel, null)
    .then((controller:any) => {
      let model = controller.settings;
      controller.viewModel.onUploadFile = function(event, fileList) {
        let fileArray = Array.from(fileList);
        controller.viewModel.item.files = fileArray;
      };
      controller.viewModel.submit = (output) => {
        // me.gridOptions.api.refreshVirtualPageCache();
        // me.gridOptions.api.refreshView();

        // update the organization member count.
        // me.selectedOrg.memberCount = data.totalCount;
        // Close dialog on success.
        controller.ok();
      };

      // controller.result.then((response) => {
      //   if (response.wasCancelled) {
      //     // Cancel.
      //     this.logger.debug('Cancel');
      //   }
      // })
    });
  }

}

