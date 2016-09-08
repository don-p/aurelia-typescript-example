export class AppConfig {  

    // Service object for maintaining application shared state and application-level functions.
    
    private _apiServerUrl: string;
    clientId: string;
    clientSecret: string;
    
    constructor(){
        // Base Url for REST API service.
        this._apiServerUrl = 'https://api-dev-scig-blg.bluelinegrid.com/';
        // App identifiers for REST services.
        // this.clientId = 'YmxfY29tbWFuZF9j';
        // this.clientSecret = 'ZW50ZXI6MzI3MmU2ZTctYTY2ZC0xMDMyLTg2YzktNmFiMzQ0M2M2MDJk';
        // App identifiers for REST services - immediate expiration.
        this.clientId = 'YmxfcHJvdG90eXBlO';
        this.clientSecret = 'jMwOTE1MzNlLTNlNDctMTFlNC1hM2M5LTM3MDY3OTRlMWNhMg==';
    }

    get apiServerUrl(): string {
        return this._apiServerUrl;
    }
}