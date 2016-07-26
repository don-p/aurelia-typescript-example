import {inject, Lazy} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {Session} from './services/session';
import {AppConfig} from './services/appConfig';
import {DataService} from './services/dataService';
import {Messages} from './services/messages';
import {AuthService} from 'aurelia-auth';
import {Validator} from 'aurelia-validation';
import {required, email} from 'aurelia-validatejs';

// const apiServerUrl = 'https://api-dev-scig-blg.bluelinegrid.com/v1/';
// const apiServerUrl = 'http://192.168.119.115:8888/blueline/';
//const apiServerUrl = 'https://api-dev.bluelinegrid.com/';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);


@inject(Lazy.of(HttpClient), Session, Router, AppConfig, DataService, Messages, AuthService)
export class Login {
  heading: string = 'BlueLine Grid Command 2.0';
//  @required
//  @email
  username: string = '';
//  @required
  password: string = '';

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
    private dataService: DataService, private messages: Messages, private auth: AuthService) {
      
  }

  activate(params, navigationInstruction) {
    this.navigationInstruction = navigationInstruction;
    console.log(navigationInstruction);
  }

  bind(bindingContext: Object, overrideContext: Object) {
    console.log('Bind...');
  }

  async login(): Promise<void> {

    var me = this;
    var body = 'username=' + this.username + 
        '&password=' + this.password + 
        '&grant_type=PASSWORD' +
        '&client_id=' + me.appConfig.clientId +
        '&client_secret=' + me.appConfig.clientSecret

    return this.auth.login(body, null)
//    .then(response => response.json())
    .then(data => {
      console.log(json(data));
      me.session.auth = data;
      me.session.auth['isLoggedIn'] = true;
      me.router.navigateToRoute('login-2');
    }).catch(error => {
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


    /*
    const response = dataService.loginFactor2()
    ;//.withParams({username:'don.peterkofsky@grid.blue', password: '*Do4495*', grant_type:'password'});
    response.then(data => {
      console.log(json(data));
      if(!data.ok || data.status===0) {
        console.log("Authentication failed."); 
      } else {
        me.session.auth['isLoggedIn'] = true;
        me.router.navigateToRoute('login2');
      }
    }).catch(error => {
      console.log(error); 
    });
    */
  }



}

