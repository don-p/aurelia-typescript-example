import {inject, viewResources, Lazy, bindable, bindingMode, containerless, customElement, LogManager, Parent} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {Session} from '../services/session';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
import {Utils} from '../services/util';
import {Grid, GridOptions, Column, TextFilter} from 'ag-grid/main';
import {TextSearchFilter} from '../lib/grid/textSearchFilter';

@inject(Session, EventAggregator, I18N, Utils, LogManager) 
@viewResources('./notifications-table-grid')
@customElement('notifications-table-grid')
@containerless
export class NotificationsTableGridCustomElement {  

    @bindable gridOptions: GridOptions = <GridOptions>{};
    gridColumns: Array<any>;
    grid: any;
    @bindable gridId:String;
    @bindable gridReadyFunc: Function;
    @bindable gridFilterFunc: Function;
    @bindable gridSelectionChangedFunc: Function;
    @bindable rowSelectionChangedFunc: Function;
    @bindable paginationPageSize: Number;
    @bindable enableFilter: boolean;
    @bindable enableServerSideFilter: boolean;
    @bindable enableSorting: boolean;
    @bindable enableServerSideSorting: boolean;
    @bindable displayColumns: Array<String> = [];
    @bindable fullWidthCellRenderer;

    context: any;

    messageStatusFilter: string = 'ALL';

    logger: Logger;

    

  constructor(private session: Session, private evt: EventAggregator, private i18n: I18N, private utils: Utils){
    this.gridOptions = <GridOptions>{};
    this.logger = LogManager.getLogger(this.constructor.name);

    let me = this;

    this.gridSelectionChangedFunc = function(){};
    this.rowSelectionChangedFunc = function(){};
    this.gridFilterFunc = function(){};
    this.evt.subscribe('notificationsFilterChanged', payload => {
      if(!!(me.gridOptions.api)) {
        me.messageStatusFilter = payload.messageStatusFilter;
        me.gridOptions.api.onFilterChanged();
      }
    });
    
    this.fullWidthCellRenderer = function (params) {
      me.logger.debug('>>>>>>> fullWidthRenderer');
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
        // var data = params.node.parent.data;
        let data = params.node.data;
        let memberId = params.context.context.session.auth.member.memberId;
        let isReceived:boolean = params.context.context.constructor.name === 'ReceivedAlerts';
        let spacer = isReceived?'<span style="min-width: 26px;width: 26px;display: inline-block;"></span>':'';
        var template = //'<div></div>';
            '<div class="full-width-panel full-width-notification-message">' +
            '  <div class="full-width-summary">' +
            spacer +
            '    <label class="alert-label ' + data.notificationCategory.categoryName.split(" ")[0] + '">' + data.notificationCategory.categoryName.split(" ")[0] + '</label><span>'+data.message+'</span>'+
            '  </div>' +
            '</div>';

        return template;
    };

    this.gridOptions.fullWidthCellRenderer = this.fullWidthCellRenderer;
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

    this.logger.debug("BInd");
  }

  activate(model) {
    this.logger.debug("activate");
  }

  attached() {
    this.logger.debug("attached");
  }

  onGridReady(event, scope) {
    this.logger.debug("=== onGridReady ===");
    let me = this;
    
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
      return(node.data.notificationCategory.categoryName === me.messageStatusFilter);
    }

    event.api.gridOptionsWrapper.gridOptions.doesDataFlower = function(){ return true;};

    event.api.gridOptionsWrapper.gridOptions.isFullWidthCell = function(rowNode) {
        return rowNode.flower;
    };

    event.api.gridOptionsWrapper.gridOptions.groupDefaultExpanded = 99999;

    // Force the filter indexing to use the data from the hidden 'message' column.
    let attachmentCol = event.api.columnController.getColumn('attachmentCount', event.api.columnController.gridColumns);
    let attachmentColDef = attachmentCol.colDef;
    attachmentColDef.getQuickFilterText = function(params) {
      return '_' + params.data.message;
    };
    

    scope.gridReadyFunc.call(this, event, scope);
  }

  getMessageQuickFilterText(params) {
    this.logger.debug("===== getMessageQuickFilterText ===== " + params);
    return !!(params)?params.data.notificationCategory.categoryName + '_' + params.data.message:'';
  }


  getRowHeight(params) {
      var rowIsNestedRow = params.node.flower;
      return rowIsNestedRow ? 50 : 30;
  }



  private getTextSearchFilter(): any {
    return TextSearchFilter;
  }

  private showColumn(column: String): boolean {
    return this.displayColumns.includes(column);
  }
}