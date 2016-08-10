import {inject, Lazy} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {AppConfig} from './appConfig';
import {Session} from './session';
import {EventAggregator} from 'aurelia-event-aggregator';

@inject(Lazy.of(HttpClient), AppConfig, EventAggregator)
export class DataService {  

    // Service object for retreiving application data from REST services.
    
    apiServerUrl: String;
    clientId: String;
    clientSecret: String;
    httpClient: HttpClient;

    constructor(private getHttpClient: () => HttpClient, private appConfig: AppConfig, private evt: EventAggregator){
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
                    response: function(response) {
                        console.log(`Received ${response.status} ${response.url}`);
                        if(response.status !== 200) {
                            me.evt.publish('responseError', response);
                        }
                        return response; // you can return a modified Response
                    },
                    responseError: function(responseError) {
                        console.log(`Received ` + responseError);
                        throw responseError;
                    }
                });
        });

    }

    // AUTHENTICATION

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
            'X-Requested-With': 'Fetch',
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
        var response = http.fetch('v1/communities/' + communityId + '/members?start_index=0&page_size=125', 
            {
                method: 'GET',
                headers: h
            }
        );
        return response;
    }

}