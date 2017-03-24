import {inject, Lazy, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {HttpClient, json} from 'aurelia-fetch-client';
import {HttpClient as Http} from 'aurelia-http-client';
import {AureliaConfiguration} from "aurelia-configuration";
import {Session} from './session';
import {EventAggregator} from 'aurelia-event-aggregator';
import {FetchConfig, AuthService} from 'aurelia-auth';
import {DialogService, DialogController, DialogResult} from 'aurelia-dialog';
import {Model} from '../model/model';
import {WizardController} from '../lib/aurelia-easywizard/controller/wizard-controller';
// import {HttpConfig} from '../lib/auth/auth-http-config';

import {Prompt} from '../model/prompt';
import 'bootstrap-sass';
import * as QueryString from 'query-string';

@inject(Lazy.of(HttpClient), Http, AureliaConfiguration, EventAggregator, AuthService, FetchConfig/*, HttpConfig*/, DialogService, Session, QueryString, LogManager)
export class DataService {  

    // Service object for retreiving application data from REST services.
    
    apiServerUrl: string;
    clientId: string;
    clientSecret: string;
    httpClient: HttpClient;
    // Filter and sort criteria operator mapping.
    static gridSortCriteria: Object = {
        asc:'ASC',
        desc:'DESC'
    };
    static gridFilterCriteria: Object = {
        contains:'LIKE'
    };

    logger: Logger;

    constructor(private getHttpClient: () => HttpClient, private httpBase: Http, private appConfig: AureliaConfiguration, 
        private evt: EventAggregator, private auth: AuthService,  
        private fetchConfig: FetchConfig/*, private httpConfig: HttpConfig*/, private dialogService:DialogService,private session: Session){

        // Base Url for REST API service.
        this.apiServerUrl = this.appConfig.get('api.serverUrl');
        // App identifiers for REST services.
        this.clientId = this.appConfig.get('api.clientId');
        this.clientSecret = this.appConfig.get('api.clientSecret');

        /**
         * DataService is loaded in application bootstrapping, so 
         * configure the application-wide http and fetch client settings here.
         */
        // Configure custom fetch for aurelia-auth service.
        fetchConfig.configure();
        // httpConfig.configure();

        // Set up global http configuration; API url, request/response error handlers.
        var me = this;
        
        // Inner function to asynchronously wait for result of call to refreshToken.
        // Called from responseError() handler.
        // var waitRefresh = async function waitRefresh(request: Request) {
        //     let refreshResponse = me.refreshToken(me.session.auth['refresh_token'], request);
        //     let result = await refreshResponse;
        //     return result;
        // };


        let http = getHttpClient().configure(config => {
            config
                // Standard config causes Promise to reject 'error' responses.
                .useStandardConfiguration()
                // Add the baseUrl for API server.
                .withBaseUrl(this.apiServerUrl)
                .withDefaults({
                    credentials: 'same-origin',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'Fetch'
                    }
                })
                .withInterceptor(this.debugRequestResponseInterceptor)
                // .withInterceptor({
                //     responseError: function(response, request) {
                //         console.debug(`Received response error ${response.status} ${response.url}`);
                //        if(!(response.status >= 200 && response.status < 300)) {
                //             if((response.status === 401 || response.status === 400) && 
                //                 request.url.indexOf('/oauth/token')===-1 &&
                //                 me.session.auth['access_token'] && 
                //                 !me.auth.isAuthenticated()) { // Special case, refresh expired token.
                //                 // Request and save a new access token, using the refresh token.
                //                 var result = waitRefresh(request);
                //                 return result;
                //             } else {
                //                 // response
                //                 me.evt.publish('responseError', response);
                //                 throw response;
                //             }
                //         }
                //     }
                // })
                .withInterceptor(this.refreshExpiredTokenResponseInterceptor)
                // Add special interceptor to force inclusion of access_token when token is expired, 
                // to support refreshing the token.
                .withInterceptor(this.includeExpiredTokenResponseInterceptor)
                // .withInterceptor(this.responseErrorInterceptor)
;
        });
        httpBase.configure(config => {
            config
            // Add the baseUrl for API server.
            .withBaseUrl(this.apiServerUrl)
            .withHeader('Authorization', 'Bearer ' + this.session.auth['access_token']);
        });

        this.logger = LogManager.getLogger(this.constructor.name);
    }

    // HTTP CLIENT INTERCEPTORS

    /**
     * Force inclusion in the headers of an expired token, so that a REST
     * call to refresh the token will succeed.
     */
    get includeExpiredTokenResponseInterceptor() {
        let me = this;
        return {
            request(request) {
                if (request.url.indexOf('/oauth/token')===-1 && !(me.auth.isAuthenticated())) {
                    me.logger.debug('Access token in request expired.');
                    let config = me.auth['config'];
                    let tokenName = config.tokenPrefix ? `${config.tokenPrefix}_${config.tokenName}` : config.tokenName;
                    let token = me.auth['auth'].getToken();

                    request.headers.set(config.authHeader, ' ' + config.authToken + ' ' + token);
                }
                return request;
            }
        };
    }

    async waitRefresh(request: Request, response: Response) {
        let refreshPromise = await this.refreshToken(this.session.auth['refresh_token'], request, response);
        this.logger.debug('waitrefresh() refreshPromise:' + refreshPromise);
        let result = await refreshPromise;
        this.logger.debug('waitrefresh() result:' + result);
        return result;
    };

    /**
     * Force inclusion in the headers of an expired token, so that a REST
     * call to refresh the token will succeed.
     */
    get refreshExpiredTokenResponseInterceptor() {
        let me = this;
        return {
            responseError: function(response, request) {
                // Inner function to asynchronously wait for result of call to refreshToken.
                // Called from responseError() handler.
                // let waitRefresh = async function waitRefresh(request: Request) {
                //     let refreshResponse = me.refreshToken(me.session.auth['refresh_token'], request);
                //     let result = await refreshResponse;
                //     return result;
                // };

                if((response.status === 401 || response.status === 400)) {
                    if(request.url.indexOf('/oauth/token')===-1 &&
                    me.session.auth['access_token'] && !me.auth.isAuthenticated()) {
                        me.logger.debug('Received expired access token - response error ' + response.status + ' ' + response.url);
                        // Special case, refresh expired token.
                        // Request and save a new access token, using the refresh token.
                        me.logger.debug('responseErrorInterceptor - wait for refreshToken()');
                        let result = me.waitRefresh(request, response);
                        me.logger.debug('responseErrorInterceptor - result from wait(): '+ result);
                        return result===null?response:result;
                    } else {
                        me.evt.publish('responseError', response);
                        return response;
                    }
                } 
            }
        };
    }

    /**
     * Forward response errors to central error handler.
     */
    get responseErrorInterceptor() {
        let me = this;
        return {
            responseError: function(response, request) {
                me.evt.publish('responseError', response);
                return response;
            },
        };
    }

    /**
     * Log the REST requests and responses for debugging.
     */
    get debugRequestResponseInterceptor() {
        let me = this;
        return {
            request: function(request) {
                me.logger.debug(`Requesting ${request.method} ${request.url}`);
                if(request.method === 'GET') {
                    // Inject a cache-busting parameter.
                    let u = document.createElement('a');
                    u.href = request.url;
                    let params = u.search;
                    let cacheBustingString = btoa(new Date().getTime().toString());
                    if(!!params && params.length > 0) {
                        params += '&' + cacheBustingString;
                    } else {
                        params += '?' + cacheBustingString;
                    }
                    u.search = params;

                    let result:Request = Object.defineProperty(request, 'url', {value: u.href, configurable: true});
                }
                return request;
            },
            response: async function(response, request) {
                me.logger.debug(`Received response ${response.status} ${response.url}`);
                return response; 
            },
        };
    }



    // AUTHENTICATION

    async login(username: string, password: string): Promise<Response> {

        var obj = {
                    username: username, 
                    password: password,
                    grant_type: 'PASSWORD',
                    client_id: this.clientId,
                    client_secret: this.clientSecret
                };
        var params = QueryString.stringify(obj, {});
        var me = this;
        let response = this.auth.login(params, null);
        return response;
    }

    isAuthenticated() {
        return this.auth.isAuthenticated();
    }

    async refreshToken(refreshToken: string, fetchRequest: Request, response: Response): Promise<Response> {
        await fetch;
        const http =  this.getHttpClient();
        var me = this;

        var obj = {
                    refresh_token: refreshToken, 
                    grant_type: 'REFRESH_TOKEN',
                    client_id: this.clientId,
                    client_secret: this.clientSecret
                };
        var params = QueryString.stringify(obj, {});

        this.logger.debug('Refreshing access token.');
        let result;
        let data;
        // let theResponse = response;
        this.logger.debug('refreshToken - wait for oauth/token');
        try {
            result = await http.fetch('oauth/token', 
                {
                    method: 'post',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    body: params
            // })
            // .then(response => {
            //     me.logger.debug('refreshToken.then()');
            // })
            // .catch(error => {
            //      me.logger.error('refreshToken failed in catch() - Refresh token (session) expired - error: ' + error);
            });
        } catch(e) {
            // Refresh token (session) expired).
            me.logger.error('refreshToken failed catch1 - Refresh token (session) expired: ' + e);
            //console.debug('refreshToken - wait for oauth/token catch: ' + e);
        //    throw e;
            return response;         
        }
        try {
            data = await result.json();
        } catch(e) {
            me.logger.error('refreshToken failed catch2 - Refresh token (session) expired: ' + e);
            return new Response(null, {status: 401});
        }
        me.auth['auth'].setToken(data, true);
        // Save the new access token in the app's existing session.
        me.session.auth['access_token'] = data['access_token'];
        me.session.auth['expires_in'] = data['expires_in'];
        me.logger.debug('Access token refreshed.');
    //    } catch(e) {
    //         // Refresh token (session) expired).
    //         me.logger.error('refreshToken failed - Refresh token (session) expired: ' + e);
    //         //console.debug('refreshToken - wait for oauth/token catch: ' + e);
    //        throw e;
    //         // return response;         
    //    }
        // data = await result.json();
    //    data = result;

        // me.auth['auth'].setToken(data, true);
        // // Save the new access token in the app's existing session.
        // me.session.auth['access_token'] = data['access_token'];
        // me.session.auth['expires_in'] = data['expires_in'];
        // console.debug('Access token refreshed.');
        if(fetchRequest && fetchRequest !== null) { // We need to re-try the original request.
            // Before re-executing the original request, replace the token in the auth header.
            fetchRequest.headers.set('Authorization', 'Bearer ' + data['access_token']);
            this.logger.debug('Access token refreshed -> re-running fetch: ' + fetchRequest.url + '.');
            this.logger.debug('refreshToken - wait for fetch request: ' + fetchRequest);
            var response = await http.fetch(fetchRequest);
            this.logger.debug('refreshToken - after await  fetch request: ' + fetchRequest);
            this.logger.debug('refreshToken Response: ' + response);
            return response; // Return re-try response.
        }
        return null;

    }

    async loginFactor2(token): Promise<Response> {
        await fetch;
        let response = this.getHttpClient().fetch('v1/mfa-tokens/'+token, 
            {
                method: 'PUT',
            }
        );
        return response;
    }

    async logout(): Promise<Response> {
        await fetch;
        const http =  this.getHttpClient();
        let obj = {
                    client_id: this.clientId,
                    client_secret: this.clientSecret
                };
        let params = QueryString.stringify(obj, {});
        let token = this.session.auth['access_token'];
        let response = http.fetch('oauth/token/' + token + '?' +params, 
            {
                method: 'DELETE'
            }
        );
        
        return response;
    }



 
// GLOBAL SERVICES //

    async getAlertCategories(startIndex: number, pageSize:number): Promise<Response> {
        await fetch;
        let response = this.getHttpClient().fetch('v1/notifications/categories?start_index=' + 
            startIndex + '&page_size=' + pageSize, 
            {
                method: 'GET',
            }
        );
        return response;
    }


    /**
     * Opens a dialog for creating/editing a resource type.
     * modelView: the path to the html template.
     * title: title of the dialog.
     * item: the resource object instance.
     * okText: text for the submit button.
     * 
     * Returns a Promise upon opening the dialog.
     */
    async openResourceEditDialog(settings: any): Promise<DialogController> {
        return this.dialogService.openAndYieldController({
            viewModel: Model, 
            view: 'model/model.html', 
            modelView: settings.modelView,
            title: settings.title, 
            loadingTitle: settings.loadingTitle,
            item: settings.item, 
            model: settings.model, 
            gridOptions: settings.gridOptions,
            rules: settings.validationRules,
            okText: settings.okText,
            showErrors: settings.showErrors,
            showCancel: true,
            isSubmitDisabled: false
        })
    }

    /**
     * Opens a dialog for a wizard.
     * title: title of the dialog.
     * item: the resource object instance.
     * okText: text for the submit button.
     * 
     * Returns a Promise upon opening the dialog.
     */
    async openWizardDialog(title: string, steps:Array<any>, item: any, validationRules: any): Promise<DialogController> {
        // let wizardCtrl = new Wizard([{name:'step1'}]);
        return this.dialogService.openAndYieldController({
            viewModel: WizardController, 
            view: 'model/wizardModel.html', 
            title: title, 
            steps: steps,
            item: item, 
            rules: validationRules,
            showCancel: true,
            isSubmitDisabled: false
        })
    }

    async openPromptDialog(question:string, message:string, item: any, okText:string, showCancel: boolean, validationRules: any, modelPromise: string, loadingTitle: string): Promise<DialogController> {
        return this.dialogService.openAndYieldController({ 
            viewModel: Prompt, 
            view: 'model/model.html', 
            modelView: 'model/prompt.html',
            title: question, 
            message: message,
            modelPromise: modelPromise,
            loadingTitle: loadingTitle,
            item: item, 
            rules: validationRules,
            okText: okText,
            showCancel: showCancel,
            isSubmitDisabled: false
        });
    }

    async getCallServiceConfig() {
        await fetch;
        const http =  this.getHttpClient();
        let response = http.fetch('v1/service-configurations/grid-call', 
            {
                method: 'GET'
            }
        );
        
        return response;
        
    }

    static getAPIFilterSortFromParams(params:Object) {
        let result = {};
        // Create the server-compatible filter criteria.
        if(params['filterModel'] && typeof params['filterModel'] === 'object' && Object.keys(params['filterModel']).length !== 0) {
            result['parameters'] = [];
            let keys = Object.keys(params['filterModel']);
            for(let i=0; i < keys.length; i++) {
                let param = {};
                let key = keys[i];
                if(key !== 'select') { // Don't do external filter on selection checkbox.
                    let filter = params['filterModel'][key];
                    let op = filter.type;
                    let operator = this.gridFilterCriteria[op];
                    let filterValue:string = filter.filter;
                    let values:Array<string> = filterValue.split(",");
                    values = values
                        .filter(function(item) {
                            return item.length > 0;
                        })
                        .map(function(item) {
                            return item.trim();
                        });
                    param['operationType'] = operator;
                    param['parameterType'] = key;
                    param['values'] = values;
                    result['parameters'].push(param);
                }
            }
        }
        // Create the server-compatible sort criteria.
        if(params['sortModel'] && Array.isArray(params['sortModel']) && params['sortModel'].length > 0) {
            result['parameterSortings'] = [];
            for(let sort of params['sortModel']) {
                let param = {};
                let parameterType = sort.colId;
                let sortDirection = this.gridSortCriteria[sort.sort];
                param['parameterType'] = parameterType;
                param['sortDirection'] = sortDirection;
                result['parameterSortings'].push(param);
            }
        }
        // Base64-encode.
        let str = btoa(JSON.stringify(result));
        // URL encode.
        str = encodeURIComponent(str);
        return str;
    }
}