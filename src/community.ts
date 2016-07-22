import {inject, Lazy} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {Session} from './services/session';
import {AppConfig} from './services/appConfig';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(Lazy.of(HttpClient), Session, Router, AppConfig)
export class Community {
  communities: Array<Object>;

  http: HttpClient;
  session: Session;
  router: Router;
  appConfig: AppConfig;
  navigationInstruction: NavigationInstruction;
  selectedItem: Object;

  constructor(private getHttpClient: () => HttpClient, session, router, appConfig) {
    this.session = session;
    this.router = router;
    this.appConfig = appConfig;
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
    // ensure fetch is polyfilled before we create the http client
    await fetch;
    const http = this.http = this.getHttpClient();
    var  headers = new Object({
      'X-Requested-With': 'Fetch',
      'origin':'*',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    var h = new Headers();
    for (var header in headers) {
      h.append(header, headers[header]);
    }
    http.configure(config => {
      config
        .withBaseUrl(this.appConfig.apiServerUrl.toString())
        /*.withDefaults({headers: h})*/;
    });
    var me = this;
    const response = http.fetch('v1/communities?community_type=COI&start_index=110&page_size=20', {
      method: 'GET',
      headers: h
    }
    )
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
    await fetch;
    const http = this.http = this.getHttpClient();
    var  headers = new Object({
      'X-Requested-With': 'Fetch',
      'origin':'*',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    var h = new Headers();
    for (var header in headers) {
      h.append(header, headers[header]);
    }
    http.configure(config => {
      config
        .withBaseUrl(this.appConfig.apiServerUrl.toString())
        /*.withDefaults({headers: h})*/;
    });
    var me = this;
    const response = http.fetch('v1/communities/' + communityId + '/members?start_index=0&page_size=125', {
      method: 'GET',
      headers: h
    }
    )
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

