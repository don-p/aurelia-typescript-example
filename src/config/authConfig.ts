


var configForDevelopment = {
    baseUrl: 'https://api-dev-scig-blg.bluelinegrid.com/',
    loginUrl: 'oauth/token',
    providers: {
        google: {
            clientId: '239531826023-ibk10mb9p7ull54j55a61og5lvnjrff6.apps.googleusercontent.com'
        }
        ,
        linkedin:{
            clientId:'778mif8zyqbei7'
        },
        facebook:{
            clientId:'1452782111708498'
        }
    }
};

var configForProduction = {
    baseUrl: 'https://api-dev-scig-blg.bluelinegrid.com/',
    providers: {
        google: {
            clientId: '239531826023-3ludu3934rmcra3oqscc1gid3l9o497i.apps.googleusercontent.com'
        }
        ,
        linkedin:{
            clientId:'7561959vdub4x1'
        },
        facebook:{
            clientId:'1653908914832509'
        }

    }
};
var config ;
if (window.location.hostname==='localhost') {
    config = configForDevelopment;
}
else{
    config = configForProduction;
}


export default config;

/*
export class AuthConfig {  

    configForDevelopment: {
        providers: {
            google: {
                clientId: '239531826023-ibk10mb9p7ull54j55a61og5lvnjrff6.apps.googleusercontent.com'
            }
            ,
            linkedin:{
                clientId:'778mif8zyqbei7'
            },
            facebook:{
                clientId:'1452782111708498'
            }
        }
    };

    configForProduction: {
        providers: {
            google: {
                clientId: '239531826023-3ludu3934rmcra3oqscc1gid3l9o497i.apps.googleusercontent.com'
            }
            ,
            linkedin:{
                clientId:'7561959vdub4x1'
            },
            facebook:{
                clientId:'1653908914832509'
            }

        }
    };
    config: Object;

    constructor() {
        if (window.location.hostname==='localhost') {
            this.config = this.configForDevelopment;
        } else {
            this.config = this.configForProduction;
        }

    }

    //export default config;

}
*/