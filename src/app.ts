import {Aurelia, inject} from 'aurelia-framework';
import {Router, RouterConfiguration} from 'aurelia-router';
import {Session} from './services/session';
import {FetchConfig} from 'aurelia-auth';
import {I18N} from 'aurelia-i18n';
//import '../less/blg.less';
import 'bootstrap/less/bootstrap.less';
import {EventAggregator} from 'aurelia-event-aggregator';

// require('../less/blg.less');

@inject(Session, FetchConfig, I18N, EventAggregator)
export class App {
  router: Router;

  constructor(private session: Session, private fetchConfig: FetchConfig, private i18n: I18N, private evt: EventAggregator) {
    this.session.auth['isLoggedIn'] = false;

    // Subscribe to request/response errors.
    this.evt.subscribe('responseError', payload => {
       this.handleResponseError(payload);
    });
    
 }

  activate(){
   this.fetchConfig.configure();
    
  }

  handleResponseError(response) {
    switch (response.status) {
      case 401:
        console.log("ResponseError: 401 Unauth");
        this.router.navigateToRoute('login', {errorMessage: 'error.sessionExpired'});
        break;
      default:
        console.log("No ResponseError");
    }

  }

  configureRouter(config: RouterConfiguration, router: Router) {
    config.title = this.i18n.tr('app.title');
    config.map([
      { 
        route: ['', 'login'], 
        name: 'login',      
        moduleId: './login',      
        nav: false,
        errorMessage:'',
        title: this.i18n.tr('router.nav.login') 
      },
      { 
        route: 'login-2',     
        name: 'login-2',    
        moduleId: './login',      
        nav: false,     
        title: this.i18n.tr('router.nav.login2') 
      },
      { 
        route: 'tracker',     
        name: 'tracker',    
        moduleId: './community',  
        nav: true,   
        className: 'ico-location4',   
        title: this.i18n.tr('router.nav.tracker') 
      },
      { 
        route: 'conversations',   
        name: 'conversations',  
        moduleId: './conversations',  
        nav: true,      
        className: 'ico-bubbles10',   
        title: this.i18n.tr('router.nav.conversations') 
      },
      { 
        route: 'alerts', 
        name: 'alerts', 
        moduleId: './alerts', 
        nav: true, 
        className: 'ico-bullhorn',   
        title: this.i18n.tr('router.nav.alerts') 
      },
      { 
        route: 'community',   
        name: 'community',  
        moduleId: './community',  
        nav: true,      
        className: 'ico-users',   
        title: this.i18n.tr('router.nav.community') 
      },
      // { 
      //   route: 'community/:id', 
      //   name: 'community',  
      //   moduleId: './community',  
      //   nav: true,      
      //   className: 'ico-users',   
      //   title: this.i18n.tr('router.nav.community') 
      // },
      { 
        route: 'community/:id/detail', 
        name: 'communityDetail', 
        moduleId: './community-detail', 
        nav: false, 
        title: this.i18n.tr('router.nav.community') 
      },
      { route: 'child-router', name: 'child-router', moduleId: './child-router', nav: true, title: 'Child Router' }
    ]);

    this.router = router;
  }
}
