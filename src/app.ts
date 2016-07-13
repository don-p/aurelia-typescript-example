import {Aurelia, inject} from 'aurelia-framework';
import {Router, RouterConfiguration} from 'aurelia-router';
import {Session} from './session';
// import * as I18N from 'aurelia-i18n';
//import * as Backend from 'i18next-xhr-backend';

@inject(Session)
export class App {
  router: Router;
  session: Session;

  constructor(session) {
    this.session = session;
    this.session.auth['isLoggedIn'] = false;
   }

  configureRouter(config: RouterConfiguration, router: Router) {
    config.title = 'Grid Command';
    config.map([
      { route: ['', 'login'], name: 'login',      moduleId: './login',      nav: false, title: 'Login' },
      { route: 'login-2', name: 'login-2',      moduleId: './login',      nav: false, title: 'Confirm Login' },
      { route: 'community', name: 'community',      moduleId: './community',      nav: true, title: 'Community' },
      { route: 'alerts',         name: 'alerts',        moduleId: './alerts',        nav: true, title: 'Alerts' },
      { route: 'child-router',  name: 'child-router', moduleId: './child-router', nav: true, title: 'Child Router' }
    ]);

    this.router = router;
  }
}
