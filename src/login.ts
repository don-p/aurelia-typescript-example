import {inject, NewInstance, Lazy, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {json} from 'aurelia-fetch-client';
import {Router, NavigationInstruction} from 'aurelia-router';
import {DialogService} from 'aurelia-dialog';
import {I18N} from 'aurelia-i18n';
import {Session} from './services/session';
import {DataService} from './services/dataService';
import {Utils} from './services/util';
import {FetchConfig, AuthService} from 'aurelia-auth';
import {ValidationRules, ValidationController, Rules, validateTrigger, Validator, ValidateResult} from 'aurelia-validation';

// import {Validator} from 'aurelia-validation';
// import {required, email} from 'aurelia-validatejs';


@inject(Session, Router, DataService, Utils, DialogService, I18N, NewInstance.of(ValidationController), AuthService, Validator, LogManager)
export class Login {
//  @required
//  @email
  username: string = '';
//  @required
  password: string = '';
  errorMessage: string;
  errorResult: ValidateResult;
  vResults: ValidateResult[];

  vRules: ValidationRules;

  mfaCode: string;
 
  navigationInstruction: NavigationInstruction;

  headers: {
        'X-Requested-With': 'Fetch',
        'origin':'*',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
  };

  logger: Logger;


  constructor(private session: Session, private router: Router, private dataService: DataService, 
    private utils: Utils, private dialogService: DialogService, private i18n: I18N, private vController:ValidationController, private authService: AuthService, private validator:Validator) {
      
    this.logger = LogManager.getLogger(this.constructor.name);
    const vRules = ValidationRules
      .ensure('username')
      .displayName(this.i18n.tr('login.emailAddr'))
      .required()
      .then()
      .email()
      .then()
      .ensure('password')
      .displayName(this.i18n.tr('login.password'))
      .required()
      .then()
      .minLength(6)
      .rules;
    this.vController.validateTrigger = validateTrigger.manual;
    Rules.set(this, vRules);

  }

  activate(params, routeConfig, navigationInstruction) {
    this.navigationInstruction = navigationInstruction;
    if(Object.keys(params).length !== 0) {
      this.errorMessage = this.utils.parseFetchError(params);
    }
    this.logger.debug(navigationInstruction);
  }

  bind(bindingContext: Object, overrideContext: Object) {
    this.logger.debug('Bind...');
  }

  attached() {
    $('#pw').on('change', function(event) {
      console.log('Got a CHANGE');
    });
    $('#un').on('change', function(event) {
      console.log('Got a CHANGE');
    });
    let me = this;
    this.validator.validateObject(this).then(function(result) {
      me.vResults = result;
    })    
  }

  get hasValidationErrors() {
    return Array.isArray(this.vController.errors) && this.vController.errors.length > 0;
  }

  get validationErrors() {
    return this.vController.errors;
  }

  clearError() {
    this.logger.debug('clearError(): ' + this.errorResult);
    this.vResults = [];
    if(this.errorResult) {
      this.vController.removeError(this.errorResult);
     }
     this.vController.validate();
  }

  async login(): Promise<void> {

    var me = this;
    delete me.errorResult;
    return this.dataService.login(this.username, this.password)
//    .then(response => response.json())
    .then((data:any) => {
      me.logger.debug(data);
      if(data && data!==null) {
        let auth = {};
        auth['refresh_token'] = data.refresh_token;
        auth['member'] = data.member;
        me.session.auth = data;
        // FIXME: temp hard-coded role.
        me.session.auth['member'].role = 'admin';
        // FIXME: temp hard-coded role.
        me.session.auth['isLoggedIn'] = true;
        me.authService['auth'].storage.set('auth', JSON.stringify(auth));
        if(data.mfa.isRequired) {
          me.router.navigateToRoute('login-2');          
        } else {
          // me.router.navigateToRoute('/#', { replace: true });
          me.router.navigateToRoute('organization');
        }
      } else {
        throw "Login(): Authentication failed."
      }
    }).catch(error => {
       me.errorResult = me.vController.addError(this.utils.parseFetchError({errorMessage: me.i18n.tr('error.badCredentials')}), this);
      me.logger.debug("Authentication failed."); 
      me.logger.debug(error); 
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
      // me.router.navigateToRoute('community');
      me.router.navigateToRoute('organization');
    })
    .catch(error => {
      er = error;
      error.json()
      .then(responseError => { 
        me.logger.debug("mfa token failed."); 
        me.logger.debug(er); 
        if(/*er.status === 400 && */responseError.error == 'INCORRECT_PARAMETER') {
          me.errorMessage = me.i18n.tr('error.invalidConfirmationCode');
        } else {
      // DEBUG
          // me.router.navigateToRoute('community');
          me.router.navigateToRoute('organization');
    // DEBUG
        }
      })
    });

    /*
    const response = dataService.loginFactor2()
    ;//.withParams({username:'don.peterkofsky@grid.blue', password: '*Do4495*', grant_type:'password'});
    response.then(data => {
      this.logger.debug(json(data));
      if(!data.ok || data.status===0) {
        this.logger.error("Authentication failed."); 
      } else {
        me.session.auth['isLoggedIn'] = true;
        me.router.navigateToRoute('community');
      }
    }).catch(error => {
      this.logger.error(error); 
    });
    */
  }



}

