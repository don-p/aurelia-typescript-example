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
import {DataService} from '../services/dataService';
import {TaskResource} from '../model/taskResource';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(Session, I18N, AureliaConfiguration, Utils, CaseService, DataService, EventAggregator, NewInstance.of(ValidationController), Router, LogManager)
export class TaskDetail {

  sentRequestsGrid: any;
  receivedRequestsGrid: any;
  connections: Array<any>;
  casePromise: Promise<Response>;
  requestType: string;
  selectedCase: any;
  selectedTask: any;
  gridOptions: GridOptions;
  caseView: string;
  caseId: string;
  taskId: string;

  @bindable pageSize;

  logger: Logger;

  constructor(private session: Session, private i18n: I18N, private appConfig: AureliaConfiguration, private utils: Utils, 
    private caseService:CaseService, private dataService:DataService, private evt: EventAggregator, 
    private vController:ValidationController, private router: Router) {

    this['id'] = new Date().getTime();
    this.requestType = 'PENDING';
    this.pageSize = 100000;

    this.caseView = 'CASE';

    let me = this;

    this.evt.subscribe('taskLoaded', payload => {
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

  bind(bindingContext: Object, overrideContext: any) {
    this.logger.debug("Connections | bind()");
    this.caseId = overrideContext.parentOverrideContext.bindingContext.caseId;
    this.taskId = overrideContext.parentOverrideContext.bindingContext.taskId;
    
    // this.getTask(this.caseId, this.taskId);
  }

  attached() {
    // this.showRequests(this.requestType);

  }
  activate(params, navigationInstruction) {
    this.logger.debug("Detail | activate()");

    // this.caseId = params.caseId;
    // this.taskId = params.taskId;

    // this.getTask(this.caseId, this.taskId);

    // this.selectOrganization(this.parent.organizations[0]);
  }

  getTasks() {
    if(!!(this.selectedCase)) {
      this.gridOptions.api.setRowData(this.selectedCase.tasks);
    }
  }
  

  onCaseSelected(payload) {

    let selectedCase = payload.case;
    let me = this;
    // Reset the view.
    this.setView('CASE');
    me.gridOptions.api.deselectAll();

    // get the case details.
    this.casePromise = this.caseService.getCase(selectedCase.caseId);
    this.casePromise.then(function(data:any){
      let _case = data;
      
      me.selectedCase = _case;
      me.gridOptions.api.setRowData(me.selectedCase.tasks);
    });

  }
  
  onTaskSelected(payload) {

    let selectedTask = payload.task;
    let me = this;

    this.selectedTask = selectedTask;
    this.setView('COMMENTS');

    // // get the task details.
    // this.casePromise = this.caseService.getTask(this.selectedCase.caseId, selectedTask.taskId);
    // this.casePromise.then(function(data:any){
    //   let task = data;
      
    //   me.selectedTask = task;
    // });
  }

  setView(view) {
    this.caseView = view;
  }
  
  getTask(caseId: string, taskId: string) {

    let me = this;
    // get the task details.
    me.casePromise = me.caseService.getTask(caseId, taskId);
    me.casePromise.then(function(data:any){
      // let task = data;
        
      me.selectedTask = data;

    });
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

