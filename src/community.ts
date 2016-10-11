import {inject, Lazy} from 'aurelia-framework';
import {json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {Session} from './services/session';
import {DataService} from './services/dataService';
import {CommunityService} from './services/communityService';
import {VirtualRepeat} from 'aurelia-ui-virtualization';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
import {DialogService, DialogController} from 'aurelia-dialog';
import * as Ps from 'perfect-scrollbar';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(Session, Router, DataService, CommunityService, EventAggregator, Ps, I18N, DialogService)
export class Community {
  communities: Array<Object>;
  items:Array<Object>;
  commType: string;
  pageSize: number;
  cmtysPromise: Promise<Response>;
  modelPromise: Promise<void>;
  ps: any;

  navigationInstruction: NavigationInstruction;
  selectedItem: Object;
  selectedCommunities: Array<String>;
  selectAll: boolean;
  _virtualRepeat: VirtualRepeat;

  constructor(private session: Session, private router: Router, private dataService: DataService, 
    private communityService: CommunityService, private evt: EventAggregator, Ps, private i18n: I18N, private dialogService: DialogService) {

    // var Ps = require('perfect-scrollbar');

    this.ps = Ps;
    this.communities = [];
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
      return this.communityService.getCommunities(this.commType, topIndex, 
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
    var cmtysPromise = this.communityService.getCommunities(communityType, startIndex,  pageSize);
    this.cmtysPromise = cmtysPromise;
    return cmtysPromise
    .then(response => response.json())
    .then(data => {
      me.communities = data.responseCollection;
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
    if(this.communities && this.communities.length > 0) {
      this.selectCommunity(this.communities[0]);
    }
  }

  selectCommunity(community: Object) {
    this.selectedItem = community;
    this.selectedCommunities = [];
    this.evt.publish('cmtySelected', {community: community});
  }

  selectAllCommunities(selected: boolean) {
    if(selected) {
      this.selectedCommunities = this.communities.map(function(com:any){
        return com.communityId;
      });
    } else {
      this.selectedCommunities = [];
    }
    console.log(selected);
  }

  onCommunitySelectionChanged(event) {
    if(this.selectedCommunities.length == this.communities.length) {
      this.selectAll = true;
    } else {
      this.selectAll = false;
    }
  }


  deleteCommunity(community: any) {
    let me = this;
    this.modelPromise = null;
    this.dataService.openPromptDialog(this.i18n.tr('community.confirmDelete.title'),
      this.i18n.tr('community.confirmDelete.message', {communityName: community.communityName}),
      community, this.i18n.tr('button.delete'), 'modelPromise')
    .then((controller:any) => {
      let model = controller.settings.model;
      // Callback function for submitting the dialog.
      model.submit = (community) => {
        let comm = {
          communityId: community.communityId, 
          communityType: community.communityType
        };
        // Call the delete service.
        let promise = this.communityService.deleteCommunity(comm);
        // model.modelPromise = promise;
        // me.modelPromise = promise;
        return promise.then(data => {
            /*
            let item = me.communities.responseCollection.find(function(obj) {
              return obj.communityId === comm.communityId;
            })
            if(typeof item === 'object') {
              let idx = me.communities.responseCollection.indexOf(item);
              if(idx >= 0) {
                me.communities.responseCollection.splice(idx, 1);
              }
            }
            */
            me.getCommunitiesPage(me.commType, 0, this.pageSize).then(function(){
              me.selectCommunity(me.selectedItem);
            });
            // Close dialog on success.
            controller.ok();
          }, error => {
            model.errorMessage = "Failed"; 
            console.debug("Community delete() rejected."); 
          }).catch(error => {
            model.errorMessage = "Failed"; 
            console.debug("Community delete() failed."); 
            console.debug(error); 
            return Promise.reject(error);
          });
      }
      controller.result.then((response) => {
        if (response.wasCancelled) {
          // Cancel.
          console.debug('Cancel');
        }
      })
    });
  }

  createCommunity() {
    this.editCommunity(null);
  }

  editCommunity(community: any) {
    let me = this;
    let title = '';
    if(community === null) {
      // Create an empty object model for creation.
      community = {};
      title = this.i18n.tr('community.createCommunity');
    } else {
      // Clone the object so we do not edit the live/bound model.
      community = Object.assign({}, community);
      title = this.i18n.tr('community.editCommunity');
    }
    this.dataService.openResourceEditDialog('model/communityModel.html', title, community, this.i18n.tr('button.save'))
    .then((controller:any) => {
      let model = controller.settings.model;
      // Callback function for submitting the dialog.
      model.submit = (community) => {
        let comm = {
          communityId: community.communityId, 
          communityName: community.communityName, 
          communityDescription: community.communityDescription, 
          communityType: community.communityType,
          membershipType: 'DEFINED'
        };
        me.communityService.createCommunity(comm)
          .then(response => response.json())
          .then(data => {
            me.getCommunitiesPage(me.commType, 0, this.pageSize).then(function(){
              if(community === null || typeof community.communityId !== 'string') {
                me.selectedItem = data;
              }
              me.selectCommunity(me.selectedItem);
            });
            // Close dialog on success.
            controller.ok();
          }, error => {
            console.debug("Community create() rejected.");
            model.errorMessage = "Failed"; 
          }).catch(error => {
            console.debug("Community create() failed."); 
            console.debug(error); 
            model.errorMessage = "Failed"; 
            return Promise.reject(error);
          })
      }
      controller.result.then((response) => {
        if (response.wasCancelled) {
          // Cancel.
          console.debug('Cancel');
        }
      })
    });


  }

}

