import {inject, NewInstance, Lazy, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {Router, NavigationInstruction} from 'aurelia-router';
import {DataService} from '../services/dataService';
import {Session} from '../services/session';
import {I18N} from 'aurelia-i18n';
import {Grid, GridOptions, Column, TextFilter} from 'ag-grid/main';
import {WizardControllerStep} from '../lib/aurelia-easywizard/controller/wizard-controller-step';
import {AureliaConfiguration} from 'aurelia-configuration';
import {ValidationRules, ValidationController, Validator} from 'aurelia-validation';
import {Utils} from '../services/util';
import {MemberActionsBarCustomElement} from '../components/member-actions-bar';

@inject(Session, DataService, I18N, AureliaConfiguration, Utils, MemberActionsBarCustomElement, LogManager)
export class Cases {

  router: Router;
  // alertCategories: Array<Object>;
  caseId: string;

  logger: Logger;
  pageSize;

  constructor(private session: Session, private dataService: DataService, private i18n: I18N, private appConfig: AureliaConfiguration, private utils: Utils) {
    this.pageSize = 200;
    this.logger = LogManager.getLogger(this.constructor.name);
  }


  bind(bindingContext: Object, overrideContext: Object) {
    this.logger.debug("Community | bind()");
  }

  activate(params) {
    // Set case ID for a case-specific request.
    if(!!(params)) {
      this.caseId = params.caseId;
    }
  }



}

