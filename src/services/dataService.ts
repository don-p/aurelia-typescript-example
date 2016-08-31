import {inject, Lazy} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {AppConfig} from './appConfig';
import {Session} from './session';
import {EventAggregator} from 'aurelia-event-aggregator';
import {AuthService} from 'aurelia-auth';
import 'bootstrap-sass';
import * as QueryString from 'query-string';

@inject(Lazy.of(HttpClient), AppConfig, EventAggregator, AuthService, Session, QueryString)
export class DataService {  

    // Service object for retreiving application data from REST services.
    
    apiServerUrl: String;
    clientId: String;
    clientSecret: String;
    httpClient: HttpClient;

    constructor(private getHttpClient: () => HttpClient, private appConfig: AppConfig, 
        private evt: EventAggregator, private auth: AuthService, private session: Session){

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
                .withBaseUrl(this.apiServerUrl.toString())
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
                    response: function(response, request) {
                        console.log(`Received ${response.status} ${response.url}`);
                        ///// DEBUG /////
                        // if(response.status === 201) { // Special case, refresh expired token.
                        //     me.refreshToken(me.session.auth['refresh_token']);
                        // }
                        ///// DEBUG /////
                        if(!(response.status >= 200 && response.status < 300)) {
                            if(response.status === 401 && 
                                me.session.auth['access_token'] && 
                                !me.auth.isAuthenticated()) { // Special case, refresh expired token.
                                // Request and save a new access token, using the refresh token.
                                me.refreshToken(me.session.auth['refresh_token'])
                                // .then(response => response.json())
                                .then(data => {
                                    console.log(data);
                                    // Re-try the original request, which should succeed with a new access token.
                                    // return me.httpClient.fetch(request);
                                }).catch(error => {
                                    console.log("refreshToken() failed."); 
                                    console.log(error); 
                                });

                            } else {
                                me.evt.publish('responseError', response);
                            }
                        }
                        return response; // you can return a modified Response
                    },
                    responseError: function(responseError, request) {
                        me.evt.publish('responseError', responseError);
                        throw responseError;
                    }
                });
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

    async refreshToken(refreshToken: string): Promise<Response> {
        await fetch;
        const http =  this.getHttpClient();
        var  headers = new Object({
            'origin':'*',
            // 'Content-Type': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            // 'Accept': 'application/json'
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

        var obj = {
                    refresh_token: refreshToken, 
                    grant_type: 'refresh_token',
                    client_id: this.appConfig.clientId,
                    client_secret: this.appConfig.clientSecret
                };
        var params = QueryString.stringify(obj, {});

        var response = http.fetch('oauth/token', 
            {
                method: 'post',
                headers: h,
                // body: body
                body: params
           }
        );
        response.then(response => response.json())
        .then(data => {
            console.log(json(data));
            // Save the new access token in the existing session.
            me.session.auth['access_token'] = data.access_token;
            me.session.auth['expires_in'] = data.expires_in;
        }).catch(error => {
            console.log("refreshToken() failed."); 
            console.log(error); 
        });
        return response;

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

}