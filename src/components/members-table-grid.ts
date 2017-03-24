import {inject, viewResources, Lazy, bindable, bindingMode, containerless, customElement, LogManager, Parent} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {Session} from '../services/session';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
import {Utils} from '../services/util';
import {Grid, GridOptions, IGetRowsParams, IDatasource, Column, TextFilter} from 'ag-grid/main';
import {TextSearchFilter} from '../lib/grid/textSearchFilter';

@inject(Session, EventAggregator, I18N, Utils, LogManager) 
@viewResources('./members-table-grid')
@customElement('members-table-grid')
@containerless
export class MembersTableGridCustomElement {  

    @bindable gridOptions: GridOptions = <GridOptions>{};
    gridColumns: Array<any>;
    grid: any;
    @bindable gridId:String;
    @bindable gridReadyFunc: Function;
    @bindable gridFilterFunc: Function;
    @bindable gridSelectionChangedFunc: Function;
    @bindable paginationPageSize: Number;
    @bindable enableFilter: boolean;
    @bindable enableServerSideFilter: boolean;
    @bindable enableSorting: boolean;
    @bindable enableServerSideSorting: boolean;
    @bindable displayColumns: Array<String> = [];

    context: any;
    logger: Logger;

    

  constructor(private session: Session, private evt: EventAggregator, private i18n: I18N, private utils: Utils){
    this.gridOptions = <GridOptions>{};
    this.logger = LogManager.getLogger(this.constructor.name);

    this.gridSelectionChangedFunc = function(){};
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
    event.api.gridOptionsWrapper.gridOptions.onViewportChanged = function() {
      event.api && event.api.sizeColumnsToFit();
    };
    event.api.gridOptionsWrapper.gridOptions.onGridSizeChanged = function(){
      event.api && event.api.sizeColumnsToFit();
    };

    this.gridReadyFunc.call(this, event);
  }

  private getTextSearchFilter(): any {
    return TextSearchFilter;
  }

  private showColumn(column: String): boolean {
    return this.displayColumns.includes(column);
  }
}