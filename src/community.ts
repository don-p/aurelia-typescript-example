import {inject, Lazy} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {Session} from './services/session';
import {DataService} from './services/dataService';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(Lazy.of(HttpClient), Session, Router, DataService)
export class Community {
  communities: Array<Object>;

  navigationInstruction: NavigationInstruction;
  selectedItem: Object;

  constructor(private getHttpClient: () => HttpClient, private session: Session, private router: Router, private dataService: DataService) {
    this.selectedItem = null;
  }

  activate(params, navigationInstruction) {
    this.navigationInstruction = navigationInstruction;
    this.listCommunities();
  }

/**
 * Get communities for logged-in user.
 */
  async listCommunities(): Promise<void> {
    var me = this;

    this.dataService.getCommunities()
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

  async getCommunityMembers(communityId: string) : Promise<void> {
    var me = this;

    this.dataService.getCommunity(communityId)
    .then(response => response.json())
    .then(data => {
      console.log(json(data));
//      this.session=me.session;
      me.selectedItem = data.responseCollection;
    }).catch(error => {
      console.log("Communities members() failed."); 
      console.log(error); 
    });
  }


}

