import {inject, Lazy} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {Session} from './session';
import {FetchConfig} from 'aurelia-auth';
import {EventAggregator} from 'aurelia-event-aggregator';
import {DialogService, DialogController, DialogResult} from 'aurelia-dialog';
import {Model} from '../model/model';
import {Prompt} from '../model/prompt';
import {DataService} from './dataService';
import 'bootstrap-sass';
import * as QueryString from 'query-string';

@inject(HttpClient, EventAggregator, DialogService, Session, FetchConfig, QueryString, DataService)
export class CommunityService {  

    // Service object for retreiving application data from REST services.
    
    apiServerUrl: string;
    clientId: string;
    clientSecret: string;

    constructor(private httpClient: HttpClient, 
        private evt: EventAggregator, private dialogService:DialogService, private session: Session, 
        private fetchConfig: FetchConfig, private dataService:DataService){

    }

    getHttpClient() {
        return this.httpClient;
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
     * Get an individual community's members for logged-in user.
     */
    async getCommunity(communityId: string, startIndex: number, pageSize:number, params:Object): Promise<Response> {
        await fetch;
        let criteriaParams;
        let criteriaParamsQueryString = ''
        if((params && typeof params === 'object') &&
            ((params['filterModel'] && typeof params['filterModel'] === 'object' && Object.keys(params['filterModel']).length !== 0) || 
                (params['sortModel'] && Array.isArray(params['sortModel']) && params['sortModel'].length > 0))) {
            criteriaParams = DataService.getAPIFilterSortFromParams(params);
            // FOR ENCODED DISCOVERY RULE:
            criteriaParamsQueryString = 'discovery_rule=' + criteriaParams;
        }
        let response = this.getHttpClient().fetch('v1/communities/' + communityId + '/members?start_index=' + 
            startIndex + '&page_size=' + pageSize + '&' + criteriaParamsQueryString, 
            {
                method: 'GET'
            }
        );
        return response;
    }

    async createCommunity(community: Object) {
        await fetch;

        let method = (typeof community['communityId'] !== 'string')?'POST':'PUT';
        let path = (typeof community['communityId'] !== 'string')?'':'/'+community['communityId'];
        
        let response = this.getHttpClient().fetch('v1/communities'+path, 
            {
                method: method,
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

    async removeCommunityMembers(communityId: string, members: Array<string>) {
        await fetch;

        let response = this.getHttpClient().fetch('v1/communities/' + communityId + '/members', 
            {
                method: 'DELETE',
                body: JSON.stringify(members)

            }
        );
        return response;
    }

    async addCommunityMembers(communityId: string, members: Array<string>) {
        await fetch;

        let response = this.getHttpClient().fetch('v1/communities/' + communityId + '/members', 
            {
                method: 'POST',
                body: JSON.stringify(members)

            }
        );
        return response;
    }

    async startConferenceCall(callConfig:Object) {
        await fetch;

        let response = this.getHttpClient().fetch('v2/conferences', 
            {
                method: 'POST',
                body: JSON.stringify(callConfig)

            }
        );
        return response;
    }


    // ORGANIZATION

    async getOrgMembers(organizationId: string, startIndex: number, pageSize:number, params:Object): Promise<Response> {
        await fetch;
        let criteriaParams;
        let criteriaParamsQueryString = ''
        if((params && typeof params === 'object') &&
            ((params['filterModel'] && typeof params['filterModel'] === 'object' && Object.keys(params['filterModel']).length !== 0) || 
                (params['sortModel'] && Array.isArray(params['sortModel']) && params['sortModel'].length > 0))) {
            criteriaParams = DataService.getAPIFilterSortFromParams(params);
            // FOR ENCODED DISCOVERY RULE:
            criteriaParamsQueryString = 'discovery_rule=' + criteriaParams;
        }
        let response = this.getHttpClient().fetch('v1/organizations/' + organizationId + '/members?start_index=' + 
            startIndex + '&page_size=' + pageSize + '&' + criteriaParamsQueryString, 
            {
                method: 'GET',
            }
        );
        return response;

    }
}