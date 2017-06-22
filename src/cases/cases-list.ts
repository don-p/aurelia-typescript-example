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
import {CaseResource} from '../model/caseResource';
import {Grid, GridOptions, Column, TextFilter} from 'ag-grid/main';
import {Utils} from '../services/util';
import {MemberActionsBarCustomElement} from '../components/member-actions-bar';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(Session, DataService, CaseService, EventAggregator, I18N, 
  AureliaConfiguration, Utils, MemberActionsBarCustomElement, Validator, NewInstance.of(ValidationController), LogManager)
export class CasesList {
  pageSizeList: number;
  pageSize: number;
  modelPromise: Promise<void>;
  ps: any;

  //parent: any;
  navigationInstruction: NavigationInstruction;
  selectedItem: Object;
  selectedCases: Array<Object>;
  selectAll: boolean;
  cases: Array<any>;
  casesPromise: Promise<Response>;
  caseId: string;

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

  activate(params, router, instruction) {

    this.logger.debug("Case | activate()");
  }
  bind(bindingContext: any, overrideContext: any) {
    let caseId = overrideContext.parentOverrideContext.bindingContext.caseId;
    if(!!(caseId)) {
      this.caseId = caseId;
    }
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
    // Get list of cases the logged-in user has rights to.
    this.getCases(0, 500).then(function(){
      if(!(me.caseId)) {
        me.selectDefaultCase()
      } else {
        me.selectCase({caseId: me.caseId});
      }
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
    // Find the object in the collection.
    let selectedCase =  this.cases.find(function(cs: Object){
      return cs['caseId'] === _case['caseId'];
    });
    // Select the item.
    this.selectedItem = !!selectedCase?selectedCase:_case;

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
*/
  createCase() {
    this.editCase(null, null);
  }

  editCase(_case: any, event: MouseEvent) {
    if(!!(event)) event.stopPropagation();

    let me = this;

    let title = '';
    if(_case === null) {
      // Create an empty or cloned object model for the edit dialog.
      _case = new CaseResource();
      title = this.i18n.tr('cases.createCase');
      me.openCaseResourceDialog(_case, title, null);
    } else {
      // get the case details.
      let casePromise = this.caseService.getCase(_case.caseId);
      casePromise.then(function(data:any){
        let _case = data;
        // Clone the object so we do not edit the live/bound model.
        _case = new CaseResource(_case);
        title = me.i18n.tr('cases.editCase');
        me.openCaseResourceDialog(_case, title, null);
      });

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

  }

  openCaseResourceDialog(_case, title, vRules) {
    let me = this;

    this.dataService.openResourceEditDialog({modelView:'model/caseModel.html', title:title, 
      loadingTitle: 'app.loading', item:_case, okText:this.i18n.tr('button.save'), validationRules:vRules})
    .then((controller:any) => {

      let types = this.appConfig.get('server.case.types');
      types = types.types;
      controller.viewModel.types = types;

      let priorities = this.appConfig.get('server.case.priorities');
      priorities = priorities.priorities;
      controller.viewModel.priorities = priorities;

      // let model = controller.settings.model;
      let model = controller.settings;

      // On change of case type, get associated attributes.
      controller.viewModel.getCaseAttributes = function(typeId, newCase) {
        me.logger.debug("Edit case getCaseAttributes()");
        let caseAttrPromise = me.caseService.getCaseAttributes(me.session.auth.organization.organizationId, typeId);
        caseAttrPromise.then(function(data) {
          let attrs:Array<any> = _case.caseAttributes;
          let attrsObj = {};
          let caseAttributes = data;
          // Match attrs with data.
          attrs.forEach(function(value) {
            attrsObj[value.attributeKey] = {description: value.description};
          });
          if(!!(caseAttributes)) {
            caseAttributes.forEach(function(value) {
              // For each type-attr, find a value in the case attr obj, and set the data in the type-attr with the value.

            });
          }
          controller.viewModel.caseAttributes = caseAttributes;
        })
      }
      if(!!(_case.type)) {
        controller.viewModel.getCaseAttributes(_case.type.typeId);
      }
      // Callback function for submitting the dialog.
      controller.viewModel.submit = (_case) => {
        me.logger.debug("Edit case submit()");
        // _case.typeId = _case.type.typeId;
        delete _case.type;
        // _case.priorityId = _case.priority.priorityId;
        delete _case.priority;
        let modelPromise = me.caseService.createCase(_case);
        controller.viewModel.modelPromise = modelPromise;        
        modelPromise
        .then(response => response.json())
        .then(data => {
          me.getCases(0, 1000).then(function(){
            me.selectCase(data);
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

  
  deleteCase(_case: CaseResource, event: MouseEvent) {
    event.stopPropagation();

    let me = this;
    let modelPromise = null;
    this.dataService.openPromptDialog(this.i18n.tr('cases.confirmDelete.title'),
      this.i18n.tr('cases.confirmDelete.message', {caseId: _case.caseId}),
      _case, this.i18n.tr('button.delete'), true, null, 'modelPromise', '')
    .then((controller:any) => {
      let model = controller.settings;
      // Callback function for submitting the dialog.
      controller.viewModel.submit = (task) => {
        // Call the delete service.
        // let modelPromise = ;
        let casePromise = this.caseService.deleteCase(_case);
        controller.viewModel.modelPromise = casePromise;        
        casePromise.then(data => {
          me.getCases(0, 1000).then(function(){
            me.selectDefaultCase();
          });
          // Close dialog on success.
          controller.ok();
        }, error => {
          model.errorMessage = "Failed"; 
          me.logger.error("Task delete() rejected."); 
        }).catch(error => {
          model.errorMessage = "Failed"; 
          me.logger.error("Task delete() failed."); 
          me.logger.error(error); 
          return Promise.reject(error);
        });
        return casePromise;        
      }
      // controller.result.then((response) => {
      //   if (response.wasCancelled) {
      //     // Cancel.
      //     this.logger.debug('Cancel');
      //   }
      // })
    });
  }
  

}

