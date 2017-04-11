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

    this.gridOptions = <GridOptions>{};
    this.gridOptions['id'] = 'notificationsGrid';
    this.gridOptions.getRowNodeId = function(item) {
      return item.notificationId?item.notificationId.toString():null;
    };
    this.gridOptions.rowModelType = 'normal';

    this.evt.subscribe('notificationSelected', payload => {
      me.onNotificationSelected(payload);
     });
    this.evt.subscribe('notificationsSelected', payload => {
      me.selectedNotifications = payload.selectedNotifications;
    });

    this.logger = LogManager.getLogger(this.constructor.name);
    
  }

  bind(bindingContext: Object, overrideContext: Object) {
    this.logger.debug("SentAlerts | bind()");
  }

  activate() {
    // Wait for required view data before routing, by returning a Promise from activate().

    // Get list of organizations the logged-in user has rights to.
    // let promise =  this.getOrganizationsPage(0, 500);

    // return promise;
  }

  onGridReady(event, scope) {
    let grid:any = this;

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
    event.context.evt.publish('notificationSelected', {notification: event.data});
  };

  onNotificationSelected(payload) {
    let selectedNotification = payload.notification;
    this.selectedNotification = selectedNotification;
    let me = this;
    // get the notification details.
    this.notificationAcksPromise = this.alertsService.getNotification(this.session.auth['member'].memberId, selectedNotification.notificationId, 0, 1000).then(function(data:any){
      // set the message to read if currently unread.
      let notification = data.responseCollection[0];
      if(notification.ackStatus === 'UNREAD') {
        me.alertsService.setNotificationAckStatus(me.session.auth['member'].memberId, selectedNotification.notificationId, 'READ')
        .then(result => {
            me.showSelectedNotification(result);
        });
      } else {
        me.showSelectedNotification(notification);
      }
    });

  }

  notificationSelectionChanged(scope) {
    let selected = scope.api.getSelectedRows().length != 0;
    this.evt.publish('notificationsSelected', {selectedNotifications: scope.api.getSelectedRows(), notificationType: 'RECEIVED'});
  }

  showSelectedNotification(notificationAck) {
    this.selectedNotificationAck = notificationAck;
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

