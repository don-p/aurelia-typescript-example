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
      { route: 'connections', name: 'community/connections', moduleId: './connections', nav: true, title: this.i18n.tr('router.nav.connections') },
      { route: 'discover', name: 'community/discover', moduleId: './discover', nav: true, title: this.i18n.tr('router.nav.discover') }
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


  sendAlertCommunityMembers(communityMembers, communities) {
    let me = this;

    // let gridOptions = this.getGridOptions('listMembers');
    let message = null;
    let alertModel = {
      communityMembers: communityMembers,
      communities: communities,
      alertType: '',
      alertMessage: '',
      files: []
    };
    const maxMessageLength = this.appConfig.get('maxAlertMessageSize');
    const vRules = ValidationRules
      .ensure('communityMembers')
      .displayName(this.i18n.tr('community.communities.alert.recipientsList'))
      .minItems(1)
      .then()
      .ensure('alertMessage')
      .displayName(this.i18n.tr('community.communities.alert.message'))
      .required()
      .then()
      .maxLength(maxMessageLength)
      .on(alertModel)
      .rules;

    const step1config = {
        viewsPrefix: 'community/alertWizard',
        id: 'alert_message',
        title: this.i18n.tr('community.communities.alert.selectMessage'),
        canValidate: true,
        model: alertModel,
        attachedFn: function(){
          me.logger.debug( "------attached");
          let message = '';
          if(Array.isArray(communityMembers) && communityMembers.length > 0) {
            if(communityMembers.length === 1) {
              message = me.i18n.tr('community.communities.alert.alertRecipientsMessageSingle', {member: communityMembers[0]});
            } else if(communityMembers.length >= 1) {
              message = me.i18n.tr('community.communities.alert.alertRecipientsMessage', {memberCount: communityMembers.length});
            }
          }
          else if(Array.isArray(communities) && communities.length > 0) {
            if(communities.length === 1) {
              message = me.i18n.tr('community.communities.alert.alertCommunityRecipientsMessageSingle', {community: communities[0].communityName});
            } else if(communities.length >= 1) {
              message = me.i18n.tr('community.communities.alert.alertCommunityRecipientsMessage', {communityCount: communities.length});
            }
          }
          this.controller.recipientsMessage = message;
        }
      };
    const step2config = {
        viewsPrefix: 'community/alertWizard',
        id: 'alert_confirm',
        title: this.i18n.tr('community.communities.alert.confirm'),
        canValidate: false,
        model: alertModel,
        attachedFn: function(){
          me.logger.debug( "------attached");
          let wizardController = this.controller;
          let message = '';
          if(Array.isArray(communityMembers) && communityMembers.length > 0) {
            if(communityMembers.length === 1) {
              message = me.i18n.tr('community.communities.alert.alertRecipientsMessageSingle', {member: communityMembers[0]});
            } else if(communityMembers.length >= 1) {
              message = me.i18n.tr('community.communities.alert.alertRecipientsMessage', {memberCount: communityMembers.length});
            }
          }
          else if(Array.isArray(communities) && communities.length > 0) {
            if(communities.length === 1) {
              message = me.i18n.tr('community.communities.alert.alertCommunityRecipientsMessageSingle', {community: communities[0].communityName});
            } else if(communities.length >= 1) {
              message = me.i18n.tr('communit.communitiesy.alert.alertCommunityRecipientsMessage', {communityCount: communities.length});
            }
          }
          
          wizardController.errorMessage = me.i18n.tr('community.communities.members.alert.alertConfirmMessage', {alertType: this.controller.dialogController.alertModel.alertType.categoryName, attCount: ((this.controller.dialogController.alertModel.fileList)?this.controller.dialogController.alertModel.fileList.length:0), recipients: message});
          // this.step.errorMessage = me.i18n.tr('community.members.alert.alertConfirmMessage', {alertType: this.controller.dialogController.alertModel.alertType.categoryName, attCount: ((this.controller.dialogController.alertModel.fileList)?this.controller.dialogController.alertModel.fileList.length:0), recipientCount: this.controller.dialogController.alertModel.communityMembers.length});
        },
        callback: function(step){
          me.logger.debug( "------attached");
          // Call the service to send the alert.
          let view = this;
          let modelPromise = me.communityService.sendNotification(this.controller.dialogController.alertModel.communityMembers, 
          this.controller.dialogController.alertModel.communities, 
          {message: this.controller.dialogController.alertModel.alertMessage, notificationCategory: this.controller.dialogController.alertModel.alertType.categoryId, attachmentRefs: this.controller.dialogController.alertModel.files});
          step.controller.wizard.wizLoadingPromise = modelPromise;        
          
          return modelPromise.then(response => response.content)
          .then(data => {
              // Update the message for success.
              view.controller.showCancel = false;
              // Close dialog on success.
              // delete this.controller.viewModel.submit;
              let viewModel = view.controller;
              // viewModel.wizard.currentStep.stepStatus = 'OK';
              view.controller.stepStatus = 'OK';
              let message = '';
              if(Array.isArray(communityMembers) && communityMembers.length > 0) {
                if(communityMembers.length === 1) {
                  message = me.i18n.tr('community.communities.alert.alertRecipientsMessageSingle', {member: view.controller.wizard.currentStep.model.communityMembers[0]});
                } else if(communityMembers.length >= 1) {
                  message = me.i18n.tr('communit.communitiesy.alert.alertRecipientsMessage', {memberCount: view.controller.wizard.currentStep.model.communityMembers.length});
                }
              }
              else if(Array.isArray(communities) && communities.length > 0) {
                if(communities.length === 1) {
                  message = me.i18n.tr('community.communities.alert.alertCommunityRecipientsMessageSingle', {community: view.controller.wizard.currentStep.model.communities[0].communityName});
                } else if(communities.length >= 1) {
                  message = me.i18n.tr('community.communities.alert.alertCommunityRecipientsMessage', {communityCount: view.controller.wizard.currentStep.model.communities.length});
                }
              }
              view.controller.errorMessage = me.i18n.tr('community.communities.members.alert.alertSuccessMessage', 
                {alertCategory: view.controller.wizard.currentStep.model.alertType.categoryName, 
                  recipients: message});
              // view.controller.wizard.currentStep.errorMessage = me.i18n.tr('community.members.alert.alertSuccessMessage', 
              //   {alertCategory: view.controller.wizard.currentStep.model.alertType.categoryName, 
              //     recipientCount: view.controller.wizard.currentStep.model.communityMembers.length});
              return {currentStep:viewModel, res:data};
              // controller.ok();
            }, error => {
              view.controller.stepStatus = 'ERROR';
              view.controller.errorMessage = me.i18n.tr('community.communities.members.alert.alertErrorMessage', 
                {alertCategory: view.controller.wizard.currentStep.model.alertType.categoryName, 
                  recipientCount: view.controller.wizard.currentStep.model.communityMembers.length});
              // view.controller.wizard.currentStep.errorMessage = "Failed"; 
              me.logger.error("Community member call() rejected."); 
            }).catch(error => {
              view.controller.stepStatus = 'ERROR';
              view.controller.errorMessage = me.i18n.tr('community.communities.members.alert.alertErrorMessage', 
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
     const step3config = {
        viewsPrefix: 'community/alertWizard',
        id: 'alert_result',
        title: this.i18n.tr('community.communities.alert.finish'),
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


    const steps = [step1config, step2config, step3config];

    this.dataService.openWizardDialog('Send Alert', steps,
      communityMembers, vRules)
    .then((controller:any) => {

      let model = controller.settings;
      controller.viewModel.maxMessageLength = maxMessageLength;
      controller.errorMessage = '';
      controller.alertModel = alertModel;
      controller.viewModel.alertCategories = me.alertCategories;
      // Get selected alert category.
      controller.viewModel.selectAlertCategory = function(event: any) {
        if(this.selectedAlertCategory !== event.target.value) {
          this.selectedAlertCategory = event.target.value;
        }
      };
      controller.viewModel.onAlertAttachmentFile = function(event, fileList) {
        let fileArray = Array.from(fileList);
        controller.alertModel.files = fileArray;
      };

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

      controller.result.then((response) => {
        if (response.wasCancelled) {
          // Cancel.
          this.logger.debug('Cancel');
        }
      })
    });
  }


}

