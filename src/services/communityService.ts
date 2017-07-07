import {inject, Lazy, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {HttpClient, json} from 'aurelia-fetch-client';
import {HttpClient as Http, HttpResponseMessage} from 'aurelia-http-client';
import {Session} from './session';
import {FetchConfig} from 'aurelia-auth';
import {EventAggregator} from 'aurelia-event-aggregator';
import {DialogService, DialogController} from 'aurelia-dialog';
import {Model} from '../model/model';
import {MemberResource} from '../model/memberResource';
import {DataService} from './dataService';
import {Utils} from './util';
import 'bootstrap-sass';
import * as QueryString from 'query-string';

@inject(HttpClient, Http, EventAggregator, DialogService, Session, FetchConfig, DataService, Utils, QueryString, LogManager)
export class CommunityService {  

    // Service object for retreiving application data from REST services.
    
    apiServerUrl: string;
    clientId: string;
    clientSecret: string;
    logger: Logger;

    constructor(private httpClient: HttpClient, private httpBase: Http, 
        private evt: EventAggregator, private dialogService:DialogService, private session: Session, 
        private fetchConfig: FetchConfig, private dataService:DataService, private utils: Utils){

        this.logger = LogManager.getLogger(this.constructor.name);
    }

    getHttpClient() {
        return this.httpClient;
    }

    // getMemberHttpClient() {
    //     return new HttpClient().configure(x=> {
    //         x.withReviver((k,v) => {        
    //             return typeof v === 'object' ? new Person(v) : v;
    //         });  
    //     });
    // }

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
    async getCommunity(args:any): Promise<Response> {
        await fetch;

        let me = this;
        let communityId = args.communityId; 
        let startIndex = args.startIndex; 
        let pageSize = args.pageSize; 
        let params = args.params;

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
        return response
        .then(response => {return response.text()
            .then(data => {
                let content:any = me.utils.parseMemberResource(data);
                return content;
            })
        });

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

    async sendNotification(alertModel:any):Promise<HttpResponseMessage> {
        await fetch;

        let members:Array<any> = alertModel.communityMembers; 
        let communities:Array<any> = alertModel.communities; 
        let notificationConfig:Object = {
            message: alertModel.alertMessage, 
            notificationCategory: alertModel.alertType, 
            attachmentRefs: alertModel.files
        };
        let schedule:Object;

        if(typeof alertModel.schedule == 'object' && 
            !!(alertModel.schedule.sendDate) &&
            alertModel.schedule.sendDate.constructor.name == 'Date') {
            schedule = alertModel.schedule;
            schedule['sendDate'] = alertModel.schedule.sendDate.getTime();
        }

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

        if(!!(schedule)) {
            body['schedule'] = schedule;
        }

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
        .withHeader('Authorization', 'Bearer '+ this.session.auth.access_token)
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

    async setCommunityCoordinators(memberIds: Array<string>, communityId: string, role) {
        await fetch;

        let data = memberIds.map(function(item){
            return {memberId: item, role: role};
        });

        let response = this.getHttpClient().fetch('v1/communities/' + communityId + '/members', 
            {
                method: 'PUT',
                body: JSON.stringify(data)
            }
        );
        return response;

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

    async editConnectionRequest(memberIds: Array<string>, status: string) {
        await fetch;

        let body = {
            memberId: memberIds,
            status: status,
            statusComment: status
        };
        let response = this.getHttpClient().fetch('v1/member-connects', 
            {
                method: 'PUT',
                body: JSON.stringify(body)
            }
        );
        return response;

    }

    async getMemberConnections(args: any): Promise<Response> {
        let connectionStatus = args.connectionStatus; 
        let startIndex = args.startIndex; 
        let pageSize = args.pageSize; 
        let params = args.params;

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
        let response = this.getHttpClient().fetch('v1/member-connects?connect_status=' + connectionStatus + '&start_index=' + 
            startIndex + '&page_size=' + pageSize + '&' + criteriaParamsQueryString, 
            {
                method: 'GET'
            }
        );
        return response
        .then(response => {return response.json()
            .then(data => {
                let json = JSON.stringify(data);
                let content = JSON.parse(json, (k, v) => { 
                    if ((k !== '')  && typeof this == 'object' && typeof v == 'object' && (!(isNaN(k)) && !(isNaN(parseInt(k))) )) {
                        if(v.hasOwnProperty('member') && typeof v.member == 'object') {
                            Object.assign(v, v.member);
                            delete v.member;
                        }
                        return new MemberResource(v);
                    } 
                    return v;                
                });
                return content;
            })
        });
    }

}