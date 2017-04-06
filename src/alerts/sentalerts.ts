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

@inject(Session, DataService, AlertsService, OrganizationService, I18N, EventAggregator, AureliaConfiguration, Utils, MemberActionsBarCustomElement, LogManager)
export class SentAlerts {

  @bindable pageSize;
  gridOptions: GridOptions;
  grid: any;

  selectedNotification: any;

  ps: any; // SCROLL

  logger: Logger;

  constructor(private session: Session, private dataService: DataService, private alertsService: AlertsService, 
    private organizationService: OrganizationService, private i18n: I18N, private evt: EventAggregator, 
    private appConfig: AureliaConfiguration, private utils: Utils) {

    this.pageSize = 100000;

    let me = this;

    this.gridOptions = <GridOptions>{};
    this.gridOptions.getRowNodeId = function(item) {
      return item.notificationId?item.notificationId.toString():null;
    };
    this.gridOptions.rowModelType = 'normal';
/*
    this.evt.subscribe('cmtySelected', payload => {
      if((!me.selectedCmty || me.selectedCmty === null) || (me.selectedCmty.communityId !== payload.community.communityId)) {
        me.selectedCmty = payload.community;
        // Save selected communityId.
        me.gridOptions['communityId'] = me.selectedCmty.communityId;
        // Clear all member selections.
        me.isSelectedMembers = false;
        me.showSelectedMembers = false;

        if(!!(me.gridOptions.api)) {
          me.gridOptions.api.deselectAll();
          me.gridOptions.api.setFilterModel(null)
          me.gridOptions.api.setSortModel(null);
          // Set up the virtual scrolling grid displaying community members.
          me.gridOptions.api.refreshVirtualPageCache();
          me.gridOptions.api.refreshView();
        }
        */
        // me.utils.setNotificationsGridDataSource(
        //   me.gridOptions, 
        //   me.alertsService, 
        //   me.alertsService.getReceivedNotifications, 
        //   {startIndex: 0, pageSize: me.pageSize}, 
        //   false
        // );
/*  }*/
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
    grid.context.onQuickFilterChanged = function(event) {
        this.gridOptions.api.setQuickFilter(event.target.value);
    }

    grid.context.utils.setNotificationsGridMemoryDataSource(
      grid.context.gridOptions, 
      grid.context.alertsService, 
      grid.context.alertsService.getNotifications, 
      {startIndex: 0, pageSize: grid.context.pageSize, memberId: grid.context.session.auth.member.memberId, direction: 'SENT'},
      false
    );
    event.api.sizeColumnsToFit();
  }
  
  onFilterChanged = function(event, scope) {
    this.utils.setGridFilterMap(this.gridOptions);
  }

  onSelectionChanged = function(event) {
    this.context.notificationSelectionChanged(this.context.gridOptions);
  };

  onRowSelectionChanged = function(event) {
    this.context.notificationSelectionChanged(this.context.gridOptions);
  };

  notificationSelectionChanged(scope) {
    let selected = scope.api.getSelectedRows().length != 0;
    this.evt.publish('notificationsSelected', {selectedNotifications: scope.api.getSelectedRows(), notificationType: 'SENT'});
  }

  get isGridFiltered() {
    return (this.gridOptions && this.gridOptions.api && this.gridOptions.api.isAnyFilterPresent()) ;
  }

  getSentAlerts() {
    //getReceivedNotifications();
  }

}

