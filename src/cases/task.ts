import {inject, NewInstance, Lazy, LogManager, bindable} from 'aurelia-framework';
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
import {Utils} from '../services/util';
import {CaseService} from '../services/caseService';

@inject(Session, DataService, I18N, AureliaConfiguration, Utils, CaseService, EventAggregator, LogManager)
export class Task {

  router: Router;
  // alertCategories: Array<Object>;

  logger: Logger;
  pageSize;

  casePromise: Promise<Response>;
  @bindable caseId: string;
  taskId: string;
  selectedTask: any;

  constructor(private session: Session, private dataService: DataService, private i18n: I18N, 
    private appConfig: AureliaConfiguration, private utils: Utils, private caseService: CaseService, private evt: EventAggregator) {

    this.pageSize = 200;
    this.logger = LogManager.getLogger(this.constructor.name);
  }
/*
  // Child router for subtabs - Community, Discover, Connections.
  configureRouter(config, router) {
    config.map([
      { 
        route: '', redirect: 'detail', nav: false
      },
      { 
        route: 'detail', name: 'task/detail', moduleId: './task-detail', 
        nav: true, title: this.i18n.tr('router.nav.communities'), 
        settings:{
          detailView: 'community-detail', 
          memberActions: [
            MemberActionsBarCustomElement.GRIDCALL, 
            MemberActionsBarCustomElement.ALERT, 
            MemberActionsBarCustomElement.ADDCONNECTION, 
            MemberActionsBarCustomElement.ADDMEMBER, 
            // MemberActionsBarCustomElement.STARTCONVERSATION,
            MemberActionsBarCustomElement.REMOVEMEMBER,
            MemberActionsBarCustomElement.TRANSFEROWNER,
            MemberActionsBarCustomElement.SETCOORDINATOR
          ]
        }
      },
      { 
        route: 'connections', name: 'community/connections', moduleId: './connections', 
        nav: true, title: this.i18n.tr('router.nav.connections'), 
        settings:{
          detailView: 'connections-detail',
          memberActions: [
            MemberActionsBarCustomElement.GRIDCALL, 
            MemberActionsBarCustomElement.ALERT, 
            MemberActionsBarCustomElement.REMOVECONNECTION, 
            // MemberActionsBarCustomElement.STARTCONVERSATION
          ]
        }
      },
      { 
        route: 'discover', name: 'community/discover', moduleId: './discover', 
        nav: true, title: this.i18n.tr('router.nav.discover'), 
        settings:{
          detailView: 'discover-detail',
          memberActions: [
            MemberActionsBarCustomElement.GRIDCALL, 
            MemberActionsBarCustomElement.ALERT, 
            MemberActionsBarCustomElement.ADDCONNECTION, 
            MemberActionsBarCustomElement.ADDMEMBER ,
            // MemberActionsBarCustomElement.STARTCONVERSATION
          ]
        }
      }
    ]);

    // router.hasAction = (instruction: NavigationInstruction, action: string) {
    //   const actions:Array<string> = instruction.config.settings.actions;
    //   return actions.includes(action);
    // }

    this.router = router;
  }
*/
  bind(bindingContext: Object, overrideContext: Object) {
    this.logger.debug("Task | bind()");
  }

  activate(params, router, instruction) {
    // Wait for required view data before routing, by returning a Promise from activate().

    this.logger.debug("Task | activate()");
    this.caseId = params.caseId;
    this.taskId = params.taskId;

    this.getTask(this.caseId, this.taskId);
  }

  getTask(caseId: string, taskId: string) {

    let me = this;
    // get the task details.
    me.casePromise = me.caseService.getTask(caseId, taskId);
    me.casePromise.then(function(data:any){
      // let task = data;
      me.evt.publish('taskLoaded', {task: data});
      me.selectedTask = data;

    });
  }  


}

