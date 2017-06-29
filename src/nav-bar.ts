import {inject, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {Session} from './services/session';
import {AlertsService} from './services/alertsService';
import {Router} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';
import {AureliaConfiguration} from 'aurelia-configuration';

@inject(Session, AlertsService, Router, EventAggregator, AureliaConfiguration)
export class NavBar {

  avatarUrl: string;
  logger: Logger;
  showCaseMgmt: boolean;

  constructor(private session: Session, private alertsService: AlertsService, 
    private router: Router, private evt: EventAggregator, private appConfig: AureliaConfiguration) {
    let me = this;

    this.showCaseMgmt = this.appConfig.get('showCaseMgmt');
    this.logger = LogManager.getLogger(this.constructor.name);
  }

  attached() {
    if(this.router.currentInstruction && this.router.currentInstruction.config.route !== '' && this.router.currentInstruction.config.route !== 'login') {
      this.avatarUrl = this.session.auth.member.secureAvatarUrl;
    }
  }

  get unreadAlertCount(): number {
      return this.session.unreadAlertCount;
  }

  hasRole(roles: Array<string>): boolean {

    
    if(!(roles) || (roles.length === 0)) {
      return true;
    }

    let memberRoles = this.session.getRoles();
    if(!(memberRoles) || (memberRoles.length === 0)) {
      return true;
    }

    let hasRole = false;

    let rolesObj = roles.reduce(function(ac, curVal) {
      ac[curVal] = null;
      return ac;
    }, {});
    
    for(let i = 0; i < memberRoles.length; i++) {
      let role = memberRoles[i];
      let has = rolesObj.hasOwnProperty(role);
      if(has) {
        hasRole = true;
        break;
      }
    }
    return hasRole;
  }

}

