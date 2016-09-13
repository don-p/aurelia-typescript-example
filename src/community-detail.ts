import {inject, Lazy} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {Session} from './services/session';
import {AppConfig} from './services/appConfig';
import {DataService} from './services/dataService';
import {EventAggregator} from 'aurelia-event-aggregator';
import * as Ps from 'perfect-scrollbar'; // SCROLL

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(Lazy.of(HttpClient), Session, Router, AppConfig, DataService, EventAggregator, Ps) // SCROLL
export class CommunityDetail {
  member: Object;

  navigationInstruction: NavigationInstruction;
  selectedCommunityMembers: Array<Object>;
  ps: any; // SCROLL
  
  constructor(private getHttpClient: () => HttpClient, private session: Session, private router: Router, private appConfig: AppConfig, 
    private dataService: DataService, private evt: EventAggregator, Ps) { // SCROLL

    this.selectedCommunityMembers = null;
    this.ps = Ps; // SCROLL

    this.evt.subscribe('cmtySelected', payload => {
      let selectedCmty = payload.cmtyId;
      this.getCommunityMembers(selectedCmty);
    });
  }

  attached(params, navigationInstruction) {
    // this.navigationInstruction = navigationInstruction;
    // this.selectedCommunityMembers = params;

    // Custom scrollbar:
    var container = document.getElementById('community-member-list'); // SCROLL
    this.ps.initialize(container);
    this.ps.update(container);

  }

  bind() {
  }

  
  async getCommunityMembers(communityId: string) : Promise<void> {
    var me = this;
    this.dataService.getCommunity(communityId)
    .then(response => response.json())
    .then(data => {
      console.log(json(data));
//      this.session=me.session;
      me.selectedCommunityMembers = data.responseCollection;
    }).catch(error => {
      console.log("Communities members() failed."); 
      console.log(error); 
    });
  }




}

