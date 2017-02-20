import {inject, Lazy, bindable, LogManager, Parent} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {Router, NavigationInstruction} from 'aurelia-router';
import {ValidationRules, ValidationController, Validator} from 'aurelia-validation';
//import {Community} from '../community/community';
import {Session} from '../services/session';
import {DataService} from '../services/dataService';
import {CommunityService} from '../services/communityService';
import {OrganizationService} from '../services/organizationService';
import {AureliaConfiguration} from 'aurelia-configuration';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
import {Utils} from '../services/util';
import {Grid, GridOptions, IGetRowsParams, IDatasource, Column, TextFilter} from 'ag-grid/main';

@inject(Session, Router, DataService, CommunityService, OrganizationService, EventAggregator, 
  I18N, AureliaConfiguration, Utils, /*Parent.of(Community),*/ LogManager) // SCROLL
export class MemberActionsBarCustomElement {  

    navigationInstruction: NavigationInstruction;
    selectedMembers: Array<Object>;
    selectedOrganizationMembers: Array<Object>;
    selectedCmty: any;
    membersGrid: Object;
    cmtyMembersGrid: any;
    cmtyMembersSelectedGrid: any;
    addCmtyMembersGrid: any;
    addCmtyMembersSelectedGrid: any;
    currentMember: Object;

    alertCategories: Array<Object>;
    parent: any;
 
    membersPromise: Promise<Response>;
    cmtyMembersCachePromise:  Promise<void>;
    @bindable pageSize;
    gridOptions: GridOptions;
    gridOptionsSelected: GridOptions;
    showSelectedCommunitiesGrid: boolean;
    gridCreated: boolean;
    gridColumns: Array<any>;
    grid: any;

    logger: Logger;

    static GRIDCALL: string = 'gridcall';
    static ALERT: string = 'alert';
    static ADDCONNECTION: string = 'connect';
    static REMOVECONNECTION: string = 'disconnect';
    static STARTCONVERSATION: string = 'startconversation';
    static ADDMEMBER: string = 'addmember';
    static REMOVEMEMBER: string = 'removemember';
    static TRANSFEROWNER: string = 'transferowner';

  constructor(private session: Session, private router: Router, 
    private dataService: DataService, private communityService: CommunityService, private organizationService: OrganizationService,
    private evt: EventAggregator, private i18n: I18N, private appConfig: AureliaConfiguration, private utils: Utils/*, private parent: Community*/){
    
    this.pageSize = 200;
    let me = this;
    this.evt.subscribe('communityMembersSelected', payload => {
      me.selectedMembers = payload.selectedMembers;
    });
    this.evt.subscribe('cmtySelected', payload => {
      if((!me.selectedCmty || me.selectedCmty === null) || (me.selectedCmty.communityId !== payload.community.communityId)) {
        me.selectedCmty = payload.community;
      }
    });

    // Get list of alert/notification categories.
    let promise1 = this.getAlertCategoriesPage(0, 500);

    this.logger = LogManager.getLogger(this.constructor.name);
  }

  get GRIDCALL() { return MemberActionsBarCustomElement.GRIDCALL; }
  get ALERT() { return MemberActionsBarCustomElement.ALERT; }
  get ADDCONNECTION() { return MemberActionsBarCustomElement.ADDCONNECTION; }
  get REMOVECONNECTION() { return MemberActionsBarCustomElement.REMOVECONNECTION; }
  get STARTCONVERSATION() { return MemberActionsBarCustomElement.STARTCONVERSATION; }
  get ADDMEMBER() { return MemberActionsBarCustomElement.ADDMEMBER; }
  get REMOVEMEMBER() { return MemberActionsBarCustomElement.REMOVEMEMBER; }
  get TRANSFEROWNER() { return MemberActionsBarCustomElement.TRANSFEROWNER; }

  // activate(model) {
  //     this.parent = model.parent;
  //   // Wait for required view data before routing, by returning a Promise from activate().

  //   // Get list of alert/notification categories.
  //   let promise1 = this.getAlertCategoriesPage(0, 500);

  //   return promise1;
  // }

  bind(context, originalContext) {
    this.parent = context;

  }
  
  hasAction (action: string) {
    let instruction = this.router.currentInstruction;
    const actions:Array<string> = instruction.config.settings.memberActions;
    if(!!actions) {
        return actions.includes(action);
    }
    return true;
  }

  makeCallCommunityMembers(communityMembers, communities) {
    let maxParticipants = this.appConfig.get('server.MAX_CONFERENCE_PARTICIPANTS');
    this.logger.debug('makeCallCommunityMembers() => MAX_CONFERENCE_PARTICIPANTS = ' + maxParticipants);

    let message = null;
    var me = this;

    if(communityMembers.length === 1) {
      message = this.i18n.tr('community.communities.members.call.callConfirmMessageSingle', 
          {memberName: communityMembers[0].physicalPersonProfile.firstName + ' ' +
          communityMembers[0].physicalPersonProfile.lastName});
    } else if(communityMembers.length >= 1) {
      message = this.i18n.tr('community.communities.members.call.callConfirmMessage',
          {memberCount: communityMembers.length});
    }
    const vRules = ValidationRules
      .ensure('item').maxItems(maxParticipants)
      .withMessage(this.i18n.tr('community.communities.call.callParticipantMaxCountError', {count:maxParticipants}))
      .rules;

    this.dataService.openPromptDialog(this.i18n.tr('community.communities.members.call.title'),
      message,
      communityMembers, this.i18n.tr('button.call'), true, vRules, 'modelPromise', '')
    .then((controller:any) => {
      let model = controller.settings;
      // Callback function for submitting the dialog.
      controller.viewModel.submit = (communityMembers:any[]) => {
        // Add logged-in user to the call list, if not in list.
        if(!(communityMembers.find(function(value, index) {
            return value.memberId == me.session.auth['member'].memberId;
          })
        )) {
          communityMembers = communityMembers.slice(0);
          communityMembers.unshift(me.session.auth['member']);
        }
        let memberIDs = communityMembers.map(function(value) {
          return {
            "participantId": value.memberId,
            "participantType": "MEMBER"
          }
        });
        // Call the service to start the call.
        let modelPromise = this.communityService.startConferenceCall({participantRef:memberIDs});
        controller.viewModel.modelPromise = modelPromise;        
        modelPromise
        .then(response => response.json())
        .then(data => {
            // Update the message for success.
            controller.viewModel.messagePrefix = 'global.success';
            controller.viewModel.status = 'OK';
            controller.viewModel.message = this.i18n.tr('community.communities.members.call.callSuccessMessage');
            controller.viewModel.okText = this.i18n.tr('button.ok');
            controller.viewModel.showCancel = false;
            // Close dialog on success.
            delete controller.viewModel.submit;
          }, error => {
            controller.viewModel.messagePrefix = 'global.failed';
            controller.viewModel.status = 'ERROR';
            model.errorMessage = this.i18n.tr('community.communities.members.call.callFailedMessage'); 
            me.logger.error("Community member call() rejected."); 
          }).catch(error => {
            controller.viewModel.messagePrefix = 'global.failed';
            controller.viewModel.status = 'ERROR';
            model.errorMessage = this.i18n.tr('community.communities.members.call.callFailedMessage'); 
            me.logger.error("Community member call() failed."); 
            me.logger.error(error); 
            return Promise.reject(error);
          })
      };
      controller.result.then((response) => {
        if (response.wasCancelled) {
          // Cancel.
          this.logger.debug('Cancel');
        }
      })
    });
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
              message = me.i18n.tr('community.communities.alert.alertCommunityRecipientsMessage', {communityCount: communities.length});
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
                  message = me.i18n.tr('community.communities.alert.alertRecipientsMessage', {memberCount: view.controller.wizard.currentStep.model.communityMembers.length});
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

  setOrganizationMembersGridDataSource(gridOptions, pageSize, organizationService) {
    const me = this;

    let selection = gridOptions.selection;
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
            let  organizationId = gridOptions.organizationId;
            let orgPromise = organizationService.getOrgMembers(organizationId, params.startRow, pageSize, params);
            orgPromise.then(response => response.json())
              .then(data => {
                // Filter out existing community members.
                let totalCount = data.totalCount;
                let filteredData = data.responseCollection;
                // let communityMembers = me.communityMembers?me.communityMembers:me.parent.communityMembers;
                // if(Array.isArray(communityMembers) && communityMembers.length > 0) {
                //   filteredData = data.responseCollection.filter(function(item) {
                //     if(communityMembers.indexOf(item.memberId) < 0) {
                //       return true;
                //     } else {
                //       return false;
                //     }
                //   });
                //   totalCount = totalCount - (me.pageSize - filteredData.length);
                // }
                if(gridDataSource.rowCount === null) {
                  gridDataSource.rowCount = totalCount;
                }
                params.successCallback(filteredData, totalCount);
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


  orgMembersSelectionChanged(scope) {
    let rows = scope.api.getSelectedRows();
    this.selectedOrganizationMembers = rows;
  }


  addCommunityMembers() {
    let me = this;
    let item = {}
    item['membersList'] = [];
    // selected community from "Communities" view.
    let selectedCmty = this.selectedCmty;
    item['selectedCmty'] = selectedCmty;
    // In "Discover" view, get a list of communities to select from.
    let communitiesPromise;
    let communityTypes;
    let selectedCommunityType;

    // Grid for "Communities" view.
    let gridOptions;
    let gridOptionsSelected;
    if(!!(selectedCmty)) {
      gridOptions = this.utils.getGridOptions('addMembers', this.pageSize);
      gridOptionsSelected = this.utils.getGridOptions('selectedMembers', null);
      gridOptionsSelected.enableServerSideSorting = false;
      gridOptionsSelected.enableServerSideFilter = false;
      gridOptionsSelected.enableSorting = true;
      gridOptionsSelected.enableFilter = true;
      gridOptionsSelected.rowModelType = 'normal';
    }
    this.dataService.openResourceEditDialog({modelView:'model/organizationMembersListModel.html', 
      title:this.i18n.tr('community.communities.members.addMembers'), loadingTitle: 'app.loading',
      item: item, okText:this.i18n.tr('button.save'), showErrors:false, validationRules:null})
    .then((controller:any) => {
      // Ensure there is no focused element that could be submitted, since dialog has no focused form elements.
      let activeElement = <HTMLElement> document.activeElement;
      activeElement.blur();

      let communities = [];
      item['communities'] = communities;
      if(!(selectedCmty)) {
        communitiesPromise = me.communityService.getCommunities(controller.viewModel.selectedCommunityType, 0, 10000);
        controller.viewModel.communitiesPromise = communitiesPromise;
        communitiesPromise
        .then(response => response.json())
        .then(data => {
          controller.viewModel.communities = data.responseCollection;
        });
      }

      let model = controller.settings;
      model.isSubmitDisabled = true;
      // Grid for "Communities" view.
      if(!!(selectedCmty)) {
        // Org members grid.
        gridOptions.onSelectionChanged = function() {
          controller.viewModel.item.membersList = gridOptions.api.getSelectedRows();
          controller.viewModel.isSubmitDisabled = gridOptions.api.getSelectedRows().length === 0;
        };
        gridOptions.getRowNodeId = function(row) {
          return row.memberId.toString();
        };
        let addMembersGrid = new Grid(controller.viewModel.addCmtyMembersGrid, gridOptions); //create a new grid
        gridOptions['api'].sizeColumnsToFit();
        me.setOrganizationMembersGridDataSource(gridOptions, me.pageSize, me.organizationService);
        // Selected org members grid.
        gridOptionsSelected.onSelectionChanged = function() {
          gridOptions.selection = gridOptionsSelected.api.getSelectedRows();
          controller.viewModel.isSubmitDisabled = gridOptionsSelected.api.getSelectedRows().length === 0;
        };
        gridOptionsSelected.getRowNodeId = function(row) {
          return row.memberId.toString();
        };
        let addMembersSelectedGrid = new Grid(controller.viewModel.addCmtyMembersSelectedGrid, gridOptionsSelected); //create a new grid
        gridOptionsSelected['api'].sizeColumnsToFit();
        
        controller.viewModel.clearGridFilters = me.utils.clearGridFilters;
        controller.viewModel.organizations = me.parent.parent.organizations;
        controller.viewModel.setOrganizationMembersGridDataSource = me.setOrganizationMembersGridDataSource;
        controller.viewModel.gridOptions = gridOptions;
        controller.viewModel.gridOptionsSelected = gridOptionsSelected;
        let organizationId = me.parent.parent.organizations[0]['organizationId'];
        gridOptions['organizationId'] = organizationId;
        // Get list of members in a selected organization.
        controller.viewModel.selectOrganization = function(event: any) {
          if(this.selectedOrganization !== event.target.value) {
            this.selectedOrganization = event.target.value;
            gridOptions['organizationId'] = this.selectedOrganization;
            this.setOrganizationMembersGridDataSource(gridOptions, me.pageSize, me.organizationService, this.selectedOrganization);
          }
        }
        controller.viewModel.showSelectedOrganizationMembers = function(showSelected:boolean) {
          controller.viewModel.showSelected = showSelected;
          if(showSelected) {
            let selection = gridOptions.api.getSelectedRows();
            gridOptions.selection = selection;
            gridOptionsSelected.api.setRowData(selection);
            gridOptionsSelected.api.selectAll();
            gridOptionsSelected.api.refreshView();
            gridOptionsSelected['api'].sizeColumnsToFit();
          } else {
            me.setOrganizationMembersGridDataSource(gridOptions, me.pageSize, me.organizationService);
          }
        };
        controller.viewModel.$isGridFiltered = function() {
          let filtered = (!(controller.viewModel.showSelected) && 
            (controller.viewModel.gridOptions && controller.viewModel.gridOptions.api && controller.viewModel.gridOptions.api.isAnyFilterPresent())) ||
            (!!(controller.viewModel.showSelected) && 
            (controller.viewModel.gridOptionsSelected && controller.viewModel.gridOptionsSelected.api && controller.viewModel.gridOptionsSelected.api.isAnyFilterPresent()));
          console.debug(">>>> ISGRIDFILTERED: " + filtered);
          return filtered;
        };

      
      } else {
        controller.viewModel.selectCommunityType = function(communityType:string, selectedCommunity:Object) {
          let communitiesPromise = me.communityService.getCommunities(communityType, 0, 10000);
          controller.viewModel.communitiesPromise = communitiesPromise;
          communitiesPromise
          .then(response => response.json())
          .then((data:any) => {
            controller.viewModel.communities = data.responseCollection;
          });
        }
        let message = null;
        let members = me.parent.gridOptions.api.getSelectedRows();
        if(members.length === 1) {
          message = this.i18n.tr('community.communities.members.addMembersMessageSingle', 
              {memberName: members[0].physicalPersonProfile.firstName + ' ' +
              members[0].physicalPersonProfile.lastName});
        } else if(members.length >= 1) {
          message = this.i18n.tr('community.communities.members.addMembersMessage',
              {memberCount: members.length});
        }
        controller.viewModel.message = message;
      }
      controller.viewModel.communityMembers = me.parent.communityMembers;



      // Callback function for submitting the dialog.
      controller.viewModel.submit = () => {
        let selection;
        if(!!(selectedCmty)) {
          // Get selected members from dialog grid.
          selection = gridOptions.api.getSelectedRows();
        } else {
          // Get selected members from main view grid.
          selection = me.parent.gridOptions.api.getSelectedRows();
        }
        let orgMemberIds = selection.map(function(obj){ 
          return obj.memberId;
        });
        if(!(item['communitySelection'])) {
          item['communitySelection'] = selectedCmty;
        }
        // Call the addMembers service.
        let modelPromise = this.communityService.addCommunityMembers(item['communitySelection'].communityId, orgMemberIds);
        controller.viewModel.modelPromise = modelPromise;        
        modelPromise
        .then(response => response.json())
        .then(data => {
            if(!!(selectedCmty) && !!(me.parent.communityMembers)) {
              // Update local cache of community members.
              Array.prototype.splice.apply(me.parent.communityMembers,[].concat(me.parent.communityMembers.length,0,orgMemberIds));
            }
            if(!!(selectedCmty)) {
              me.parent.gridOptions.api.refreshVirtualPageCache();
              me.parent.gridOptions.api.refreshView();
              me.parent.gridOptions.api.deselectAll();
              // update the community member count.
              selectedCmty.memberCount = data['totalCount'];
              // Close dialog on success.
              gridOptions.api.destroy();
            }
            controller.ok();
          }, error => {
            model.errorMessage = "Failed"; 
            me.logger.error("Community member add() rejected."); 
          }).catch(error => {
            model.errorMessage = "Failed"; 
            me.logger.error("Community member add() failed."); 
            me.logger.error(error); 
            return Promise.reject(error);
          }) 
      };

      controller.result.then((response) => {
        if (response.wasCancelled) {
          // Cancel.
          gridOptions.api.destroy();
          this.logger.debug('Cancel');
        }
      })
    });
    
  }
  
  deleteCommunityMembers(communityMembers: Array<any>) {
    let message = null;
    var me = this;
    let selectedCmty = this.selectedCmty;

    if(communityMembers.length === 1) {
      message = this.i18n.tr('community.communities.members.confirmDelete.messageSingle', 
          {memberName: communityMembers[0].physicalPersonProfile.firstName + ' ' +
          communityMembers[0].physicalPersonProfile.lastName});
    } else if(communityMembers.length >= 1) {
      message = this.i18n.tr('community.communities.members.confirmDelete.message',
          {memberCount: communityMembers.length});
    }
    this.dataService.openPromptDialog(this.i18n.tr('community.communities.members.confirmDelete.title'),
      message,
      communityMembers, this.i18n.tr('button.remove'), true, null, 'modelPromise', '')
    .then((controller:any) => {
      let model = controller.settings;
      // Callback function for submitting the dialog.
      controller.viewModel.submit = (communityMembers) => {
        let commMemberIds = communityMembers.map(function(obj){ 
          return obj.memberId;
        });
        // Call the delete service.
        let modelPromise = this.communityService.removeCommunityMembers(selectedCmty.communityId, commMemberIds);
        controller.viewModel.modelPromise = modelPromise;        
        modelPromise
        .then(response => response.json())
        .then(data => {
            if(!!(me.parent.communityMembers)) {
              // Update local cache of community members.
              me.parent.communityMembers = me.parent.communityMembers.filter(function(item:any) {
                return !(commMemberIds.indexOf(item.memberId >= 0));
              })
            }

            me.parent.gridOptions.api.refreshVirtualPageCache();
            me.parent.gridOptions.api.refreshView();
            me.parent.gridOptions.api.deselectAll();
            // update the community member count.
            selectedCmty.memberCount = data['totalCount'];
            // Close dialog on success.
            controller.ok();
          }, error => {
            model.errorMessage = "Failed"; 
            me.logger.error("Community member delete() rejected."); 
          }).catch(error => {
            model.errorMessage = "Failed"; 
            me.logger.error("Community member delete() failed."); 
            me.logger.error(error); 
            return Promise.reject(error);
          })
      };
      controller.result.then((response) => {
        if (response.wasCancelled) {
          // Cancel.
          this.logger.debug('Cancel');
        }
      })
    });
  }

  sendConnectionRequest(communityMembers:Array<any>) {

    let message = null;
    var me = this;
    let item = {}

    if(communityMembers.length === 1) {
      message = this.i18n.tr('community.connections.connectionRequestMessageSingle', 
          {memberName: communityMembers[0].physicalPersonProfile.firstName + ' ' +
          communityMembers[0].physicalPersonProfile.lastName});
    } else if(communityMembers.length >= 1) {
      message = this.i18n.tr('community.connections.connectionRequestMessage',
          {memberCount: communityMembers.length});
    }
    item['members'] = communityMembers;
    item['message'] = message;
    item['requestMessage'] = '';

    const vRules = ValidationRules
      .ensure('requestMessage')
      .displayName(this.i18n.tr('community.connections.message'))
      .required()
      .then()
      .minLength(1)
      .rules;

    this.dataService.openResourceEditDialog({title: this.i18n.tr('community.connections.sendConnectionRequest'),
      modelView: '../model/connectionRequest.html', loadingTitle: 'app.loading', 
      item: item, okText: this.i18n.tr('button.send'), validationRules: vRules})
    .then((controller:any) => {
      let model = controller.settings;
      // Callback function for submitting the dialog.
      controller.viewModel.submit = (result:any) => {
        let memberIDs = result.members.map(function(value) {
          return value.memberId
        });
        // Call the service to start the call.
        let modelPromise = this.communityService.sendConnectionRequest(memberIDs, result.requestMessage);
        controller.viewModel.modelPromise = modelPromise;        
        modelPromise
        .then(response => response.json())
        .then(data => {
            // Update the message for success.
            controller.viewModel.messagePrefix = 'global.success';
            controller.viewModel.status = 'OK';
            controller.viewModel.message = this.i18n.tr('community.connections.connectionRequestSuccessMessage');
            controller.viewModel.okText = this.i18n.tr('button.ok');
            controller.viewModel.showCancel = false;
            // Close dialog on success.
            delete controller.viewModel.submit;
          }, error => {
            controller.viewModel.messagePrefix = 'global.failed';
            controller.viewModel.status = 'ERROR';
            model.errorMessage = this.i18n.tr('community.connections.connectionRequestFailedMessage'); 
            me.logger.error("Community member call() rejected."); 
          }).catch(error => {
            controller.viewModel.messagePrefix = 'global.failed';
            controller.viewModel.status = 'ERROR';
            model.errorMessage = this.i18n.tr('community.connections.connectionRequestFailedMessage'); 
            me.logger.error("Community member call() failed."); 
            me.logger.error(error); 
            return Promise.reject(error);
          })
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