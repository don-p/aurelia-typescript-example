import {inject, NewInstance, Lazy, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {Router} from 'aurelia-router';
import {DataService} from '../services/dataService';
import {Session} from '../services/session';
import {I18N} from 'aurelia-i18n';
import {Grid, GridOptions, IGetRowsParams, IDatasource, Column, TextFilter} from 'ag-grid/main';
import {WizardControllerStep} from '../lib/aurelia-easywizard/controller/wizard-controller-step';
import {AureliaConfiguration} from 'aurelia-configuration';
import {ValidationRules, ValidationController, Validator} from 'aurelia-validation';
import {CommunityService} from '../services/communityService';
import {Utils} from '../services/util';

@inject(Session, DataService, CommunityService, I18N, AureliaConfiguration, Utils, LogManager)
export class Community {

  router: Router;
  alertCategories: Array<Object>;

  logger: Logger;
  pageSize;

  constructor(private session: Session, private dataService: DataService, private communityService: CommunityService, private i18n: I18N, private appConfig: AureliaConfiguration, private utils: Utils) {
    this.pageSize = 200;

    // Get list of alert/notification categories.
    this.getAlertCategoriesPage(0, 500);

    this.logger = LogManager.getLogger(this.constructor.name);
  }

  // Child router for subtabs - Community, Discover, Connections.
  configureRouter(config, router) {
    config.map([
      { route: '', redirect: 'communities', nav: false},
      { route: 'communities', name: 'community/communities', moduleId: './communities', nav: true, title: this.i18n.tr('router.nav.communities') },
      { route: 'discover', name: 'community/discover', moduleId: './discover', nav: true, title: this.i18n.tr('router.nav.discover') }//,
      // { route: 'connections', name: 'connections', moduleId: './community/connections', nav: true, title: 'Connections' }
    ]);
    this.router = router;
  }

  bind(bindingContext: Object, overrideContext: Object) {
    this.logger.debug("Community | bind()");
  }

  getAlertCategoriesPage(startIndex: number, pageSize: number): Promise<Response> {
    var me = this;
    var alertPromise = this.dataService.getAlertCategories(startIndex,  pageSize);
    return alertPromise
    .then(response => {return response.json()
      .then(data => {
        me.alertCategories = data.responseCollection;
        // me.logger.debug('cmtyPromise resolved: ' + JSON.stringify(data));
      }).catch(error => {
        me.logger.error('Communities list() failed in response.json(). Error: ' + error); 
        return Promise.reject(error);
      })
    })
    .catch(error => {
      me.logger.error('Community getAlertCategoriesPage() failed in then(response). Error: ' + error); 
      me.logger.error(error); 
      //throw error;
      return Promise.reject(error);
    });
  }  


  sendAlertCommunityMembers(communityMembers, communities, selectedCommunityId, parentGridOptions) {
    let me = this;

    // let gridOptions = this.getGridOptions('listMembers');
    let message = null;
    // let communityMembers:any[];
    // communityMembers = this.gridOptions.api.getSelectedRows();
    // gridOptions.onModelUpdated = function(event) {
    //   event.toString();
    // }

    let alertModel = {
      communityMembers: communityMembers,
      alertType: '',
      alertMessage: '',
      files: []
    };
    const maxMessageLength = this.appConfig.get('maxAlertMessageSize');
    const vRules = ValidationRules
      .ensure('communityMembers')
      .displayName(this.i18n.tr('community.alert.recipientsList'))
      .minItems(1)
      .then()
      .ensure('alertMessage')
      .displayName(this.i18n.tr('community.alert.message'))
      .required()
      .then()
      .maxLength(maxMessageLength)
      .on(alertModel)
      .rules;

    const step1config = {
        viewsPrefix: 'community/alertWizard',
        id: 'alert_type',
        title: this.i18n.tr('community.alert.selectTypeRecipients'),
        canValidate: false,
        model: alertModel,
        attachedFn: function(){
          me.logger.debug( "------attached");
          let wizardController = this.controller;
          // let gridOptions = me.getGridOptions('listMembers');

          // let alertMembersGrid = new Grid(/*controller.viewModel.cmtyAlertGrid*/ this.cmtyAlertGrid, gridOptions); //create a new grid
          // gridOptions['api'].sizeColumnsToFit();
          // let communityId = me.selectedCmty.communityId;
          // gridOptions['communityId'] = communityId;
          // this.controller.gridOptions = gridOptions;
          // let communityMembers = me.gridOptions.api.getSelectedRows();
          // me.setSelectedOrganizationMembersGridDataSource(gridOptions, me.pageSize, communityMembers);
          // me.setSelectedCommunityMembersGridDataSource('alertRecipients', gridOptions, me.pageSize, me.communityService, communityMembers, true);

          // selected members.
          let selection = parentGridOptions.api.getSelectedRows();
          this.controller.selectedMembers = selection;
          /*
          let gridOptions = me.utils.getGridOptions('listMembers', me.pageSize);
          gridOptions['selection'] = selection;
          // Set local row model.
          gridOptions.enableServerSideSorting = false;
          gridOptions.enableServerSideFilter = false;
          gridOptions.enableSorting = true;
          gridOptions.enableFilter = true;
          gridOptions.rowModelType = '';
          gridOptions['communityId'] = selectedCommunityId;
          this.controller.alertSelectedMembersGridOptions = gridOptions;
          this.controller.alertSelectedMembersGrid = new Grid(this.controller.wizard.currentStep.cmtyAlertGrid, gridOptions); //create a new grid
          let ctrl = this.controller;
          // ***** FIXME: fix for isAnyFilterPresent
          gridOptions.onAfterFilterChanged = function(event) {
            ctrl.alertSelectedMembersGridOptions = this;
            me.logger.debug('***** FILTER CHANGED');
          };
          // ***** FIXME: fix for isAnyFilterPresent
         // me.setSelectedCommunityMembersGridDataSource('alertRecipients', gridOptions, me.pageSize, me.communityService, selection, true);
          // all members.
          gridOptions = me.utils.getGridOptions('listMembers', me.pageSize);
          // Set local row model.
          gridOptions['communityId'] = selectedCommunityId;
          this.controller.alertMembersGridOptions = gridOptions;
          this.controller.alertMembersGrid = new Grid(this.controller.wizard.currentStep.cmtyGrid, this.controller.alertMembersGridOptions); //create a new grid
          me.utils.setCommunityMembersGridDataSource('alertCommunityMembers', gridOptions, me.pageSize, me.communityService, null, false);
          */

/*

          showSelectedMembers(this.controller.dialogController, true);
          // gridOptions.api['rowModel'].datasource.name = 'alertCommunityRecipients';
          this.controller.alertSelectedMembersGridOptions.onSelectionChanged = function() {
            let rows = this.api.getSelectedRows();
            alertModel.communityMembers = rows;
            wizardController.vController.validate({ object: alertModel, propertyName: 'communityMembers' });
            // controller.viewModel.item = controller.viewModel.gridOptions.api.getSelectedRows();
            // controller.viewModel.isSubmitDisabled = controller.viewModel.gridOptions.api.getSelectedRows().length === 0;
          };
          this.controller.alertMembersGridOptions.onSelectionChanged = function() {
            let rows = this.api.getSelectedRows();
            alertModel.communityMembers = rows;
            wizardController.vController.validate({ object: alertModel, propertyName: 'communityMembers' });
            // controller.viewModel.item = controller.viewModel.gridOptions.api.getSelectedRows();
            // controller.viewModel.isSubmitDisabled = controller.viewModel.gridOptions.api.getSelectedRows().length === 0;
          };
          gridOptions.getRowNodeId = function(item) {
            return item.memberId.toString();
          };
*/
          // Pre-set selected nodes from previously-selected.
          // let communityMembers = me.gridOptions.api.getSelectedRows();
          // gridOptions.api.forEachNode( function (node) {
          //     if (communityMembers.find(function(item:any, index:number, array:any[]) {
          //       return item.memberId === node.data.memberId
          //     })) {
          //         node.setSelected(true);
          //     }
          // });
        }
      };
    const step2config = {
        viewsPrefix: 'community/alertWizard',
        id: 'alert_message',
        title: this.i18n.tr('community.alert.selectMessage'),
        canValidate: true,
        model: alertModel
      };
    const step3config = {
        viewsPrefix: 'community/alertWizard',
        id: 'alert_confirm',
        title: this.i18n.tr('community.alert.confirm'),
        canValidate: false,
        model: alertModel,
        attachedFn: function(){
          me.logger.debug( "------attached");
          let wizardController = this.controller;
          wizardController.errorMessage = me.i18n.tr('community.members.alert.alertConfirmMessage', {alertType: this.controller.dialogController.alertModel.alertType.categoryName, attCount: ((this.controller.dialogController.alertModel.fileList)?this.controller.dialogController.alertModel.fileList.length:0), recipientCount: this.controller.dialogController.alertModel.communityMembers.length});
          // this.step.errorMessage = me.i18n.tr('community.members.alert.alertConfirmMessage', {alertType: this.controller.dialogController.alertModel.alertType.categoryName, attCount: ((this.controller.dialogController.alertModel.fileList)?this.controller.dialogController.alertModel.fileList.length:0), recipientCount: this.controller.dialogController.alertModel.communityMembers.length});
        },
        callback: function(step){
          me.logger.debug( "------attached");
          // Call the service to send the alert.
          let view = this;
          let modelPromise = me.communityService.sendNotification(this.controller.dialogController.alertModel.communityMembers, [], 
          {message: this.controller.dialogController.alertModel.alertMessage, notificationCategory: this.controller.dialogController.alertModel.alertType.categoryId, attachmentRefs: this.controller.dialogController.alertModel.files});
          step.controller.wizard.wizLoadingPromise = modelPromise;        
          
          return modelPromise.then(response => response.content)
          .then(data => {
              // Update the message for success.
              view.controller.showCancel = false;
              // Close dialog on success.
              // delete this.controller.viewModel.submit;
              if(view.controller.alertMembersGridOptions.api) {
                view.controller.alertMembersGridOptions.api.destroy();
              }
              if(view.controller.alertSelectedMembersGridOptions.api) {
                view.controller.alertSelectedMembersGridOptions.api.destroy();
              }
              let viewModel = view.controller;
              // viewModel.wizard.currentStep.stepStatus = 'OK';
              view.controller.stepStatus = 'OK';
              view.controller.errorMessage = me.i18n.tr('community.members.alert.alertSuccessMessage', 
                {alertCategory: view.controller.wizard.currentStep.model.alertType.categoryName, 
                  recipientCount: view.controller.wizard.currentStep.model.communityMembers.length});
              // view.controller.wizard.currentStep.errorMessage = me.i18n.tr('community.members.alert.alertSuccessMessage', 
              //   {alertCategory: view.controller.wizard.currentStep.model.alertType.categoryName, 
              //     recipientCount: view.controller.wizard.currentStep.model.communityMembers.length});
              return {currentStep:viewModel, res:data};
              // controller.ok();
            }, error => {
              view.controller.stepStatus = 'ERROR';
              view.controller.errorMessage = me.i18n.tr('community.members.alert.alertErrorMessage', 
                {alertCategory: view.controller.wizard.currentStep.model.alertType.categoryName, 
                  recipientCount: view.controller.wizard.currentStep.model.communityMembers.length});
              // view.controller.wizard.currentStep.errorMessage = "Failed"; 
              me.logger.error("Community member call() rejected."); 
            }).catch(error => {
              view.controller.stepStatus = 'ERROR';
              view.controller.errorMessage = me.i18n.tr('community.members.alert.alertErrorMessage', 
                {alertCategory: view.controller.wizard.currentStep.model.alertType.categoryName, 
                  recipientCount: view.controller.wizard.currentStep.model.communityMembers.length});
              // view.controller.wizard.currentStep.errorMessage = "Failed"; 
              me.logger.error("Community member call() failed."); 
              me.logger.error(error); 
              return Promise.reject(error);
            })
            // return modelPromise;
        }

      };
     const step4config = {
        viewsPrefix: 'community/alertWizard',
        id: 'alert_result',
        title: this.i18n.tr('community.alert.finish'),
        canValidate: false,
        canGoBack: false,
        canCancel: false,
        model: alertModel,
        // attachedFn: function(){
        //   me.logger.debug( "------attached");
        //   // Call the service to send the alert.
        //   let view = this;
        //   let modelPromise = me.communityService.sendNotification(this.controller.dialogController.alertModel.communityMembers, 
        //   {message: this.controller.dialogController.alertModel.alertMessage, notificationCategory: this.controller.dialogController.alertModel.alertType.categoryId, attachmentRefs: this.controller.dialogController.alertModel.fileList});
          
        //   modelPromise.then(response => response.content)
        //   .then(data => {
        //       // Update the message for success.
        //       view.controller.wizard.currentStep.errorMessage = me.i18n.tr('community.members.alert.alertSuccessMessage', {alertCategory: view.controller.dialogController.alertModel.alertType.categoryName, recipientCount: this.controller.dialogController.alertModel.communityMembers.length});
        //       view.controller.showCancel = false;
        //       // Close dialog on success.
        //       // delete this.controller.viewModel.submit;
        //       if(view.controller.alertMembersGridOptions.api) {
        //         view.controller.alertMembersGridOptions.api.destroy();
        //       }
        //       if(view.controller.alertSelectedMembersGridOptions.api) {
        //         view.controller.alertSelectedMembersGridOptions.api.destroy();
        //       }
        //       // controller.ok();
        //     }, error => {
        //       view.step.errorMessage = "Failed"; 
        //       me.logger.error("Community member call() rejected."); 
        //     }).catch(error => {
        //       view.step.errorMessage = "Failed"; 
        //       me.logger.error("Community member call() failed."); 
        //       me.logger.error(error); 
        //       return Promise.reject(error);
        //     })
        // }
      };


    const steps = [step1config, step2config, step3config, step4config];

    let showSelectedMembers = function(controller:any, showSelected:boolean) {
      let selection = parentGridOptions.api.getSelectedRows();
      let obj = controller.viewModel;
      selection = alertModel.communityMembers;
      // controller.viewModel.gridOptions.api.refreshVirtualPageCache();
      // controller.viewModel.gridOptions.api.destroy();
      obj.showSelected = showSelected;
      if(showSelected) {
        obj.alertSelectedMembersGridOptions.api.setRowData(selection);
        obj.alertSelectedMembersGridOptions.api.refreshInMemoryRowModel();
        obj.alertSelectedMembersGridOptions.api.selectAll();
        
        // let gridOptions = me.getGridOptions('listMembers');
        // let communityId = me.selectedCmty.communityId;
        // gridOptions['communityId'] = communityId;
        // controller.gridOptions = gridOptions;
        
        // let alertMembersGrid = new Grid(controller.viewModel.wizard.currentStep.cmtyAlertGrid, controller.viewModel.gridOptions); //create a new grid
        // me.setSelectedCommunityMembersGridDataSource('alertRecipients', controller.viewModel.gridOptions, me.pageSize, me.communityService, selection, true);
        me.toString();
      } else {
        // let gridOptions = me.getGridOptions('listMembers');
        // let communityId = me.selectedCmty.communityId;
        // gridOptions['communityId'] = communityId;
        // controller.gridOptions = gridOptions;
        // let alertMembersGrid = new Grid(controller.viewModel.wizard.currentStep.cmtyGrid, controller.viewModel.gridOptions); //create a new grid
        obj.alertMembersGridOptions['selection'] = selection;
        
        // controller.viewModel.alertMembersGridOptions.api.refreshVirtualPageCache();
        // controller.viewModel.alertMembersGridOptions.api.refreshView();

        me.utils.setCommunityMembersGridDataSource('alertCommunityMembers', obj.alertMembersGridOptions, 
          me.pageSize, me.communityService, selection, false);
        // controller.viewModel.alertMembersGrid.context.beans.gridApi.beanInstance.refreshVirtualPageCache();
        me.toString();
        // controller.viewModel.gridOptions.api['rowModel'].datasource.name = 'alertCommunityRecipients';
      }
    };

    this.dataService.openWizardDialog('Send Alert', steps,
      communityMembers, vRules)
    .then((controller:any) => {

          // let alertMembersGrid = new Grid(/*controller.viewModel.cmtyAlertGrid*/ controller.viewModel.cmtyAlertGrid, gridOptions); //create a new grid
          // gridOptions['api'].sizeColumnsToFit();
          // let communityId = me.selectedCmty.communityId;
          // gridOptions['communityId'] = communityId;
          // me.setCommunityMembersGridDataSource(gridOptions, me.pageSize, me.communityService);
          // // Pre-set selected nodes from previously-selected.
          // let communityMembers = me.gridOptions.api.getSelectedRows();
          // gridOptions.api.forEachNode( function (node) {
          //     if (communityMembers.find(function(item:any, index:number, array:any[]) {
          //       return item.memberId === node.data.memberId
          //     })) {
          //         node.setSelected(true);
          //     }
          // });
          // this.gridOptions = gridOptions;


      // controller.viewModel.gridOptions.onSelectionChanged = function() {
      //   let rows = controller.viewModel.gridOptions.api.getSelectedRows();
      //   communityMembers = rows;
      //   controller.viewModel.item = controller.viewModel.gridOptions.api.getSelectedRows();
      //   controller.viewModel.isSubmitDisabled = controller.viewModel.gridOptions.api.getSelectedRows().length === 0;
      // };
      // controller.viewModel.gridOptions.getRowNodeId = function(item) {
      //   return item.memberId.toString();
      // };

      // let alertMembersGrid = new Grid(controller.viewModel.cmtyAlertGrid /*controller.viewModel.stepList.first.cmtyAlertGrid*/, gridOptions); //create a new grid
      // gridOptions['api'].sizeColumnsToFit();
      // let communityId = me.selectedCmty.communityId;
      // gridOptions['communityId'] = communityId;
      // me.setCommunityMembersGridDataSource(gridOptions, me.pageSize, me.communityService);

      // controller.attached = function() {
      //   let alertMembersGrid = new Grid(controller.viewModel.cmtyAlertGrid, gridOptions); //create a new grid
      //   gridOptions['api'].sizeColumnsToFit();
      //   let communityId = me.selectedCmty.communityId;
      //   gridOptions['communityId'] = communityId;
      //   me.setCommunityMembersGridDataSource(gridOptions, me.pageSize, me.communityService);

      // }
      let model = controller.settings;
      controller.viewModel.maxMessageLength = maxMessageLength;
      controller.errorMessage = '';
      controller.alertModel = alertModel;
      controller.viewModel.alertCategories = me.alertCategories;
      // Get selected alert category.
      controller.viewModel.selectAlertCategory = function(event: any) {
        if(this.selectedAlertCategory !== event.target.value) {
          this.selectedAlertCategory = event.target.value;
          // gridOptions['organizationId'] = this.selectedOrganization;
          // this.setOrganizationMembersGridDataSource(gridOptions, me.pageSize, me.organizationService, this.selectedOrganization);
        }
      };
      controller.viewModel.onAlertAttachmentFile = function(event, fileList) {
        let fileArray = Array.from(fileList);
        controller.alertModel.files = fileArray;
      };

      Object.defineProperty(controller.viewModel, 'isGridFiltered', {
        get: function() {
          let result = this.alertSelectedMembersGridOptions && this.alertSelectedMembersGridOptions.api && this.alertSelectedMembersGridOptions.api.isAnyFilterPresent();
          window.console.debug('--- isGridFiltered --- : ' + result);
          return result;
        }
      });
      controller.viewModel.removeAttachment = function(att: any) {
        if(att) {
          let index = controller.alertModel.files.indexOf(att);
          controller.alertModel.files.splice(index, 1);
        } else {
          delete controller.alertModel.fileList;
        }
      };
      // Callback function for submitting the dialog.
      controller.viewModel.submit = (communityMembers:any[]) => {
      //  // Call the service to send the alert.
      //   let modelPromise = this.communityService.sendNotification(controller.alertModel.communityMembers[0].memberId, 
      //   {message: controller.alertModel.alertMessage, notificationCategory: controller.alertModel.alertType.categoryId, attachmentRefs: controller.alertModel.fileList});
        
      //   modelPromise.then(response => response.json())
      //   .then(data => {
      //       // Update the message for success.
      //       controller.viewModel.wizard.currentStep.errorMessage = this.i18n.tr('community.members.alert.alertSuccessMessage', {alertCategory: controller.alertModel.alertType.categoryName});
      //       controller.viewModel.showCancel = false;
      //       // Close dialog on success.
      //       delete controller.viewModel.submit;
      //       controller.viewModel.gridOptions.api.destroy();
      //       setTimeout(function() {
      //         controller.ok();
      //       }, 1000);
      //       // controller.ok();
      //     }, error => {
      //       model.errorMessage = "Failed"; 
      //       me.logger.error("Community member call() rejected."); 
      //     }).catch(error => {
      //       model.errorMessage = "Failed"; 
      //       me.logger.error("Community member call() failed."); 
      //       me.logger.error(error); 
      //       return Promise.reject(error);
      //     })

      controller.ok();
      };
/* TODO: Fix for showing CLearFilter button.
Object.defineProperty(controller.viewModel, "isGridFiltered", { get: function () { //return this.a + 1; } });
      // controller.viewModel.isGridFiltered = function() {
        return (controller.viewModel.showSelected && 
            (controller.viewModel.alertSelectedMembersGridOptions && 
            controller.viewModel.alertSelectedMembersGridOptions.api && 
            controller.viewModel.alertSelectedMembersGridOptions.api.isAnyFilterPresent())) ||
            (!(controller.viewModel.showSelected) && 
            (controller.viewModel.alertMembersGridOptions && 
            controller.viewModel.alertMembersGridOptions.api && 
            controller.viewModel.alertMembersGridOptions.api.isAnyFilterPresent()));
      }});
*/
      controller.viewModel.showSelectedMembers = function(showSelected:boolean) {
        showSelectedMembers(controller, showSelected);
      };

      controller.viewModel.clearGridFilters = function(gridOptions) {
        gridOptions.api.setFilterModel({});
        gridOptions.api.refreshView();
      };

      /*
      controller.viewModel.showSelectedMembers = function(showSelected:boolean) {
        let selection = controller.viewModel.gridOptions.api.getSelectedRows();

        selection = alertModel.communityMembers;
        // controller.viewModel.gridOptions.api.refreshVirtualPageCache();
        // controller.viewModel.gridOptions.api.destroy();
        controller.viewModel.showSelected = showSelected;
        if(showSelected) {
          me.setSelectedCommunityMembersGridDataSource('alertRecipients', controller.viewModel.gridOptions, me.pageSize, me.communityService, selection, true);
          let alertMembersGrid = new Grid(this.wizard.currentStep.cmtyAlertGrid, controller.viewModel.gridOptions); //create a new grid
          me.toString();
        } else {
          me.setCommunityMembersGridDataSource('alertCommunityMembers', controller.viewModel.gridOptions, me.pageSize, me.communityService, selection, false);
          let alertMembersGrid = new Grid(this.wizard.currentStep.cmtyGrid, controller.viewModel.gridOptions); //create a new grid
          me.toString();
          // controller.viewModel.gridOptions.api['rowModel'].datasource.name = 'alertCommunityRecipients';
        }
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

