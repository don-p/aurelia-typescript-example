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
export class SentAlerts {

  @bindable pageSize;
  gridOptions: GridOptions;
  gridOptionsAcks: GridOptions;
  grid: any;

  @bindable selectedNotification: NotificationResource;
  selectedNotifications: Array<NotificationResource>;
  selectedNotificationAcks: Array<NotificationAckResource>;
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

    this.gridOptionsAcks = <GridOptions>{};
    this.gridOptionsAcks['id'] = 'notificationAcksGrid';
    this.gridOptionsAcks.getRowNodeId = function(item) {
      return item.acknowledgementId?item.acknowledgementId.toString():null;
    };
    this.gridOptionsAcks.rowModelType = 'normal';
    // this.gridOptionsAcks.isExternalFilterPresent = function() {
    //   return me.messageStatusFilter != 'ALL';
    // }
    // this.gridOptionsAcks.isExternalFilterPresent = function(){return true};

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
    // grid.context.onQuickFilterChanged = function(event) {
    //     this.gridOptions.api.setQuickFilter(event.target.value);
    // }

    grid.context.utils.setNotificationsGridMemoryDataSource(
      grid.context.gridOptions, 
      grid.context.alertsService, 
      grid.context.alertsService.getNotifications, 
      {startIndex: 0, pageSize: grid.context.pageSize, memberId: grid.context.session.auth.member.memberId, direction: 'SENT'},
      false
    );
    event.api.sizeColumnsToFit();
  }

  onNotificationsQuickFilterChanged(event) {
    this.gridOptions.api.setQuickFilter(event.target.value);
  }

  onNotificationsMessageStatusFilterChange(event) {
    this.notificationsMessageStatusFilter = event.target.value;
    this.evt.publish('notificationsFilterChanged', {messageStatusFilter: this.notificationsMessageStatusFilter});
    // this.gridOptionsAcks.api.onFilterChanged();
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
    this.notificationAcksPromise = this.alertsService.getNotification(this.session.auth['member'].memberId, selectedNotification.notificationId, 0, 1000).then(function(data:any){
      me.showSelectedNotification(data.responseCollection);
    });;
    // get the notification details.

  }

  notificationSelectionChanged(scope) {
    let selected = scope.api.getSelectedRows().length != 0;
    this.evt.publish('notificationsSelected', {selectedNotifications: scope.api.getSelectedRows(), notificationType: 'SENT'});
  }

  showSelectedNotification(notificationAcks) {
    this.selectedNotificationAcks = notificationAcks;
    this.gridOptionsAcks.api.setRowData(notificationAcks);
  }

  onAcksGridReady(event, scope) {
    let grid:any = this;
    // grid.context.onQuickFilterChanged = function(event) {
    //     this.gridOptionsAcks.api.setQuickFilter(event.target.value);
    // }

    event.api.sizeColumnsToFit();
  }

  onNotificationAcksQuickFilterChanged(event) {
    this.gridOptionsAcks.api.setQuickFilter(event.target.value);
  }

  onNotificationAcksMessageStatusFilterChange(event) {
    this.notificationAcksMessageStatusFilter = event.target.value;
    this.evt.publish('notificationAcksFilterChanged', {messageStatusFilter: this.notificationAcksMessageStatusFilter});
    // this.gridOptionsAcks.api.onFilterChanged();
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

  getSentAlerts() {
    //getReceivedNotifications();
  }

}

