import {inject, Lazy, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {HttpClient, json} from 'aurelia-fetch-client';
import {HttpClient as Http, HttpResponseMessage} from 'aurelia-http-client';
import {Session} from './session';
import {FetchConfig} from 'aurelia-auth';
import {EventAggregator} from 'aurelia-event-aggregator';
import {DialogService, DialogController} from 'aurelia-dialog';
import {Model} from '../model/model';
import {NotificationResource} from '../model/notificationResource';
import {NotificationAckResource} from '../model/notificationAckResource';
import {DataService} from './dataService';
import 'bootstrap-sass';
import * as QueryString from 'query-string';
import * as moment from 'moment';

@inject(HttpClient, Http, EventAggregator, DialogService, Session, FetchConfig, QueryString, DataService, LogManager)
export class AlertsService {  

    // Service object for retreiving application data from REST services.
    
    apiServerUrl: string;
    clientId: string;
    clientSecret: string;
    logger: Logger;
    pageSize: number; // In-memory rowModel pageSize.

    constructor(private httpClient: HttpClient, private httpBase: Http, 
        private evt: EventAggregator, private dialogService:DialogService, private session: Session, 
        private fetchConfig: FetchConfig, private dataService:DataService){

        this.pageSize = 100000;

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
        let me = this;
        let date = (moment as any).default().subtract(30, 'days').hour(0).minute(0).second(0).toDate().getTime();
        let response = http.fetch('v2/members/' + memberId + 
            '/notifications?direction=' + direction + '&include_status=true&start_index=' + 
            startIndex + '&page_size=' + pageSize + '&from_date=' + date, 
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
                        return new Date(v);
                    }
                    if(k == 'ackStatusSummary') {
                        let status = me.parseNotificationAckStatusSummary(v);
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

    /**
     * Get an individual notification + acks.
     */
    async getNotification(memberId:string, notificationId:string, startIndex:number, pageSize:number): Promise<any> {
        await fetch;

        // Multiple Promises to be resolved here.
        const http =  this.getHttpClient();
        let me = this;
        let response = http.fetch('v2/members/' + memberId + 
            '/notifications/' + notificationId, 
            {
                method: 'GET'
            }
        );
        // First, get the Notificaiton object.
        return response
        .then(response => {return response.json()
            .then(data => {
                // data is the notification.
                let json = JSON.stringify(data);
                let notificationContent = me.parseNotification(json);
                
                // Second, get the associated Acknowledgement object array.
                let acksResponse = http.fetch('v2/members/' + memberId + 
                    '/notifications/' + notificationId + '/acks?start_index=' + startIndex + '&page_size=' + pageSize, 
                    {
                        method: 'GET'
                    }
                );
                return acksResponse
                .then(res => {return res.json()
                    .then(acksData => {
                        // Third, for each Acknowledgement in list, get the Acknowledgement Detail in order to access attachments.
                        let json = JSON.stringify(acksData);
                        let acks:Array<NotificationAckResource> = me.parseNotificationAcks(json);
                        notificationContent.acks = acks;
                        let promiseArray = [];
                        // 3A. - Fetch the list of Acknowledgement Details.
                        acks.forEach(function(ack:any) {
                            let acksDetailResponse = http.fetch('v2/members/' + memberId + 
                                '/notifications/' + notificationId + '/acks/' + ack.acknowledgementId, 
                                {
                                    method: 'GET'
                                }
                            );
                            // acksDetailResponse.then(res => {return res.json()
                            //     .then(acksData => {
                            //         let json = JSON.stringify(acksData);
                            //         let acks:Array<NotificationAckResource> = me.parseNotificationAcks('{"responseCollection":[' + json + ']}');
                            //         return acks[0];                         
                            //     })
                            // });                                
                                
                            //     function(data) {
                            //     return {ack: ack, ackDetail: data};
                            // });
                            promiseArray.push(acksDetailResponse);

                        });
                        // 3B. - Wait for array of Acknowledgement Detail Promises to be fulfilled.
                        let acksPromise = Promise.all(promiseArray);
                        return acksPromise.then(function(result) {
                            let resultArray = [];
                            notificationContent.acks = resultArray;
                            // Create array of toJson() Promises.
                            let jsonMap = result.map(function(item) {
                                return item.json();
                            })
                            // 3C. - Wait for async JSON transform on Acknowledgement Detail responses.
                            return Promise.all(jsonMap);

                            // result.forEach(response => {response.json()
                            //     .then(responseAck => {
                            //         let js = JSON.stringify(responseAck);
                            //         let ack:Array<NotificationAckResource> = me.parseNotificationAcks('{"responseCollection":[' + js + ']}');
                            //         resultArray.push(ack[0]);
                            //         return ack[0];
                            //     });
                            // });

                            // notificationContent.acks = resultArray;
                            // // return result;
                            // return {notification: notificationContent, response: result};
                        }).then(function(pArray) {
                            // 3D. - Parse Acknowledgement Detail responses into model objects.
                            let acks = [];
                            pArray.forEach(function(ack) {
                                let a = new NotificationAckResource(ack);
                                acks.push(a);
                            })
                            notificationContent.acks = acks;
                            return notificationContent;
                        });
                        // return notificationContent;

                    })
                });
            })
        });
    }

    parseNotification(json): NotificationResource {
        let response = JSON.parse(json, (k, v) => { 
            if(k == 'sentDate') {
                return new Date(v);
            }
            if(k == 'ackStatusSummary') {
                let status = this.parseNotificationAckStatusSummary(v);
                return status;
            }
            if ((k == '')  && (typeof this == 'object') && (v != null) && (typeof v == 'object') && (!(v['payloadId'])) && (!(v['ackStatus'])) ) {
                return new NotificationResource(v);
            } 
            return v;                
        });
        return response;
    }

    parseNotificationAcks(json): Array<NotificationAckResource> {
        let response = JSON.parse(json, (k, v) => { 
            if(k == 'acknowledgementDate') {
                // return new Date(Number.parseInt(v));
                //FIXME: TEMP - parsing for wrong date format from Response.
                return new Date(v);
            }
            if(k == 'ackStatusSummary') {
                let status = this.parseNotificationAckStatusSummary(v);
                return status;
            }
            if ((k !== '')  && (typeof this == 'object') && (v != null) && (!(v.payloadId)) && (typeof v == 'object') && (!(isNaN(k)) && !(isNaN(parseInt(k))) )) {
                return new NotificationAckResource(v);
            } 
            return v;
        })
        return response.responseCollection;      
    }

    parseNotificationAckStatusSummary(statusObj: Array<any>) {
        let status = {};
        status = statusObj.reduce(function(acc, curVal, curIndex) {
            let key = curVal.ackStatus;
            let val = curVal.count;
            acc[key] = val;
            return acc;
        }, {});

        return status;
    }

    async setNotificationAckStatus(memberId, notificationId, status) {
        await fetch;

        // let notificationId:string = args.memberId;
        // let startIndex:number = args.startIndex;
        // let pageSize:number = args.pageSize;
        // let direction:string = args.direction;

        const http =  this.getHttpClient();
        let me = this;

        let body = {
            ackStatus: status
        };

        let response = http.fetch('v1/members/' + memberId + 
            '/notifications/' + notificationId + '/acks', 
            {
                method: 'PUT',
                body: JSON.stringify(body)
            }
        );
        return response
        .then(response => {return response.json()
            .then(data => {
                let json = JSON.stringify(data);
                let content = JSON.parse(json, (k, v) => { 
                    if(k == 'acknowledgementDate') {
                        return new Date(Number.parseInt(v));
                        //FIXME: TEMP - parsing for wrong date format from Response.
                        // return new Date(v);
                    }
                    if ((k === '')  && typeof this == 'object' && v != null && typeof v == 'object') {
                        return new NotificationAckResource(v);
                    } 
                    return v;                
                });
                return content;
            })
        });
    }

    async setNotificationReply(memberId:string, notificationId:string, ack:any): Promise<any> {
        await fetch;

        let me = this;

        // let notificationId:string = args.memberId;
        // let startIndex:number = args.startIndex;
        // let pageSize:number = args.pageSize;
        // let direction:string = args.direction;

        // const http =  this.getHttpClient();

        let body = {
            ackStatus: 'REPLY_MESSAGE',
            ackMessage: ack.message
        };

        var form = new FormData();
        form.append('acknowledgement', JSON.stringify(body));
        let files = ack.files;
        if(files) {
            for (let i = 0; i < files.length; i++) {
                let file = files[i];
                form.append('file', file);

            }
        }

        const http =  this.httpBase;
        let response = http.createRequest('v2/members/' + memberId + '/notifications/' + notificationId + '/acks')
        // .asPut()
        .asPost()
        .withContent(form)
        .withHeader('Authorization', 'Bearer '+ this.session.auth.access_token)
        .send();

        // let response = http.fetch('v1/members/' + memberId + 
        //     '/notifications/' + notificationId + '/acks', 
        //     {
        //         method: 'PUT',
        //         body: JSON.stringify(body)
        //     }
        // );
        return response
        // .then(response => {return response.json()
        //  .then(response => {return response
           .then(data => {
                let json = data.response;
                let content = JSON.parse(json, (k, v) => { 
                    if(k == 'acknowledgementDate') {
                        // return new Date(Number.parseInt(v));
                        //FIXME: TEMP - parsing for wrong date format from Response.
                        return new Date(v);
                    }
                    if ((k === '')  && typeof this == 'object' && v != null && typeof v == 'object') {
                        return new NotificationAckResource(v);
                    } 
                    return v;                
                });
                // content is the ack response, we need the full detail.
                const http =  this.getHttpClient();
                let acksDetailResponse = http.fetch('v2/members/' + memberId + 
                    '/notifications/' + content.notificationId + '/acks/' + content.acknowledgementId, 
                    {
                        method: 'GET'
                    }
                );
                return acksDetailResponse.then(response => {return response.json()
                    .then(function(data) {
                        let ackDetail = new NotificationAckResource(data);
                        return ackDetail;
                    })
                });
                
            // })
        }).catch(function(error){
            me.logger.error("Ack update failed: " + error);
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

    getNotificationsCounts(args): Promise<any> {
        
        const http =  this.getHttpClient();
        let me = this;
        let response = http.fetch('v1/members/' + args.memberId + '/notification-statistics', 
            {
                method: 'GET'
            }
        );
        response.catch(function(error) {
            me.logger.debug('Error getting notification count statistics: ' + error);
        })
        return response.then(response => {return response.json()
            .then(function(data) {
                return data;
            });
        });
    }

}