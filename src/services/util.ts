import {inject} from 'aurelia-framework';
import {AuthService} from 'aurelia-auth';
import {Session} from './session';

@inject(Session, AuthService)
export class Utils {  

    // Service object for application utilities.
    constructor(private session:Session, private auth: AuthService){
    }
    
    parseFetchError(params): string {
        var errorMessage = params.errorMessage;
        let hash = location.hash.substring(0,location.hash.indexOf('?'));
        let baseUrl = window.location.protocol + '//' + window.location.host + '/';
        if(hash && hash !== '') {
            let url = baseUrl + hash;
            location.replace(url);
        }
        return errorMessage;
    }

    isLoggedIn(): boolean {
        if(this.session && this.session.auth['access_token'] && this.auth.isAuthenticated()) {
            return true;
        } 
        return false;
    }

}