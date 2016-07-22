import {inject, Lazy} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {Session} from './services/session';
import {AppConfig} from './services/appConfig';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(Lazy.of(HttpClient), Session, Router, AppConfig)
export class CommunityDetail {
  member: Object;

  http: HttpClient;
  session: Session;
  router: Router;
  appConfig: AppConfig;
  navigationInstruction: NavigationInstruction;
  selectedCommunityMembers: Array<Object>;

  constructor(private getHttpClient: () => HttpClient, session, router, appConfig) {
    this.session = session;
    this.router = router;
    this.appConfig = appConfig;
    this.selectedCommunityMembers = null;
  }

  activate(params, navigationInstruction) {
    this.navigationInstruction = navigationInstruction;
    this.selectedCommunityMembers = params;
  }



}

