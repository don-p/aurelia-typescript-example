import {inject, Lazy} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {Session} from './services/session';
import {DataService} from './services/dataService';
import {VirtualRepeat} from 'aurelia-ui-virtualization';
import {EventAggregator} from 'aurelia-event-aggregator';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(Lazy.of(HttpClient), Session, Router, DataService, EventAggregator)
export class Community {
  communities: Object;
  items:Array<Object>;
  commType: string;
  pageSize: number;
  cmtysPromise: Promise<Response>;

  navigationInstruction: NavigationInstruction;
  selectedItem: Object;
  _virtualRepeat: VirtualRepeat;

  constructor(private getHttpClient: () => HttpClient, private session: Session, 
    private router: Router, private dataService: DataService, private evt: EventAggregator) {

     this.communities = {};
    this.communities['responseCollection'] = [];
    this.pageSize = 500;
    this.selectedItem = null;
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
    this.getCommunitiesPage('COI', 0, this.pageSize);
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
  getCommunitiesPage(communityType: string, startIndex: number, pageSize: number): Promise<Response> {
    var me = this;
    var cmtysPromise = this.dataService.getCommunities(communityType, startIndex,  pageSize);
    this.cmtysPromise = cmtysPromise;
    cmtysPromise
    .then(response => response.json())
    .then(data => {
      console.log(json(data));
//      this.session=me.session;
      me.communities = data;
     }, error => {
       console.log("Communities list() rejected."); 
       console.debug(me.cmtysPromise.isRejected().toString());
     }).catch(error => {
      console.log("Communities list() failed."); 
      console.log(error); 
      return Promise.reject(error);
    });

    return cmtysPromise;
  }

  selectCommunity(cmtyId: string) {
    this.evt.publish('cmtySelected', {cmtyId: cmtyId});
  }

}

