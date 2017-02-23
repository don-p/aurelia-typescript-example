import {inject, NewInstance, Lazy, Parent, LogManager, bindable} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {AureliaConfiguration} from 'aurelia-configuration';
import {Grid, GridOptions, IGetRowsParams, IDatasource, Column, TextFilter} from 'ag-grid/main';
import {I18N} from 'aurelia-i18n';
import {ValidationRules, ValidationController, Rules, validateTrigger} from 'aurelia-validation';
import {Community} from './community';
import {Utils} from '../services/util';
import {CommunityService} from '../services/communityService';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(I18N, AureliaConfiguration, Utils, CommunityService, Parent.of(Community), EventAggregator, NewInstance.of(ValidationController), LogManager)
export class Connections {

  sentRequestsGrid: any;
  receivedRequestsGrid: any;
  gridOptionsSent: GridOptions;
  gridOptionsReceived: GridOptions;
  connections: Array<any>;
  connectionsPromise: Promise<Response>;
  requestType: string;
  router: Router;
  @bindable pageSize;

  logger: Logger;

  constructor(private i18n: I18N, private appConfig: AureliaConfiguration, private utils: Utils, 
    private communityService:CommunityService, private parent: Community, private evt: EventAggregator, private vController:ValidationController) {

      this['id'] = new Date().getTime();
    this.requestType = 'PENDING';
    this.pageSize = 100000;

    // ValidationRules
    // .ensureObject()
    // .satisfies(obj => obj * obj.width * obj.height <= 50)
    //   .withMessage('Volume cannot be greater than 50 cubic centemeters.')
    // .on(this.$filterValues);

    // ValidationRules.on(this).passes(validatePhoneNumber);

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
    bindingContext['parent'].vm = this;
    this.logger.debug("Connections | bind()");
  }

  attached() {
    // new Grid(this.sentRequestsGrid, this.gridOptionsSent); //create a new grid
    // this.gridOptionsSent['api'].sizeColumnsToFit();
    this.utils.setMemberConnectionRequestsGridDataSource(this.gridOptionsSent, this.pageSize, this.communityService, 'INVITED');
    // new Grid(this.receivedRequestsGrid, this.gridOptionsReceived); //create a new grid
    // this.gridOptionsReceived['api'].sizeColumnsToFit();
    this.utils.setMemberConnectionRequestsGridDataSource(this.gridOptionsReceived, this.pageSize, this.communityService, 'PENDING');

    // this.showRequests(this.requestType);

  }
  activate(params, navigationInstruction) {
    // this.selectOrganization(this.parent.organizations[0]);
  }

  showRequests(type: string) {
    this.requestType = type;
    let me = this;

    if(type === 'PENDING') {
       //me.gridOptionsReceived.api.refreshView();
       me.utils.setMemberConnectionRequestsGridDataSource(me.gridOptionsReceived, me.pageSize, me.communityService, type);
    } else if(type === 'INVITED') {
      //me.gridOptionsSent.api.refreshView();
      me.utils.setMemberConnectionRequestsGridDataSource(me.gridOptionsSent, me.pageSize, me.communityService, type);
   }

  }

  editConnectionRequest(connections: Array<any>, status:string, event:string) {
    let me = this;
    let memberIds = connections.map(function(connection) {
      return connection.memberId;
    })
    this.communityService.editConnectionRequest(memberIds, status)
    .then(response => response.json())
    .then(data => {
      // update view
      me.evt.publish('connectionChanged', event);
      // Filter out existing community members.
      let totalCount = data['totalCount'];
    });
  }


}

