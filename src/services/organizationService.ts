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
                method: 'GET'
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

    async searchOrganizationMembers(args: any) {
        await fetch;

        let organization = args.organizationId; 
        let startIndex = args.startIndex; 
        let pageSize = args.pageSize; 
        let params = args.params;
        let filters = args.filters;

        // Params from filter elements.
        let criteriaParams = OrganizationService.getDiscoveryRuleFromParams(filters);
        // FOR ENCODED DISCOVERY RULE:
        let criteriaParamsQueryString = 'discovery_rule=' + criteriaParams;
        
        // Params from grid filters.
        criteriaParamsQueryString = ''
        if((params && typeof params === 'object') &&
            ((params['filterModel'] && typeof params['filterModel'] === 'object' && Object.keys(params['filterModel']).length !== 0) || 
                (params['sortModel'] && Array.isArray(params['sortModel']) && params['sortModel'].length > 0))) {
            criteriaParams = DataService.getAPIFilterSortFromParams(params);
            // FOR ENCODED DISCOVERY RULE:
            criteriaParamsQueryString = 'discovery_rule=' + criteriaParams;
        }
        
        let response = this.getHttpClient().fetch('v1/organizations/' + organization + '/members?start_index=' + 
            startIndex + '&page_size=' + pageSize + '&' + criteriaParamsQueryString, 
            {
                method: 'GET',
            }
        );
        return response;
    }

    async getOrganizationNotificationTemplates(organizationId:string, categoryId:string) {
        await fetch;
        let categoryIdParam = '';
        if(!!(categoryId)) {
            categoryIdParam = '&categoryId=' + categoryId;
        }
        let response = this.getHttpClient().fetch('/v1/organizations/' + organizationId + '/alert-message-templates?start_index=' + 
            0 + '&page_size=' + 10000  + categoryIdParam, 
            {
                method: 'GET'
            }
        );
        return response;
        
    }

    /*
    Utility methods.
    */

    static getDiscoveryRuleFromParams(filters: Array<any>) {
        if(!(filters)) {
            return '';
        }
        let result = {};
        // Create the server-compatible filter criteria.
        result['parameters'] = [];
        for(let filter of filters) {
            let param = {};
            let attribute = filter['attr'];
            let operator = filter['op'];
            let value = filter['value'];
            param['operationType'] = operator;
            param['parameterType'] = attribute;
            param['values'] = [value];
            result['parameters'].push(param);
        }
        // Base64-encode.
        let str = btoa(JSON.stringify(result));
        // URL encode.
        str = encodeURIComponent(str);
        return str;
    }
    
    
}