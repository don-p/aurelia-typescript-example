import {inject, Lazy, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {HttpClient, json} from 'aurelia-fetch-client';
import {HttpClient as Http, HttpResponseMessage} from 'aurelia-http-client';
import {Session} from './session';
import {FetchConfig} from 'aurelia-auth';
import {EventAggregator} from 'aurelia-event-aggregator';
import {DialogService, DialogController, DialogResult} from 'aurelia-dialog';
import {Model} from '../model/model';
import {DataService} from './dataService';
import 'bootstrap-sass';
import * as QueryString from 'query-string';

@inject(HttpClient, Http, EventAggregator, DialogService, Session, FetchConfig, QueryString, DataService, LogManager)
export class CommunityService {  

    // Service object for retreiving application data from REST services.
    
    apiServerUrl: string;
    clientId: string;
    clientSecret: string;
    logger: Logger;

    constructor(private httpClient: HttpClient, private httpBase: Http, 
        private evt: EventAggregator, private dialogService:DialogService, private session: Session, 
        private fetchConfig: FetchConfig, private dataService:DataService){

        this.logger = LogManager.getLogger(this.constructor.name);
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

    async sendNotification(members:Array<any>, communities:Array<any>, notificationConfig:Object):Promise<HttpResponseMessage> {
        await fetch;
        let memberIds = members.map(function(member) {
            return member.memberId;
        });

        let communityIds = communities.map(function(community) {
            return community.communityId;
        });

        let body = {
            memberRecipients: memberIds,
            communityRecipients: communityIds,
            message: notificationConfig['message'],
            notificationCategory: notificationConfig['notificationCategory']
        };

        var form = new FormData();
        form.append('notification', JSON.stringify(body));
        let files = notificationConfig['attachmentRefs']
        if(files) {
            for (let i = 0; i < files.length; i++) {
                let file = files[i];
                form.append('file', file);

            }
        }
        // form.append('file', notificationConfig['attachmentRefs']);

        const http =  this.httpBase;

        // Use base http-client, instead of Fetch, for multipart-form file upload.
        let response = http.createRequest('v1/notifications')
        .asPost()
        .withContent(form)
        .withHeader('Authorization', 'Bearer '+ this.session.auth['access_token'])
        .send();

        return response;
    
        // let response = this.getHttpClient().fetch('v1/notifications', 
        //     {
        //         method: 'POST',
        //         body: form

        //     }
        // );
        // return response;
    }

    async transferOwnership(communityId, memberId):Promise<any> {
        let me = this;
        let p = new Promise(function(resolve,reject) {
            me.logger.debug('new Promise for transferOwner()');
        })
        // setTimeout(function() {
        
        // p = Promise.delay(2500, {
        //     status:'OK',
        //     communityId: communityId,
        //     memberId: memberId
        //     }
        // );
            
        p = Promise.resolve( {
            status:'OK',
            communityId: communityId,
            memberId: memberId
            }
        );
        return p;
    }

    async sendConnectionRequest(memberIds: string[], requestMessage: string) {
        await fetch;

        let body = {
            memberId: memberIds,
            statusComment: requestMessage
        };

        let response = this.getHttpClient().fetch('v1/member-connects', 
            {
                method: 'POST',
                body: JSON.stringify(body)
            }
        );
        return response;

    }
}