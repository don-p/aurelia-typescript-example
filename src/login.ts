import {inject, Lazy} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction, activationStrategy} from 'aurelia-router';
import {DialogService} from 'aurelia-dialog';
import {Session} from './services/session';
import {AppConfig} from './services/appConfig';
import {DataService} from './services/dataService';
import {Utils} from './services/util';

// import {Validator} from 'aurelia-validation';
// import {required, email} from 'aurelia-validatejs';


@inject(Lazy.of(HttpClient), Session, Router, AppConfig, DataService, Utils, activationStrategy, DialogService)
export class Login {
  heading: string = 'BlueLine Grid Command 2.0';
//  @required
//  @email
  username: string = '';
//  @required
  password: string = '';
  errorMessage: string;

  code: string;
 
  http: HttpClient;
  navigationInstruction: NavigationInstruction;

  headers: {
        'X-Requested-With': 'Fetch',
        'origin':'*',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
  };

  constructor(private getHttpClient: () => HttpClient, private session: Session, private router: Router, private appConfig: AppConfig, 
    private dataService: DataService, private utils: Utils, private dialogService: DialogService) {
      
  }

  determineActivationStrategy(){
    return 'invoke-lifecycle';
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
    .then(data => {
      console.log(json(data));
      if(data && data!==null) {
        me.session.auth = data;
        me.session.auth['isLoggedIn'] = true;
        this.errorMessage = '';
        me.router.navigateToRoute('login-2');
      } else {
        throw "Login(): Authentication failed."
      }
    }).catch(error => {
      // me.errorMessage = this.utils.parseFetchError('');
      console.log("Authentication failed."); 
      console.log(error); 
    });
  }

async loginConfirm(): Promise<void> {
    // ensure fetch is polyfilled before we create the http client
    var code = this.code;
    await fetch;
    const http = this.http = this.getHttpClient();
    var  headers = new Object({
      'TestHEader': 'Testing',
      'X-Requested-With': 'Fetch',
      'origin':'*',
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    var h = new Headers();
    for (var header in headers) {
      h.append(header, headers[header]);
    }
    http.configure(config => {
      config
        .withBaseUrl(this.appConfig.apiServerUrl.toString())
        /*.withDefaults({headers: h})*/;
    });
    var me = this;
    // DEBUG
        me.router.navigateToRoute('community');
   // DEBUG


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

