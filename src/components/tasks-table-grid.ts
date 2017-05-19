import {inject, viewResources, Lazy, bindable, bindingMode, containerless, customElement, LogManager, Parent} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {Session} from '../services/session';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
import {Utils} from '../services/util';
import {DataService} from '../services/dataService';
import {Grid, GridOptions, Column, TextFilter} from 'ag-grid/main';
import {TextSearchFilter} from '../lib/grid/textSearchFilter';
import {NotificationResource} from '../model/notificationResource';
import {NotificationAckResource} from '../model/notificationAckResource';

@inject(Session, EventAggregator, I18N, Utils, DataService, LogManager) 
@viewResources('./tasks-table-grid')
@customElement('tasks-table-grid')
@containerless
export class TasksTableGridCustomElement {  

    @bindable gridOptions: GridOptions = <GridOptions>{};
    // @bindable gridOptionsAcks: GridOptions = <GridOptions>{};
    gridColumns: Array<any>;
    grid: any;
    @bindable gridId:String;
    @bindable gridReadyFunc: Function;
    @bindable gridFilterFunc: Function;
    @bindable gridSelectionChangedFunc: Function;
    @bindable rowSelectionChangedFunc: Function;
    @bindable isExternalFilterPresent: Function;
    @bindable doesExternalFilterPass: Function;
    @bindable paginationPageSize: Number;
    @bindable enableFilter: boolean;
    @bindable enableServerSideFilter: boolean;
    @bindable enableSorting: boolean;
    @bindable enableServerSideSorting: boolean;
    @bindable displayColumns: Array<String> = [];
    // @bindable dataFlowerFunc: Function;
    @bindable fullWidthCellRenderer;
    DetailPanelCellRenderer: any;
    dataFlowerFunc: Function;
    context: any;
    logger: Logger;

    messageStatusFilter: string = 'ALL';

    

  constructor(private session: Session, private evt: EventAggregator, private i18n: I18N, private utils: Utils, private dataService: DataService){
    this.gridOptions = <GridOptions>{};
    this.logger = LogManager.getLogger(this.constructor.name);

    // this.gridReadyFunc = function(){};
    this.gridSelectionChangedFunc = function(){};
    this.rowSelectionChangedFunc = function(){};
    this.gridFilterFunc = function(){};
    this.doesExternalFilterPass = function(){};

    // this.isExternalFilterPresent = function(){
    //   console.log("ext filter");
    //   return false;
    // };
    // this.isExternalFilterPresent = function() {
    //   return true;
    // }
    let me = this;
    this.evt.subscribe('notificationAcksFilterChanged', payload => {
      me.messageStatusFilter = payload.messageStatusFilter;
      me.gridOptions.api.onFilterChanged();
    });

  }

  bind(bindingContext, overrideBindingContext) {
    this.context = bindingContext;
    // this.gridOptions.onViewportChanged = function() {
    //   if(!this.api) return;
    //   this.api.sizeColumnsToFit();
    // };
    // this.gridOptions.onGridSizeChanged = function(){
    //     if(!this.api) return;
    //     this.api.sizeColumnsToFit();
    // };
    this.isExternalFilterPresent = function() {
      return true;
    }

    this.logger.debug("BInd");
  }

  activate(model) {
    this.logger.debug("activate");
  }

  attached() {
    this.logger.debug("attached");
  }

  onGridReady(event, scope) {
    let me = this;

    this.logger.debug("=== onGridReady ===");
    event.api.gridOptionsWrapper.gridOptions.onViewportChanged = function() {
      event.api && event.api.sizeColumnsToFit();
    };
    event.api.gridOptionsWrapper.gridOptions.onGridSizeChanged = function(){
      event.api && event.api.sizeColumnsToFit();
    };
    event.api.gridOptionsWrapper.gridOptions.isExternalFilterPresent = function(){    
      console.log('EXFL');
      return !!(event.api.gridOptionsWrapper.gridOptions.context.messageStatusFilter) &&
      (event.api.gridOptionsWrapper.gridOptions.context.messageStatusFilter !== 'ALL');
    }
    event.api.gridOptionsWrapper.gridOptions.doesExternalFilterPass = function(node) {
      return(node.data.ackStatus === me.messageStatusFilter);
    }
    // let statusCol = event.api.columnController.getColumn('ackStatusName', event.api.columnController.gridColumns);
    // let statusColDef = statusCol.colDef;
    // statusColDef.getQuickFilterText = function(params) {
    //   return null;
    // };
    // event.api.gridOptionsWrapper.gridOptions.getStatusQuickFilterText = function(params) {
    //   return null;
    // }

    event.api.gridOptionsWrapper.gridOptions.getRowStyle = function(params) {
      if (params.data.ackStatus === 'REPLY_MESSAGE') {
          return {'cursor': 'pointer'}
      }
      return null;
    }
    event.api.gridOptionsWrapper.gridOptions.onRowClicked = function(event) {
      // if(event.data.ackStatus === 'REPLY_MESSAGE') {
      //   console.debug("node: " + event);
      //   event.context.showAckReply(event.data);
      // }
    }
    // scope.gridOptions.doesDataFlower = scope.dataFlowerFunc;

    scope.gridReadyFunc.call(this, event);
  }

  // getStatusQuickFilterText(params) {
  //   return null;
  // }

  getMessageQuickFilterText(params) {
    this.logger.debug("===== getMessageQuickFilterText ===== " + params);
    return !!(params)?params.data.notificationCategory.categoryName + '_' + params.data.message:'';
  }

  private getTextSearchFilter(): any {
    return TextSearchFilter;
  }

  editTask(task) {
    this.logger.debug("===== editTask ===== " + task);

  }

  showAckReply(ack) {
    this.dataService.openTemplateDialog(this.i18n.tr('alerts.notifications.replyMessage'), this.i18n.tr('button.close'), false, 'components/notificationMessageDetail.html')
    .then((controller:any) => {
      // let model = controller.settings.model;
      let model = controller.settings;
      let selectedNotification = ack;
      controller.viewModel.selectedNotificationAck = selectedNotification;
      
      // Callback function for submitting the dialog.
      controller.viewModel.submit = (reply) => {
        controller.ok();
      }
      // controller.result.then((response) => {
      //   if (response.wasCancelled) {
      //     // Reset validation error state.
      //     this.logger.debug('Cancel');
      //   }
      // })
    });

  }

  private showColumn(column: String): boolean {
    return this.displayColumns.includes(column);
  }
}