import {inject, computedFrom} from 'aurelia-framework';
import {Router, RouterConfiguration} from 'aurelia-router';
import {Session} from './services/session';
import {FetchConfig} from 'aurelia-auth';
import {I18N} from 'aurelia-i18n';
import {EventAggregator} from 'aurelia-event-aggregator';
import {AuthService} from 'aurelia-auth';
import {DataService} from './services/dataService';

@inject(Session, FetchConfig, I18N, EventAggregator, AuthService, DataService)
export class App {
  router: Router;
  session: Session;

  constructor(Session, private fetchConfig: FetchConfig, private i18n: I18N, 
    private evt: EventAggregator, private authService: AuthService, private dataService: DataService) {
    this.session = Session;

 
    let auth = this.authService['auth'].storage.get('auth');
    if(typeof auth === 'string') {
      auth = JSON.parse(auth);
      auth['access_token'] = this.authService['auth'].getToken();
      this.session.auth = auth;
      this.session.auth['isLoggedIn'] = true;
    } else {
      this.session.auth['isLoggedIn'] = false;      
    }
    
    // Subscribe to request/response errors.
    this.evt.subscribe('responseError', payload => {
       this.handleResponseError(payload);
    });    
 }

//  @computedFrom('this.session.auth')
  get fullName(): string {
    let fn = this.session.auth['member'].firstName + ' ' + this.session.auth['member'].lastName;
    return fn;
  }


  handleResponseError(response) {
    switch (response.status) {
      // case 400:
      //   console.log("ResponseError: 400 Unauth");
      //   this.router.navigateToRoute('login', {errorMessage: 'error.badCredentials'});
      //   break;
      case 401:
        console.log("handler - ResponseError: 401 Unauthorized");
        if((this.session.auth['access_token'] && !(this.authService.isAuthenticated()))) {
          let messageKey = 'error.badCredentials';
          messageKey = 'error.sessionExpired';
          this.router.navigateToRoute('login', {errorMessage: messageKey});
        }
        break;
      case 500:
        console.log("handler - ResponseError: 500 Server");
        console.error(response);
        this.router.navigateToRoute('login', {errorMessage: 'error.serverNotAvailable'});
        break;
      // default:
      //   console.log("ResponseError");
      //   console.error(response);
      //   this.router.navigateToRoute('login', {errorMessage: 'error.unknown'});
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
      // },
      // { 
      //   route: 'child-router', name: 'child-router', moduleId: './child-router', nav: true, title: 'Child Router' 
      }
    ]);

    this.router = router;
  }

//
// Top-level/global-scope functions
//
  async logout(): Promise<void> {

    var me = this;

    return this.dataService.logout(this.session.auth['access_token'])
  //  .then(response => response.json())
    .then(data => {
      console.log(data);
      me.authService['auth'].storage.remove(me.authService['tokenName']);
      me.authService['auth'].storage.remove('auth');
      if(data && data!==null) {
        me.router.navigateToRoute('login');
      } else {
        throw "Logout(): Authentication failed."
      }
    }).catch(error => {
      // me.errorMessage = this.utils.parseFetchError('');
      console.log("Logout failed."); 
      console.log(error); 
      me.router.navigateToRoute('login');
    });
  }


}
