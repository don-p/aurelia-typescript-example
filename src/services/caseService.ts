import {inject, Lazy, LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {HttpClient, json} from 'aurelia-fetch-client';
import {HttpClient as Http, HttpResponseMessage} from 'aurelia-http-client';
import {Session} from './session';
import {FetchConfig} from 'aurelia-auth';
import {EventAggregator} from 'aurelia-event-aggregator';
import {DialogService, DialogController} from 'aurelia-dialog';
import {Model} from '../model/model';
import {CaseResource} from '../model/caseResource';
import {TaskResource} from '../model/taskResource';
import {NotificationAckResource} from '../model/notificationAckResource';
import {DataService} from './dataService';
import 'bootstrap-sass';
import * as QueryString from 'query-string';
import * as moment from 'moment';

@inject(HttpClient, Http, EventAggregator, DialogService, Session, FetchConfig, QueryString, DataService, LogManager)
export class CaseService {  

    // Service object for retreiving application data from REST services.
    
    apiServerUrl: string;
    clientId: string;
    clientSecret: string;
    logger: Logger;
    pageSize: number; // In-memory rowModel pageSize.

    // MOCK DATA
    casesArray: Array<any> = [
                    {
                        "caseId": "001",
                        "description": "Desc 1",
                        "externalReference": "Ref 1",
                        "title": "Case 1",
                        "dueDate": 0,
                        "lastExportDate": 0,
                        "attachmentsCount": 0,
                        "type": {
                            "typeId": "t1",
                            "typeName": "Type A"
                        },
                        "priority": 
                            {
                                "priorityId": "p1",
                                "priorityName": "Urgent"
                            }
                    },
                    {
                        "caseId": "002",
                        "description": "Description 2",
                        "externalReference": "Ref 2",
                        "title": "Case 2",
                        "dueDate": 0,
                        "lastExportDate": 0,
                        "attachmentsCount": 0,
                        "type": {
                            "typeId": "t2",
                            "typeName": "Type B"
                        },
                        "priority": 
                            {
                                "priorityId": "p3",
                                "priorityName": "Normal"
                            }
                    },
                    {
                        "caseId": "003",
                        "description": "Case Desc 3",
                        "externalReference": "Ref 3",
                        "title": "Case number 3",
                        "dueDate": 0,
                        "lastExportDate": 0,
                        "attachmentsCount": 1,
                        "type": {
                            "typeId": "t3",
                            "typeName": "Type C"
                        },
                        "priority": 
                            {
                                "priorityId": "p2",
                                "priorityName": "High"
                            }
                    }
                ];
    tasksArray: Array<any> = [
                    {
                        "taskId": "001",
                        "description": "Desc 1",
                        "title": "Task 1"
                    },
                    {
                        "taskId": "002",
                        "description": "Description 2",
                        "title": "Task 2",
                    },
                    {
                        "taskId": "003",
                        "description": "Case Desc 3",
                        "title": "Task number 3",
                    }
                ];

    constructor(private httpClient: HttpClient, private httpBase: Http, 
        private evt: EventAggregator, private dialogService:DialogService, private session: Session, 
        private fetchConfig: FetchConfig, private dataService:DataService){

        this.pageSize = 100000;

        this.logger = LogManager.getLogger(this.constructor.name);
    }

    getHttpClient() {
        return this.httpClient;
    }

    // CASES

    /**
     * Get list of cases for logged-in user.
     */
    async getCases(args:any): Promise<any> {
        await fetch;

        let memberId:string = args.memberId;
        let startIndex:number = args.startIndex;
        let pageSize:number = args.pageSize;
        let direction:string = 'RECEIVED';

        const http =  this.getHttpClient();
        let me = this;
        let response = http.fetch('v1/cases?start_index=' + startIndex + '&page_size=' + pageSize, 
            {
                method: 'GET'
            }
        );
        return response
        .then(response => 
        {
            // let result = {
            //     "pageSize": 0,
            //     "responseCollection": me.casesArray,
            //     "startPosition": 0,
            //     "totalCount": 3
            // };
            // return JSON.parse(JSON.stringify(result));
            return response.json()
            .then(data => {
                // let json = JSON.stringify(data);
                // let content = JSON.parse(json, (k, v) => { 
                //     if(k == 'sentDate') {
                //         return new Date(v);
                //     }
                //     if(k == 'ackStatusSummary') {
                //         let status = me.parseNotificationAckStatusSummary(v);
                //         return status;
                //     }
                //     if ((k !== '')  && typeof this == 'object' && v != null && typeof v == 'object' && !(v['payloadId']) && !(v['ackStatus']) && (!(isNaN(k)) && !(isNaN(parseInt(k))) )) {
                //         return new NotificationResource(v);
                //     } 
                //     return v;                
                // });
                // return content;
                return data;
            })
        });
    }

    /**
     * Get an individual case.
     */
    async getCase(caseId:string): Promise<any> {
        await fetch;

        // Multiple Promises to be resolved here.
        const http =  this.getHttpClient();
        let me = this;
        // let response = http.fetch('v1/cases/' + caseId, 
        //     {
        //         method: 'GET'
        //     }
        // );
        // return response
        // .then(response => 
        // {
        //     return response.json().then(data => {
        //         return data;
        //     });

        // });


        // First, get the Case object.
        let response = http.fetch('v1/cases/' + caseId, 
            {
                method: 'GET'
            }
        );
        return response
        .then(response => {return response.json()
            .then(data => {
                // data is the case.
                let json = JSON.stringify(data);
                let caseContent = me.parseCase(json);
                
                // Second, get the associated Tasks object array.
                let tasksResponse = http.fetch('v1/cases/' + caseId + 
                    '/tasks', 
                    {
                        method: 'GET'
                    }
                );
                return tasksResponse
                .then(res => {return res.json()
                    .then(tasksData => {
                        caseContent.tasks = tasksData.responseCollection;
                        return caseContent;
                    })
                });
            })
        });


    }

    parseCase(json): CaseResource {
        let response = JSON.parse(json, (k, v) => { 
            if(k == 'dueDate') {
                return new Date(v);
            }
            if(k == 'lastExportDate') {
                return new Date(v);
            }
            // if(k == 'ackStatusSummary') {
            //     let status = this.parseNotificationAckStatusSummary(v);
            //     return status;
            // }
            if ((k == '')  && (typeof this == 'object') && (v != null) && (typeof v == 'object') && (!(v['payloadId'])) && (!(v['ackStatus'])) ) {
                return new CaseResource(v);
            } 
            return v;                
        });
        return response;
    }


    /**
     * Get list of tasks for logged-in user.
     */
    async getTasks(args:any): Promise<any> {
        await fetch;

        let memberId:string = args.memberId;
        let startIndex:number = args.startIndex;
        let pageSize:number = args.pageSize;
        let direction:string = 'RECEIVED';

        const http =  this.getHttpClient();
        let me = this;
        let response = http.fetch('v1/cases?start_index=' + startIndex + '&page_size=' + pageSize, 
            {
                method: 'GET'
            }
        );
        return response
        .then(response => 
        {
            let result = {
                "pageSize": 0,
                "responseCollection": [
                    {
                    "caseId": "001",
                    "description": "Desc 1",
                    "externalReference": "Ref 1",
                    "title": "Case 1",
                    "type": "Type A",
                    "priority": "Urgent"
                    },
                    {
                    "caseId": "002",
                    "description": "Description 2",
                    "externalReference": "Ref 2",
                    "title": "Case 2",
                    "type": "Type B",
                    "priority": "Normal"
                    },
                    {
                    "caseId": "003",
                    "description": "Case Desc 3",
                    "externalReference": "Ref 3",
                    "title": "Case number 3",
                    "type": "Type C",
                    "priority": "High"
                    }
                ],
                "startPosition": 0,
                "totalCount": 3
            };
            return JSON.parse(JSON.stringify(result));
            // return response.json()
            // .then(data => {
            //     // let json = JSON.stringify(data);
            //     // let content = JSON.parse(json, (k, v) => { 
            //     //     if(k == 'sentDate') {
            //     //         return new Date(v);
            //     //     }
            //     //     if(k == 'ackStatusSummary') {
            //     //         let status = me.parseNotificationAckStatusSummary(v);
            //     //         return status;
            //     //     }
            //     //     if ((k !== '')  && typeof this == 'object' && v != null && typeof v == 'object' && !(v['payloadId']) && !(v['ackStatus']) && (!(isNaN(k)) && !(isNaN(parseInt(k))) )) {
            //     //         return new NotificationResource(v);
            //     //     } 
            //     //     return v;                
            //     // });
            //     // return content;
            //     return data;
            // })
        });
    }

    /**
     * Get an individual case.
     */
    async getTask(caseId:string, taskId:string): Promise<any> {
        await fetch;

        // Multiple Promises to be resolved here.
        const http =  this.getHttpClient();
        let me = this;
        let response = http.fetch('v1/cases/' + caseId + 
            '/tasks/' + taskId, 
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
                let taskContent = me.parseTask(json);
                return taskContent;
                // // Second, get the associated Comments object array.
                // let commentsResponse = http.fetch('v1/members/' + memberId + 
                //     '/notifications/' + notificationId + '/acks?start_index=' + startIndex + '&page_size=' + pageSize, 
                //     {
                //         method: 'GET'
                //     }
                // );
                // return commentsResponse
                // .then(res => {return res.json()
                //     .then(commentsData => {
                //         taskContent.comments = commentsData.responseCollection;
                //         return taskContent;
                //     })
                // });
            })
        });
   
    }

    parseTask(json): CaseResource {
        let response = JSON.parse(json, (k, v) => { 
            if(k == 'dueDate') {
                return new Date(v);
            }
            if(k == 'lastChangeDate') {
                return new Date(v);
            }
            if(k == 'createDate') {
                return new Date(v);
            }
            // if(k == 'ackStatusSummary') {
            //     let status = this.parseNotificationAckStatusSummary(v);
            //     return status;
            // }
            if ((k == '')  && (typeof this == 'object') && (v != null) && (typeof v == 'object') && (!(v['payloadId'])) && (!(v['ackStatus'])) ) {
                return new TaskResource(v);
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

    async setNotificationReply(memberId:string, notificationId:string, ack:any) {
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
        .withHeader('Authorization', 'Bearer '+ this.session.auth['access_token'])
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
                let json = JSON.stringify(data);
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
                return content;
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