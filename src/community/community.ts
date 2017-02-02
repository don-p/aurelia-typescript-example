import {inject, NewInstance, Lazy, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {Router} from 'aurelia-router';
import {Session} from '../services/session';
import {I18N} from 'aurelia-i18n';

@inject(Session, I18N, LogManager)
export class Community {

  router: Router;

  logger: Logger;

  constructor(private session: Session, private i18n: I18N) {

    this.logger = LogManager.getLogger(this.constructor.name);
  }

  // Child router for subtabs - Community, Discover, Connections.
  configureRouter(config, router) {
    config.map([
      { route: '', redirect: 'communities', nav: false},
      { route: 'communities', name: 'community/communities', moduleId: './communities', nav: true, title: this.i18n.tr('router.nav.communities') },
      { route: 'discover', name: 'community/discover', moduleId: './discover', nav: true, title: this.i18n.tr('router.nav.discover') }//,
      // { route: 'connections', name: 'connections', moduleId: './community/connections', nav: true, title: 'Connections' }
    ]);
    this.router = router;
  }

  bind(bindingContext: Object, overrideContext: Object) {
    this.logger.debug("Community | bind()");
  }

}

