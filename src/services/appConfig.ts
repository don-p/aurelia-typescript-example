export class AppConfig {  

    // Service object for maintaining application shared state and application-level functions.
    
    private _apiServerUrl: string;
    clientId: String;
    clientSecret: String;

    constructor(){
        // Base Url for REST API service.
        this._apiServerUrl = 'https://api-dev-scig-blg.bluelinegrid.com/';
        // App identifiers for REST services.
        this.clientId = 'YmxfY29tbWFuZF9j';
        this.clientSecret = 'ZW50ZXI6MzI3MmU2ZTctYTY2ZC0xMDMyLTg2YzktNmFiMzQ0M2M2MDJk';
    }

    get apiServerUrl(): string {
        return this._apiServerUrl;
    }
}