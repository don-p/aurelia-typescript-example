import {inject, Lazy} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {AppConfig} from './appConfig';
import {Session} from './session';
import {EventAggregator} from 'aurelia-event-aggregator';
import {DialogService, DialogController, DialogResult} from 'aurelia-dialog';
import {Model} from '../model/model';
import {Prompt} from '../model/prompt';
import 'bootstrap-sass';
import * as QueryString from 'query-string';

@inject(Lazy.of(HttpClient), AppConfig, EventAggregator, DialogService, Session, QueryString)
export class CommunityService {  

    // Service object for retreiving application data from REST services.
    
    apiServerUrl: string;
    clientId: string;
    clientSecret: string;
    httpClient: HttpClient;

    constructor(private getHttpClient: () => HttpClient, private appConfig: AppConfig, 
        private evt: EventAggregator, private dialogService:DialogService,private session: Session){

        // Base Url for REST API service.
        this.apiServerUrl = appConfig.apiServerUrl;
        // App identifiers for REST services.
        this.clientId = appConfig.clientId;
        this.clientSecret = appConfig.clientSecret;
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
                method: (typeof community['communityId'] !== 'string')?'POST':'PUT',
                body: JSON.stringify(community)
            }
        );
        return response;
    }

    async deleteCommunity(community: Object) {
        await fetch;

        let obj = {community_type: community['communityType']};
        let params = QueryString.stringify(obj, {});

        let response = this.getHttpClient().fetch('v1/communities/' + community['communityId']+'?'+params, 
            {
                method: 'DELETE'
                // body: JSON.stringify(obj)

            }
        );
        return response;

        // // TEST
        // var p = new Promise(function(resolve, reject){

        //     window.setTimeout(
        //         function() {
        //             // We fulfill the promise !
        //             resolve('done');
        //         }, 10000);
        // });
        // return p
    }

    async deleteCommunityMembers(communityId: string, members: Array<string>) {
        await fetch;

        let obj = {memberIds: members};

        let response = this.getHttpClient().fetch('v1/communities/' + communityId + '/members', 
            {
                method: 'DELETE',
                body: JSON.stringify(obj)

            }
        );
        return response;
    }

}