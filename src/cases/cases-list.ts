import {inject, NewInstance, Lazy, LogManager, Parent} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {AureliaConfiguration} from 'aurelia-configuration';
import {Session} from '../services/session';
import {DataService} from '../services/dataService';
import {CaseService} from '../services/caseService';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
// import * as Ps from 'perfect-scrollbar';
import {ValidationRules, ValidationController, Validator} from 'aurelia-validation';
import {CommunityResource} from '../model/communityResource';
import {Grid, GridOptions, Column, TextFilter} from 'ag-grid/main';
import {Utils} from '../services/util';
import {MemberActionsBarCustomElement} from '../components/member-actions-bar';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(Session, DataService, CaseService, EventAggregator, I18N, 
  AureliaConfiguration, Utils, MemberActionsBarCustomElement, Validator, NewInstance.of(ValidationController), LogManager)
export class CasesList {
  communities: Array<Object>;
  items:Array<Object>;
  commType: string;
  pageSizeList: number;
  pageSize: number;
  cmtysPromise: Promise<Response>;
  modelPromise: Promise<void>;
  ps: any;

  //parent: any;
  navigationInstruction: NavigationInstruction;
  selectedItem: Object;
  selectedCases: Array<Object>;
  selectAll: boolean;
  cases: Array<any>;
  casesPromise: Promise<Response>;

  router: Router;

  logger: Logger;

  constructor(private session: Session, private dataService: DataService, 
    private caseService: CaseService, private evt: EventAggregator, 
    private i18n: I18N, private appConfig: AureliaConfiguration, private utils: Utils, private memberActions: MemberActionsBarCustomElement, private validator:Validator) {

    // var Ps = require('perfect-scrollbar');

    this.cases = [];
    this.cases['responseCollection'] = [];
    this.pageSizeList = 500;
    this.pageSize = 200;
    this.selectedItem = null;
    this.selectedCases = [];
    this.logger = LogManager.getLogger(this.constructor.name);
  }

  activate(params, navigationInstruction) {
    this.navigationInstruction = navigationInstruction;
  }

  bind(bindingContext: Object, overrideContext: Object) {
    this.logger.debug("Communities | bind()");
  }

  attached() {
    this.logger.debug("Community | attached()");
/*    
    // Custom scrollbar:
    var container = document.getElementById('community-list');
    this.ps.initialize(container);
    this.ps.update(container);
*/
    let me = this;
    // Get list of organizations the logged-in user has rights to.
    this.getCases(0, 500).then(function(){
      me.selectDefaultCase();
    });

  }
/*
  async getMore(topIndex: number, isAtBottom: boolean, isAtTop: boolean): Promise<void> {
    this.logger.debug('Getting more communities: '+topIndex+' | '+isAtBottom+' | '+isAtTop);
    var me = this;

    if(isAtBottom){
      return this.communityService.getCommunities(this.commType, topIndex, 
        this._virtualRepeat['_viewsLength'] +  this._virtualRepeat['_bottomBufferHeight'])
      .then(response => response.json())
      .then((data: any) => {
        me.logger.debug(data);
  //      this.session=me.session;
        me.communities = 
          me.communities['responseCollection'].splice(topIndex,me.communities['responseCollection'].length - topIndex, data.responseCollection);
        // me.communities = data;
      }).catch(error => {
        me.logger.error("Communities list() failed."); 
        me.logger.error(error); 
      });
    } else if(isAtTop){

    }
  }
*/
  getCases(startIndex: number, pageSize: number): Promise<Response> {
    let me = this;
    let casesPromise = this.caseService.getCases({memberId: this.session.auth.member.memberId, startIndex: startIndex,  pageSize: pageSize});
    return casesPromise
    // .then(response => {return response.json()
      .then(data => {
        me.cases = data.responseCollection;
        return data;
        // me.logger.debug('cmtyPromise resolved: ' + JSON.stringify(data));
      }).catch(error => {
        me.logger.error('Communities list() failed in response.json(). Error: ' + error); 
        return Promise.reject(error);
      })
    // })
    .catch(error => {
      me.logger.error('Communities list() failed in then(response). Error: ' + error); 
      me.logger.error(error); 
      //throw error;
      return Promise.reject(error);
    });
  }  

  selectDefaultCase() {
    if(this.cases && this.cases.length > 0) {
      this.selectCase(this.cases[0]);
    }
  }

  selectCase(_case: any) {
    // Select the community item.
    this.evt.publish('caseSelected', {case: _case});

  }

  scrollToCommunityInList(community:any) {
    let me = this;
    setTimeout(function() {
      // Scroll selected item into view.
      let container = $('#community-list')[0];
      let element = $('#cmty-'+community['communityId'])[0];
      if(typeof element === 'object') {
        me.logger.debug("scrolTo element: " + element);
        let childEl = element.querySelector('div.panel.panel-default');
        let el = $(childEl)[0];
        let elTop = el.offsetTop;
        let elBottom = el.offsetTop + el.offsetHeight;
        let clientTop = container.scrollTop;
        let clientBottom = container.scrollTop + container.clientHeight;
        let scrollVisible = !(($(childEl).position().top >= container.clientHeight) || ($(childEl).position().top < 0));
        // if(!scrollVisible) {
        //   container.scrollTop = $(element).position().top;
        // }
        // let scrollVisible = (elTop >= clientTop && elBottom <= clientBottom);
        if(!scrollVisible) {
          container.scrollTop = element.offsetTop;
        }
      }
    }, 0);
  }
/*
  selectAllCommunities(selected: boolean) {
    if(selected) {
      this.selectedCommunities = this.communities.slice(0);
    } else {
      this.selectedCommunities = [];
    }
  }

  onCommunitySelectionChanged(event) {
    if(this.selectedCommunities.length == this.communities.length) {
      this.selectAll = true;
    } else {
      this.selectAll = false;
    }
  }
*/

/*
  deleteCommunity(community: any, event: MouseEvent) {
    event.stopPropagation();

    let me = this;
    this.modelPromise = null;
    this.dataService.openPromptDialog(this.i18n.tr('community.communities.confirmDelete.title'),
      this.i18n.tr('community.communities.confirmDelete.message', {communityName: community.communityName}),
      community, this.i18n.tr('button.delete'), true, null, 'modelPromise', '')
    .then((controller:any) => {
      let model = controller.settings;
      // Callback function for submitting the dialog.
      controller.viewModel.submit = (community) => {
        let comm = {
          communityId: community.communityId, 
          communityType: community.communityType
        };
        // Call the delete service.
        let modelPromise = this.communityService.deleteCommunity(comm);
        controller.viewModel.modelPromise = modelPromise;        
        return modelPromise.then(data => {
            
            // let item = me.communities.responseCollection.find(function(obj) {
            //   return obj.communityId === comm.communityId;
            // })
            // if(typeof item === 'object') {
            //   let idx = me.communities.responseCollection.indexOf(item);
            //   if(idx >= 0) {
            //     me.communities.responseCollection.splice(idx, 1);
            //   }
            // }
            
            let idx = me.communities.indexOf(community);
            me.getCommunitiesPage(me.commType, 0, this.pageSizeList).then((communitiesResult:any) => {
              // After deleting community, select the next available community.
              if(me.selectedItem['communityId'] === community.communityId) {
                idx = idx===0?0:idx-1;
                let cmty = me.communities[idx];
                me.selectCommunity(cmty);
              } else {
                me.selectDefaultCommunity();
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
            model.errorMessage = "Failed"; 
            me.logger.error("Community delete() rejected."); 
          }).catch(error => {
            model.errorMessage = "Failed"; 
            me.logger.error("Community delete() failed."); 
            me.logger.error(error); 
            return Promise.reject(error);
          });
      }
      // controller.result.then((response) => {
      //   if (response.wasCancelled) {
      //     // Cancel.
      //     this.logger.debug('Cancel');
      //   }
      // })
    });
  }

  createCommunity() {
    this.editCommunity(null, null);
  }

  editCommunity(community: any, event: MouseEvent) {
    if(!!(event)) event.stopPropagation();

    let me = this;
    let title = '';
    if(community === null) {
      // Create an empty or cloned object model for the edit dialog.
      community = new CommunityResource();
      community.communityType = "TEAM";
      title = this.i18n.tr('community.communities.createCommunity');
    } else {
      // Clone the object so we do not edit the live/bound model.
      community = new CommunityResource(community);
      title = this.i18n.tr('community.communities.editCommunity');
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

    this.dataService.openResourceEditDialog({modelView:'model/communityModel.html', title:title, 
      loadingTitle: 'app.loading', item:community, okText:this.i18n.tr('button.save'), validationRules:vRules})
    .then((controller:any) => {

      // let model = controller.settings.model;
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
      }
      // controller.result.then((response) => {
      //   if (response.wasCancelled) {
      //     // Reset validation error state.
      //     this.logger.debug('Cancel');
      //   }
      // })
    });
  }
*/

}

