import {inject, Lazy} from 'aurelia-framework';
import {json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {DialogService} from 'aurelia-dialog';
import {I18N} from 'aurelia-i18n';
import {Session} from './services/session';
import {AppConfig} from './services/appConfig';
import {DataService} from './services/dataService';
import {Utils} from './services/util';
import {FetchConfig, AuthService} from 'aurelia-auth';

// import {Validator} from 'aurelia-validation';
// import {required, email} from 'aurelia-validatejs';


@inject(Session, Router, AppConfig, DataService, Utils, DialogService, I18N, AuthService)
export class Login {
  heading: string = 'BlueLine Grid Command 2.0';
//  @required
//  @email
  username: string = '';
//  @required
  password: string = '';
  errorMessage: string;

  mfaCode: string;
 
  navigationInstruction: NavigationInstruction;

  headers: {
        'X-Requested-With': 'Fetch',
        'origin':'*',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
  };

  constructor(private session: Session, private router: Router, private appConfig: AppConfig, 
    private dataService: DataService, private utils: Utils, private dialogService: DialogService, private i18n: I18N, private authService: AuthService) {
      
  }

  activate(params, routeConfig, navigationInstruction) {
    this.navigationInstruction = navigationInstruction;
    if(Object.keys(params).length !== 0) {
      this.errorMessage = this.utils.parseFetchError(params);
    }
    console.log(navigationInstruction);
  }

  bind(bindingContext: Object, overrideContext: Object) {
    console.log('Bind...');
  }

  async login(): Promise<void> {

    var me = this;

    return this.dataService.login(this.username, this.password)
//    .then(response => response.json())
    .then((data:any) => {
      console.log(json(data));
      if(data && data!==null) {
        let auth = {};
        auth['refresh_token'] = data.refresh_token;
        auth['member'] = data.member;
        me.session.auth = data;
        me.session.auth['isLoggedIn'] = true;
        me.authService['auth'].storage.set('auth', JSON.stringify(auth));
        this.errorMessage = '';
        if(data.mfa.isRequired) {
          me.router.navigateToRoute('login-2');          
        } else {
          me.router.navigateToRoute('community');
        }
      } else {
        throw "Login(): Authentication failed."
      }
    }).catch(error => {
      // me.errorMessage = this.utils.parseFetchError('');
      console.log("Authentication failed."); 
      console.log(error); 
    });
  }

async loginConfirm(token): Promise<void> {
    // ensure fetch is polyfilled before we create the http client
    var me = this;
    var er = null;

    var mfaPromise = this.dataService.loginFactor2(token);
    mfaPromise
    // .then(response => response.json())
    .then(data => {
      // Successfully validated confirmation code.
      me.router.navigateToRoute('community');
    })
    .catch(error => {
      er = error;
      error.json()
      .then(responseError => { 
        console.log("mfa token failed."); 
        console.log(er); 
        if(/*er.status === 400 && */responseError.error == 'INCORRECT_PARAMETER') {
          me.errorMessage = me.i18n.tr('error.invalidConfirmationCode');
        } else {
      // DEBUG
          me.router.navigateToRoute('community');
    // DEBUG
        }
      })
    });

    /*
    const response = dataService.loginFactor2()
    ;//.withParams({username:'don.peterkofsky@grid.blue', password: '*Do4495*', grant_type:'password'});
    response.then(data => {
      console.log(json(data));
      if(!data.ok || data.status===0) {
        console.log("Authentication failed."); 
      } else {
        me.session.auth['isLoggedIn'] = true;
        me.router.navigateToRoute('community');
      }
    }).catch(error => {
      console.log(error); 
    });
    */
  }



}

