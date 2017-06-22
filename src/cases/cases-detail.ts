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
import {CaseResource} from '../model/caseResource';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(Session, I18N, AureliaConfiguration, Utils, CaseService, DataService, EventAggregator, NewInstance.of(ValidationController), Router, LogManager)
export class CasesDetail {

  sentRequestsGrid: any;
  receivedRequestsGrid: any;
  connections: Array<any>;
  casePromise: Promise<Response>;
  requestType: string;
  selectedCase: any;
  selectedTask: any;
  gridOptions: GridOptions;
  caseView: string;

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

    this.evt.subscribe('caseSelected', payload => {
      // if((!me.selectedCase || me.selectedCase === null) || (me.selectedCase.caseId !== payload.case.caseId)) {
        me.onCaseSelected(payload);
    //  }
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
      scope.context.editTask(event.data, event.event);
    } else if(event.event.target.id === 'delete-task') {
      scope.context.deleteTask(event.data, event.event);
    } else {
      if(!!(event.data) && (!(this.selectedTask) || (!!(this.selectedTask) && !(event.data.taskId === this.selectedTask.taskId)))) {
        // Navigate to Task view.
        this.router.navigateToRoute('task', { taskId: event.data.taskId, caseId:  this.selectedCase.caseId});
        // event.context.evt.publish('taskSelected', {task: event.data, type: 'SENT'});
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
    // Reset the view.
    this.setView('CASE');
    // me.gridOptions.api.deselectAll();

    // Update router Url.
    this.router.navigateToRoute('cases-caseId', { caseId: selectedCase.caseId}, {replace: true, trigger: false});
    // get the case details.
    this.casePromise = this.caseService.getCase(selectedCase.caseId);
    this.casePromise.then(function(data:any){
      if(!!(me.gridOptions) && !!(me.gridOptions.api)) {
        let _case = data;
        
        me.selectedCase = _case;
        me.logger.debug("Setting task grid row data. api: " + me.gridOptions.api);
        me.gridOptions.api.setRowData(me.selectedCase.tasks);
      }
    });

  }
  
  onTaskSelected(payload) {

    let selectedTask = payload.task;
    let me = this;

    this.setView('TASK');

    // get the task details.
    this.casePromise = this.caseService.getTask(this.selectedCase.caseId, selectedTask.taskId);
    this.casePromise.then(function(data:any){
      let task = data;
      
      me.selectedTask = task;
    });
  }

  setView(view) {
    this.caseView = view;
  }
  
  editTask(task: any, event: MouseEvent) {
    if(!!(event)) event.stopPropagation();

    let me = this;
    let title = '';
    if(task === null) {
      // Create an empty or cloned object model for the edit dialog.
      task = new TaskResource();
      title = this.i18n.tr('cases.tasks.createTask');
      me.openTaskResourceDialog(me.selectedCase, task, title, null);
    } else {
      // Clone the object so we do not edit the live/bound model.
      // get the task details.
      me.casePromise = me.caseService.getTask(me.selectedCase.caseId, task.taskId);
      me.casePromise.then(function(data:any){
        // let task = data;
        
        me.selectedTask = data;
        task = new TaskResource(data);
        title = me.i18n.tr('cases.tasks.editTask');
        me.openTaskResourceDialog(me.selectedCase, task, title, null);
      });
      // task = new TaskResource(task);
      // title = this.i18n.tr('cases.tasks.editTask');
    }
    const vRules = ValidationRules
      .ensure((community: any) => community.communityName)
      .displayName(this.i18n.tr('community.communities.communityName'))
      .required()
      .then()
      .minLength(3)
      .maxLength(120)
//      .then()
      .ensure((community: any) => community.communityDescription)
      .displayName(this.i18n.tr('community.communities.communityDesc'))
      .required()
      .then()
      .maxLength(120)
      // .on(community)
      .rules;
  }

  openTaskResourceDialog(_case: CaseResource, task: TaskResource, title: string, vRules):Promise<any> {

    let me = this;
    return this.dataService.openResourceEditDialog({modelView:'model/taskModel.html', title:title, 
      loadingTitle: 'app.loading', item:task, okText:this.i18n.tr('button.save'), validationRules:vRules})
    .then((controller:any) => {
      let model = controller.settings;

      let statuses = this.appConfig.get('server.task.statuses');
      statuses = statuses.statuses;
      controller.viewModel.statuses = statuses;

      // let roles = this.appConfig.get('server.task.statuses');
      // statuses = statuses.statuses;
      // controller.viewModel.statuses = statuses;

      let assigneesListPromise = me.caseService.getCaseTaskAssignees(me.session.auth.organization.organiztionId);
      assigneesListPromise.then(data => {
        controller.viewModel.assignees = data;
      });

      // Callback function for submitting the dialog.
      controller.viewModel.submit = (task) => {
        me.logger.debug("Edit task submit()");
        let modelPromise = me.caseService.createTask(_case, task);
        controller.viewModel.modelPromise = modelPromise;        
        modelPromise
        .then(response => response.json())
        .then(data => {
          let casePromise = me.caseService.getCase(_case.caseId);
          casePromise.then(data => {
            me.selectedCase = data;
            // Refresh the task list grid.
            me.getTasks();
            // Close dialog on success.
            controller.ok();
          })
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
      // controller.result.then((response) => {
      //   if (response.wasCancelled) {
      //     // Reset validation error state.
      //     this.logger.debug('Cancel');
      //   }
      // })
    });

  }
  
  deleteTask(task: TaskResource, event: MouseEvent) {
    event.stopPropagation();

    let me = this;
    let modelPromise = null;
    this.dataService.openPromptDialog(this.i18n.tr('cases.tasks.confirmDelete.title'),
      this.i18n.tr('cases.tasks.confirmDelete.message', {taskId: task.taskId}),
      task, this.i18n.tr('button.delete'), true, null, 'modelPromise', '')
    .then((controller:any) => {
      let model = controller.settings;
      // Callback function for submitting the dialog.
      controller.viewModel.submit = (task) => {
        // Call the delete service.
        // let modelPromise = ;
        let taskPromise = this.caseService.deleteTask(task);
        controller.viewModel.modelPromise = taskPromise;        
        taskPromise.then(data => {
          let casePromise = me.caseService.getCase(task.caseId);
          return casePromise.then(caseData => {
            me.selectedCase = caseData;
            // Refresh the task list grid.
            me.getTasks();
            // Close dialog on success.
            controller.ok();
          });
        }, error => {
          model.errorMessage = "Failed"; 
          me.logger.error("Task delete() rejected."); 
        }).catch(error => {
          model.errorMessage = "Failed"; 
          me.logger.error("Task delete() failed."); 
          me.logger.error(error); 
          return Promise.reject(error);
        });
        return taskPromise;        
      }
      // controller.result.then((response) => {
      //   if (response.wasCancelled) {
      //     // Cancel.
      //     this.logger.debug('Cancel');
      //   }
      // })
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

