import {inject, Lazy, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {HttpClient, json} from 'aurelia-fetch-client';
import {HttpClient as Http, HttpResponseMessage} from 'aurelia-http-client';
import {Session} from './session';
import {FetchConfig} from 'aurelia-auth';
import {EventAggregator} from 'aurelia-event-aggregator';
import {DialogService, DialogController, DialogResult} from 'aurelia-dialog';
import {Model} from '../model/model';
import {NotificationResource} from '../model/notificationResource';
import {DataService} from './dataService';
import 'bootstrap-sass';
import * as QueryString from 'query-string';

@inject(HttpClient, Http, EventAggregator, DialogService, Session, FetchConfig, QueryString, DataService, LogManager)
export class AlertsService {  

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

    // getMemberHttpClient() {
    //     return new HttpClient().configure(x=> {
    //         x.withReviver((k,v) => {        
    //             return typeof v === 'object' ? new Person(v) : v;
    //         });  
    //     });
    // }

    // NOtIFICATIONS

    /**
     * Get list of alerts for logged-in user.
     */
    async getNotifications(args:any): Promise<Response> {
        await fetch;

        let memberId:string = args.memberId;
        let startIndex:number = args.startIndex;
        let pageSize:number = args.pageSize;
        let direction:string = args.direction;

        const http =  this.getHttpClient();
        var me = this;
        var response = http.fetch('v1/members/' + memberId + 
            '/notifications?direction=' + direction + '&include_status=true&start_index=' + startIndex + '&page_size=' + pageSize, 
            {
                method: 'GET'
            }
        );
        return response
        .then(response => {return response.json()
            .then(data => {
                let json = JSON.stringify(data);
                let content = JSON.parse(json, (k, v) => { 
                    if(k == 'sentDate') {
                        return new Date(Number.parseInt(v));
                    }
                    if(k == 'ackStatusSummary') {
                        let status = {};
                        status = v.reduce(function(acc, curVal, curIndex) {
                            let key = curVal.ackStatus;
                            let val = curVal.count;
                            acc[key] = val;
                            return acc;
                        }, {});
                        return status;
                    }
                    if ((k !== '')  && typeof this == 'object' && v != null && typeof v == 'object' && !(v['payloadId']) && !(v['ackStatus']) && (!(isNaN(k)) && !(isNaN(parseInt(k))) )) {
                        return new NotificationResource(v);
                    } 
                    return v;                
                });
                return content;
            })
        });
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

}