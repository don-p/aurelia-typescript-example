import {inject, Lazy} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {AppConfig} from './appConfig';
import {Session} from './session';
import {EventAggregator} from 'aurelia-event-aggregator';
import {AuthService, BaseConfig} from 'aurelia-auth';
import 'bootstrap-sass';
import * as QueryString from 'query-string';

@inject(Lazy.of(HttpClient), AppConfig, EventAggregator, AuthService, Session, QueryString, BaseConfig)
export class DataService {  

    // Service object for retreiving application data from REST services.
    
    apiServerUrl: string;
    clientId: string;
    clientSecret: string;
    httpClient: HttpClient;

    constructor(private getHttpClient: () => HttpClient, private appConfig: AppConfig, 
        private evt: EventAggregator, private auth: AuthService,  
        private session: Session, private authConfig: BaseConfig){

        // Base Url for REST API service.
        this.apiServerUrl = appConfig.apiServerUrl;
        // App identifiers for REST services.
        this.clientId = appConfig.clientId;
        this.clientSecret = appConfig.clientSecret;
        this.httpClient = this.getHttpClient();

        // Set up global http configuration; API url, request/response error handlers.
        var me = this;
        this.httpClient.configure(config => {
            config
                .withBaseUrl(this.apiServerUrl)
                .withDefaults({
                    credentials: 'same-origin',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'Fetch'
                    }
                })
                .withInterceptor({
                    request: function(request) {
                        console.log(`Requesting ${request.method} ${request.url}`);
                        return request; // you can return a modified Request, or you can short-circuit the request by returning a Response
                    },
                    response: async function(response, request) {
                        console.log(`Received ${response.status} ${response.url}`);
                        if(!(response.status >= 200 && response.status < 300)) {
                            if((response.status === 401 || response.status === 400) && 
                                request.url.indexOf('/oauth/token')===-1 &&
                                me.session.auth['access_token'] && 
                                !me.auth.isAuthenticated()) { // Special case, refresh expired token.
                                // Request and save a new access token, using the refresh token.
                                var result = await me.refreshToken(me.session.auth['refresh_token'], request);
                                return result===null?response:result;
                            } else {
                                me.evt.publish('responseError', response);
                                return response;
                            }
                        }
                        return response; // you can return a modified Response
                    },
                    responseError: function(responseError, request) {
                        me.evt.publish('responseError', responseError);
                        throw responseError;
                    }
                })
                .withInterceptor(this.tokenExpiredInterceptor);
        });

    }

    // AUTHENTICATION
    async login(username: string, password: string): Promise<Response> {

        // var body = 'username=' + username + 
        //     '&password=' + password + 
        //     '&grant_type=PASSWORD' +
        //     '&client_id=' + this.appConfig.clientId +
        //     '&client_secret=' + this.appConfig.clientSecret
        var obj = {
                    username: username, 
                    password: password,
                    grant_type: 'PASSWORD',
                    client_id: this.appConfig.clientId,
                    client_secret: this.appConfig.clientSecret
                };
        var params = QueryString.stringify(obj, {});
        var me = this;
        var response = this.auth.login(params, null);
         response.then(response => {
            // var res = response.json();
            // var res = new Response(response);
            // return res;
        });
        return response;
    }

    isAuthenticated() {
        return this.auth.isAuthenticated();
    }

    async refreshToken(refreshToken: string, fetchRequest: Request): Promise<Response> {
        await fetch;
        const http =  this.getHttpClient();
        var  headers = {
            'origin':'*',
            // 'Content-Type': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            // 'Accept': 'application/json'
        };
        var h = new Headers();
        for (var header in headers) {
            h.append(header, headers[header]);
        }
        http.configure(config => {
            config
                .withBaseUrl(this.apiServerUrl.toString())
                /*.withDefaults({headers: h})*/;
            }
        );
        var me = this;

        var obj = {
                    refresh_token: refreshToken, 
                    grant_type: 'REFRESH_TOKEN',
                    client_id: this.appConfig.clientId,
                    client_secret: this.appConfig.clientSecret
                };
        var params = QueryString.stringify(obj, {});

        console.debug('Refreshing access token.');
        var result = await http.fetch('oauth/token', 
            {
                method: 'post',
                headers: h,
                // body: body
                body: params
           }
        );
        let data = await result.json();

        me.auth['auth'].setToken(data, true);
        // Save the new access token in the app's existing session.
        me.session.auth['access_token'] = data['access_token'];
        me.session.auth['expires_in'] = data['expires_in'];
        console.debug('Access token refreshed.');

        if(fetchRequest && fetchRequest !== null) { // We need to re-try the original request.
            // Before re-executing the original request, replace the token in the auth header.
            fetchRequest.headers.set('Authorization', 'Bearer ' + data['access_token']);
            console.debug('Access token refreshed -> re-running fetch: ' + fetchRequest.url + '.');
            var response = await me.httpClient.fetch(fetchRequest);
            console.log('refreshToken Response: ' + response);
            return response; // Return re-try response.
        }
        return null;

    }

    async loginFactor2(): Promise<Response> {
        await fetch;
        const http =  this.getHttpClient();
        var  headers = new Object({
            'X-Requested-With': 'Fetch',
            'origin':'*',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        });
        var h = new Headers();
        for (var header in headers) {
            h.append(header, headers[header]);
        }
        http.configure(config => {
            config
                .withBaseUrl(this.apiServerUrl.toString())
                /*.withDefaults({headers: h})*/;
            }
        );
        var me = this;
        var response = http.fetch('v1/communities?community_type=COI&start_index=110&page_size=20', 
            {
                method: 'GET',
                headers: h
            }
        );
        return response;
    }

    // COMMUNITIES

    /**
     * Get list of communities for logged-in user.
     */
    async getCommunities(communityType: string, startIndex: number, pageSize: number): Promise<Response> {
        await fetch;
        const http =  this.getHttpClient();
        var  headers = new Object({
            'origin':'*',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        });
        var h = new Headers();
        for (var header in headers) {
            h.append(header, headers[header]);
        }
        // http.configure(config => {
        //     config
        //         .withBaseUrl(this.apiServerUrl.toString())
        //         /*.withDefaults({headers: h})*/;
        //     }
        // );
        var me = this;
        var response = http.fetch('v1/communities?community_type=' + communityType + 
            '&start_index=' + startIndex + '&page_size=' + pageSize, 
            {
                method: 'GET',
                headers: h
            }
        );
        return response;
    }

   /**
     * Get an individual community detail for logged-in user.
     */
    async getCommunity(communityId: string): Promise<Response> {
        await fetch;
        const http =  this.getHttpClient();
        var  headers = new Object({
            'origin':'*',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        });
        var h = new Headers();
        for (var header in headers) {
            h.append(header, headers[header]);
        }
        http.configure(config => {
            config
                .withBaseUrl(this.apiServerUrl.toString())
                /*.withDefaults({headers: h})*/;
            }
        );
        var me = this;
        var response = http.fetch('v1/communities/' + communityId + '/members?start_index=0&page_size=125', 
            {
                method: 'GET',
                headers: h
            }
        );
        return response;
    }

    get tokenExpiredInterceptor() {
        let me = this;
        return {
            request(request) {
                if (request.url.indexOf('/oauth/token')===-1 && !(me.auth.isAuthenticated())) {
                    console.debug('Access token in request expired.');
                    let config = me.auth['config'];
                    let tokenName = config.tokenPrefix ? `${config.tokenPrefix}_${config.tokenName}` : config.tokenName;
                    let token = me.auth['auth'].getToken();

                    request.headers.set(config.authHeader, ' ' + config.authToken + ' ' + token);
                }
                return request;
            }
        };
    }

}