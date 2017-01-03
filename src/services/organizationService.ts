import {inject, Lazy} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {HttpClient as Http, HttpResponseMessage} from 'aurelia-http-client';
import {FetchConfig} from 'aurelia-auth';
import {Session} from './session';
import {DataService} from './dataService';
import * as QueryString from 'query-string';

@inject(HttpClient, Http, Session, DataService, FetchConfig)
export class OrganizationService {  

    // Service object for retreiving application data from REST services.
    
    apiServerUrl: string;
    clientId: string;
    clientSecret: string;

    constructor(private httpClient: HttpClient, private httpBase: Http, private session: Session, private dataService:DataService, private fetchConfig: FetchConfig){

    }

    getHttpClient() {
        return this.httpClient;
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

    async getMemberOrgs(startIndex: number, pageSize:number): Promise<Response> {
        await fetch;
        let response = this.getHttpClient().fetch('v1/organizations?start_index=' + 
            startIndex + '&page_size=' + pageSize, 
            {
                method: 'GET',
            }
        );
        return response;

    }


    importValidate(orgId, files):Promise<HttpResponseMessage> {
        var form = new FormData();
        form.append('dataFile', files[0]);
        const http =  this.httpBase;

        // Use base http-client, instead of Fetch, for multipart-form file upload.
        let response = http.createRequest('v1/organizations/' + orgId + '/member-metadata-crs')
        .asPost()
        .withHeader('Authorization', 'Bearer '+ this.session.auth['access_token'])
        .withContent(form)
        .send();

        return response;
    }
    
    importProcess(orgId, importId) {
        // Use base http-client, instead of Fetch, for multipart-form file upload.
        const http =  this.httpBase;

        let response = this.getHttpClient().fetch('v1/organizations/' + orgId + '/member-metadata-crs/' + importId,
        {
            method: 'PUT'
        });

        return response;
    }
    
}