import {inject, bindable, NewInstance, Lazy, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {Router, NavigationInstruction} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';
import {DataService} from '../services/dataService';
import {Session} from '../services/session';
import {I18N} from 'aurelia-i18n';
import {Grid, GridOptions, Column, TextFilter} from 'ag-grid/main';
import {WizardControllerStep} from '../lib/aurelia-easywizard/controller/wizard-controller-step';
import {AureliaConfiguration} from 'aurelia-configuration';
import {ValidationRules, ValidationController, Validator} from 'aurelia-validation';
import {AlertsService} from '../services/alertsService';
import {OrganizationService} from '../services/organizationService';
import {Utils} from '../services/util';
import {MemberActionsBarCustomElement} from '../components/member-actions-bar';
import {NotificationResource} from '../model/notificationResource';
import {NotificationAckResource} from '../model/notificationAckResource';

@inject(Session, DataService, AlertsService, OrganizationService, I18N, EventAggregator, AureliaConfiguration, Utils, MemberActionsBarCustomElement, LogManager)
export class ReceivedAlerts {

  @bindable pageSize;
  gridOptions: GridOptions;
  grid: any;

  @bindable selectedNotification: NotificationResource;
  selectedNotifications: Array<NotificationResource>;
  selectedNotificationAck: NotificationAckResource;
  notificationAcksPromise: Promise<any>;
  notificationsMessageStatusFilter: string;
  notificationAcksMessageStatusFilter: string;

  ps: any; // SCROLL

  logger: Logger;

  constructor(private session: Session, private dataService: DataService, private alertsService: AlertsService, 
    private organizationService: OrganizationService, private i18n: I18N, private evt: EventAggregator, 
    private appConfig: AureliaConfiguration, private utils: Utils) {

    this.pageSize = 100000;

    let me = this;

    // this.alertCategories = appConfig.get('alertCategories');

    this.gridOptions = <GridOptions>{};
    this.gridOptions['id'] = 'notificationsGrid';
    this.gridOptions.getRowNodeId = function(item) {
      return item.notificationId?item.notificationId.toString():null;
    };
    this.gridOptions.rowModelType = 'normal';

    this.evt.subscribe('notificationSelected', payload => {
      if(payload.type === 'RECEIVED') me.onNotificationSelected(payload);
     });
    this.evt.subscribe('notificationsSelected', payload => {
      me.selectedNotifications = payload.selectedNotifications;
    });

    this.logger = LogManager.getLogger(this.constructor.name);
    
  }

  bind(bindingContext: any, overrideContext: Object) {
    this.logger.debug("SentAlerts | bind()");
   }

  activate() {
    this.logger.debug("SentAlerts | activate()");
    // Wait for required view data before routing, by returning a Promise from activate().

    // Get list of organizations the logged-in user has rights to.
    // let promise =  this.getOrganizationsPage(0, 500);

    // return promise;
  }

  get alertCategories(): Array<any> {
    return this.appConfig.get('alertCategories');
  }

  onGridReady(event, scope) {
    let grid:any = this;

    event.api.gridOptionsWrapper.gridOptions.onRowClicked = function(event) {
      scope.context.onRowclick(event);
    }

    grid.context.getReceivedAlerts();
    event.api.sizeColumnsToFit();
  }

  onNotificationsQuickFilterChanged(event) {
    this.gridOptions.api.setQuickFilter(event.target.value);
  }

  onNotificationsMessageStatusFilterChange(event) {
    this.notificationsMessageStatusFilter = event.target.value;
    this.evt.publish('notificationsFilterChanged', {messageStatusFilter: this.notificationsMessageStatusFilter});
  }

  onFilterChanged = function(event, scope) {
    this.utils.setGridFilterMap(this.gridOptions);
  }

  onSelectionChanged = function(event) {
    this.context.notificationSelectionChanged(this.context.gridOptions);
  };

  onRowclick = function(event) {
    // if selection changed
    if(!!(event.data) && (!(this.selectedNotification) || (!!(this.selectedNotification) && !(event.data.notificationId === this.selectedNotification.notificationId)))) {
      event.context.evt.publish('notificationSelected', {notification: event.data, type: 'RECEIVED'});
    }
  };

  onNotificationSelected(payload) {

    let selectedNotification = payload.notification;
    let me = this;

    // set the message to read if currently unread.
    if(selectedNotification.ackStatus === 'UNREAD') {
      me.logger.debug("Got UNREAD message.")
      return  me.setNotificationStatus(selectedNotification, 'READ')
      .then(result => {
        // get the notification details.
        this.notificationAcksPromise = this.alertsService.getNotification(this.session.auth['member'].memberId, selectedNotification.notificationId, 0, 1000);
        this.notificationAcksPromise.then(function(data:any){
          let notification = data;
          let memberId = me.session.auth['member'].memberId;
          let ack = notification.acks.find(function(ackItem) {
            return memberId === ackItem.ackParty.memberId;
          });
          me.selectedNotificationAck = ack;
          me.showSelectedNotification(notification);
          // Update "READ" status in list.
          selectedNotification.notificationStatus.ackStatusSummary = {READ: 1};
        });
      });
    } else {
      me.logger.debug("Got READ message.")
      // get the notification details.
      this.notificationAcksPromise = this.alertsService.getNotification(this.session.auth['member'].memberId, selectedNotification.notificationId, 0, 1000);
      this.notificationAcksPromise.then(function(data:any){
        let notification = data;
        // let notification = data.notification;
        // let resultArray = [];
        // notification.acks = resultArray;

        // data.response.forEach(response => {response.json()
        //     .then(responseAck => {
        //         let js = JSON.stringify(responseAck);
        //         let ack:Array<NotificationAckResource> = me.alertsService.parseNotificationAcks('{"responseCollection":[' + js + ']}');
        //         resultArray.push(ack[0]);
        //         return ack[0];
        //     });
        // });

        
        me.logger.debug(">> not acks: " + (notification.acks && notification.acks.length));
        let memberId = me.session.auth['member'].memberId;
        let ack = notification.acks.find(function(ackItem) {
          return memberId === ackItem.ackParty.memberId;
        });
        me.logger.debug(">> not matched ack: " + ack);
        me.selectedNotificationAck = ack;
        me.showSelectedNotification(notification);
      });
    }
  }

  notificationSelectionChanged(scope) {
    let selected = scope.api.getSelectedRows().length != 0;
    this.evt.publish('notificationsSelected', {selectedNotifications: scope.api.getSelectedRows(), notificationType: 'RECEIVED'});
  }

  showSelectedNotification(notification) {
    this.selectedNotification = notification;
  }

  onAcksGridReady(event, scope) {
    let grid:any = this;

    event.api.sizeColumnsToFit();
  }

  // onNotificationAcksQuickFilterChanged(event) {
  //   this.gridOptionsAcks.api.setQuickFilter(event.target.value);
  // }

  onNotificationAcksMessageStatusFilterChange(event) {
    this.notificationAcksMessageStatusFilter = event.target.value;
    this.evt.publish('notificationAcksFilterChanged', {messageStatusFilter: this.notificationAcksMessageStatusFilter});
  }

  isNotificationsExternalFilterPresent() {
    // if messageStatus is not ALL, then we are filtering
    return this.notificationAcksMessageStatusFilter != 'ALL';
  }

  doesNotificationsExternalFilterPass(node) {
    return(node.data.ackStatus === this.notificationAcksMessageStatusFilter);
  }

  get isGridFiltered() {
    return (this.gridOptions && this.gridOptions.api && this.gridOptions.api.isAnyFilterPresent()) ;
  }

  setNotificationStatus(notification, status): Promise<any> {
    let me = this;
    this.notificationAcksPromise = this.alertsService.setNotificationAckStatus(this.session.auth['member'].memberId, 
    notification.notificationId, 
    status).then(function(data:any){
      Object.assign(notification, data);
      return data;
    });
    return this.notificationAcksPromise;
  }


  setNotificationReply(notification) {
    let me = this;

    let ackModel:any = {};

    const maxMessageLength = 2000;
    const vRules = ValidationRules
      .ensure((ack: any) => ackModel.message)
      .displayName(this.i18n.tr('alerts.notifications.message'))
      .required()
      .then()
      .maxLength(maxMessageLength)
      .rules;

    this.dataService.openResourceEditDialog({modelView:'alerts/alertreply.html', title: this.i18n.tr('alerts.notifications.reply'), 
      loadingTitle: 'app.loading', item:ackModel, okText:this.i18n.tr('button.send'), validationRules:vRules})
    .then((controller:any) => {
      // let model = controller.settings.model;
      let model = controller.settings;

      controller.viewModel.maxMessageLength = maxMessageLength;
      controller.ackModel = ackModel;
      controller.viewModel.recipientName = me.selectedNotification.senderFullName;
      
      controller.viewModel.onReplyAttachmentFile = function(event, fileList) {
        let fileArray = Array.from(fileList);
        controller.viewModel.item.files = fileArray;
      };

      // Callback function for submitting the dialog.
      controller.viewModel.submit = (reply) => {
        me.logger.debug("Edit community submit()");
        let ack = controller.ackModel;
        let modelPromise = 
          me.alertsService.setNotificationReply(this.session.auth['member'].memberId, notification.notificationId, reply);
        controller.viewModel.modelPromise = modelPromise;        
        modelPromise
        .then(function(data:any) {
          me.selectedNotificationAck = data;
          // Close dialog on success.
          controller.ok();
        }, error => {
          me.logger.error("Community create() rejected.");
          model.errorMessage = "Failed"; 
        }).catch(error => {
          me.logger.error("Community create() failed."); 
          me.logger.error(error); 
          model.errorMessage = "Failed"; 
          return Promise.reject(error);
        })
      }
      controller.result.then((response) => {
        if (response.wasCancelled) {
          // Reset validation error state.
          this.logger.debug('Cancel');
        }
      })
    });
  }
  
  getReceivedAlerts() {
    this.utils.setNotificationsGridMemoryDataSource(
      this.gridOptions, 
      this.alertsService, 
      this.alertsService.getNotifications, 
      {startIndex: 0, pageSize: this.pageSize, memberId: this.session.auth['member'].memberId, direction: 'RECEIVED'},
      false
    );
  }

}

