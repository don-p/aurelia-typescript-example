import {inject, NewInstance, Lazy, LogManager, Parent} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {AureliaConfiguration} from 'aurelia-configuration';
import {Session} from '../services/session';
import {DataService} from '../services/dataService';
import {CommunityService} from '../services/communityService';
import {Community} from './community';
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

@inject(Session, DataService, CommunityService, EventAggregator, I18N, 
  AureliaConfiguration, Utils, Parent.of(Community), MemberActionsBarCustomElement, Validator, NewInstance.of(ValidationController), LogManager)
export class Communities {
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
  selectedCommunities: Array<Object>;
  selectAll: boolean;

  router: Router;

  logger: Logger;

  constructor(private session: Session, private dataService: DataService, 
    private communityService: CommunityService, private evt: EventAggregator, 
    private i18n: I18N, private appConfig: AureliaConfiguration, private utils: Utils, private parent: Community, private memberActions: MemberActionsBarCustomElement, private validator:Validator) {

    // var Ps = require('perfect-scrollbar');

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
    this.commType = 'TEAM';
    this.getCommunitiesPage(this.commType, 0, this.pageSizeList).then(function(){
      me.selectDefaultCommunity();
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
  getCommunitiesPage(communityType: string, startIndex: number, pageSize: number): Promise<Response> {
    var me = this;
    var cmtysPromise = this.communityService.getCommunities(communityType, startIndex,  pageSize);
    this.cmtysPromise = cmtysPromise;
    return cmtysPromise
    .then(response => {return response.json()
      .then(data => {
        me.communities = data.responseCollection;
        return data.responseCollection;
        // return Promise.resolve(data.responseCollection);
        // me.logger.debug('cmtyPromise resolved: ' + JSON.stringify(data));
      }).catch(error => {
        me.logger.error('Communities list() failed in response.json(). Error: ' + error); 
        return Promise.reject(error);
      })
    })
    .catch(error => {
      me.logger.error('Communities list() failed in then(response). Error: ' + error); 
      me.logger.error(error); 
      //throw error;
      return Promise.reject(error);
    });
    // return cmtysPromise;

  }

  selectCommunityType(communityType:string, selectedCommunity:Object) {
    let me = this;
    if(this.commType !== communityType) {
      this.commType = communityType;
    }
    this.getCommunitiesPage(communityType, 0, this.pageSizeList).then(function(){
      if(typeof selectedCommunity !== 'object') {
        me.selectDefaultCommunity();
        me.selectedCommunities = [];
      } else {
        me.scrollToCommunityInList(selectedCommunity);
      }
      // me.evt.publish('cmtySelected', {community: selectedCommunity});      
      me.onCommunitySelectionChanged(null);
    })
  }

  selectDefaultCommunity() {
    if(this.communities && this.communities.length > 0) {
      this.selectCommunity(this.communities[0]);
    }
  }

  selectCommunity(community: Object) {
    // Find the community object in the collection.
    let selectedCommunity =  this.communities.find(function(comm: Object){
      return comm['communityId'] === community['communityId'];
    });
    // Select the community item.
    this.selectedItem = !!selectedCommunity?selectedCommunity:community;
    // Ensure correct community type view.
    let type = this.selectedItem['communityType'];
    if(this.commType !== type) {
      this.selectCommunityType(type, this.selectedItem);
    } else {
      this.scrollToCommunityInList(this.selectedItem);
      // this.evt.publish('cmtySelected', {community: this.selectedItem});
    }
    // TODO: move event to prmoise resolved?
    this.evt.publish('cmtySelected', {community: this.selectedItem});
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

  transferOwnershipToCommunityMember(community: any, event: MouseEvent) {
    event.stopPropagation();

    let message = null;
    let membersList = [];
    let me = this;

    let gridOptions = this.utils.getGridOptions('transferOwnership', this.pageSize);
    gridOptions.rowSelection = 'single';
    gridOptions.suppressRowClickSelection = false;
    gridOptions['communityId'] = community.communityId;

    this.dataService.openResourceEditDialog({modelView:'model/communityMembersListModel.html', 
      title:this.i18n.tr('community.communities.members.transferOwnership.title'), loadingTitle: 'app.loading',
      item:membersList, okText:this.i18n.tr('button.save'), showErrors:false, validationRules:null})
    .then((controller:any) => {
      controller.viewModel.communityId = community['communityId'];
      controller.viewModel.$isDirty = false;
      Object.defineProperty(controller.viewModel, 'isDirty', {
        get: function() {
          return this.$isDirty;
        }
      });
      
      // Ensure there is no focused element that could be submitted, since dialog has no focused form elements.
      let activeElement = <HTMLElement> document.activeElement;
      activeElement.blur();

      let model = controller.settings;
      model.isSubmitDisabled = true;
      gridOptions.onSelectionChanged = function() {
        let rows = gridOptions.api.getSelectedRows();
        controller.viewModel.selectedMembers = rows;
        controller.viewModel.$isDirty = true;
        controller.viewModel.isSubmitDisabled = rows.length === 0;
      };
      gridOptions.getRowNodeId = function(item) {
        return item.memberId.toString();
      };
      let transferOwnershipGrid = new Grid(controller.viewModel.addCmtyMembersGrid, gridOptions); //create a new grid
      gridOptions['api'].sizeColumnsToFit();
      me.utils.setCommunityMembersGridDataSource('transferOwnershipGrid', gridOptions, me.pageSize, me.communityService, null, false);

      
      // controller.isGridFiltered = Object.defineProperty(controller, 'isGridFiltered', {get: function() {
      //   window.console.debug('--- isGridFiltered ---');
      //     return controller.viewModel.gridOptions && controller.viewModel.gridOptions.api && controller.viewModel.gridOptions.api.isAnyFilterPresent();
      //   }
      // });
      controller.viewModel.clearGridFilters = me.utils.clearGridFilters;
      // controller.viewModel.organizations = me.organizations;
      // controller.viewModel.communityMembers = me.communityMembers;
      // controller.viewModel.setOrganizationMembersGridDataSource = me.setOrganizationMembersGridDataSource;
      controller.viewModel.gridOptions = gridOptions;
      // let organizationId = me.organizations[0]['organizationId'];
      // gridOptions['organizationId'] = organizationId;

      // Get list of members in a selected organization.
      // controller.viewModel.selectOrganization = function(event: any) {
      //   if(this.selectedOrganization !== event.target.value) {
      //     this.selectedOrganization = event.target.value;
      //     gridOptions['organizationId'] = this.selectedOrganization;
      //     this.setOrganizationMembersGridDataSource(gridOptions, me.pageSizeList, me.organizationService, this.selectedOrganization);
      //   }
      // }


      // Callback function for submitting the dialog.
      controller.viewModel.submit = () => {
        let selection = gridOptions.api.getSelectedRows();
        let memberId = selection[0].memberId;

        // Call the addMembers service.
        let modelPromise = this.communityService.transferOwnership(controller.viewModel.communityId, memberId);
        controller.viewModel.modelPromise = modelPromise;        
        modelPromise
        // .then(response => response.json())
        .then(data => {

            // me.gridOptions.api.refreshVirtualPageCache();
            // me.gridOptions.api.refreshView();
            // me.gridOptions.api.deselectAll();

            // // update the community member count.
            // me.selectedCmty.memberCount = data['totalCount'];

            // Close dialog on success.
            gridOptions.api.destroy();

            controller.viewModel.showCancel = false;
            controller.viewModel.okText = 'Done';
            controller.viewModel.status = 'OK';
            delete controller.viewModel.submit;

            //controller.ok();
          }, error => {
            model.errorMessage = "Failed"; 
            me.logger.error("Community member delete() rejected."); 
          }).catch(error => {
            model.errorMessage = "Failed"; 
            me.logger.error("Community member delete() failed."); 
            me.logger.error(error); 
            return Promise.reject(error);
          }) 
      };

      controller.result.then((response) => {
        if (response.wasCancelled) {
          // Cancel.
          gridOptions.api.destroy();
          this.logger.debug('Cancel');
        }
      })
    });
    
  }


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
/* TODO      
      me.validator.validateObject(community).then(function(result) {
        controller.viewModel.vResults = result;
      })    

      controller.clearError = () => {
        let me = this;
        controller.viewModel.vResults = [];
        controller.viewModel.vController.validate();
      };

*/
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

  makeCallCommunity() {
    // let maxParticipants = this.appConfig.get('api.serverUrl');
    let maxParticipants = 2;
    let message = null;
    var me = this;
    let communities = this.selectedCommunities;
    // let maxParticipants = ;

    if(communities.length === 1) {
      message = this.i18n.tr('community.communities.call.callConfirmMessageSingle', 
          {communityName: communities[0]['communityName']});
    } else if(communities.length >= 1) {
      message = this.i18n.tr('community.communities.call.callConfirmMessage',
          {communityCount: communities.length});
    }
    const vRules = ValidationRules
      .ensure('item').maxItems(maxParticipants).withMessage(this.i18n.tr('community.communities.call.callParticipantMaxCountError', {count:maxParticipants}))
      .rules;

    this.dataService.openPromptDialog(this.i18n.tr('community.communities.call.title'),
      message,
      communities, this.i18n.tr('button.call'), true, null, 'modelPromise', '')
    .then((controller:any) => {
      let model = controller.settings;
      // Callback function for submitting the dialog.
      controller.viewModel.submit = (communityMembers) => {
        let memberIDs = communityMembers.map(function(value) {
          return {
            "participantId": value.memberId,
            "participantType": "MEMBER"
          }
        });
        // Call the service to start the call.
        controller.viewModel.modelPromise = this.communityService.startConferenceCall({participantRef:memberIDs})
        .then(response => response.json())
        .then(data => {
            // Update the message for success.
            controller.viewModel.model.message = this.i18n.tr('community.communities.members.call.callSuccessMessage');
            controller.viewModel.model.okText = this.i18n.tr('button.ok');
            controller.viewModel.model.showCancel = false;
            // Close dialog on success.
            delete model.submit;
          }, error => {
            model.errorMessage = "Failed"; 
            me.logger.error("Community member call() rejected."); 
          }).catch(error => {
            model.errorMessage = "Failed"; 
            me.logger.error("Community member call() failed."); 
            me.logger.error(error); 
            return Promise.reject(error);
          })
      };
      controller.result.then((response) => {
        if (response.wasCancelled) {
          // Cancel.
          this.logger.debug('Cancel');
        }
      })
    });
  }

}

