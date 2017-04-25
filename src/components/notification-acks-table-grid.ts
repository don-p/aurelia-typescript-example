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
@viewResources('./notification-acks-table-grid')
@customElement('notification-acks-table-grid')
@containerless
export class NotificationAcksTableGridCustomElement {  

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
    
    this.dataFlowerFunc = this.doesDataFlower;
    // this.gridOptions['doesDataFlower'] = function(){
    //   return true;
    // };
    // this.gridOptions.getNodeChildDetails = this.getNodeChildDetails;
    this.DetailPanelCellRenderer = function() {};
    this.DetailPanelCellRenderer.prototype.init = function(params) {
        // trick to convert string of html into dom object
        var eTemp = document.createElement('div');
        eTemp.innerHTML = this.getTemplate(params);
        this.eGui = eTemp.firstElementChild;

        this.setupDetailGrid(params.data);
        // this.consumeMouseWheelOnDetailGrid();
        // this.addSeachFeature();
        // this.addButtonListeners();
    };
    this.DetailPanelCellRenderer.prototype.setupDetailGrid = function(callRecords) {

      this.detailGridOptions = {
          enableSorting: true,
          enableFilter: true,
          enableColResize: true,
          rowData: callRecords,
          onGridReady: function(params) {
              setTimeout( function() { params.api.sizeColumnsToFit(); }, 0);
          }
      };

    };
    this.DetailPanelCellRenderer.prototype.getTemplate = function(params) {

      var message = params.data.message;

      var template =
          '<div class="full-width-panel">' +
          '  <div class="full-width-details">' +
          '    <div class="full-width-detail"><b>Message: </b>'+message+'</div>' +
          '  </div>'+
          '</div>';

      return template;
    };
    this.DetailPanelCellRenderer.prototype.getGui = function() {
      return this.eGui;
    };



    this.gridOptions.fullWidthCellRenderer = this.DetailPanelCellRenderer;

    this.fullWidthCellRenderer = function (params) {
      //  this.toString();
      let eGui = me.fullWidthCellRenderer.prototype.init(params);
      return eGui;
    }
    this.fullWidthCellRenderer.prototype.init = function(params) {
        // trick to convert string of html into dom object
        var eTemp = document.createElement('div');
        eTemp.innerHTML = this.getTemplate(params);
        this.eGui = eTemp.firstElementChild;
        return this.eGui;
        // this.consumeMouseWheelOnCenterText();
    };
    this.fullWidthCellRenderer.prototype.getTemplate = function(params) {
        // the flower row shares the same data as the parent row
        var data = params.node.data;

        var template = '<div></div>';
            // '<div class="full-width-panel">' +
            // '  <div class="full-width-summary">' +
            // '    <label>' + data.category + ':&nbsp;</label><span>'+data.message+'</span>'+
            // '  </div>' +
            // '</div>';

        return template;
    };

    // this.fullWidthCellRenderer.prototype.getGui = function() {
    //   return this.eGui;
    // };

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
    let statusCol = event.api.columnController.getColumn('ackStatusName', event.api.columnController.gridColumns);
    let statusColDef = statusCol.colDef;
    statusColDef.getQuickFilterText = function(params) {
      return null;
    };
    event.api.gridOptionsWrapper.gridOptions.getStatusQuickFilterText = function(params) {
      return null;
    }

    event.api.gridOptionsWrapper.gridOptions.getRowStyle = function(params) {
      if (params.data.ackStatus === 'REPLY_MESSAGE') {
          return {'cursor': 'pointer'}
      }
      return null;
    }
    event.api.gridOptionsWrapper.gridOptions.onRowClicked = function(event) {
      if(event.data.ackStatus === 'REPLY_MESSAGE') {
        console.debug("node: " + event);
        event.context.showAckReply(event.data);
      }
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

  isFullWidthCell(rowNode) {
     return rowNode.level === 1;
  }

    getRowHeight(params) {
        var rowIsNestedRow = params.node.canFlower;
        // return 100 when nested row, otherwise return 25
        return rowIsNestedRow ? 50 : 30;
    }


  doesDataFlower(dataItem) {
    return true;
  }

  getNodeChildDetails(record) {
    if(record.sentDate) {
      return {
        // group: true,
        key: record.notificationId,
          // the key is used by the default group cellRenderer
        expanded: true,
          // provide ag-Grid with the children of this group
          //children: [record.message],
        children: [{'notificationId': record.notificationId, 'category': record.notificationCategory.categoryName, 'message': record.message, 'attachments': record.attachmentCount}]
      };
    } else {
      return null;
    }
  }

  private getTextSearchFilter(): any {
    return TextSearchFilter;
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
      controller.result.then((response) => {
        if (response.wasCancelled) {
          // Reset validation error state.
          this.logger.debug('Cancel');
        }
      })
    });

  }

  private showColumn(column: String): boolean {
    return this.displayColumns.includes(column);
  }
}