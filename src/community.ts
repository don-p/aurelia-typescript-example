import {inject, Lazy} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {Session} from './services/session';
import {DataService} from './services/dataService';
import {VirtualRepeat} from 'aurelia-ui-virtualization';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
import {DialogService} from 'aurelia-dialog';
import {Prompt} from './lib/prompt/prompt';
import * as Ps from 'perfect-scrollbar';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(Lazy.of(HttpClient), Session, Router, DataService, EventAggregator, Ps, I18N, DialogService)
export class Community {
  communities: any;
  items:Array<Object>;
  commType: string;
  pageSize: number;
  cmtysPromise: Promise<Response>;
  ps: any;

  navigationInstruction: NavigationInstruction;
  selectedItem: Object;
  selectedCommunities: Array<String>;
  _virtualRepeat: VirtualRepeat;

  constructor(private getHttpClient: () => HttpClient, private session: Session, 
    private router: Router, private dataService: DataService, private evt: EventAggregator, Ps, private i18n: I18N, private dialogService: DialogService) {

    // var Ps = require('perfect-scrollbar');

    this.ps = Ps;
    this.communities = {};
    this.communities['responseCollection'] = [];
    this.pageSize = 500;
    this.selectedItem = null;
    this.selectedCommunities = [];
    // this.getCommunitiesPage('COI', 50, this.pageSize);
    // this.cmtysPromise = this.getCommunitiesPage('COI', 50, this.pageSize);
  }

  activate(params, navigationInstruction) {
    this.navigationInstruction = navigationInstruction;
  }

  bind(bindingContext: Object, overrideContext: Object) {
    console.debug("Community | bind()");
  }
  attached() {
    console.debug("Community | attached()");
    
    // Custom scrollbar:
    var container = document.getElementById('community-list');
    this.ps.initialize(container);
    this.ps.update(container);
    let me = this;
    this.getCommunitiesPage('COI', 0, this.pageSize).then(function(){
      me.selectDefaultCommunity();
    });
  }
/**
 * Get communities for logged-in user.
 */
/*
  async listCommunities(communityType: string): Promise<void> {
    var me = this;

    this.dataService.getCommunities(communityType)
    .then(response => response.json())
    .then(data => {
      console.log(json(data));
//      this.session=me.session;
      me.communities = data.responseCollection;
    }).catch(error => {
      console.log("Communities list() failed."); 
      console.log(error); 
    });
  }
*/

  async getMore(topIndex: number, isAtBottom: boolean, isAtTop: boolean): Promise<void> {
    console.debug('Getting more communities: '+topIndex+' | '+isAtBottom+' | '+isAtTop);
    var me = this;

    if(isAtBottom){
      return this.dataService.getCommunities(this.commType, topIndex, 
        this._virtualRepeat['_viewsLength'] +  this._virtualRepeat['_bottomBufferHeight'])
      .then(response => response.json())
      .then(data => {
        console.log(json(data));
  //      this.session=me.session;
        me.communities = 
          me.communities['responseCollection'].splice(topIndex,me.communities['responseCollection'].length - topIndex, data.responseCollection);
        // me.communities = data;
      }).catch(error => {
        console.log("Communities list() failed."); 
        console.log(error); 
      });
    } else if(isAtTop){

    }
  }
  getCommunitiesPage(communityType: string, startIndex: number, pageSize: number): Promise<void> {
    var me = this;
    var cmtysPromise = this.dataService.getCommunities(communityType, startIndex,  pageSize);
    this.cmtysPromise = cmtysPromise;
    return cmtysPromise
    .then(response => response.json())
    .then(data => {
      me.communities = data;
     }, error => {
       console.log("Communities list() rejected."); 
       console.debug(me.cmtysPromise.isRejected().toString());
     }).catch(error => {
      console.log("Communities list() failed."); 
      console.log(error); 
      return Promise.reject(error);
    });

    // return cmtysPromise;
  }

  selectCommunityType(communityType:string) {
    let me = this;
    this.getCommunitiesPage(communityType, 0, this.pageSize).then(function(){
      me.selectDefaultCommunity();
    })
  }

  selectDefaultCommunity() {
    if(this.communities && this.communities.responseCollection.length > 0) {
      this.selectCommunity(this.communities.responseCollection[0]);
    }
  }

  selectCommunity(community: Object) {
    this.selectedItem = community;
    this.evt.publish('cmtySelected', {community: community});
  }

  deleteCommunity(community: any) {
    this.dialogService.open({ viewModel: Prompt, model: {
        question:this.i18n.tr('community.confirmDelete.title') , 
        message: this.i18n.tr('community.confirmDelete.message', {communityName: community.communityName})
      }
    }).then(response => {
      if (!response.wasCancelled) {
        // Call the delete service.
        console.log('Delete');
      } else {
        // Cancel.
        console.log('Cancel');
      }
    });
    
  }

}

