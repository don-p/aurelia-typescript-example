import {inject, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {Session} from './services/session';
import {AlertsService} from './services/alertsService';
import {Router} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';

@inject(Session, AlertsService, Router, EventAggregator)
export class NavBar {

  avatarUrl: string;
  logger: Logger;

  constructor(private session: Session, private alertsService: AlertsService, private router: Router, private evt: EventAggregator) {
    let me = this;

    this.logger = LogManager.getLogger(this.constructor.name);
  }

  attached() {
    if(this.router.currentInstruction && this.router.currentInstruction.config.route !== '' && this.router.currentInstruction.config.route !== 'login') {
      this.avatarUrl = this.session.auth['member'].secureAvatarUrl;
    }
  }

  get unreadAlertCount(): number {
      return this.session.unreadAlertCount;
  }

}

