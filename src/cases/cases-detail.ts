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
import {CommunityService} from '../services/communityService';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(I18N, AureliaConfiguration, Utils, CommunityService, EventAggregator, NewInstance.of(ValidationController), LogManager)
export class CasesDetail {

  sentRequestsGrid: any;
  receivedRequestsGrid: any;
  gridOptionsSent: GridOptions;
  gridOptionsReceived: GridOptions;
  connections: Array<any>;
  connectionsPromise: Promise<Response>;
  requestType: string;
  selectedRequest: any;

  router: Router;
  @bindable pageSize;

  logger: Logger;

  constructor(private i18n: I18N, private appConfig: AureliaConfiguration, private utils: Utils, 
    private communityService:CommunityService, private evt: EventAggregator, private vController:ValidationController) {

    this['id'] = new Date().getTime();
    this.requestType = 'PENDING';
    this.pageSize = 100000;

    this.gridOptionsSent = this.utils.getGridOptions('listConnectionRequests', this.pageSize);
    this.gridOptionsReceived = this.utils.getGridOptions('listConnectionRequests', this.pageSize);

    let me = this;
    this.evt.subscribe('connectionChanged', payload => {
      if(payload === 'REQUEST_TERMINATED' || 
        payload === 'REQUEST_ACCEPTED' || 
        payload === 'REQUEST_DECLINED') {
        me.showRequests(me.requestType);
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

  onReceivedGridReady(event) {
    this.utils.setMemberConnectionRequestsGridDataSource(this.gridOptionsReceived, this.pageSize, this.communityService, 'PENDING');
  }

  onSentGridReady(event) {
    this.utils.setMemberConnectionRequestsGridDataSource(this.gridOptionsSent, this.pageSize, this.communityService, 'INVITED');
  }

  showRequests(type: string) {
    this.requestType = type;
    let me = this;
    this.selectedRequest = null;

    if(type === 'PENDING') {
       //me.gridOptionsReceived.api.refreshView();
       me.utils.setMemberConnectionRequestsGridDataSource(me.gridOptionsReceived, me.pageSize, me.communityService, type);
    } else if(type === 'INVITED') {
      //me.gridOptionsSent.api.refreshView();
      me.utils.setMemberConnectionRequestsGridDataSource(me.gridOptionsSent, me.pageSize, me.communityService, type);
   }

  }

  onReceivedRequestSelected(event) {
    let connection = event.data;
    this.selectedRequest = connection;
  }

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


}

