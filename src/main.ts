import {Aurelia, LogManager} from 'aurelia-framework';
import {ConsoleAppender} from "aurelia-logging-console";
// we want font-awesome to load as soon as possible to show the fa-spinner
 // Vendor CSS libs:
import 'font-awesome/scss/font-awesome.scss';
import 'perfect-scrollbar/dist/css/perfect-scrollbar.css';
// Application CSS + Bootstrap:
import '../styles/style.scss';
// import 'ag-grid/dist/styles/theme-blue.css';
// import 'ag-grid/dist/styles/theme-bootstrap.css';
import 'ag-grid/dist/styles/ag-grid.css';
import '../styles/theme-blg.styl';


import 'bootstrap-sass/assets/javascripts/bootstrap.js';
// Framework modules:
import {bootstrap} from 'aurelia-bootstrapper-webpack';
import {Configure} from "aurelia-configuration";
import {AuthConfig} from './config/authConfig';
// import * as config from './config/authConfig';
import {I18N} from 'aurelia-i18n';
import LngDetector from 'i18next-browser-languagedetector/dist/commonjs/index.js';
import Backend from 'i18next-xhr-backend';
import 'intl';

// comment out if you don't want a Promise polyfill (remove also from webpack.config.js)
import * as Bluebird from 'bluebird';
Bluebird.config({ warnings: false });

export async function configure(aurelia: Aurelia) {

  let environment = '%RUNTIME_ENVIRONMENT%';

  let authConfig = aurelia.container.get(AuthConfig);
  // Language detector options.
  var options = {
    // order and from where i18n user language should be detected
    order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
    // keys or params to lookup language from
    lookupQuerystring: 'lng',
    lookupCookie: 'i18next',
    lookupLocalStorage: 'i18nextLng',
    // cache user language on
    caches: ['localStorage', 'cookie'],
    // optional expire and domain for set cookie
    cookieMinutes: 10,
    cookieDomain: 'blg',
    // optional htmlTag with lang attribute, the default is:
    htmlTag: document.documentElement
  };

  // Optional Intl polyfill.
  if (!window['Intl']) {
    console.log('Intl not present');
    aurelia.use.plugin('intl');
  }

  // polyfill fetch client conditionally
  const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

  aurelia.use
    .standardConfiguration()
    // .developmentLogging()
    // .globalResources('services/remoteDataAttribute')
    .plugin('aurelia-configuration', config => {
      config.setDirectory('config'); // Will make plugin look for config files in a directory called "config-files"
      config.setConfig('appConfig.json'); // Will look for mycoolconfig.json as the configuration file
      config.setEnvironment(environment);     
    })
    .plugin('aurelia-auth', (baseConfig)=>{
      // Use config to set auth Url.
      let configInstance = aurelia.container.get(Configure);
      let apiServerUrl = configInstance.get('api.serverUrl'); 
      authConfig.config.baseUrl = apiServerUrl;
      baseConfig.configure(authConfig.config);
    })
//       .plugin('aurelia-i18n')

//    ;
//   .plugin('aurelia-validation')
    // .plugin('aurelia-validatejs')
    
    .plugin('aurelia-i18n', (instance) => {
        // Import i18n resources.

        // // register backend plugin
        instance.i18next.use(Backend);
        instance.i18next.use(LngDetector).init({detection: options});
        var lang = 'en';
        var detected = instance.i18next.services.languageDetector.detectors.navigator.lookup()[1];
        if(detected && detected != null) {
          lang = detected;
        }
        // adapt options to your needs (see http://i18next.com/docs/options/)
        // make sure to return the promise of the setup method, in order to guarantee proper loading
        const pr = instance.setup({
          backend: {                                  // <-- configure backend settings
            loadPath: '/locales/{{lng}}/{{ns}}.json', // <-- XHR settings for where to get the files from
          },
          //   resources: {
          //   en: {
          //     translation: {
          //       "key": "hello world"
          //     }
          //   }
          // },
          lng : lang,
          attributes : ['t','i18n'],
          fallbackLng : 'en',
          debug : false
        });
        return pr;
      })
      .plugin('aurelia-dialog')
      // .plugin('aurelia-ui-virtualization')
      .postTask(function() {
        // Use config to set logging level.
        let configInstance = aurelia.container.get(Configure);
        let logLevel = configInstance.get('logLevel');
        LogManager.setLevel(LogManager.logLevel[logLevel]);
        LogManager.addAppender(new ConsoleAppender());
      });

  // Uncomment the line below to enable animation.
  // aurelia.use.plugin('aurelia-animator-css');
  // if the css animator is enabled, add swap-order="after" to all router-view elements

  // Anyone wanting to use HTMLImports to load views, will need to install the following plugin.
  // aurelia.use.plugin('aurelia-html-import-template-loader')

  await aurelia.start();
  aurelia.setRoot('app');


 

  // if you would like your website to work offline (Service Worker), 
  // install and enable the @easy-webpack/config-offline package in webpack.config.js and uncomment the following code:
  /*
  const offline = await System.import('offline-plugin/runtime');
  offline.install();
  */
}
