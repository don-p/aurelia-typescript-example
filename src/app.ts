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
import {AlertsService} from './services/alertsService';
import {OrganizationService} from './services/organizationService';
import {Utils} from './services/util';
import{RedirectWithParams} from './lib/RedirectWithParams';
import {DialogService, DialogController, DialogCloseResult, DialogOpenResult, DialogCancelResult} from 'aurelia-dialog';
import {WebSocketService} from './services/wsService';
import {AudioService} from './services/audioService';
import {CaseService} from './services/caseService';

@inject(Session, FetchConfig, I18N, EventAggregator, AuthService, DataService, OrganizationService, 
  AureliaConfiguration, Router, DialogService, AlertsService, CaseService, WebSocketService, AudioService, Utils, LogManager)
export class App {
  session: Session;
  logger: Logger;
  configPromise: Promise<any>;

  constructor(Session, private fetchConfig: FetchConfig, private i18n: I18N, 
    private evt: EventAggregator, private authService: AuthService, 
    private dataService: DataService, private organizationService: OrganizationService, 
    private appConfig:AureliaConfiguration, private router:Router, 
    private dialogService: DialogService, private alertsService: AlertsService, private caseService: CaseService,
    private wsService: WebSocketService, private audioService: AudioService) {

    this.session = Session;
    let me = this;
    // Subscribe to authentication events.  Bootstrap other services.
    this.evt.subscribe('authenticated', auth => {
      // Get server config data and merge server config with local.
      let callConfigPromise: Promise<Response> = me.dataService.getCallServiceConfig();
      callConfigPromise.then(function(response) {
        return response.json()
        .then((data) => {
          // Merge configs.
          me.appConfig.merge({server: data});
          me.logger.debug('=== CONFIG callServer ===');
          return data;
        }).catch(error => {
          me.logger.debug('getCallServiceConfig() returned error: ' + error);
        })
      });
      // Open a new WebSocket connection.
      me.wsService.openWsConnection(me.session);
      
      // Get alert categories/types.
      let alertCatsPromise: Promise<Response> =me.dataService.getAlertCategories(0,  10000);
      alertCatsPromise.then(response => {return response.json()
        .then(data => {
          let categories = data.responseCollection;
          // Get alert notification template set.
          return me.organizationService.getOrganizationNotificationTemplates(
            me.session.auth['organization'].organizationId, null
          )
          .then(response => response.json())
          .then((data:any) => {
            let templateCategoryIds = Object.keys(data);
            templateCategoryIds.forEach(function(templateCategoryId) {
              let category = categories.find(function(item) {
                return item.categoryId === templateCategoryId;
              })
              category['categoryTemplates'] = data[templateCategoryId].responseCollection;
            });
            me.appConfig.set('alertCategories', categories);
            me.logger.debug('=== CONFIG appConfig ===');
            return data;
            //me.appConfig.set('alertTemplates', data);
          });
        }).catch(error => {
          me.logger.error('getAlertCategories() failed in response.json(). Error: ' + error); 
          return Promise.reject(error);
        })
      })
      .catch(error => {
        me.logger.error('getAlertCategoriesPage() failed in then(response). Error: ' + error); 
        me.logger.error(error); 
        //throw error;
        return Promise.reject(error);
      });

      // Get Case Management data collections.
      let caseTypesPromise: Promise<Response> = me.caseService.getCaseTypes(me.session.auth.organization.organizationId);
      caseTypesPromise
      .then((data: any) => {
        // Merge configs.
        me.appConfig.merge({server: {case: {types: data.responseCollection}}});
        me.logger.debug('=== CONFIG callServer ===');
        return data;
      }).catch(error => {
        me.logger.debug('getCallServiceConfig() returned error: ' + error);
      })
 
      let casePrioritiesPromise: Promise<Response> = me.caseService.getCasePriorities(me.session.auth.organization.organizationId);
      casePrioritiesPromise
      .then((data: any) => {
        // Merge configs.
        me.appConfig.merge({server: {case: {priorities: data.responseCollection}}});
        me.logger.debug('=== CONFIG callServer ===');
        return data;
      }).catch(error => {
        me.logger.debug('getCallServiceConfig() returned error: ' + error);
      });

      let caseTagsPromise: Promise<Response> = me.caseService.getCaseTags(me.session.auth.organization.organizationId);
      caseTagsPromise
      .then((data: any) => {
        // Merge configs.
        me.appConfig.merge({server: {case: {tags: data.responseCollection}}});
        me.logger.debug('=== CONFIG callServer ===');
        return data;
      }).catch(error => {
        me.logger.debug('getCallServiceConfig() returned error: ' + error);
      });

      me.configPromise = Promise.all(
        [
          callConfigPromise, 
          callConfigPromise , 
          alertCatsPromise,
          caseTypesPromise,
          casePrioritiesPromise,
          caseTagsPromise
        ]
      );
      me.session['configured'] = me.configPromise;
      me.configPromise.then(function(result) {
        me.logger.debug('=== CONFIGURED ===');
        // me.router.navigateToRoute('');
        return true;
      })

      // Subscribe to new alerts.
      me.evt.subscribe('NOTIFICATION_RECEIVED', function(message) {
        me.logger.debug(' || New notification');
        // Play alert sound.
        // me.audioService.playSound(me.audioService.alertSound);
        me.audioService.playSoundCompat(me.audioService.alertSoundAudio);
        me.logger.debug(' || Received new notification');
        // Refresh the alerts count.
        let statusObj = me.alertsService.parseNotificationAckStatusSummary(message.statistics.received);
        me.session.notificationStatus = statusObj;
      });

      // Get current unread alert count.
      let alertCountPromise = me.alertsService.getNotificationsCounts({startIndex: 0, pageSize: me.alertsService.pageSize, memberId: me.session.auth.member.memberId, direction: 'RECEIVED'})
      .then(function(result) {
        let statusObj = me.alertsService.parseNotificationAckStatusSummary(result.received);
        me.session.notificationStatus = statusObj;
      });
      
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
    if(typeof auth === 'string' && this.authService.isAuthenticated()) {
      auth = JSON.parse(auth);
      this.session.auth = auth;
      this.session.auth.isLoggedIn = true;
      // Send event for successful authentication.
      this.evt.publish('authenticated', auth);
    } else {
      this.session.auth.isLoggedIn = false;      
      // let messageKey = 'error.sessionExpired';
      // setTimeout(function() {
      // this.router.navigate('login'/*, {errorMessage: messageKey}*/);

      // }, 0);
      // this.router.navigate('login'/*, {errorMessage: messageKey}*/);
    }
    
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
        if((this.session.auth.access_token && !(this.authService.isAuthenticated()))) {
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
      let user = me.session.auth.member;
      let route = './community';
      if (user && !!(me.session.getRole())) {
        if (me.session.getRole() === 'admin') {
          route = './organization/organization';
        }
      }
      return route;
    });
    config.addAuthorizeStep(ConfigurationStep);
    config.addAuthorizeStep(AuthenticationStep);
    config.addAuthorizeStep(AuthorizeRolesStep);        
    config.map([
      { route: '', redirect: 'organization' }, // default route.
      { 
        route: 'login', 
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
        moduleId: './alerts/alerts', 
        nav: true, 
        settings: {auth: true, roles: ['user', 'admin']},
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
        moduleId: './community/community',  
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
        moduleId: './community/community-detail', 
        nav: false, 
        title: this.i18n.tr('router.nav.community') 
      // },
      // { 
      //   route: 'child-router', name: 'child-router', moduleId: './child-router', nav: true, title: 'Child Router' 
      },
      { 
        route: 'cases',   
        name: 'cases',  
        moduleId: './cases/cases',  
        nav: true,      
        settings: {auth: true, roles: ['admin']},
        className: 'ico-briefcase2',   
        title: this.i18n.tr('router.nav.cases') 
      },
      { 
        route: 'cases/:caseId/tasks/:taskId',   
        name: 'task',  
        moduleId: './cases/task',  
        nav: false,      
        settings: {auth: true, roles: ['admin']},
        className: 'ico-briefcase2',   
        title: this.i18n.tr('router.nav.cases') 
      }
    ]);

    this.router = router;

    // Subscribe to route-change event, to close dialogs:
    this.evt.subscribe('router:navigation:processing', function(event, args) {
      me.logger.debug('== ROUTER EVENT: processing ==');
      me.dialogService.closeAll();
    });
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
      // Delete the local authentication data.
      me.authService['auth'].storage.remove(me.authService['tokenName']);
      me.authService['auth'].storage.remove('auth');
      if(data && data!==null) {
        me.wsService.removeSubscriptions();
        me.wsService.wsConnection.disconnect(function(){
          me.router.navigateToRoute('login');
        });
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
    if (user && !!(this.session.getRole())) {
      if (this.session.getRole().indexOf('admin') !== -1) {
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
        return next.cancel(new RedirectWithParams('login',{errorMessage:'error.sessionExpired'}));
      }
      return next();
    }
    return next();
  }
}

@inject(Session)
export class AuthorizeRolesStep {
  constructor(private session: Session) {

  }
  run(navigationInstruction: NavigationInstruction, next: Next): Promise<any> {  
    let user = {role: 'admin'};
    let requiredRoles = navigationInstruction.getAllInstructions().map(i => i.config.settings.roles)[0];
    let isUserPermited = requiredRoles? requiredRoles.some(r => r === this.session.getRole()) : true;
    if(isUserPermited) {
      return next();
    }
    return next.cancel();
  }
}

@inject(Session)
export class ConfigurationStep {
  constructor(private session: Session) {
    this.session.toString();
  }
  run(navigationInstruction: NavigationInstruction, next: Next): Promise<any> {  
    // Check if app is configured yet.
    let configured = this.session['configured'];
    if(!!(configured)) {
      return configured.then(function(result){
        console.debug("[ROUTER] === CONFIGURED ===");
        return next();
      });
    } else {
      return next();
    }
  }
}

