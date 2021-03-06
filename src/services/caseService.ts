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
import {MemberResource} from '../model/memberResource';
import {ArtifactResource} from '../model/artifactResource';
import {NotificationAckResource} from '../model/notificationAckResource';
import {DataService} from './dataService';
import {CommunityService} from './communityService';
import {Utils} from './util';
import 'bootstrap-sass';
import * as moment from 'moment';

@inject(HttpClient, Http, EventAggregator, DialogService, Session, FetchConfig, DataService, CommunityService, Utils, LogManager)
export class CaseService {  

    // Service object for retreiving application data from REST services.
    
    apiServerUrl: string;
    clientId: string;
    clientSecret: string;
    logger: Logger;
    pageSize: number; // In-memory rowModel pageSize.

    constructor(private httpClient: HttpClient, private httpBase: Http, 
        private evt: EventAggregator, private dialogService:DialogService, private session: Session, 
        private fetchConfig: FetchConfig, private dataService:DataService, private communityService: CommunityService, private utils: Utils){

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
            return response.text()
            .then(data => {
                let caseContent = me.parseCase(data);
                return caseContent;
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

        // First, get the Case object.
        let response = http.fetch('v1/cases/' + caseId, 
            {
                method: 'GET'
            }
        );
        return response
        .then(response => {return response.text()
            .then(data => {
                // data is the case.
                let caseContent = me.parseCase(data);
                
                // Second, get the associated Tasks object array.
                let tasksResponse = http.fetch('v1/cases/' + caseId + 
                    '/tasks?start_index=0&page_size=10000', 
                    {
                        method: 'GET'
                    }
                );
                return tasksResponse
                .then(res => {return res.text()
                    .then(tasksData => {
                        let taskContent = me.parseTask(tasksData);
                        caseContent.tasks = taskContent.responseCollection;
                        return caseContent;
                    })
                });
            })
        });
    }

    parseCase(json): any {
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
            if( (!(k === 'responseCollection')) && (v != null) && (typeof v == 'object') ) {
                if((k == '')  && (typeof this == 'object') && !(v.responseCollection)) {
                    // Individual case.
                    let cr = new CaseResource(v);
                    // cr.typeId = cr.type.typeId;
                    return cr;                    
                } else if((!(isNaN(parseInt(k)))) && (!(v.metaTagId)) && (!(v.attributeKey))) {
                // if(this.constructor.name === 'Array') {
                    // Collection of cases in responseCollection.
                    let cr = new CaseResource(v);
                    // cr.typeId = cr.type.typeId;
                    return cr;                
                // }
                }
            }
            return v;                
        });
        return response;
    }

    parseTask(json): any {
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
            if(k == 'member') {
                return new MemberResource(v);
            }
            // if(k == 'ackStatusSummary') {
            //     let status = this.parseNotificationAckStatusSummary(v);
            //     return status;
            // }
            if( (!(k === 'responseCollection')) && (v != null) && (typeof v == 'object') ) {
                if((k == '')  && (typeof this == 'object') && !(v.responseCollection)) {
                    // Individual task.
                    let t = new TaskResource(v);
                    return t;                    
                } else if((!(isNaN(parseInt(k)))) && (!(v.metaTagId)) && (!(v.attributeKey))) {
                    // Collection of tasks in responseCollection.
                    let t = new TaskResource(v);
                    return t;                
                }
            }
            return v;                
        });
        return response;
    }

    parseArtifact(json): any {
        let response = JSON.parse(json, (k, v) => { 
            if(k == 'createDate') {
                return new Date(v);
            }
            if(k == 'createdBy') {
                return new MemberResource(v);
            }
            if( (!(k === 'responseCollection')) && (v != null) && (typeof v == 'object') ) {
                if((k == '')  && (typeof this == 'object') && !(v.responseCollection)) {
                    // Individual task.
                    let t = new ArtifactResource(v);
                    return t;                    
                } else if((!(isNaN(parseInt(k)))) && (!(v.metaTagId)) && (!(v.attributeKey))) {
                    // Collection of tasks in responseCollection.
                    let t = new ArtifactResource(v);
                    return t;                
                }
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
            return response.json()
            .then(data => {
                return data;
            })
        });
    }

    /**
     * Get an individual task.
     */
    async getTask(caseId:string, taskId:string): Promise<any> {
        await fetch;

        const http =  this.getHttpClient();
        let me = this;
        let response = http.fetch('v1/cases/' + caseId + 
            '/tasks/' + taskId, 
            {
                method: 'GET'
            }
        );

        // get the task object.
        return response
        .then(response => {return response.text()
            .then(data => {
                // data is the task.
                let taskContent = me.parseTask(data);
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

    /**
     * Get an individual task's artifacts.
     */
    async getTaskArtifacts(caseId:string, taskId:string): Promise<any> {
        await fetch;

        const http =  this.getHttpClient();
        let me = this;
        let response = http.fetch('v1/cases/' + caseId + 
            '/tasks/' + taskId + '/artifacts', 
            {
                method: 'GET'
            }
        );

        return response
        .then(response => {return response.text()
            .then(data => {
                // data is the artifacts list.
                let artifactContent = me.parseArtifact(data);
                return artifactContent.responseCollection;
            })
        });
   
    }

    async createCase(_case: any) {
        await fetch;

        let method = (typeof _case.caseId !== 'string')?'POST':'PUT';
        let path = (typeof _case.caseId !== 'string')?'':'/' + _case.caseId;

        // Clone
        let caseObj:any = new CaseResource();
        Object.assign(caseObj, _case);

        // caseObj.caseAttributes = [];
        caseObj.metaTags = [];
        caseObj.locale = 'us-en';
        if(method === 'POST') {
            delete caseObj.caseId;
        }
        
        caseObj.dueDate = new Date(caseObj.dueDate).getTime();
        let response = this.getHttpClient().fetch('v1/cases' + path, 
            {
                method: method,
                body: JSON.stringify(caseObj)
            }
        );
        return response;
    }

    async deleteCase(_case: CaseResource) {
        await fetch;


        let response = this.getHttpClient().fetch('v1/cases/' + _case.caseId, 
            {
                method: 'DELETE'
            }
        );
        return response;
    }


    async createTask(_case: any, task: any) {
        // await fetch;

        let me = this;
        let method = (typeof task.taskId !== 'string')?'POST':'PUT';
        let path = (typeof task.taskId !== 'string')?'':'/' + task.taskId;
        // Clone
        let taskObj = new TaskResource();
        Object.assign(taskObj, task);
        if(method === 'POST') {
            delete taskObj.statusId;
        }
        delete taskObj.taskId;
        delete taskObj.caseId;

        let assignee = {
          memberId: task.assigneeId,
          roleId: task.roleId
        };
        delete taskObj.assigneeId;
        delete taskObj.roleId;
        taskObj.assignee = assignee;

        delete taskObj.taskStatus;
        delete taskObj.createDate;
        delete taskObj.lastChangeDate;
        delete taskObj.attachmentCount;
        delete taskObj.commentsCount;
        delete taskObj.changesCount;

        taskObj.dueDate = task.dueDate.getTime();

        // Always do a POST
        method = 'POST';

        // let response = this.getHttpClient().fetch('v1/cases/'+ _case.caseId + '/tasks' + path, 
        //     {
        //         method: method,
        //         body: JSON.stringify(taskObj)
        //     }
        // );
        // return response;
        let form = new FormData();
        
        let files = taskObj.files;
        if(files) {
            for (let i = 0; i < files.length; i++) {
                let file = files[i];
                form.append('file', file);

            }
        }
        delete taskObj.files;
        delete taskObj['fileList'];

        form.append('caseTaskRequest', JSON.stringify(taskObj));
        
        const http =  this.httpBase;
        let r = http.createRequest('v1/cases/'+ _case.caseId + '/tasks' + path)
        .withContent(form)
        .withHeader('Authorization', 'Bearer '+ this.session.auth.access_token);
        let response = method === 'POST'?r.asPost().send():r.asPut().send();
        // response.send();

        return response
        .then(data => {
            let json = data.response;
            let taskContent = me.parseTask(json);
            return taskContent;
           
        }).catch(function(error){
            me.logger.error("Task create failed: " + error);
        });
   }

    async deleteTask(task: TaskResource) {
        await fetch;


        let response = this.getHttpClient().fetch('v1/cases/' + task.caseId + '/tasks/' + task.taskId, 
            {
                method: 'DELETE'
            }
        );
        return response;
    }


    /**
     * Getcase-related lookup data.
     */
    async getCasePriorities(orgId:string): Promise<any> {
        await fetch;

        const http =  this.getHttpClient();
        let me = this;
        let response = http.fetch('v1/organizations/' + orgId + 
            '/case-priorities', 
            {
                method: 'GET'
            }
        );
        return response
        .then(response => {return response.json()
            .then(data => {
                return data;
            })
        });
   
    }

    async getCaseTypes(orgId:string): Promise<any> {
        await fetch;

        const http =  this.getHttpClient();
        let me = this;
        let response = http.fetch('v1/organizations/' + orgId + 
            '/case-types', 
            {
                method: 'GET'
            }
        );
        return response
        .then(response => {return response.json()
            .then(data => {
                return data;
            })
        });
   
    }

    async getCaseTags(orgId:string): Promise<any> {
        await fetch;

        const http =  this.getHttpClient();
        let me = this;
        let response = http.fetch('v1/organizations/' + orgId + 
            '/case-metatags', 
            {
                method: 'GET'
            }
        );
        return response
        .then(response => {return response.json()
            .then(data => {
                return data;
            })
        });
   
    }

    async getCaseAttributes(orgId:string, typeId: string): Promise<any> {
        await fetch;

        const http =  this.getHttpClient();
        let me = this;
        let response = http.fetch('v1/organizations/' + orgId + 
            '/case-types/' + typeId + '/attributes', 
            {
                method: 'GET'
            }
        );
        return response
            // .then(data => {
            //     return data;
            // });
        .then(response => {return response.json()
            .then(data => {
                return data.responseCollection;
            })
        });
    }

    async getCaseTaskAssignees(orgId:string): Promise<any> {
        await fetch;

        const http =  this.getHttpClient();
        let me = this;
        let response = http.fetch('v1/communities?community_type=' + 'TEAM' + '&start_index=' + 0 + '&page_size=' + 10000, 
            {
                method: 'GET'
            }
        );
        return response
        .then(response => {return response.json()
        .then(data => {
            let comm = data.responseCollection[1];
            // Get members.
            let membersResponse = http.fetch('v1/communities/' + comm.communityId + '/members' + '?start_index=' + 0 + '&page_size=' + 10000, 
                {
                    method: 'GET'
                }
            );
            return membersResponse
            .then(response => {return response.json()
                .then(data => {
                    let json = JSON.stringify(data);
                    let content:any = me.utils.parseMemberResource(json);
                    return content.responseCollection;
                });
            });       
        });
        });
    }

    async getCaseTaskRoles(orgId:string): Promise<any> {
        await fetch;

        const http =  this.getHttpClient();
        let me = this;
        let response = http.fetch('v1/organizations/' + orgId + 
            '/case-task-roles', 
            {
                method: 'GET'
            }
        );
        return response
        .then(response => {return response.json()
            .then(data => {
                return data;
            })
        });
   
    }

    async getCaseTaskStatuses(orgId:string): Promise<any> {
        await fetch;

        const http =  this.getHttpClient();
        let me = this;
        let response = http.fetch('v1/organizations/' + orgId + 
            '/case-task-statuses', 
            {
                method: 'GET'
            }
        );
        return response
        .then(response => {return response.json()
            .then(data => {
                return data;
            })
        });
   
    }

}