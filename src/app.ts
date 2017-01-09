import {inject, computedFrom, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {Router, RouterConfiguration, NavigationInstruction, Next, Redirect} from 'aurelia-router';
import {Session} from './services/session';
import {FetchConfig} from 'aurelia-auth';
import {AureliaConfiguration} from 'aurelia-configuration';
import {I18N} from 'aurelia-i18n';
import {EventAggregator} from 'aurelia-event-aggregator';
import {AuthService} from 'aurelia-auth';
import {DataService} from './services/dataService';
import {Utils} from './services/util';

@inject(Session, FetchConfig, I18N, EventAggregator, AuthService, DataService, AureliaConfiguration, Router, Utils, LogManager)
export class App {
  session: Session;
  logger: Logger;

  constructor(Session, private fetchConfig: FetchConfig, private i18n: I18N, 
    private evt: EventAggregator, private authService: AuthService, 
    private dataService: DataService, private appConfig:AureliaConfiguration, private router:Router) {
    this.session = Session;
    let me = this;
    // Subscribe to authentication events.
    this.evt.subscribe('authenticated', auth => {
      // Get server config data and merge server config with local.
      me.dataService.getCallServiceConfig()
      .then(response => response.json())
      .then((data) => {
        // Merge configs.
        me.appConfig.merge({server: data});
      })
    });    
    
    // Subscribe to request/response errors.
    this.evt.subscribe('responseError', payload => {
       this.handleResponseError(payload);
    });    
    this.logger = LogManager.getLogger(this.constructor.name);
  }

  created() {
    this.logger.debug('App created');
    // Check for existing cookie/localStorage authentication.
    let auth = this.authService['auth'].storage.get('auth');
    if(typeof auth === 'string') {
      auth = JSON.parse(auth);
      auth['access_token'] = this.authService['auth'].getToken();
      this.session.auth = auth;
      this.session.auth['isLoggedIn'] = true;
      // Send event for successful authentication.
      this.evt.publish('authenticated', auth);
    } else {
      this.session.auth['isLoggedIn'] = false;      
      // let messageKey = 'error.sessionExpired';
      // setTimeout(function() {
      // this.router.navigate('login'/*, {errorMessage: messageKey}*/);

      // }, 0);
      // this.router.navigate('login'/*, {errorMessage: messageKey}*/);
    }
    
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
        this.logger.debug("handler - ResponseError: 401 Unauthorized");
        let messageKey = 'error.badCredentials';
        if((this.session.auth['access_token'] && !(this.authService.isAuthenticated()))) {
          messageKey = 'error.sessionExpired';
          this.router.navigateToRoute('login', {errorMessage: messageKey});
        }
        break;
      case 500:
        this.logger.debug("handler - ResponseError: 500 Server");
        this.logger.error(response);
        this.router.navigateToRoute('login', {errorMessage: 'error.serverNotAvailable'});
        break;
      // default:
      //   console.log("ResponseError");
      //   console.error(response);
      //   this.router.navigateToRoute('login', {errorMessage: 'error.unknown'});
    }

  }

  configureRouter(config: RouterConfiguration, router: Router) {
    let me = this;
    config.title = this.i18n.tr('app.title');
    config.mapUnknownRoutes((instruction: NavigationInstruction) => {
      let user = me.session.auth['member'];
      let route = './community';
      if (user && user['role']) {
        if (user['role'] === 'admin') {
          route = './organization/organization';
        }
      }
      return route;
    });
    config.addAuthorizeStep(AuthenticationStep);
    config.addAuthorizeStep(AuthorizeRolesStep);        
    config.map([
      { 
        route: ['','login'], 
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
        settings: {auth: true, roles: ['user']},
        className: 'ico-location4',   
        title: this.i18n.tr('router.nav.tracker') 
      },
      { 
        route: 'conversations',   
        name: 'conversations',  
        moduleId: './conversations',  
        nav: true,      
        settings: {auth: true, roles: ['user']},
        className: 'ico-bubbles10',   
        title: this.i18n.tr('router.nav.conversations') 
      },
      { 
        route: 'alerts', 
        name: 'alerts', 
        moduleId: './alerts', 
        nav: true, 
        settings: {auth: true, roles: ['user']},
        className: 'ico-bullhorn',   
        title: this.i18n.tr('router.nav.alerts') 
      },
      { 
        route: 'organization',   
        name: 'organization',  
        moduleId: './organization/organization',  
        nav: true,      
        settings: {auth: true, roles: ['admin']},
        className: 'ico-tree7',   
        title: this.i18n.tr('router.nav.organization') 
      },
      { 
        route: 'community',   
        name: 'community',  
        moduleId: './community',  
        nav: true,      
        settings: {auth: true, roles: ['admin']},
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

    return this.dataService.logout()
  //  .then(response => response.json())
    .then(data => {
      me.logger.debug("Logged out");
      me.authService['auth'].storage.remove(me.authService['tokenName']);
      me.authService['auth'].storage.remove('auth');
      if(data && data!==null) {
        me.router.navigateToRoute('login');
      } else {
        throw "Logout(): Authentication failed."
      }
    }).catch(error => {
      // me.errorMessage = this.utils.parseFetchError('');
      me.logger.error("Logout failed."); 
      me.logger.error(error); 
      me.router.navigateToRoute('login');
    });
  }

  handleUnknownRoutes(instruction): string {
    // return default route for role
    let route = './community';
    let user = this.session.auth;
    if (user && user['roles']) {
      if (user['roles'].indexOf('admin') !== -1) {
        route = './organization/organization';
      }
    }
    return route;
  }


}

@inject(Utils)
export class AuthenticationStep {
  constructor(private utils:Utils) {
    this.utils.toString();
  }
  run(navigationInstruction: NavigationInstruction, next: Next): Promise<any> {  
    // Check if authentication is required for the route.
    let needsAuth = navigationInstruction.getAllInstructions().some(i => i.config.settings.auth);
    if(needsAuth) {
      let isLoggedIn = this.utils.isLoggedIn();
      if(!isLoggedIn) {
        return next.cancel(new Redirect('login',{errorMessage:'error.sessionExpired'}));
      }
      return next();
    }
    return next();
  }
}

export class AuthorizeRolesStep {
  run(navigationInstruction: NavigationInstruction, next: Next): Promise<any> {  
    let user = {role: 'admin'};
    let requiredRoles = navigationInstruction.getAllInstructions().map(i => i.config.settings.roles)[0];
    let isUserPermited = requiredRoles? requiredRoles.some(r => r === user.role) : true;
    if(isUserPermited) {
      return next();
    }
    return next.cancel();
  }
}