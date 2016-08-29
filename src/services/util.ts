export class Utils {  

    // Service object for application utilities.
    
    parseFetchError(params): string {
        var errorMessage = params.errorMessage;
        let hash = location.hash.substring(0,location.hash.indexOf('?'));
        if(hash && hash !== '') {
            let url = location.origin + location.pathname + hash;
            location.replace(url);
        }
        return errorMessage;
    }
}