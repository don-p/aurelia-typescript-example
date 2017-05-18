import {inject, NewInstance, Lazy, Parent, LogManager, bindable} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {AureliaConfiguration} from 'aurelia-configuration';
import {Grid, GridOptions, IGetRowsParams, IDatasource, Column, TextFilter} from 'ag-grid/main';
import {I18N} from 'aurelia-i18n';
import {ValidationRules, ValidationController, Rules, validateTrigger} from 'aurelia-validation';
import {Utils} from '../services/util';
import {CaseService} from '../services/caseService';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(I18N, AureliaConfiguration, Utils, CaseService, EventAggregator, NewInstance.of(ValidationController), LogManager)
export class CasesDetail {

  sentRequestsGrid: any;
  receivedRequestsGrid: any;
  gridOptionsSent: GridOptions;
  gridOptionsReceived: GridOptions;
  connections: Array<any>;
  connectionsPromise: Promise<Response>;
  requestType: string;
  selectedCase: any;

  router: Router;
  @bindable pageSize;

  logger: Logger;

  constructor(private i18n: I18N, private appConfig: AureliaConfiguration, private utils: Utils, 
    private caseService:CaseService, private evt: EventAggregator, private vController:ValidationController) {

    this['id'] = new Date().getTime();
    this.requestType = 'PENDING';
    this.pageSize = 100000;

    this.gridOptionsSent = this.utils.getGridOptions('listConnectionRequests', this.pageSize);
    this.gridOptionsReceived = this.utils.getGridOptions('listConnectionRequests', this.pageSize);

    let me = this;

    this.evt.subscribe('caseSelected', payload => {
      if((!me.selectedCase || me.selectedCase === null) || (me.selectedCase.caseId !== payload.case.caseId)) {
        me.selectedCase = payload.case;

        // me.utils.setCommunityMembersGridDataSource('communityMembers', me.gridOptions, me.pageSize, me.communityService, null, false);
     }
    });
    

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

