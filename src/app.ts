import {Aurelia, inject} from 'aurelia-framework';
import {Router, RouterConfiguration} from 'aurelia-router';
import {Session} from './services/session';
import {Messages} from './services/messages';
import {FetchConfig} from 'aurelia-auth';
// import * as I18N from 'aurelia-i18n';
//import * as Backend from 'i18next-xhr-backend';

@inject(Session, Messages, FetchConfig)
export class App {
  router: Router;
  session: Session;
  messages: Messages;
  fetchConfig: FetchConfig;

  constructor(session, messages, fetchConfig) {
    this.session = session;
    this.session.auth['isLoggedIn'] = false;
    this.messages = messages;
    this.fetchConfig = fetchConfig;
 }

  activate(){
    this.fetchConfig.configure();
  }

  configureRouter(config: RouterConfiguration, router: Router) {
    config.title = this.messages.getMessage('app.title');
    config.map([
      { 
        route: ['', 'login'], 
        name: 'login',      
        moduleId: './login',      
        nav: false,     
        title: this.messages.getMessage('router.nav.login') 
      },
      { 
        route: 'login-2',     
        name: 'login-2',    
        moduleId: './login',      
        nav: false,     
        title: this.messages.getMessage('router.nav.login2') 
      },
      { 
        route: 'tracker',     
        name: 'tracker',    
        moduleId: './community',  
        nav: true,   
        className: 'ico-location4',   
        title: this.messages.getMessage('router.nav.tracker') 
      },
      { 
        route: 'conversations',   
        name: 'conversations',  
        moduleId: './conversations',  
        nav: true,      
        className: 'ico-bubbles10',   
        title: this.messages.getMessage('router.nav.conversations') 
      },
      { 
        route: 'alerts', 
        name: 'alerts', 
        moduleId: './alerts', 
        nav: true, 
        className: 'ico-bullhorn',   
        title: this.messages.getMessage('router.nav.alerts') 
      },
      { 
        route: 'community',   
        name: 'community',  
        moduleId: './community',  
        nav: true,      
        className: 'ico-users',   
        title: this.messages.getMessage('router.nav.community') 
      },
      { 
        route: 'community/:id/detail', 
        name: 'communityDetail', 
        moduleId: './community-detail', 
        nav: false, 
        title: this.messages.getMessage('router.nav.community') 
      },
      { route: 'child-router', name: 'child-router', moduleId: './child-router', nav: true, title: 'Child Router' }
    ]);

    this.router = router;
  }
}
