import {inject, NewInstance, Lazy, LogManager} from 'aurelia-framework';
import {Session} from './services/session';
import {Router, NavigationInstruction} from 'aurelia-router';

@inject(Session, Router)
export class NavBar {

  avatarUrl: string;

  constructor(private session: Session, private router: Router) {
      
  }

  activate(params, routeConfig, navigationInstruction) {
    if(this.router.currentInstruction && this.router.currentInstruction.config.route !== '' && this.router.currentInstruction.config.route !== 'login') {
      this.avatarUrl = this.session.auth['member'].secureAvatarUrl;
    }
  }



}

