import {inject, Lazy} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {AppConfig} from './appConfig';
import {Session} from './session';
import {EventAggregator} from 'aurelia-event-aggregator';
import {FetchConfig} from 'aurelia-auth';
import {AuthService} from 'aurelia-auth';
import 'bootstrap-sass';
import * as QueryString from 'query-string';

@inject(Lazy.of(HttpClient), AppConfig, EventAggregator, AuthService, FetchConfig, Session, QueryString)
export class DataService {  

    // Service object for retreiving application data from REST services.
    
    apiServerUrl: string;
    clientId: string;
    clientSecret: string;
    httpClient: HttpClient;

    constructor(private getHttpClient: () => HttpClient, private appConfig: AppConfig, 
        private evt: EventAggregator, private auth: AuthService,  
        private fetchConfig: FetchConfig, private session: Session){

        // Base Url for REST API service.
        this.apiServerUrl = appConfig.apiServerUrl;
        // App identifiers for REST services.
        this.clientId = appConfig.clientId;
        this.clientSecret = appConfig.clientSecret;

        // Configure custom fetch for aurelia-auth service.
        fetchConfig.configure();

        // Set up global http configuration; API url, request/response error handlers.
        var me = this;
        // let http = new HttpClient().configure(config => {
        let http = getHttpClient().configure(config => {
            config
                // Standard config causes Promise to reject 'error' resposes.
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
                                // response
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
                // Add special interceptor to force inclusion of access_token when token is expired, 
                // to support refreshing the token.
                .withInterceptor(this.tokenExpiredInterceptor);
        });
    }

    // AUTHENTICATION
    async login(username: string, password: string): Promise<Response> {

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
        return response;
    }

    isAuthenticated() {
        return this.auth.isAuthenticated();
    }

    async refreshToken(refreshToken: string, fetchRequest: Request): Promise<Response> {
        await fetch;
        var me = this;

        var obj = {
                    refresh_token: refreshToken, 
                    grant_type: 'REFRESH_TOKEN',
                    client_id: this.appConfig.clientId,
                    client_secret: this.appConfig.clientSecret
                };
        var params = QueryString.stringify(obj, {});

        console.debug('Refreshing access token.');
        var result = await this.getHttpClient().fetch('oauth/token', 
            {
                method: 'post',
                // headers: h,
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

    async loginFactor2(token): Promise<Response> {
        await fetch;
        var response = this.getHttpClient().fetch('v1/mfa-tokens/'+token, 
            {
                method: 'PUT',
            }
        );
        return response;
    }

    async logout(token: string): Promise<Response> {
        await fetch;
        const http =  this.getHttpClient();
        var obj = {
                    client_id: this.appConfig.clientId,
                    client_secret: this.appConfig.clientSecret
                };
        var params = QueryString.stringify(obj, {});
        var me = this;
        var response = http.fetch('oauth/token/' + token + '?' +params, 
            {
                method: 'DELETE'
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
        var me = this;
        var response = http.fetch('v1/communities?community_type=' + communityType + 
            '&start_index=' + startIndex + '&page_size=' + pageSize, 
            {
                method: 'GET'
            }
        );
        return response;
    }

   /**
     * Get an individual community detail for logged-in user.
     */
    async getCommunity(communityId: string, startIndex: number, pageSize:number): Promise<Response> {
        await fetch;
        var response = this.getHttpClient().fetch('v1/communities/' + communityId + '/members?start_index=' + 
            startIndex + '&page_size=' + pageSize, 
            {
                method: 'GET',
            }
        );
        return response;
    }

    async createCommunity(community: Object) {
        await fetch;

        let response = this.getHttpClient().fetch('v1/communities', 
            {
                method: !!(community['communityId'])?'POST':'PUT',
                body: JSON.stringify(community)
            }
        );
        return response;
    }

    async deleteCommunity(community: Object) {
        await fetch;

        let obj = {communityType: community['communityType']};
        let params = QueryString.stringify(obj, {});

        let response = this.getHttpClient().fetch('v1/communities/' + community['communityId']/*+'?'+params*/, 
            {
                method: 'DELETE',
                body: JSON.stringify(obj)

            }
        );
        return response;
    }

// GLOBAL SERVICES //

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