import {inject, NewInstance, Lazy, Parent, LogManager, bindable} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {Session} from '../services/session';
import {AureliaConfiguration} from 'aurelia-configuration';
import {Grid, GridOptions, IGetRowsParams, IDatasource, Column, TextFilter} from 'ag-grid/main';
import {I18N} from 'aurelia-i18n';
import {ValidationRules, ValidationController, Rules, validateTrigger} from 'aurelia-validation';
import {Utils} from '../services/util';
import {CaseService} from '../services/caseService';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(Session, I18N, AureliaConfiguration, Utils, CaseService, EventAggregator, NewInstance.of(ValidationController), LogManager)
export class CasesDetail {

  sentRequestsGrid: any;
  receivedRequestsGrid: any;
  connections: Array<any>;
  casePromise: Promise<Response>;
  requestType: string;
  selectedCase: any;
  selectedTask: any;
  gridOptions: GridOptions;

  router: Router;
  @bindable pageSize;

  logger: Logger;

  constructor(private session: Session, private i18n: I18N, private appConfig: AureliaConfiguration, private utils: Utils, 
    private caseService:CaseService, private evt: EventAggregator, private vController:ValidationController) {

    this['id'] = new Date().getTime();
    this.requestType = 'PENDING';
    this.pageSize = 100000;

    let me = this;

    this.evt.subscribe('caseSelected', payload => {
      if((!me.selectedCase || me.selectedCase === null) || (me.selectedCase.caseId !== payload.case.caseId)) {
        me.onCaseSelected(payload);
     }
    });
    
    this.evt.subscribe('taskSelected', payload => {
      if((!me.selectedTask || me.selectedTask === null) || (me.selectedTask.taskId !== payload.task.taskId)) {
        me.onTaskSelected(payload);
     }
    });
    
    this.gridOptions = <GridOptions>{};
    this.gridOptions['id'] = 'tasksGrid';
    this.gridOptions.getRowNodeId = function(item) {
      return item.taskId?item.taskId.toString():null;
    };
    this.gridOptions.rowModelType = 'normal';

    this.logger = LogManager.getLogger(this.constructor.name);
    
  }

  bind(bindingContext: Object, overrideContext: Object) {
    this.logger.debug("Connections | bind()");
  }

  attached() {
    // this.showRequests(this.requestType);

  }
  activate(params, navigationInstruction) {
    // this.selectOrganization(this.parent.organizations[0]);
  }

  onGridReady(event, scope) {
    let grid:any = this;

    event.api.gridOptionsWrapper.gridOptions.onRowClicked = function(event) {
      event.context.context.onRowclick(event);
    }

    grid.context.getTasks();
    event.api.sizeColumnsToFit();
  }

  onRowclick = function(event) {
    let scope = event.context;

    if(event.event.target.id === 'edit-task') {
      scope.editTask(event.data);
    } else if(event.event.target.id === 'delete-task') {
      scope.editTask(event.data);
    } else {
      if(!!(event.data) && (!(this.selectedTask) || (!!(this.selectedTask) && !(event.data.taskId === this.selectedTask.taskId)))) {
        event.context.evt.publish('taskSelected', {task: event.data, type: 'SENT'});
      }
    }
  };

  getTasks() {
    if(!!(this.selectedCase)) {
      this.gridOptions.api.setRowData(this.selectedCase.tasks);
    }
  }
  

  onCaseSelected(payload) {

    let selectedCase = payload.case;
    let me = this;

    // get the case details.
    this.casePromise = this.caseService.getCase(selectedCase.caseId, 0, 1000);
    this.casePromise.then(function(data:any){
      let _case = data;
      
      me.selectedCase = _case;
      me.gridOptions.api.setRowData(me.selectedCase.tasks);
    });

  }
  
  onTaskSelected(payload) {

    let selectedTask = payload.task;
    let me = this;

    // TEMP
    me.selectedTask = selectedTask;

    // // get the case details.
    // this.casePromise = this.caseService.getCase(selectedTask.taskId, 0, 1000);
    // this.casePromise.then(function(data:any){
    //   let _case = data;
      
    //   me.selectedCase = _case;
    //   me.gridOptions.api.setRowData(me.selectedCase.tasks);
    // });

  }
  

/*
  editConnectionRequest(connections: Array<any>, status:string, event:string) {
    let me = this;
    let memberIds = connections.map(function(connection) {
      return connection.memberId;
    })
    this.communityService.editConnectionRequest(memberIds, status)
    .then(response => response.json())
    .then(data => {
      me.evt.publish('connectionChanged', event);
      let totalCount = data['totalCount'];
    });
  }
*/

}

