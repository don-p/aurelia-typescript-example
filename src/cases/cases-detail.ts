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
    } else {
      // Clone the object so we do not edit the live/bound model.
      // get the task details.
      me.casePromise = me.caseService.getTask(me.selectedCase.caseId, task.taskId);
      me.casePromise.then(function(data:any){
        // let task = data;
        
        me.selectedTask = data;
        task = new TaskResource(data);
        title = me.i18n.tr('cases.tasks.editTask');
        me.openTaskResourceDialog(task, title, null);
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

  openTaskResourceDialog(task: TaskResource, title: string, vRules) {

    let me = this;
    this.dataService.openResourceEditDialog({modelView:'model/taskModel.html', title:title, 
      loadingTitle: 'app.loading', item:task, okText:this.i18n.tr('button.save'), validationRules:vRules})
    .then((controller:any) => {
      let model = controller.settings;
      // Callback function for submitting the dialog.
      controller.viewModel.submit = (community) => {
        me.logger.debug("Edit community submit()");
        let comm = {
          communityId: community.communityId, 
          communityName: community.communityName, 
          communityDescription: community.communityDescription, 
          communityType: community.communityType,
          membershipType: 'DEFINED'
        };
        /*
        let modelPromise = me.communityService.createCommunity(comm);
        controller.viewModel.modelPromise = modelPromise;        
        modelPromise
        .then(response => response.json())
        .then(data => {
          me.getCommunitiesPage(me.commType, 0, this.pageSizeList).then((communitiesResult:any) => {
            if(community === null || typeof community.communityId !== 'string') {
              // select the new community
              me.selectCommunity(data);
            }
            // re-select the selected communities
            if(me.selectedCommunities.length > 0) {
              let temp = [];
              for(community of communitiesResult) {
                let found = me.selectedCommunities.find(function(item: any) {
                  return item.communityId == community.communityId;
                })
                
                if(!!(found)) {
                  temp.push(community);
                  // let index = me.selectedCommunities.indexOf(found);
                  // me.selectedCommunities[index] = community;
                }
              }
              me.selectedCommunities = temp;
            }

          });
          // Close dialog on success.
          controller.ok();
        }, error => {
          me.logger.error("Community create() rejected.");
          model.errorMessage = "Failed"; 
        }).catch(error => {
          me.logger.error("Community create() failed."); 
          me.logger.error(error); 
          model.errorMessage = "Failed"; 
          return Promise.reject(error);
        })
        */
      }
      // controller.result.then((response) => {
      //   if (response.wasCancelled) {
      //     // Reset validation error state.
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

