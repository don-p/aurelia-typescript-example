import {inject, NewInstance, Lazy, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {AureliaConfiguration} from 'aurelia-configuration';
import {Session} from '../services/session';
import {DataService} from '../services/dataService';
import {CommunityService} from '../services/communityService';
import {VirtualRepeat} from 'aurelia-ui-virtualization';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
import * as Ps from 'perfect-scrollbar';
import {ValidationRules, ValidationController} from 'aurelia-validation';
import {CommunityResource} from '../model/communityResource';
import {Grid, GridOptions, IGetRowsParams, IDatasource, Column, TextFilter} from 'ag-grid/main';
import {Utils} from '../services/util';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(Session, DataService, CommunityService, EventAggregator, Ps, I18N, 
  AureliaConfiguration, Utils, NewInstance.of(ValidationController), LogManager)
export class Discover {
  communities: Array<Object>;
  items:Array<Object>;
  commType: string;
  pageSizeList: number;
  pageSize: number;
  cmtysPromise: Promise<Response>;
  modelPromise: Promise<void>;
  ps: any;

  navigationInstruction: NavigationInstruction;
  selectedItem: Object;
  selectedCommunities: Array<Object>;
  selectAll: boolean;
  _virtualRepeat: VirtualRepeat;

  router: Router;

  logger: Logger;

  constructor(private session: Session, private dataService: DataService, 
    private communityService: CommunityService, private evt: EventAggregator, Ps, 
    private i18n: I18N, private appConfig: AureliaConfiguration, private utils: Utils) {

    // var Ps = require('perfect-scrollbar');

    this.ps = Ps;
    this.communities = [];
    this.communities['responseCollection'] = [];
    this.pageSizeList = 500;
    this.pageSize = 200;
    this.selectedItem = null;
    this.selectedCommunities = [];
    this.logger = LogManager.getLogger(this.constructor.name);
  }

  activate(params, navigationInstruction) {
    this.navigationInstruction = navigationInstruction;
  }

  bind(bindingContext: Object, overrideContext: Object) {
    this.logger.debug("Community | bind()");
  }


}

