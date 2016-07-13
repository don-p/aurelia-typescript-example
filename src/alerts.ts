import {inject, Lazy} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {json} from 'aurelia-fetch-client';

// const apiServerUrl = 'https://api-dev-scig-blg.bluelinegrid.com/v1/';
//const apiServerUrl = 'http://192.168.119.115:8082/blueline/';
const apiServerUrl = 'https://api-dev.bluelinegrid.com/';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

interface IUser {
  avatar_url: string;
  login: string;
  html_url: string;
}

@inject(Lazy.of(HttpClient))
export class Users {
  heading: string = 'Alerts';
  users: Array<IUser> = [];
  http: HttpClient;
   headers: {
        'X-Requested-With': 'Fetch',
        'origin':'*',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Basic YmxfY29tbWFuZF9jZW50ZXI6MzI3MmU2ZTctYTY2ZC0xMDMyLTg2YzktNmFiMzQ0M2M2MDJk'
  };
      
  constructor(private getHttpClient: () => HttpClient) {}

  async activate(): Promise<void> {
    // ensure fetch is polyfilled before we create the http client
    await fetch;
    const http = this.http = this.getHttpClient();
  var  headers = {
        'X-Requested-With': 'Fetch',
        'origin':'*',
         'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic YmxfY29tbWFuZF9jZW50ZXI6MzI3MmU2ZTctYTY2ZC0xMDMyLTg2YzktNmFiMzQ0M2M2MDJk'
  };

    http.configure(config => {
      config
 //       .useStandardConfiguration()
        .withBaseUrl(apiServerUrl)
        .withDefaults({headers: headers});
        // config.withHeader('X-Requested-With','Fetch');
        // config.withHeader('Content-Type', 'application/x-www-form-urlencoded');
//        config.withHeader('origin','*');
//         'origin':'*',
//         'Accept': 'application/json',
//         'Content-Type': 'application/json')
//         .withDefaults({
//       // credentials: 'same-origin',
//  //     mode: 'no-cors',
//       headers: {
//         'X-Requested-With': 'Fetch',
//         'origin':'*',
//         'Accept': 'application/json',
//         'Content-Type': 'application/json'
//       }
//     })
   ;
    });
    /*
    const response = await http.post('oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic YmxfY29tbWFuZF9jZW50ZXI6MzI3MmU2ZTctYTY2ZC0xMDMyLTg2YzktNmFiMzQ0M2M2MDJk'
      },
//               mode: 'cors',
      cache: 'default',
     params:{username:'don.peterkofsky@grid.blue', password: '*Do4495*', grant_type:'password'}
      }
    );//.withParams({username:'don.peterkofsky@grid.blue', password: '*Do4495*', grant_type:'password'});
*/
    const response = http.fetch('oauth/token', {
      method: 'POST',
//      headers: headers,
      mode: 'no-cors',
      cache: 'default',
      body: 'username=don.peterkofsky@grid.blue&password=*Do4495*&grant_type=password'
     //body:{username:'don.peterkofsky@grid.blue', password: '*Do4495*', grant_type:'password'}
      }
    );//.withParams({username:'don.peterkofsky@grid.blue', password: '*Do4495*', grant_type:'password'});
    response.then(data => {
              console.log(json(data));
            }).catch(error => {
              console.log(error); 
            });
/*
  var formData = new FormData();
  formData.append('don.peterkofsky@grid.blue', 'Do4495');
  formData.append('password', '*Do4495*');
  formData.append('grant_type', '*password*');

  http.post('oauth/token', {
                username:'don.peterkofsky@grid.blue',
                password: '*Do4495*',
                grant_type:'password'
            }).then(data => {
              console.log(json(data));
            }).catch(error => {
              console.log(error); 
            });
*/
/*
http.createRequest('oauth/token')
            .asPost()
            .withHeader('Content-Type', 'application/x-www-form-urlencoded')
            .withHeader('Authorization', 'Basic YmxfY29tbWFuZF9jZW50ZXI6MzI3MmU2ZTctYTY2ZC0xMDMyLTg2YzktNmFiMzQ0M2M2MDJk')
            .withParams({
                username:'don.peterkofsky@grid.blue',
                password: '*Do4495*',
                grant_type:'password'
            })
            .send().then(data => {
              this.users =  json(data);
            }).catch(error => {
              console.log(error); 
            });

*/
//    this.users = await json(response);
  }
}
